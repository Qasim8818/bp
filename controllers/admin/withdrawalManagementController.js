const Withdrawal = require('../../models/Withdrawal');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const withdrawalQueueService = require('../../services/withdrawalQueueService');
const WithdrawalRateLimit = require('../../middlewares/withdrawalRateLimit');

class WithdrawalManagementController {
  constructor() {
    this.pageSize = 20;
  }

  async getPendingWithdrawals(req, res) {
    try {
      const { page = 1, search = '', status = 'pending', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const query = { status };
      
      if (search) {
        query.$or = [
          { 'userId.username': { $regex: search, $options: 'i' } },
          { 'userId.email': { $regex: search, $options: 'i' } },
          { accountNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const withdrawals = await Withdrawal.find(query)
        .populate('userId', 'username email balance')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(this.pageSize)
        .skip((page - 1) * this.pageSize);

      const total = await Withdrawal.countDocuments(query);

      res.json({
        success: true,
        data: {
          withdrawals,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / this.pageSize),
            totalItems: total,
            hasNext: page * this.pageSize < total,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async approveWithdrawal(req, res) {
    try {
      const { withdrawalId } = req.body;
      const { adminId } = req.user;

      const withdrawal = await Withdrawal.findById(withdrawalId)
        .populate('userId', 'username email balance');

      if (!withdrawal) {
        return res.status(404).json({ success: false, error: 'Withdrawal not found' });
      }

      if (withdrawal.status !== 'pending') {
        return res.status(400).json({ success: false, error: 'Withdrawal is not in pending status' });
      }

      // Check rate limits
      const rateCheck = await WithdrawalRateLimit.checkLimits(withdrawal.userId._id, withdrawal.amount);
      if (!rateCheck.canWithdraw) {
        return res.status(400).json({ 
          success: false, 
          error: 'Withdrawal exceeds rate limits',
          details: rateCheck.details
        });
      }

      // Check user balance
      if (withdrawal.userId.balance < withdrawal.amount) {
        return res.status(400).json({ 
          success: false, 
          error: 'Insufficient user balance' 
        });
      }

      // Update withdrawal status
      withdrawal.status = 'approved';
      withdrawal.approvedBy = adminId;
      withdrawal.approvedAt = new Date();
      withdrawal.notes = req.body.notes || '';
      await withdrawal.save();

      // Add to processing queue
      await withdrawalQueueService.addToQueue(withdrawal._id);

      // Log admin action
      await Transaction.create({
        userId: withdrawal.userId,
        type: 'withdrawal_approved',
        amount: -withdrawal.amount,
        status: 'completed',
        description: `Withdrawal approved by admin`,
        metadata: {
          withdrawalId: withdrawal._id,
          adminId,
          notes: req.body.notes
        }
      });

      res.json({ success: true, message: 'Withdrawal approved and added to processing queue' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async rejectWithdrawal(req, res) {
    try {
      const { withdrawalId, reason } = req.body;
      const { adminId } = req.user;

      const withdrawal = await Withdrawal.findById(withdrawalId)
        .populate('userId', 'username email balance');

      if (!withdrawal) {
        return res.status(404).json({ success: false, error: 'Withdrawal not found' });
      }

      if (withdrawal.status !== 'pending') {
        return res.status(400).json({ success: false, error: 'Withdrawal is not in pending status' });
      }

      // Update withdrawal status
      withdrawal.status = 'rejected';
      withdrawal.rejectedBy = adminId;
      withdrawal.rejectedAt = new Date();
      withdrawal.reason = reason;
      await withdrawal.save();

      // Refund user balance
      const user = await User.findById(withdrawal.userId);
      if (user) {
        user.balance += withdrawal.amount;
        await user.save();
      }

      // Log admin action
      await Transaction.create({
        userId: withdrawal.userId,
        type: 'withdrawal_rejected',
        amount: withdrawal.amount,
        status: 'completed',
        description: 'Withdrawal rejected by admin',
        metadata: {
          withdrawalId: withdrawal._id,
          adminId,
          reason
        }
      });

      res.json({ success: true, message: 'Withdrawal rejected and amount refunded to user' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getWithdrawalDetails(req, res) {
    try {
      const { withdrawalId } = req.params;

      const withdrawal = await Withdrawal.findById(withdrawalId)
        .populate('userId', 'username email balance')
        .populate('approvedBy', 'username')
        .populate('rejectedBy', 'username');

      if (!withdrawal) {
        return res.status(404).json({ success: false, error: 'Withdrawal not found' });
      }

      res.json({ success: true, data: withdrawal });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getWithdrawalHistory(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, status, startDate, endDate } = req.query;

      const query = { userId };
      
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const withdrawals = await Withdrawal.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((page - 1) * parseInt(limit));

      const total = await Withdrawal.countDocuments(query);

      res.json({
        success: true,
        data: {
          withdrawals,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getWithdrawalAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);

      const analytics = await Withdrawal.aggregate([
        {
          $match: dateFilter ? { createdAt: dateFilter } : {}
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 },
            pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
            completedAmount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
            rejectedAmount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, '$amount', 0] } },
            avgAmount: { $avg: '$amount' }
          }
        }
      ]);

      const statusBreakdown = await Withdrawal.aggregate([
        {
          $match: dateFilter ? { createdAt: dateFilter } : {}
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          overview: analytics[0] || {},
          statusBreakdown
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new WithdrawalManagementController();
