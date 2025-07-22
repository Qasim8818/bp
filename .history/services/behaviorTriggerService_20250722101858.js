const GameResult = require('../models/GameResult');
const UserBalance = require('../models/UserBalance');

class BehaviorTriggerService {
  constructor() {
    this.userBehaviorCache = new Map();
    this.triggerThresholds = {
      totalSpins: {
        low: 10,
        medium: 50,
        high: 100
      },
      timeSinceFirstSpin: {
        short: 5 * 60 * 1000, // 5 minutes
        medium: 30 * 60 * 1000, // 30 minutes
        long: 2 * 60 * 60 * 1000 // 2 hours
      },
      balanceChange: {
        small: 0.1, // 10% change
        medium: 0.25, // 25% change
        large: 0.5 // 50% change
      },
      winHistory: {
        streak: 3,
        drought: 10
      }
    };
  }

  /**
   * Track user behavior and return trigger decisions
   * @param {string} userId - User ID
   * @param {Object} spinData - Current spin data
   * @returns {Object} Trigger decision with win/loss parameters
   */
  async analyzeBehavior(userId, spinData) {
    const behavior = await this.getUserBehavior(userId);
    const triggers = this.evaluateTriggers(behavior, spinData);
    
    return {
      allowWin: triggers.shouldAllowWin,
      winAmount: this.calculateWinAmount(triggers, spinData),
      nextLossStreak: triggers.nextLossStreak,
      pattern: triggers.pattern,
      reasoning: triggers.reasoning
    };
  }

  /**
   * Get comprehensive user behavior data
   * @param {string} userId - User ID
   * @returns {Object} User behavior analysis
   */
  async getUserBehavior(userId) {
    const cacheKey = `behavior_${userId}`;
    
    if (this.userBehaviorCache.has(cacheKey)) {
      const cached = this.userBehaviorCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) { // 30 second cache
        return cached.data;
      }
    }

    const behavior = await this.calculateUserBehavior(userId);
    
    this.userBehaviorCache.set(cacheKey, {
      data: behavior,
      timestamp: Date.now()
    });

    return behavior;
  }

  /**
   * Calculate user behavior metrics
   * @param {string} userId - User ID
   * @returns {Object} Behavior metrics
   */
  async calculateUserBehavior(userId) {
    const [spinHistory, userBalance] = await Promise.all([
      GameResult.find({ userId }).sort({ createdAt: -1 }).limit(200),
      UserBalance.findOne({ userId })
    ]);

    const now = new Date();
    const firstSpin = spinHistory.length > 0 ? spinHistory[spinHistory.length - 1].createdAt : now;
    const timeSinceFirstSpin = now - firstSpin;

    // Calculate metrics
    const totalSpins = spinHistory.length;
    const totalBet = spinHistory.reduce((sum, spin) => sum + spin.betAmount, 0);
    const totalWon = spinHistory.reduce((sum, spin) => sum + spin.winAmount, 0);
    const netProfit = totalWon - totalBet;
    
    // Balance changes
    const initialBalance = userBalance?.initialBalance || 1000;
    const currentBalance = userBalance?.currentBalance || 1000;
    const balanceChange = (currentBalance - initialBalance) / initialBalance;

    // Win history analysis
    const wins = spinHistory.filter(spin => spin.isWin);
    const losses = spinHistory.filter(spin => !spin.isWin);
    const winRate = totalSpins > 0 ? (wins.length / totalSpins) * 100 : 0;
    
    // Streak analysis
    const recentSpins = spinHistory.slice(0, 20);
    const currentStreak = this.calculateStreak(recentSpins);
    
    // Time-based patterns
    const hourlySpins = this.calculateHourlySpins(spinHistory);
    const sessionDuration = this.calculateSessionDuration(spinHistory);

    return {
      totalSpins,
      timeSinceFirstSpin,
      balanceChange,
      winHistory: {
        totalWins: wins.length,
        totalLosses: losses.length,
        winRate,
        currentStreak,
        biggestWin: Math.max(...wins.map(w => w.winAmount), 0),
        longestWinStreak: this.calculateLongestStreak(spinHistory, true),
        longestLossStreak: this.calculateLongestStreak(spinHistory, false)
      },
      bettingPatterns: {
        averageBet: totalSpins > 0 ? totalBet / totalSpins : 0,
        totalBet,
        totalWon,
        netProfit,
        volatility: this.calculateVolatility(spinHistory)
      },
      timePatterns: {
        hourlySpins,
        sessionDuration,
        spinsPerMinute: totalSpins / (timeSinceFirstSpin / 60000)
      },
      riskProfile: this.determineRiskProfile(spinHistory)
    };
  }

  /**
   * Evaluate triggers based on behavior
   * @param {Object} behavior - User behavior data
   * @param {Object} spinData - Current spin data
   * @returns {Object} Trigger decisions
   */
  evaluateTriggers(behavior, spinData) {
    const triggers = {
      allowWin: false,
      winAmount: 0,
      nextLossStreak: 0,
      pattern: 'default',
      reasoning: []
    };

    // Total spins trigger
    if (behavior.totalSpins < this.triggerThresholds.totalSpins.low) {
      triggers.reasoning.push('New user - allow small wins');
      triggers.shouldAllowWin = true;
      triggers.winAmount = spinData.betAmount * 1.5;
      triggers.pattern = 'new_user';
    } else if (behavior.totalSpins >= this.triggerThresholds.totalSpins.high) {
      triggers.reasoning.push('Experienced user - balanced approach');
      triggers.shouldAllowWin = Math.random() < 0.4;
      triggers.winAmount = spinData.betAmount * 2;
      triggers.pattern = 'experienced';
    }

    // Balance change trigger
    if (behavior.balanceChange <= -this.triggerThresholds.balanceChange.large) {
      triggers.reasoning.push('Large losses detected - recovery mode');
      triggers.shouldAllowWin = true;
      triggers.winAmount = spinData.betAmount * 3;
      triggers.pattern = 'recovery';
      triggers.nextLossStreak = 3;
    } else if (behavior.balanceChange >= this.triggerThresholds.balanceChange.medium) {
      triggers.reasoning.push('Profitable session - maintain house edge');
      triggers.shouldAllowWin = Math.random() < 0.2;
      triggers.winAmount = spinData.betAmount * 1.2;
      triggers.pattern = 'profitable';
      triggers.nextLossStreak = 5;
    }

    // Win streak trigger
    if (behavior.winHistory.currentStreak.loss >= this.triggerThresholds.winHistory.drought) {
      triggers.reasoning.push('Long loss streak - guaranteed win');
      triggers.shouldAllowWin = true;
      triggers.winAmount = spinData.betAmount * 2.5;
      triggers.pattern = 'drought_breaker';
      triggers.nextLossStreak = 2;
    } else if (behavior.winHistory.currentStreak.win >= this.triggerThresholds.winHistory.streak) {
      triggers.reasoning.push('Win streak detected - increase losses');
      triggers.shouldAllowWin = Math.random() < 0.1;
      triggers.winAmount = spinData.betAmount * 0.5;
      triggers.pattern = 'streak_cooldown';
      triggers.nextLossStreak = 8;
    }

    // Time-based trigger
    if (behavior.timeSinceFirstSpin > this.triggerThresholds.timeSinceFirstSpin.long) {
      triggers.reasoning.push('Long session - engagement boost');
      triggers.shouldAllowWin = true;
      triggers.winAmount = spinData.betAmount * 1.8;
      triggers.pattern = 'engagement_boost';
    }

    return triggers;
  }

  /**
   * Calculate win amount based on triggers
   * @param {Object} triggers - Trigger decisions
   * @param {Object} spinData - Spin data
   * @returns {number} Calculated win amount
   */
  calculateWinAmount(triggers, spinData) {
    if (!triggers.shouldAllowWin) return 0;

    let baseWin = triggers.winAmount || 0;
    
    // Apply randomness within 20% range
    const randomFactor = 0.8 + (Math.random() * 0.4);
    baseWin *= randomFactor;

    // Ensure win is not too large
    const maxWin = spinData.betAmount * 5;
    return Math.min(Math.round(baseWin), maxWin);
  }

  // Helper methods
  calculateStreak(spins) {
    let winStreak = 0;
    let lossStreak = 0;
    
    for (const spin of spins) {
      if (spin.isWin) {
        winStreak++;
        lossStreak = 0;
      } else {
        lossStreak++;
        winStreak = 0;
      }
    }

    return { win: winStreak, loss: lossStreak };
  }

  calculateLongestStreak(spins, isWin) {
    let longest = 0;
    let current = 0;

    for (const spin of spins) {
      if (spin.isWin === isWin) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }

    return longest;
  }

  calculateVolatility(spins) {
    if (spins.length < 2) return 0;
    
    const wins = spins.filter(s => s.isWin).map(s => s.winAmount);
    if (wins.length === 0) return 0;
    
    const mean = wins.reduce((a, b) => a + b, 0) / wins.length;
    const variance = wins.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wins.length;
    
    return Math.sqrt(variance) / mean;
  }

  calculateHourlySpins(spins) {
    const hourly = {};
    spins.forEach(spin => {
      const hour = new Date(spin.createdAt).getHours();
      hourly[hour] = (hourly[hour] || 0) + 1;
    });
    return hourly;
  }

  calculateSessionDuration(spins) {
    if (spins.length < 2) return 0;
    
    const first = new Date(spins[spins.length - 1].createdAt);
    const last = new Date(spins[0].createdAt);
    
    return last - first;
  }

  determineRiskProfile(spins) {
    if (spins.length < 10) return 'unknown';
    
    const avgBet = spins.reduce((sum, s) => sum + s.betAmount, 0) / spins.length;
    const maxBet = Math.max(...spins.map(s => s.betAmount));
    const riskRatio = maxBet / avgBet;
    
    if (riskRatio > 5) return 'high_risk';
    if (riskRatio > 2) return 'medium_risk';
    return 'low_risk';
  }

  /**
   * Clear cache for a specific user
   * @param {string} userId - User ID
   */
  clearCache(userId) {
    this.userBehaviorCache.delete(`behavior_${userId}`);
  }

  /**
   * Get system-wide behavior statistics
   * @returns {Object} System statistics
   */
  async getSystemStats() {
    const totalUsers = await GameResult.distinct('userId');
    const totalSpins = await GameResult.countDocuments();
    const totalWins = await GameResult.countDocuments({ isWin: true });
    
    return {
      totalUsers: totalUsers.length,
      totalSpins,
      totalWins,
      overallWinRate: totalSpins > 0 ? (totalWins / totalSpins) * 100 : 0
    };
  }
}

module.exports = new BehaviorTriggerService();
