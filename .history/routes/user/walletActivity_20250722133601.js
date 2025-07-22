const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/authMiddleware');
const {
  createDeposit,
  getUserDeposits,
} = require('../../controllers/admin/depositController');
const {
  createWithdrawal,
  getUserWithdrawals,
} = require('../../controllers/withdrawalController');

// Create deposit request
router.post('/deposit', auth, createDeposit);

// Create withdrawal request
router.post('/withdraw', auth, createWithdrawal);

// Get user's deposit history
router.get('/deposits', auth, getUserDeposits);

// Get user's withdrawal history
router.get('/withdrawals', auth, getUserWithdrawals);

// Get all user transactions (combined)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get both deposits and withdrawals
    const deposits = await require('../../models/Deposit').find({ userId })
      .sort({ createdAt: -1 });
    
    const withdrawals = await require('../../models/Withdrawal').find({ userId })
      .sort({ createdAt: -1 });
    
    // Combine and sort by date
    const transactions = [
      ...deposits.map(d => ({ ...d.toObject(), type: 'deposit' })),
      ...withdrawals.map(w => ({ ...w.toObject(), type: 'withdrawal' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
