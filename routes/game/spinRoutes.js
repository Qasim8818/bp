const express = require('express');
const router = express.Router();
const spinLogicEngine = require('../../services/spinLogicEngine');
const authMiddleware = require('../../middlewares/authMiddleware');
const UserBalance = require('../../models/UserBalance');
const GameResult = require('../../models/GameResult');

// All spin routes require authentication
router.use(authMiddleware);

// Process a spin
router.post('/spin', async (req, res) => {
  try {
    const { betAmount, gameType = 'slots' } = req.body;
    const userId = req.user.id;

    // Validate bet amount
    if (!betAmount || betAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bet amount'
      });
    }

    // Check user balance
    const userBalance = await UserBalance.findOne({ userId });
    if (!userBalance || userBalance.currentBalance < betAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Process the spin
    const result = await spinLogicEngine.processSpin(userId, betAmount, gameType);

    if (result.success) {
      // Create game result record
      const gameResult = new GameResult({
        userId,
        gameType,
        betAmount: result.betAmount,
        winAmount: result.winAmount,
        result: result.winAmount > 0 ? 'win' : 'loss',
        multiplier: result.winAmount / result.betAmount,
        balanceAfter: result.newBalance,
        metadata: {
          pattern: result.pattern,
          contribution: result.contribution
        }
      });
      await gameResult.save();

      res.json({
        success: true,
        data: {
          ...result,
          gameResultId: gameResult._id
        }
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error processing spin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process spin',
      error: error.message
    });
  }
});

// Get user spin history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const gameResults = await GameResult.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GameResult.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        results: gameResults,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting spin history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get spin history',
      error: error.message
    });
  }
});

// Get user spin stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await spinLogicEngine.getUserSpinStats(userId);

    if (stats) {
      res.json({
        success: true,
        data: stats
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User stats not found'
      });
    }
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats',
      error: error.message
    });
  }
});

// Simulate spin sequence (for testing)
router.post('/simulate', async (req, res) => {
  try {
    const userId = req.user.id;
    const { sequenceLength = 20, baseBet = 10 } = req.body;

    // Check if user is admin or has permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const results = await spinLogicEngine.simulateSpinSequence(
      userId,
      sequenceLength,
      baseBet
    );

    res.json({
      success: true,
      data: {
        sequence: results,
        summary: {
          totalBets: results.reduce((sum, r) => sum + r.betAmount, 0),
          totalWins: results.reduce((sum, r) => sum + r.winAmount, 0),
          netResult: results.reduce((sum, r) => sum + r.winAmount - r.betAmount, 0),
          winRate: (results.filter(r => r.winAmount > 0).length / results.length) * 100
        }
      }
    });
  } catch (error) {
    console.error('Error simulating spin sequence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to simulate spin sequence',
      error: error.message
    });
  }
});

module.exports = router;
