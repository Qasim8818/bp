const EnhancedProviderFactory = require('./enhancedProviderFactory');
const User = require('../models/User');
const GameResult = require('../models/GameResult');
const Withdrawal = require('../models/Withdrawal');

class UnifiedGameLobby {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    await EnhancedProviderFactory.initializeProviders();
    this.isInitialized = true;
  }

  async getLobbyData(userId) {
    await this.initialize();
    
    const [allGames, userStats, recentResults, withdrawalLimits] = await Promise.all([
      this.getAllGames(),
      this.getUserStats(userId),
      this.getRecentResults(userId),
      this.getWithdrawalLimits(userId)
    ]);

    return {
      games: allGames,
      userStats,
      recentResults,
      withdrawalLimits,
      providers: EnhancedProviderFactory.getAllProviders()
    };
  }

  async getAllGames() {
    await this.initialize();
    
    const games = await EnhancedProviderFactory.getAllGames();
    
    // Group games by provider
    const groupedGames = games.reduce((acc, game) => {
      if (!acc[game.provider]) {
        acc[game.provider] = [];
      }
      acc[game.provider].push(game);
      return acc;
    }, {});

    return {
      totalGames: games.length,
      providers: Object.keys(groupedGames),
      games: groupedGames
    };
  }

  async getUserStats(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const stats = await GameResult.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalBets: { $sum: '$betAmount' },
          totalWins: { $sum: { $cond: ['$isWin', '$winAmount', 0] } },
          totalGames: { $sum: 1 },
          jackpotWins: { $sum: { $cond: ['$jackpotWin', 1, 0] } },
          totalJackpotWon: { $sum: { $cond: ['$jackpotWin', '$jackpotAmount', 0] } }
        }
      }
    ]);

    const withdrawalStats = await Withdrawal.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalWithdrawn: { $sum: { $cond: [{ $in: ['$status', ['completed']] }, '$amount', 0] } },
          pendingWithdrawals: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          totalWithdrawals: { $sum: 1 }
        }
      }
    ]);

    return {
      balance: user.balance,
      totalBets: stats[0]?.totalBets || 0,
      totalWins: stats[0]?.totalWins || 0,
      totalGames: stats[0]?.totalGames || 0,
      jackpotWins: stats[0]?.jackpotWins || 0,
      totalJackpotWon: stats[0]?.totalJackpotWon || 0,
      totalWithdrawn: withdrawalStats[0]?.totalWithdrawn || 0,
      pendingWithdrawals: withdrawalStats[0]?.pendingWithdrawals || 0,
      totalWithdrawals: withdrawalStats[0]?.totalWithdrawals || 0,
      netProfit: (stats[0]?.totalWins || 0) - (stats[0]?.totalBets || 0)
    };
  }

  async getRecentResults(userId, limit = 10) {
    return await GameResult.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('gameType betAmount winAmount multiplier isWin jackpotWin createdAt');
  }

  async getWithdrawalLimits(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's withdrawal history for the last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentWithdrawals = await Withdrawal.aggregate([
      {
        $match: {
          userId: user._id,
          createdAt: { $gte: last24Hours },
          status: { $in: ['pending', 'approved', 'processing', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      minWithdrawal: 10,
      maxWithdrawal: 10000,
      dailyLimit: 5000,
      currentDailyTotal: recentWithdrawals[0]?.totalAmount || 0,
      dailyWithdrawalsCount: recentWithdrawals[0]?.count || 0,
      remainingDailyLimit: Math.max(0, 5000 - (recentWithdrawals[0]?.totalAmount || 0)),
      canWithdraw: user.balance >= 10 && (recentWithdrawals[0]?.totalAmount || 0) < 5000
    };
  }

  async launchGame(providerName, gameId, userId) {
    await this.initialize();
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await EnhancedProviderFactory.launchGame(providerName, gameId, {
      id: user._id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      currency: user.currency || 'USD'
    });
  }

  async processGame(providerName, gameData) {
    await this.initialize();
    
    const result = await EnhancedProviderFactory.processGame(providerName, gameData);
    
    // Update user balance immediately
    if (result.winAmount > 0) {
      const user = await User.findById(gameData.userId);
      if (user) {
        user.balance += result.winAmount;
        await user.save();
      }
    }
    
    return result;
  }

  async getGameDetails(providerName, gameId) {
    await this.initialize();
    return await EnhancedProviderFactory.getGameDetails(providerName, gameId);
  }

  async searchGames(query, providerFilter = null) {
    await this.initialize();
    
    const allGames = await EnhancedProviderFactory.getAllGames();
    
    let filteredGames = allGames.filter(game => 
      game.name.toLowerCase().includes(query.toLowerCase()) ||
      game.category.toLowerCase().includes(query.toLowerCase())
    );
    
    if (providerFilter && providerFilter.length > 0) {
      filteredGames = filteredGames.filter(game => 
        providerFilter.includes(game.provider)
      );
    }
    
    return filteredGames;
  }

  async getJackpotStats() {
    await this.initialize();
    
    const customProvider = EnhancedProviderFactory.getProvider('Custom');
    if (customProvider && customProvider.getJackpotStats) {
      return await customProvider.getJackpotStats();
    }
    
    return null;
  }

  async getProviderStats() {
    await this.initialize();
    return EnhancedProviderFactory.getProviderStats();
  }
}

module.exports = new UnifiedGameLobby();
