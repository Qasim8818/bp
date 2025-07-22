const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middlewares/adminAuth');
const financialAnalyticsController = require('../controllers/admin/financialAnalyticsController');
const withdrawalManagementController = require('../controllers/admin/withdrawalManagementController');
const userController = require('../controllers/admin/userController');
const transactionController = require('../controllers/admin/transactionController');

// Financial Analytics Routes
router.get('/dashboard', adminMiddleware, financialAnalyticsController.getDashboardData);
router.get('/financial/top-players', adminMiddleware, financialAnalyticsController.getTopPlayers);
router.get('/financial/recent-activity', adminMiddleware, financialAnalyticsController.getRecentActivity);
router.get('/financial/daily-stats', adminMiddleware, financialAnalyticsController.getDailyStats);
router.get('/financial/user/:userId', adminMiddleware, financialAnalyticsController.getUserFinancialDetails);
router.get('/financial/system-profit', adminMiddleware, financialAnalyticsController.getSystemProfitReport);

// Withdrawal Management Routes
router.get('/withdrawals', adminMiddleware, withdrawalManagementController.getPendingWithdrawals);
router.get('/withdrawals/pending', adminMiddleware, withdrawalManagementController.getPendingWithdrawals);
router.put('/withdrawals/:id/approve', adminMiddleware, withdrawalManagementController.approveWithdrawal);
router.put('/withdrawals/:id/reject', adminMiddleware, withdrawalManagementController.rejectWithdrawal);
router.put('/withdrawals/:id/process', adminMiddleware, withdrawalManagementController.processWithdrawal);

// User Management Routes
router.get('/users', adminMiddleware, userController.getAllUsers);
router.get('/users/:id', adminMiddleware, userController.getUserById);

// Transaction Management Routes
router.get('/transactions', adminMiddleware, transactionController.getAllTransactions);
router.get('/transactions/pending', adminMiddleware, transactionController.getPendingTransactions);
router.put('/transactions/:id/process', adminMiddleware, transactionController.processTransaction);

// Analytics Routes
router.get('/analytics', adminMiddleware, financialAnalyticsController.getDashboardData);

module.exports = router;
