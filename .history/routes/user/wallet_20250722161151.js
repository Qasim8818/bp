const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/authMiddleware');
const role = require('../../middlewares/roleMiddleware');

const { updateWallet } = require('../controllers/user/walletController');

// 👛 Update Wallet Route
router.put('/wallet', auth, role('user'), updateWallet);

module.exports = router;
