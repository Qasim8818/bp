const PrizePool = require('../models/PrizePool');
const Transaction = require('../models/Transaction');
const GameResult = require('../models/GameResult');
const User = require('../models/User');

class PlayerPoolService {
  constructor() {
    this.mainPoolName = 'player_prize_pool';
    this.config = {
      minPoolBalance: 1000,
      maxPoolBalance: 100000,
      houseEdge: 0.05, // 5% house edge
      winProbability: {
        lossHeavy: 0.85, // First 5-8 spins
        lowBalance: 0.70, // When balance < 150
        plateau: 0.65, // Mid-play
        bigWin: 0.05 // After 30-40 minutes
      }
    };
  }

  async initializePool() {
    let pool = await PrizePool.findOne({ poolName: this.mainPoolName });
    if (!pool) {
      pool = new PrizePool({
        poolName: this.mainPoolName,
        currentBalance: 5000, // Starting pool
        totalContributions: 0,
        totalPayouts: 0,
        contributionRate: 0.05,
        status: 'active'
      });
      await pool.save();
    }
    return pool;
  }

  async getUserBehavior(userId) {
    const recentGames = await GameResult.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const totalSpins = recentGames.length;
    const totalDeposited = await this.getUserDeposits(userId);
    const totalWon = recentGames.reduce((sum, game) => sum + game.winAmount, 0);
    const currentBalance = await this.getUserBalance(userId);
    const timeSinceFirstSpin = recentGames.length > 0 ? 
      Date.now() - recentGames[recentGames.length - 1].createdAt.getTime() : 0;

    return {
      totalSpins,
      totalDeposited,
      totalWon,
      currentBalance,
      timeSinceFirstSpin,
      netLoss: totalDeposited - totalWon,
      isNewPlayer: totalSpins < 5,
      isLowBalance: currentBalance < 150,
      isLongSession: timeSinceFirstSpin > 30 * 60 * 1000 // 30 minutes
    };
  }

  async calculateWinAmount(userId, betAmount, gameType) {
    const behavior = await this.getUserBehavior(userId);
    const pool = await this.getPoolBalance();
    
    // Ensure pool has enough balance
    if (pool.currentBalance < betAmount * 10) {
      return { winAmount: 0, reason: 'insufficient_pool' };
    }

    let winProbability = this.config.winProbability.plateau;
    let maxWinMultiplier = 2;

    // Apply behavior-based triggers
    if (behavior.isNewPlayer && behavior.totalSpins < 8) {
      winProbability = this.config.winProbability.lossHeavy;
      maxWinMultiplier = 1.5;
    } else if (behavior.isLowBalance) {
      winProbability = this.config.winProbability.lowBalance;
      maxWinMultiplier = 3; // Comeback win
    } else if (behavior.isLongSession && Math.random() < this.config.winProbability.bigWin) {
      winProbability = this.config.winProbability.bigWin;
      maxWinMultiplier = 10; // Big win tease
    }

    // Calculate actual win
    const shouldWin = Math.random() < winProbability;
    if (!shouldWin) {
      return { winAmount: 0, reason: 'normal_loss' };
    }

    // Calculate win amount based on pool health
    const poolHealth = pool.currentBalance / this.config.maxPoolBalance;
    const adjustedMultiplier = maxWinMultiplier * (0.5 + poolHealth * 0.5);
    
    let winAmount = betAmount * (Math.random() * adjustedMultiplier + 0.5);
    winAmount = Math.min(winAmount, pool.currentBalance * 0.1); // Max 10% of pool

    return {
      winAmount: Math.round(winAmount * 100) / 100,
      reason: 'behavior_based_win',
      multiplier: winAmount / betAmount,
      probability: winProbability
    };
  }

  async processGameResult(userId, betAmount, gameType, winAmount) {
    const pool = await PrizePool.findOne({ poolName: this.mainPoolName });
    
    if (winAmount > 0) {
      // Pay from pool
      if (pool.currentBalance >= winAmount) {
        pool.currentBalance -= winAmount;
        pool.totalPayouts += winAmount;
        
        await Transaction.create({
          userId,
          type: 'pool_payout',
          amount: winAmount,
          status: 'completed',
          description: `Win paid from player pool for ${gameType}`,
          metadata: { betAmount, gameType }
        });
      } else {
        // Not enough in pool - adjust win
        winAmount = Math.min(winAmount, pool.currentBalance);
        pool.currentBalance = 0;
        pool.totalPayouts += winAmount;
      }
    } else {
      // Add to pool
      const contribution = betAmount * this.config.houseEdge;
      pool.currentBalance += contribution;
      pool.totalContributions += contribution;
      
      await Transaction.create({
        userId,
        type: 'pool_contribution',
        amount: contribution,
        status: 'completed',
        description: `Contribution to player pool from ${gameType}`,
        metadata: { betAmount, gameType }
      });
    }

    await pool.save();
    return winAmount;
  }

  async getPoolBalance() {
    return await PrizePool.findOne({ poolName: this.mainPoolName });
  }

  async getPoolStats() {
    const pool = await this.getPoolBalance();
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

    return {
      pool,
      recentContributions,
      health: pool.currentBalance > 10000 ? 'healthy' : 
              pool.currentBalance > 1000 ? 'low' : 'critical'
    };
  }

  async getUserDeposits(userId) {
    const deposits = await Transaction.aggregate([
      { $match: { userId: userId, type: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return deposits[0]?.total || 0;
  }

  async getUserBalance(userId) {
    const user = await User.findById(userId);
    return user?.balance || 0;
  }

  async canAffordPayout(amount) {
    const pool = await this.getPoolBalance();
    return {
      canAfford: pool.currentBalance >= amount,
      currentBalance: pool.currentBalance
    };
  }

  // Admin controls
  async adjustPoolBalance(amount, reason, adminId) {
    const pool = await PrizePool.findOne({ poolName: this.mainPoolName });
    pool.currentBalance += amount;
    
    await Transaction.create({
      userId: adminId,
      type: 'pool_adjustment',
      amount: amount,
      status: 'completed',
      description: reason,
      metadata: { adjustment: amount }
    });
    
    await pool.save();
    return pool;
  }

  async triggerJackpot(userId, amount) {
    const pool = await this.getPoolBalance();
    if (pool.currentBalance >= amount) {
      return await this.processGameResult(userId, 0, 'jackpot', amount);
    }
    return 0;
  }
}

module.exports = new PlayerPoolService();
