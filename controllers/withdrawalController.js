const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

class WithdrawalController {
  constructor() {
    this.MIN_WITHDRAWAL = 10;
    this.MAX_WITHDRAWAL = 10000;
    this.DAILY_LIMIT = 50000;
  }

  async requestWithdrawal(req, res) {
    try {
      const { method, accountNumber, amount } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!method || !accountNumber || !amount) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (amount < this.MIN_WITHDRAWAL || amount > this.MAX_WITHDRAWAL) {
        return res.status(400).json({ 
          message: `Withdrawal amount must be between ${this.MIN_WITHDRAWAL} and ${this.MAX_WITHDRAWAL}` 
        });
      }

      // Check rate limits using new system
      const WithdrawalRateLimit = require('../middlewares/withdrawalRateLimit');
      try {
        await WithdrawalRateLimit.validateWithdrawal(userId, amount);
      } catch (rateError) {
        return res.status(400).json({ message: rateError.message });
      }

      // Check for pending withdrawals
      const pendingWithdrawals = await Withdrawal.countDocuments({
        userId,
        status: { $in: ['pending', 'approved', 'processing'] }
      });

      if (pendingWithdrawals > 0) {
        return res.status(400).json({ 
          message: 'You have pending withdrawals. Please wait for approval.' 
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.balance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      // Create withdrawal request
      const withdrawal = await Withdrawal.create({
        userId: user._id,
        method,
        accountNumber,
        amount,
        status: 'pending',
        requestedAt: new Date()
      });

      // Deduct from user balance immediately
      user.balance -= amount;
      await user.save();

      // Log transaction
      await Transaction.create({
        userId: user._id,
        type: 'withdrawal_request',
        amount: -amount,
        status: 'pending',
        description: `Withdrawal request via ${method}`,
        metadata: {
          withdrawalId: withdrawal._id,
          method,
          accountNumber
        }
      });

      res.status(201).json({ 
        success: true,
        message: 'Withdrawal request submitted successfully',
        withdrawal: {
          id: withdrawal._id,
          amount: withdrawal.amount,
          method: withdrawal.method,
          status: withdrawal.status,
          requestedAt: withdrawal.requestedAt
        }
      });

    } catch (error) {
      console.error('Withdrawal request error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  async getAllWithdrawals(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      
      const query = {};
      if (status && status !== 'all') {
        query.status = status;
      }

      const withdrawals = await Withdrawal.find(query)
        .populate('userId', 'email username balance')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Withdrawal.countDocuments(query);

      res.json({
        withdrawals,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Get all withdrawals error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  async getUserWithdrawals(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const withdrawals = await Withdrawal.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Withdrawal.countDocuments({ userId });

      res.json({
        withdrawals,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Get user withdrawals error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  async updateWithdrawalStatus(req, res) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
      }

      const withdrawal = await Withdrawal.findById(id).populate('userId');
      if (!withdrawal) {
        return res.status(404).json({ message: 'Withdrawal not found' });
      }

      if (withdrawal.status !== 'pending') {
        return res.status(400).json({ 
          message: `Withdrawal already ${withdrawal.status}` 
        });
      }

      const oldStatus = withdrawal.status;
      withdrawal.status = action === 'approve' ? 'approved' : 'rejected';
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;
      
      if (reason) {
        withdrawal.reason = reason;
      }

      await withdrawal.save();

      // Handle rejected withdrawal - refund balance
      if (action === 'reject') {
        const user = await User.findById(withdrawal.userId);
        user.balance += withdrawal.amount;
        await user.save();

        // Log refund transaction
        await Transaction.create({
          userId: withdrawal.userId,
          type: 'withdrawal_rejected',
          amount: withdrawal.amount,
          status: 'completed',
          description: `Withdrawal rejected - amount refunded`,
          metadata: {
            withdrawalId: withdrawal._id,
            reason: reason || 'Rejected by admin'
          }
        });
      }

      // Handle approved withdrawal
      if (action === 'approve') {
        // Log completion transaction
        await Transaction.create({
          userId: withdrawal.userId,
          type: 'withdrawal_approved',
          amount: -withdrawal.amount,
          status: 'completed',
          description: `Withdrawal approved and processed via ${withdrawal.method}`,
          metadata: {
            withdrawalId: withdrawal._id,
            method: withdrawal.method,
            accountNumber: withdrawal.accountNumber
          }
        });
      }

      res.json({
        success: true,
        message: `Withdrawal ${action}d successfully`,
        withdrawal: {
          id: withdrawal._id,
          status: withdrawal.status,
          processedAt: withdrawal.processedAt,
          reason: withdrawal.reason
        }
      });

    } catch (error) {
      console.error('Update withdrawal status error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  async getWithdrawalStats(req, res) {
    try {
      const stats = await Withdrawal.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const totalStats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0
      };

      stats.forEach(stat => {
        totalStats[stat._id] = stat.count;
        totalStats.totalAmount += stat.totalAmount;
      });

      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayStats = await Withdrawal.aggregate([
        {
          $match: {
            createdAt: { $gte: today }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const todayResult = {
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0
      };

      todayStats.forEach(stat => {
        todayResult[stat._id] = stat.count;
        todayResult.totalAmount += stat.totalAmount;
      });

      res.json({
        overall: totalStats,
        today: todayResult
      });

    } catch (error) {
      console.error('Get withdrawal stats error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  async getWithdrawalLimits(req, res) {
    res.json({
      minWithdrawal: this.MIN_WITHDRAWAL,
      maxWithdrawal: this.MAX_WITHDRAWAL,
      dailyLimit: this.DAILY_LIMIT,
      availableMethods: ['JazzCash', 'EasyPaisa', 'Bank Transfer', 'USDT', 'BTC']
    });
  }
}

module.exports = new WithdrawalController();
