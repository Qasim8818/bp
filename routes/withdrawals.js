const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// User routes
router.post('/request', authMiddleware, withdrawalController.requestWithdrawal);
router.get('/history', authMiddleware, withdrawalController.getUserWithdrawals);
router.get('/limits', authMiddleware, withdrawalController.getWithdrawalLimits);

// Admin routes
router.get('/all', adminMiddleware, withdrawalController.getAllWithdrawals);
router.put('/:id/status', adminMiddleware, withdrawalController.updateWithdrawalStatus);
router.get('/stats', adminMiddleware, withdrawalController.getWithdrawalStats);

module.exports = router;
