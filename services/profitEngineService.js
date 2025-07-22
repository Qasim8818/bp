const PrizePool = require('../models/PrizePool');
const Transaction = require('../models/Transaction');
const GameResult = require('../models/GameResult');
const User = require('../models/User');

class ProfitEngineService {
  constructor() {
    this.mainPoolName = 'profit_engine_pool';
    this.config = {
      minPoolBalance: 500,
      maxPoolBalance: 100000,
      targetProfitMargin: 0.20, // 20% profit margin
      winPatterns: {
        initialLosses: 8, // First 8 spins mostly losses
        lowBalanceThreshold: 250,
        highBalanceThreshold: 500,
        bigWinTrigger: 500, // Amount to trigger big win
        smallWinAmount: 50, // Small wins to keep engaged
        mediumWinAmount: 300 // Medium wins for balance management
      }
    };
  }

  async initialize() {
    let pool = await PrizePool.findOne({ poolName: this.mainPoolName });
    if (!pool) {
      pool = new PrizePool({
        poolName: this.mainPoolName,
        currentBalance: 1000, // Starting pool
        totalContributions: 0,
        totalPayouts: 0,
        contributionRate: 0.25, // 25% of losses go to profit
        status: 'active'
      });
      await pool.save();
    }
    return pool;
  }

  async getUserSessionData(userId) {
    const recentGames = await GameResult.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100);

    const sessionData = {
      totalSpins: recentGames.length,
      totalDeposited: await this.getUserDeposits(userId),
      totalWon: recentGames.reduce((sum, game) => sum + game.winAmount, 0),
      totalBet: recentGames.reduce((sum, game) => sum + game.betAmount, 0),
      currentBalance: await this.getUserBalance(userId),
      lastSpinTime: recentGames.length > 0 ? recentGames[0].createdAt : null,
      lossStreak: this.calculateLossStreak(recentGames),
      profitGenerated: 0
    };

    sessionData.netLoss = sessionData.totalBet - sessionData.totalWon;
    sessionData.profitGenerated = Math.max(0, sessionData.netLoss * 0.25); // 25% profit margin

    return sessionData;
  }

  calculateLossStreak(games) {
    let streak = 0;
    for (const game of games) {
      if (game.winAmount === 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  async calculateWinAmount(userId, betAmount, gameType) {
    const session = await this.getUserSessionData(userId);
    const pool = await this.getPoolBalance();
    
    // Ensure pool has enough balance
    if (pool.currentBalance < betAmount * 2) {
      return { winAmount: 0, reason: 'pool_low', strategy: 'force_loss' };
    }

    let winAmount = 0;
    let strategy = 'normal';

    // Strategy 1: Initial Losses (First 8 spins)
    if (session.totalSpins < this.config.winPatterns.initialLosses) {
      if (Math.random() < 0.9) { // 90% loss rate initially
        winAmount = 0;
        strategy = 'initial_losses';
      } else {
        winAmount = betAmount * 0.5; // Small win occasionally
        strategy = 'initial_small_win';
      }
    }
    // Strategy 2: Balance Management
    else if (session.currentBalance < this.config.winPatterns.lowBalanceThreshold) {
      // Give small win to keep playing
      winAmount = this.config.winPatterns.smallWinAmount;
      strategy = 'low_balance_boost';
    }
    else if (session.currentBalance > this.config.winPatterns.highBalanceThreshold) {
      // Encourage more play with medium win
      if (Math.random() < 0.3) {
        winAmount = this.config.winPatterns.mediumWinAmount;
        strategy = 'high_balance_medium_win';
      } else {
        winAmount = 0;
        strategy = 'high_balance_loss';
      }
    }
    // Strategy 3: Profit Target Achievement
    else if (session.profitGenerated >= this.config.winPatterns.bigWinTrigger) {
      // Give big win to encourage more deposits
      winAmount = this.config.winPatterns.bigWinTrigger;
      strategy = 'big_win_tease';
    }
    // Strategy 4: Normal Play Pattern
    else {
      // 60% loss rate during normal play
      if (Math.random() < 0.6) {
        winAmount = 0;
        strategy = 'normal_loss';
      } else {
        winAmount = betAmount * (Math.random() * 2 + 0.5);
        strategy = 'normal_win';
      }
    }

    // Ensure win doesn't exceed pool balance
    winAmount = Math.min(winAmount, pool.currentBalance * 0.8);

    return {
      winAmount: Math.round(winAmount * 100) / 100,
      strategy,
      poolBalance: pool.currentBalance,
      sessionData: session
    };
  }

  async processGameResult(userId, betAmount, gameType, calculatedWin) {
    const pool = await PrizePool.findOne({ poolName: this.mainPoolName });
    
    // Calculate actual profit
    const houseProfit = betAmount - calculatedWin;
    const contribution = houseProfit * this.config.contributionRate;
    
    if (calculatedWin > 0) {
      // Pay from pool
      pool.currentBalance -= calculatedWin;
      pool.totalPayouts += calculatedWin;
      
      await Transaction.create({
        userId,
        type: 'profit_payout',
        amount: calculatedWin,
        status: 'completed',
        description: `Win paid from profit pool for ${gameType}`,
        metadata: { 
          betAmount, 
          gameType, 
          strategy: calculatedWin.strategy,
          houseProfit: houseProfit
        }
      });
    }
    
    // Add profit to pool
    pool.currentBalance += contribution;
    pool.totalContributions += contribution;
    
    await Transaction.create({
      userId,
      type: 'profit_contribution',
      amount: contribution,
      status: 'completed',
      description: `Profit contribution from ${gameType}`,
      metadata: { 
        betAmount, 
        gameType, 
        houseProfit,
        contribution
      }
    });

    await pool.save();
