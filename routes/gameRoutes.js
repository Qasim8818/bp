const express = require('express');
const router = express.Router();
const gameLobbyService = require('../services/gameLobbyService');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const BalanceTrackingService = require('../services/balanceTrackingService');
const PrizePoolService = require('../services/prizePoolService');

// Public routes
router.get('/lobby', async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'all',
      category: req.query.category || 'all',
      minBet: req.query.minBet ? parseFloat(req.query.minBet) : null,
      maxBet: req.query.maxBet ? parseFloat(req.query.maxBet) : null,
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'name',
      sortOrder: req.query.sortOrder || 'asc'
    };

    const games = await gameLobbyService.getAllGames(filters);
    res.json(games);
  } catch (error) {
    console.error('Error fetching lobby:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const featuredGames = await gameLobbyService.getFeaturedGames();
    res.json(featuredGames);
  } catch (error) {
    console.error('Error fetching featured games:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/jackpot', async (req, res) => {
  try {
    const jackpotStats = await gameLobbyService.getJackpotStats();
    res.json(jackpotStats);
  } catch (error) {
    console.error('Error fetching jackpot stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Protected routes
router.get('/game/:provider/:gameId', authMiddleware, async (req, res) => {
  try {
    const { provider, gameId } = req.params;
    const gameDetails = await gameLobbyService.getGameDetails(provider, gameId);
    res.json(gameDetails);
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/launch', authMiddleware, async (req, res) => {
  try {
    const { provider, gameId } = req.body;
    const userData = {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      currency: req.user.currency || 'USD'
    };

    const launchData = await gameLobbyService.launchGame(provider, gameId, userData);
    res.json(launchData);
  } catch (error) {
    console.error('Error launching game:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/play', authMiddleware, async (req, res) => {
  try {
    const { provider, gameId, betAmount, userChoice, sessionId } = req.body;
    
    if (!provider || !gameId || !betAmount || !userChoice || !sessionId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check user balance
    const userBalance = await BalanceTrackingService.getUserBalance(req.user.id);
    if (userBalance.currentBalance < parseFloat(betAmount)) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const gameData = {
      gameId,
      betAmount: parseFloat(betAmount),
      userChoice,
      userId: req.user.id,
      sessionId
    };

    // Process the game
    const result = await gameLobbyService.processGame(provider, gameData);
    
    // Record the game result with balance tracking
    await BalanceTrackingService.recordGameResult(
      req.user.id,
      parseFloat(betAmount),
      result.winAmount || 0,
      result.gameResultId
    );

    // Update prize pool
    await PrizePoolService.contributeToPool(
      parseFloat(betAmount),
      result.winAmount || 0,
      req.user.id,
      result.gameResultId
    );

    res.json(result);
  } catch (error) {
    console.error('Error processing game:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes
router.get('/providers/status', adminMiddleware, async (req, res) => {
  try {
    const status = gameLobbyService.getProviderStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching provider status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const GameResult = require('../models/GameResult');
    const { page = 1, limit = 20, provider } = req.query;

    const query = { userId: req.user.id };
    if (provider && provider !== 'all') {
      query.gameType = provider;
    }

    const gameHistory = await GameResult.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await GameResult.countDocuments(query);

    // Get user balance summary
    const userBalance = await BalanceTrackingService.getUserBalance(req.user.id);
    const userSummary = await BalanceTrackingService.getUserFinancialSummary(req.user.id);

    res.json({
      history: gameHistory,
      balance: userBalance,
      summary: userSummary.summary,
      transactions: userSummary.recentTransactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Financial tracking routes
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const userBalance = await BalanceTrackingService.getUserBalance(req.user.id);
    const userSummary = await BalanceTrackingService.getUserFinancialSummary(req.user.id);
    
    res.json({
      success: true,
      data: {
        balance: userBalance,
        summary: userSummary.summary,
        transactions: userSummary.recentTransactions
      }
    });
  } catch (error) {
    console.error('Error getting user balance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
