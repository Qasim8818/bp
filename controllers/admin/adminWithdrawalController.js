const enhancedPrizePoolService = require('../../services/enhancedPrizePoolService');
const Transaction = require('../../models/Transaction');
const Admin = require('../../models/Admin');

class AdminWithdrawalController {
  async getAdminProfitDashboard(req, res) {
    try {
      const dashboardData = await enhancedPrizePoolService.getAdminDashboardData();
      const forecast = await enhancedPrizePoolService.getProfitForecast();

      res.json({
        success: true,
        data: {
          ...dashboardData,
          forecast
        }
      });
    } catch (error) {
      console.error('Error getting admin profit dashboard:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get admin profit dashboard',
        error: error.message 
      });
    }
  }

  async initiateAdminWithdrawal(req, res) {
    try {
      const { amount, reason, withdrawalMethod, accountDetails } = req.body;
      const adminId = req.admin.id;

      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid withdrawal amount'
        });
      }

      // Get current profit
      const stats = await enhancedPrizePoolService.getComprehensivePoolStats();
      
      if (amount > stats.adminProfit) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient admin profit',
          data: {
            requestedAmount: amount,
            availableProfit: stats.adminProfit
          }
        });
      }

      // Record the withdrawal
      const result = await enhancedPrizePoolService.recordAdminWithdrawal(
        amount,
        adminId,
        reason || 'Admin profit withdrawal'
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Create withdrawal record for tracking
      const withdrawalRecord = {
        adminId,
        amount,
        reason,
        withdrawalMethod,
        accountDetails,
        status: 'completed',
        processedAt: new Date()
      };

      // Here you would integrate with actual payment gateway
      // For now, we'll just log it as completed
      console.log('Admin withdrawal processed:', withdrawalRecord);

      res.json({
        success: true,
        message: 'Admin withdrawal processed successfully',
        data: {
          amount: result.amount,
          remainingProfit: result.remainingProfit,
          withdrawalRecord
        }
      });
    } catch (error) {
      console.error('Error processing admin withdrawal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process admin withdrawal',
        error: error.message
      });
    }
  }

  async getAdminWithdrawalHistory(req, res) {
    try {
      const { page = 1, limit = 50, startDate, endDate } = req.query;
      const skip = (page - 1) * limit;

      const query = { type: 'admin_withdrawal' };
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const transactions = await Transaction.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Transaction.countDocuments(query);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting admin withdrawal history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get admin withdrawal history',
        error: error.message
      });
    }
  }

  async getProfitBreakdown(req, res) {
    try {
      const stats = await enhancedPrizePoolService.getComprehensivePoolStats();
      
      // Get detailed breakdown by source
      const depositBreakdown = await Transaction.aggregate([
        { $match: { type: 'deposit' } },
        {
          $group: {
            _id: '$metadata.source',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const withdrawalBreakdown = await Transaction.aggregate([
        { $match: { type: 'withdrawal' } },
        {
          $group: {
            _id: '$metadata.method',
            total: { $sum: { $abs: '$amount' } },
            count: { $sum: 1 }
          }
        }
      ]);

      const profitBreakdown = {
        totalDeposits: stats.totalDeposits,
        totalWithdrawals: stats.totalWithdrawals,
        currentPrizePool: stats.currentPrizePool,
        adminProfit: stats.adminProfit,
        netProfit: stats.netProfit,
        sources: {
          deposits: depositBreakdown,
          withdrawals: withdrawalBreakdown
        },
        reservedFunds: {
          pendingWithdrawals: stats.totalPendingWithdrawals,
          poolBalance: stats.poolBalance
        }
      };

      res.json({
        success: true,
        data: profitBreakdown
      });
    } catch (error) {
      console.error('Error getting profit breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profit breakdown',
        error: error.message
      });
    }
  }

  async getWithdrawalLimits(req, res) {
    try {
      const stats = await enhancedPrizePoolService.getComprehensivePoolStats();
      
      // Calculate safe withdrawal limits
      const safeLimit = Math.max(0, stats.adminProfit * 0.8); // 80% of profit
      const maxLimit = stats.adminProfit;
      
      // Get recommended amount based on forecast
      const forecast = await enhancedPrizePoolService.getProfitForecast();
      
      res.json({
        success: true,
        data: {
          currentProfit: stats.adminProfit,
          safeWithdrawalLimit: safeLimit,
          maximumWithdrawalLimit: maxLimit,
          recommendedWithdrawal: Math.min(safeLimit, forecast.avgDailyProfit * 7),
          forecast: forecast
        }
      });
    } catch (error) {
      console.error('Error getting withdrawal limits:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get withdrawal limits',
        error: error.message
      });
    }
  }

  async exportProfitReport(req, res) {
    try {
      const { format = 'json', startDate, endDate } = req.query;
      
      const query = {};
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const transactions = await Transaction.find({
        ...query,
        type: { $in: ['deposit', 'withdrawal', 'admin_withdrawal'] }
      })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

      const report = {
        generatedAt: new Date(),
        dateRange: { startDate, endDate },
        transactions,
        summary: await enhancedPrizePoolService.getComprehensivePoolStats()
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(transactions);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="profit-report.csv"');
        return res.send(csv);
      }

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error exporting profit report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export profit report',
        error: error.message
      });
    }
  }

  convertToCSV(transactions) {
    const headers = ['Date', 'Type', 'Amount', 'User', 'Description'];
    const rows = transactions.map(t => [
      t.createdAt.toISOString(),
      t.type,
      t.amount,
      t.userId?.name || 'System',
      t.description
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = new AdminWithdrawalController();
