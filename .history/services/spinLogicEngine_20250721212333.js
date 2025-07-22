const UserBalance = require('../models/UserBalance');
const GameResult = require('../models/GameResult');
const prizePoolService = require('./prizePoolService');
const behaviorTriggerService = require('./behaviorTriggerService');
const { generateRandomNumber } = require('../utils/rng');

class SpinLogicEngine {
  constructor() {
    this.wavePatterns = {
      // Wave 1: Initial loss-heavy phase
      INITIAL_LOSS: {
        lossRate: 0.85,
        maxWin: 0.5, // 50% of bet
        duration: 5 // spins
      },
      
      // Wave 2: Low balance boost
      COMEBACK: {
        triggerBalance: 150,
        winAmount: 150,
        probability: 1.0 // Always trigger when balance low
      },
      
      // Wave 3: Plateau phase
      PLATEAU: {
        lossRate: 0.75,
        smallWinRate: 0.2,
        smallWinAmount: 100,
        mediumWinRate: 0.05,
        mediumWinAmount: 150
      },
      
      // Wave 4: Big win surprise
      BIG_WIN: {
        triggerTime: 40, // minutes
        winAmount: 500,
        postWinLossRate: 0.7 // 70% loss rate after big win
      }
    };
  }

  async processSpin(userId, betAmount, gameType = 'slots') {
    try {
      const userBalance = await UserBalance.findOne({ userId });
      if (!userBalance) {
        throw new Error('User balance not found');
      }

      // Get user's spin history
      const spinHistory = await GameResult.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

      const totalSpins = spinHistory.length;
      const currentBalance = userBalance.currentBalance;

      // Determine which pattern to use based on user behavior
      const pattern = this.selectPattern(userBalance, spinHistory);
      
      // Calculate win amount based on pattern
      const winAmount = this.calculateWinAmount(
        betAmount,
        currentBalance,
        totalSpins,
        pattern
      );

      // Update user balance
      const newBalance = currentBalance - betAmount + winAmount;
      await UserBalance.findOneAndUpdate(
        { userId },
        {
          $inc: {
            totalBetAmount: betAmount,
            totalWinAmount: winAmount,
            currentBalance: -betAmount + winAmount
          },
          $set: { lastUpdated: new Date() }
        }
      );

      // Contribute to prize pool
      const contribution = Math.max(0, betAmount - winAmount);
      if (contribution > 0) {
        await prizePoolService.contributeToPool(
          betAmount,
          winAmount,
          userId,
          'game_result_placeholder'
        );
      }

      return {
        success: true,
        betAmount,
        winAmount,
        newBalance,
        pattern: pattern.name,
        contribution
      };
    } catch (error) {
      console.error('Error processing spin:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  selectPattern(userBalance, spinHistory) {
    const totalSpins = spinHistory.length;
    const currentBalance = userBalance.currentBalance;
    
    // Use revive pattern for new users or when balance is low
    if (totalSpins < 20 || currentBalance < 200) {
      return { name: 'PATTERN_REVIVE', ...this.spinPatterns.PATTERN_REVIVE };
    }
    
    // Use gradual pattern for regular users
    if (totalSpins < 100) {
      return { name: 'PATTERN_GRADUAL', ...this.spinPatterns.PATTERN_GRADUAL };
    }
    
    // Use balanced pattern for experienced users
    return { name: 'PATTERN_BALANCED', ...this.spinPatterns.PATTERN_BALANCED };
  }

  calculateWinAmount(betAmount, currentBalance, totalSpins, pattern) {
    let winAmount = 0;
    
    switch (pattern.name) {
      case 'PATTERN_REVIVE':
        winAmount = this.calculateRevivePattern(betAmount, currentBalance, totalSpins, pattern);
        break;
        
      case 'PATTERN_GRADUAL':
        winAmount = this.calculateGradualPattern(betAmount, currentBalance, totalSpins, pattern);
        break;
        
      case 'PATTERN_BALANCED':
        winAmount = this.calculateBalancedPattern(betAmount, pattern);
        break;
        
      default:
        winAmount = 0;
    }
    
    return Math.round(winAmount);
  }

  calculateRevivePattern(betAmount, currentBalance, totalSpins, pattern) {
    const { initialLosses, reviveThreshold, reviveMultiplier, smallWinChance, smallWinMultiplier } = pattern;
    
    // Initial losses
    if (totalSpins < initialLosses) {
      return Math.random() < 0.1 ? betAmount * 2 : 0;
    }
    
    // Big win when balance is low
    if (currentBalance <= reviveThreshold) {
      return betAmount * reviveMultiplier;
    }
    
    // Small random wins
    if (Math.random() < smallWinChance) {
      return betAmount * smallWinMultiplier;
    }
    
    return 0;
  }

  calculateGradualPattern(betAmount, currentBalance, totalSpins, pattern) {
    const { lossRate, boostThresholds, boostMultipliers, randomWinChance, randomWinMultiplier } = pattern;
    
    // Check if we should give a boost
    for (let i = 0; i < boostThresholds.length; i++) {
      if (currentBalance <= boostThresholds[i]) {
        return betAmount * boostMultipliers[i];
      }
    }
    
    // Random small wins
    if (Math.random() < randomWinChance) {
      return betAmount * randomWinMultiplier;
    }
    
    // Regular losses with occasional wins
    return Math.random() < (1 - lossRate) ? betAmount * 2 : 0;
  }

  calculateBalancedPattern(betAmount, pattern) {
    const { houseEdge, winRate, maxWinMultiplier } = pattern;
    
    if (Math.random() < winRate) {
      // Win with house edge applied
      const multiplier = 1 + (Math.random() * (maxWinMultiplier - 1));
      return betAmount * multiplier * (1 - houseEdge);
    }
    
    return 0;
  }

  async getUserSpinStats(userId) {
    try {
      const userBalance = await UserBalance.findOne({ userId });
      const spinHistory = await GameResult.find({ userId })
        .sort({ createdAt: -1 })
        .limit(100);

      const stats = {
        totalSpins: spinHistory.length,
        totalBet: userBalance?.totalBetAmount || 0,
        totalWon: userBalance?.totalWinAmount || 0,
        currentBalance: userBalance?.currentBalance || 0,
        netProfit: userBalance?.netProfit || 0,
        averageBet: spinHistory.length > 0 ? 
          spinHistory.reduce((sum, spin) => sum + spin.betAmount, 0) / spinHistory.length : 0,
        winRate: spinHistory.length > 0 ?
          (spinHistory.filter(spin => spin.winAmount > 0).length / spinHistory.length) * 100 : 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting user spin stats:', error);
      return null;
    }
  }

  async simulateSpinSequence(userId, sequenceLength = 20, baseBet = 10) {
    const results = [];
    let simulatedBalance = 500;

    for (let i = 0; i < sequenceLength; i++) {
      const betAmount = baseBet;
      const result = await this.processSpin(userId, betAmount);
      
      if (result.success) {
        simulatedBalance = result.newBalance;
        results.push({
          spin: i + 1,
          betAmount,
          winAmount: result.winAmount,
          balance: simulatedBalance,
          pattern: result.pattern
        });
      }
    }

    return results;
  }
}

module.exports = new SpinLogicEngine();
