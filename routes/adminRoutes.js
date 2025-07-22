const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middlewares/adminMiddleware');
const adminAuth = require('../middlewares/adminAuth');
const financialAnalyticsController = require('../controllers/admin/financialAnalyticsController');
const withdrawalManagementController = require('../controllers/admin/withdrawalManagementController');
const authController = require('../controllers/admin/authController');
const providerController = require('../controllers/admin/providerController');
const prizePoolController = require('../controllers/admin/prizePoolController');

// Financial Analytics Routes
router.get('/dashboard', adminMiddleware, financialAnalyticsController.getDashboardData);
router.get('/financial/top-players', adminMiddleware, financialAnalyticsController.getTopPlayers);
router.get('/financial/recent-activity', adminMiddleware, financialAnalyticsController.getRecentActivity);
router.get('/financial/daily-stats', adminMiddleware, financialAnalyticsController.getDailyStats);
router.get('/financial/user/:userId', adminMiddleware, financialAnalyticsController.getUserFinancialDetails);
router.get('/financial/system-profit', adminMiddleware, financialAnalyticsController.getSystemProfitReport);

// Withdrawal Management Routes
router.get('/withdrawals', adminMiddleware, withdrawalManagementController.getAllWithdrawals);
router.get('/withdrawals/pending', adminMiddleware, withdrawalManagementController.getPendingWithdrawals);
router.put('/withdrawals/:id/approve', adminMiddleware, withdrawalManagementController.approveWithdrawal);
router.put('/withdrawals/:id/reject', adminMiddleware, withdrawalManagementController.rejectWithdrawal);
router.put('/withdrawals/:id/process', adminMiddleware, withdrawalManagementController.processWithdrawal);

// User Management Routes
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const UserBalance = require('../models/UserBalance');
    const users = await UserBalance.find()
      .populate('userId', 'name email')
      .sort({ currentBalance: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/users/:id', adminMiddleware, async (req, res) => {
  try {
    const UserBalance = require('../models/UserBalance');
    const user = await UserBalance.findOne({ userId: req.params.id })
      .populate('userId', 'name email');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Transaction Management Routes
router.get('/transactions', adminMiddleware, async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const transactions = await Transaction.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analytics Routes
router.get('/analytics', adminMiddleware, async (req, res) => {
  try {
    const UserBalance = require('../models/UserBalance');
    const Transaction = require('../models/Transaction');
    const GameResult = require('../models/GameResult');
    
    const [
      totalUsers,
      totalDeposits,
      totalWithdrawals,
      totalBets,
      totalWins,
      activeUsers
    ] = await Promise.all([
      UserBalance.countDocuments(),
      Transaction.aggregate([
        { $match: { type: 'deposit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'withdrawal', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'bet' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'win' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      UserBalance.countDocuments({ currentBalance: { $gt: 0 } })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDeposits: totalDeposits[0]?.total || 0,
        totalWithdrawals: totalWithdrawals[0]?.total || 0,
        totalBets: totalBets[0]?.total || 0,
        totalWins: totalWins[0]?.total || 0,
        activeUsers,
        houseProfit: (totalDeposits[0]?.total || 0) - (totalWithdrawals[0]?.total || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
