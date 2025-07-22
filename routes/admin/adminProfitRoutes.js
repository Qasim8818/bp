const express = require('express');
const router = express.Router();
const adminWithdrawalController = require('../../controllers/admin/adminWithdrawalController');
const adminAuth = require('../../middlewares/adminAuth');

// All routes require admin authentication
router.use(adminAuth);

// Get admin profit dashboard
router.get('/dashboard', adminWithdrawalController.getAdminProfitDashboard);

// Get profit breakdown
router.get('/breakdown', adminWithdrawalController.getProfitBreakdown);

// Get withdrawal limits
router.get('/limits', adminWithdrawalController.getWithdrawalLimits);

// Initiate admin withdrawal
router.post('/withdraw', adminWithdrawalController.initiateAdminWithdrawal);

// Get admin withdrawal history
router.get('/withdrawals', adminWithdrawalController.getAdminWithdrawalHistory);

// Export profit report
router.get('/export', adminWithdrawalController.exportProfitReport);

module.exports = router;
