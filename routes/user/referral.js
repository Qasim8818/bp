const express = require('express');
const router = express.Router();
const referralController = require('../controllers/user/referralController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.get('/leaderboard', referralController.getReferralLeaderboard);

// Protected routes
router.use(authMiddleware);

// Referral routes
router.get('/stats', referralController.getReferralStats);
router.get('/referred-users', referralController.getReferredUsers);
router.get('/referrals', referralController.getReferredUsers);

module.exports = router;
