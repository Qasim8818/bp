const PrizePool = require('../models/PrizePool');
const Transaction = require('../models/Transaction');
const GameResult = require('../models/GameResult');

class PrizePoolService {
  constructor() {
    this.mainPoolName = 'main_prize_pool';
  }

  async initializePool() {
    let pool = await PrizePool.findOne({ poolName: this.mainPoolName });
    if (!pool) {
      pool = new PrizePool({
        poolName: this.mainPoolName,
        currentBalance: 0,
        totalContributions: 0,
        totalPayouts: 0,
        contributionRate: 0.05, // 5% of each bet goes to pool
        status: 'active'
      });
      await pool.save();
    }
    return pool;
  }

  async contributeToPool(betAmount, winAmount, userId, gameResultId) {
    try {
      const contribution = Math.max(0, betAmount - winAmount);
      
      if (contribution <= 0) return { success: true, contribution: 0 };

      const pool = await PrizePool.findOneAndUpdate(
        { poolName: this.mainPoolName },
        { 
          $inc: { 
            currentBalance: contribution,
            totalContributions: contribution 
          }
        },
        { new: true, upsert: true }
      );

      // Log the contribution
      await Transaction.create({
        userId,
        type: 'pool_contribution',
        amount: contribution,
        status: 'completed',
        description: `Contribution to prize pool from game ${gameResultId}`,
        metadata: {
          betAmount,
          winAmount,
          gameResultId
        }
      });

      return { 
        success: true, 
        contribution, 
        newPoolBalance: pool.currentBalance 
      };
    } catch (error) {
      console.error('Error contributing to prize pool:', error);
      return { success: false, error: error.message };
    }
  }

  async payFromPool(amount, userId, reason = 'game_win') {
    try {
      const pool = await PrizePool.findOne({ poolName: this.mainPoolName });
      
      if (!pool || pool.currentBalance < amount) {
        return { 
          success: false, 
          error: 'Insufficient pool balance',
          currentBalance: pool?.currentBalance || 0
        };
      }

      const updatedPool = await PrizePool.findOneAndUpdate(
        { poolName: this.mainPoolName, currentBalance: { $gte: amount } },
        { 
          $inc: { 
            currentBalance: -amount,
            totalPayouts: amount 
          }
        },
        { new: true }
      );

      if (!updatedPool) {
        return { success: false, error: 'Pool balance changed during transaction' };
      }

      // Log the payout
      await Transaction.create({
        userId,
        type: 'pool_payout',
        amount: amount,
        status: 'completed',
        description: `Payout from prize pool: ${reason}`,
        metadata: { reason }
      });

      return { 
        success: true, 
        amount, 
        newPoolBalance: updatedPool.currentBalance 
      };
    } catch (error) {
      console.error('Error paying from prize pool:', error);
      return { success: false, error: error.message };
    }
  }

  async getPoolStats() {
    try {
      const pool = await PrizePool.findOne({ poolName: this.mainPoolName });
      const recentContributions = await Transaction.aggregate([
        { $match: { type: 'pool_contribution' } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            totalContributions: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
        { $limit: 30 }
      ]);

      const recentPayouts = await Transaction.aggregate([
        { $match: { type: 'pool_payout' } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            totalPayouts: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
        { $limit: 30 }
      ]);

      return {
        pool: pool || { currentBalance: 0, totalContributions: 0, totalPayouts: 0 },
        recentContributions,
        recentPayouts,
        netBalance: pool ? pool.totalContributions - pool.totalPayouts : 0
      };
    } catch (error) {
      console.error('Error getting pool stats:', error);
      return { success: false, error: error.message };
    }
  }

  async canAffordPayout(amount) {
    try {
      const pool = await PrizePool.findOne({ poolName: this.mainPoolName });
      return {
        canAfford: pool ? pool.currentBalance >= amount : false,
        currentBalance: pool?.currentBalance || 0
      };
    } catch (error) {
      console.error('Error checking pool affordability:', error);
      return { success: false, error: error.message };
    }
  }

  async getPoolHealth() {
    try {
      const pool = await PrizePool.findOne({ poolName: this.mainPoolName });
      if (!pool) return { health: 'unknown', balance: 0 };

      const health = {
        balance: pool.currentBalance,
        totalContributions: pool.totalContributions,
        totalPayouts: pool.totalPayouts,
        health: pool.currentBalance > 1000 ? 'healthy' : 
                pool.currentBalance > 100 ? 'low' : 'critical',
        utilizationRate: pool.totalContributions > 0 ? 
          (pool.totalPayouts / pool.totalContributions) * 100 : 0
      };

      return health;
    } catch (error) {
      console.error('Error getting pool health:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PrizePoolService();
