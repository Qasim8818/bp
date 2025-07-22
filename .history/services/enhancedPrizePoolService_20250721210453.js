const PrizePool = require('../models/PrizePool');
const Transaction = require('../models/Transaction');
const GameResult = require('../models/GameResult');
const UserBalance = require('../models/UserBalance');

class EnhancedPrizePoolService {
  constructor() {
    this.mainPoolName = 'main_prize_pool';
    this.config = {
      targetWinRatio: 0.65,
      dailyWinCap: 1000,
      maxConsecutiveWins: 3,
      minDelayBetweenBigWins: 3600, // seconds
      enableRandomness: true,
      adminWinRate: 0.1,
      bigWinThreshold: 100
    };
  }

  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  async getUserWinHistory(userId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const wins = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'win',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalWins: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);

    const losses = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'bet',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalLosses: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);

    return { wins, losses };
  }

  async checkDailyWinCap(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyWins = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'win',
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalWins: { $sum: '$amount' }
        }
      }
    ]);

    const totalDailyWins = dailyWins[0]?.totalWins || 0;
    return totalDailyWins < this.config.dailyWinCap;
  }

  async checkConsecutiveWins(userId) {
    const recentResults = await GameResult.find({ userId })
      .sort({ createdAt: -1 })
      .limit(this.config.maxConsecutiveWins + 1);

    if (recentResults.length < this.config.maxConsecutiveWins) {
      return true;
    }

    const consecutiveWins = recentResults.filter(r => r.winAmount > 0).length;
    return consecutiveWins < this.config.maxConsecutiveWins;
  }

  async checkBigWinDelay(userId, potentialWin) {
    if (potentialWin < this.config.bigWinThreshold) {
      return true;
    }

    const lastBigWin = await GameResult.findOne({
      userId,
      winAmount: { $gte: this.config.bigWinThreshold }
    }).sort({ createdAt: -1 });

    if (!lastBigWin) {
      return true;
    }

    const timeSinceLastBigWin = (Date.now() - lastBigWin.createdAt.getTime()) / 1000;
    return timeSinceLastBigWin >= this.config.minDelayBetweenBigWins;
  }

  async shouldAllowWin(userId, potentialWin, isAdmin = false) {
    if (isAdmin && this.config.enableAdminWins) {
      return Math.random() < this.config.adminWinRate;
    }

    // Check daily win cap
    const underDailyCap = await this.checkDailyWinCap(userId);
    if (!underDailyCap) {
      return false;
    }

    // Check consecutive wins
    const underConsecutiveLimit = await this.checkConsecutiveWins(userId);
    if (!underConsecutiveLimit) {
      return false;
    }

    // Check big win delay
    const bigWinDelayOk = await this.checkBigWinDelay(userId, potentialWin);
    if (!bigWinDelayOk) {
      return false;
    }

    // Apply target win ratio
    const userHistory = await this.getUserWinHistory(userId, 7);
    const totalWins = userHistory.wins.reduce((sum, w) => sum + w.totalWins, 0);
    const totalLosses = userHistory.losses.reduce((sum, l) => sum + l.totalLosses, 0);
    
    if (totalLosses > 0) {
      const currentRatio = totalWins / (totalWins + totalLosses);
      if (currentRatio > this.config.targetWinRatio) {
        return false;
      }
    }

    // Add randomness if enabled
    if (this.config.enableRandomness) {
      const randomFactor = 0.9 + Math.random() * 0.2; // 10% randomness
      return Math.random() < (this.config.targetWinRatio * randomFactor);
    }

    return Math.random() < this.config.targetWinRatio;
  }

  async getPoolHealthWithAlerts() {
    const pool = await PrizePool.findOne({ poolName: this.mainPoolName });
    if (!pool) return { health: 'unknown', balance: 0 };

    const health = {
      balance: pool.currentBalance,
      totalContributions: pool.totalContributions,
      totalPayouts: pool.totalPayouts,
      health: pool.currentBalance > 5000 ? 'healthy' : 
              pool.currentBalance > 1000 ? 'low' : 'critical',
      utilizationRate: pool.totalContributions > 0 ? 
        (pool.totalPayouts / pool.totalContributions) * 100 : 0,
      alerts: []
    };

    // Generate alerts
    if (pool.currentBalance < 1000) {
      health.alerts.push({
        type: 'warning',
        message: 'Pool balance is getting low',
        severity: 'medium'
      });
    }

    if (pool.currentBalance < 100) {
      health.alerts.push({
        type: 'danger',
        message: 'Pool balance is critically low',
        severity: 'high'
      });
    }

    if (health.utilizationRate > 90) {
      health.alerts.push({
        type: 'info',
        message: 'High payout rate detected',
        severity: 'low'
      });
    }

    return health;
  }

  async triggerManualJackpot(amount, userId = null) {
    try {
      const pool = await PrizePool.findOne({ poolName: this.mainPoolName });
      
      if (!pool || pool.currentBalance < amount) {
        return { 
          success: false, 
          error: 'Insufficient pool balance',
          currentBalance: pool?.currentBalance || 0
        };
      }

      const result = await this.payFromPool(amount, userId || 'manual_jackpot', 'manual_jackpot');
      
      if (result.success) {
        // Log jackpot trigger
        await Transaction.create({
          userId: userId || 'system',
          type: 'manual_jackpot',
          amount: amount,
          status: 'completed',
          description: `Manual jackpot triggered: $${amount}`,
          metadata: {
            triggeredBy: 'admin',
            poolBalanceAfter: result.newPoolBalance
          }
        });
      }

      return result;
    } catch (error) {
      console.error('Error triggering manual jackpot:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserBehaviorAnalysis(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [gameStats, financialStats] = await Promise.all([
      GameResult.aggregate([
        { $match: { userId: userId, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            totalGames: { $sum: 1 },
            totalWins: { $sum: { $cond: [{ $gt: ['$winAmount', 0] }, 1, 0] } },
            totalLosses: { $sum: { $cond: [{ $eq: ['$winAmount', 0] }, 1, 0] } },
            totalBetAmount: { $sum: '$betAmount' },
            totalWinAmount: { $sum: '$winAmount' },
            averageBet: { $avg: '$betAmount' },
            largestWin: { $max: '$winAmount' }
          }
        }
      ]),
      Transaction.aggregate([
        { 
          $match: { 
            userId: userId, 
            createdAt: { $gte: thirtyDaysAgo },
            type: { $in: ['deposit', 'withdrawal'] }
          } 
        },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const deposits = financialStats.find(s => s._id === 'deposit') || { totalAmount: 0, count: 0 };
    const withdrawals = financialStats.find(s => s._id === 'withdrawal') || { totalAmount: 0, count: 0 };

    const behavior = {
      gameStats: gameStats[0] || {},
      financialStats: {
        deposits: deposits.totalAmount,
        withdrawals: withdrawals.totalAmount,
        netFlow: deposits.totalAmount - withdrawals.totalAmount
      },
      riskLevel: 'low',
      recommendations: []
    };

    // Determine risk level
    if (behavior.gameStats.totalGames > 100 && behavior.financialStats.netFlow < -1000) {
      behavior.riskLevel = 'high';
      behavior.recommendations.push('Consider implementing stricter win limits');
    } else if (behavior.gameStats.totalGames > 50 && behavior.financialStats.netFlow < -500) {
      behavior.riskLevel = 'medium';
      behavior.recommendations.push('Monitor user activity closely');
    }

    return behavior;
  }

  // Override existing methods to use enhanced logic
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
}

module.exports = new EnhancedPrizePoolService();
