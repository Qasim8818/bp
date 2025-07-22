const express = require('express');
const router = express.Router();

// Combine sub-routers
router.use('/profile', require('./user/profile'));
router.use('/wallet-activity', require('./user/walletActivity'));
router.use('/support', require('./user/support'));
router.use('/wallet', require('./user/wallet'));
router.use('/referral', require('./user/referral'));

module.exports = router;
