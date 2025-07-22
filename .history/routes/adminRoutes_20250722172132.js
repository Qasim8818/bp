const express = require('express');
const router = express.Router;
const adminMiddleware = require('../../middlewares/adminMiddleware');
const adminAuth = require('../../middlewares/adminAuth');
const financialAnalyticsController = require('../../controllers/admin/financialAnalyticsController');
const withdrawalManagementController = require('../../controllers/admin/withdrawalManagementController');
const authController = require('../../controllers/admin/authController');
const providerController = require('../../controllers/admin/providerController');
const prizePoolController = require('../../controllers/admin/prizePoolController');

// Financial Analytics Routes
router.get('/dashboard', adminMiddleware, financialAnalyticsController.getDashboardData);
router.get('/financial/top-players', adminMiddleware, financialAnalyticsController.getTopPlayers);
router.get('/financial/recent-activity', adminMiddleware, financialAnalyticsController.getRecentActivity);
router.get('/financial/daily-stats', adminMiddleware, financialAnalyticsController.getDailyStats);
router.get('/financial/user/:userId', adminMiddleware, financialAnalyticsController.getUserFinancialDetails);
router.get('/financial/system-profit', adminMiddleware, financialAnalyticsController.getSystemProfitReport);

// Withdrawal Management Routes
router.get('/withdrawals', adminMiddleware, financialAnalyticsController.getAllWithdrawals);
router.get('/withdrawals/pending', adminMiddleware, withdrawalManagementController.getPendingWithdrawals);
router.put('/withdrawals/:id/approve', adminMiddleware, withdrawalManagementController.approveWithdrawal);
router.put('/withdrawals/:id/reject', adminMiddleware, withdrawalManagementController.rejectWithdrawal);
router.put('/withdrawals/:id/process', adminMiddleware, withdrawalManagementController.processWithdrawal);

// User Management Routes
router.get('/users', adminMiddleware, financialAnalyticsController.getAllUsers);
router.get('/users/:id', adminMiddleware, financialAnalyticsController.getUserById);

// Transaction Management Routes
router.get('/transactions', adminMiddleware, financialAnalyticsController.getAllTransactions);
router.get('/transactions/pending', adminMiddleware, financialAnalyticsController.getPendingTransactions);
router.put('/transactions/:id/process', adminMiddleware, financialAnalyticsController.processTransaction);

// Analytics Routes
router.get('/analytics', adminMiddleware, financialAnalyticsController.getAnalyticsData);

module.exports = router;
