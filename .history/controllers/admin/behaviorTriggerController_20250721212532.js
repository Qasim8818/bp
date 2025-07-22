const behaviorTriggerService = require('../../services/behaviorTriggerService');
const GameResult = require('../../models/GameResult');
const UserBalance = require('../../models/UserBalance');

class BehaviorTriggerController {
  /**
   * Get user behavior analysis
   */
  async getUserBehavior(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const behavior = await behaviorTriggerService.getUserBehavior(userId);
      
      res.json({
        success: true,
        data: behavior
      });
    } catch (error) {
      console.error('Error getting user behavior:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user behavior',
        error: error.message
      });
    }
  }

  /**
   * Get behavior trigger decisions for a user
   */
  async getTriggerDecisions(req, res) {
    try {
      const { userId } = req.params;
      const { betAmount = 100 } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const spinData = { betAmount: parseInt(betAmount), gameType: 'slots' };
      const triggers = await behaviorTriggerService.analyzeBehavior(userId, spinData);
      
      res.json({
        success: true,
        data: triggers
      });
    } catch (error) {
      console.error('Error getting trigger decisions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trigger decisions',
        error: error.message
      });
    }
  }

  /**
   * Get system-wide behavior statistics
   */
  async getSystemStats(req, res) {
    try {
      const stats = await behaviorTriggerService.getSystemStats();
      
      // Additional analytics
      const recentSpins = await GameResult.find()
        .sort({ createdAt: -1 })
        .limit(1000)
        .populate('userId', 'username');
      
      const hourlyActivity = {};
      const userActivity = {};
      
      recentSpins.forEach(spin => {
        const hour = new Date(spin.createdAt).getHours();
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
        
        const userId = spin.userId._id.toString();
        userActivity[userId] = (userActivity[userId] || 0) + 1;
      });
      
      const topUsers = Object.entries(userActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([userId, spins]) => ({ userId, spins }));
      
      res.json({
        success: true,
        data: {
          ...stats,
          hourlyActivity,
          topUsers,
          recentSpins: recentSpins.length
        }
      });
    } catch (error) {
      console.error('Error getting system stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system stats',
        error: error.message
      });
    }
  }

  /**
   * Clear behavior cache for a user
   */
  async clearCache(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      behaviorTriggerService.clearCache(userId);
      
      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache',
        error: error.message
      });
    }
  }

  /**
   * Get behavior patterns summary
   */
  async getBehaviorPatterns(req, res) {
    try {
      const { limit = 50 } = req.query;
      
      const users = await UserBalance.find()
        .sort({ lastUpdated: -1 })
        .limit(parseInt(limit));
      
      const patterns = [];
      
      for (const userBalance of users) {
        const behavior = await behaviorTriggerService.getUserBehavior(userBalance.userId);
        const triggers = await behaviorTriggerService.analyzeBehavior(userBalance.userId, { betAmount: 100 });
        
        patterns.push({
          userId: userBalance.userId,
          currentBalance: userBalance.currentBalance,
          totalSpins: behavior.totalSpins,
          winRate: behavior.winHistory.winRate,
          pattern: triggers.pattern,
          riskProfile: behavior.riskProfile,
          lastActivity: userBalance.lastUpdated
        });
      }
      
      res.json({
        success: true,
        data: patterns
      });
    } catch (error) {
      console.error('Error getting behavior patterns:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get behavior patterns',
        error: error.message
      });
    }
  }
}

module.exports = new BehaviorTriggerController();
