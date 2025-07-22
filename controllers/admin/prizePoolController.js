const prizePoolService = require('../../services/prizePoolService');
const Transaction = require('../../models/Transaction');

class PrizePoolController {
  async getCurrentPool(req, res) {
    try {
      const pool = await prizePoolService.getPoolStats();
      res.json({
        success: true,
        data: {
          currentBalance: pool.pool.currentBalance,
          totalContributions: pool.pool.totalContributions,
          totalPayouts: pool.pool.totalPayouts,
          contributionRate: pool.pool.contributionRate,
          status: pool.pool.status
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getPoolHistory(req, res) {
    try {
      const { page = 1, limit = 50, type } = req.query;
      const skip = (page - 1) * limit;

      const query = {
        $or: [
          { type: 'pool_contribution' },
          { type: 'pool_payout' }
        ]
      };

      if (type) {
        query.type = type;
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
      res.status(500).json({ message: error.message });
    }
  }

  async getPoolStats(req, res) {
    try {
      const stats = await prizePoolService.getPoolStats();
      const health = await prizePoolService.getPoolHealth();

      res.json({
        success: true,
        data: {
          ...stats,
          health
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updatePoolSettings(req, res) {
    try {
      const { contributionRate, status } = req.body;
      
      const PrizePool = require('../../models/PrizePool');
      const pool = await PrizePool.findOne({ poolName: 'main_prize_pool' });

      if (!pool) {
        return res.status(404).json({ message: 'Prize pool not found' });
      }

      if (contributionRate !== undefined) {
        pool.contributionRate = contributionRate;
      }

      if (status !== undefined) {
        pool.status = status;
      }

      await pool.save();

      res.json({
        success: true,
        message: 'Pool settings updated successfully',
        data: pool
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async simulatePoolContribution(req, res) {
    try {
      const { amount, userId, gameResultId } = req.body;

      const result = await prizePoolService.contributeToPool(amount, 0, userId, gameResultId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async simulatePoolPayout(req, res) {
    try {
      const { amount, userId, reason } = req.body;

      const result = await prizePoolService.payFromPool(amount, userId, reason);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getPoolHealth(req, res) {
    try {
      const health = await prizePoolService.getPoolHealth();
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new PrizePoolController();
