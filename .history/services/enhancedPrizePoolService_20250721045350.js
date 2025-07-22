const PrizePool = require('../models/PrizePool');
const Transaction = require('../models/Transaction');
const UserBalance = require('../models/UserBalance');
const Withdrawal = require('../models/Withdrawal');

class EnhancedPrizePoolService {
  constructor() {
    this.mainPoolName = 'main_prize_pool';
  }

  async getComprehensivePoolStats() {
    try {
      // Get prize pool data
      const pool = await PrizePool.findOne({ poolName: this.mainPoolName });
      
      // Get total deposits from all users
      const totalDepositsResult = await UserBalance.aggregate([
        { $group: { _id: null, totalDeposits: { $sum: '$depositedAmount' } } }
      ]);
      const totalDeposits = totalDepositsResult[0]?.totalDeposits || 0;

      // Get total withdrawals from all users
      const totalWithdrawalsResult = await UserBalance.aggregate([
        { $group: { _id: null, totalWithdrawals: { $sum: '$withdrawnAmount' } } }
      ]);
      const totalWithdrawals = totalWithdrawalsResult[0]?.totalWithdrawals || 0;

      // Get pending withdrawals
      const pendingWithdrawals = await Withdrawal.aggregate([
        { $match: { status: { $in: ['pending', 'processing'] } } },
        { $group: { _id: null, totalPending: { $sum: '$amount' } } }
      ]);
      const totalPendingWithdrawals = pendingWithdrawals[0]?.totalPending || 0;

      // Calculate net prize pool
      const currentPrizePool = totalDeposits - totalWithdrawals;
      
      // Get game contributions to prize pool
      const gameContributions = await Transaction.aggregate([
        { $match: { type: 'pool_contribution' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalGameContributions = gameContributions[0]?.total || 0;

      // Get game payouts from prize pool
      const gamePayouts = await Transaction.aggregate([
        { $match: { type: 'pool_payout' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalGamePayouts = gamePayouts[0]?.total || 0;

      // Calculate admin profit
      const adminProfit = currentPrizePool - pool?.currentBalance || 0;

      return {
        totalDeposits,
        totalWithdrawals,
        totalPendingWithdrawals,
        currentPrizePool,
        poolBalance: pool?.currentBalance || 0,
        totalGameContributions,
        totalGamePayouts,
        adminProfit,
        netProfit: adminProfit - totalPendingWithdrawals,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting comprehensive pool stats:', error);
      throw error;
    }
  }

  async updatePrizePoolFromDeposit(amount, userId) {
    try {
      // This is called when a user makes a deposit
      // The money goes to the business account, so we just track it
      await Transaction.create({
        userId,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        description: 'User deposit to business account',
        metadata: {
          source: 'payment_gateway',
          destination: 'business_account'
        }
      });

      return { success: true, amount };
    } catch (error) {
      console.error('Error updating prize pool from deposit:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePrizePoolFromWithdrawal(amount, userId) {
    try {
      // This is called when a user withdrawal is processed
      // The money goes from business account to user
      await Transaction.create({
        userId,
        type: 'withdrawal',
        amount: -amount,
        status: 'completed',
        description: 'User withdrawal from business account',
        metadata: {
          source: 'business_account',
          destination: 'user_account'
        }
      });

      return { success: true, amount };
    } catch (error) {
      console.error('Error updating prize pool from withdrawal:', error);
      return { success: false, error: error.message };
    }
  }

  async recordAdminWithdrawal(amount, adminId, reason = 'Admin profit withdrawal') {
    try {
      const stats = await this.getComprehensivePoolStats();
      
      if (amount > stats.adminProfit) {
        return { 
          success: false, 
          error: 'Withdrawal amount exceeds available admin profit' 
        };
      }

      await Transaction.create({
        userId: adminId,
        type: 'admin_withdrawal',
        amount: -amount,
        status: 'completed',
        description: reason,
        metadata: {
          source: 'business_account',
          destination: 'admin_account',
          adminProfit: stats.adminProfit,
          remainingProfit: stats.adminProfit - amount
        }
      });

      return { 
        success: true, 
        amount, 
        remainingProfit: stats.adminProfit - amount 
      };
    } catch (error) {
      console.error('Error recording admin withdrawal:', error);
      return { success: false, error: error.message };
    }
  }

  async getAdminDashboardData() {
    try {
      const stats = await this.getComprehensivePoolStats();
      
      // Get daily stats for last 30 days
      const dailyStats = await Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            type: { $in: ['deposit', 'withdrawal', 'pool_contribution', 'pool_payout', 'admin_withdrawal'] }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            deposits: {
              $sum: {
                $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0]
              }
            },
            withdrawals: {
              $sum: {
                $cond: [{ $eq: ['$type', 'withdrawal'] }, { $abs: '$amount' }, 0]
              }
            },
            contributions: {
              $sum: {
                $cond: [{ $eq: ['$type', 'pool_contribution'] }, '$amount', 0]
              }
            },
            payouts: {
              $sum: {
                $cond: [{ $eq: ['$type', 'pool_payout'] }, '$amount', 0]
              }
            },
            adminWithdrawals: {
              $sum: {
                $cond: [{ $eq: ['$type', 'admin_withdrawal'] }, { $abs: '$amount' }, 0]
              }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      // Get top contributors
      const topContributors = await UserBalance.aggregate([
        { $sort: { depositedAmount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            username: '$user.name',
            email: '$user.email',
            totalDeposited: '$depositedAmount',
            totalWithdrawn: '$withdrawnAmount',
            currentBalance: '$currentBalance',
            netProfit: '$netProfit'
          }
        }
      ]);

      return {
        ...stats,
        dailyStats,
        topContributors,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting admin dashboard data:', error);
      throw error;
    }
  }

  async getProfitForecast(days = 30) {
    try {
      const stats = await this.getComprehensivePoolStats();
      
      // Calculate average daily profit
      const dailyStats = await Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            type: { $in: ['deposit', 'withdrawal'] }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            dailyProfit: {
              $sum: {
                $cond: [
                  { $eq: ['$type', 'deposit'] },
                  '$amount',
                  { $multiply: ['$amount', -1] }
                ]
              }
            }
          }
        }
      ]);

      const avgDailyProfit = dailyStats.length > 0 
        ? dailyStats.reduce((sum, day) => sum + day.dailyProfit, 0) / dailyStats.length 
        : 0;

      const forecast = {
        currentProfit: stats.adminProfit,
        avgDailyProfit,
        projected30DayProfit: stats.adminProfit + (avgDailyProfit * days),
        confidence: dailyStats.length >= 7 ? 'high' : 'medium'
      };

      return forecast;
    } catch (error) {
      console.error('Error getting profit forecast:', error);
      throw error;
    }
  }
}

module.exports = new EnhancedPrizePoolService();
