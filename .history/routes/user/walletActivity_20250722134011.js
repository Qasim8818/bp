const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/authMiddleware');
const withdrawalController = require('../../controllers/withdrawalController');

// Create withdrawal request
router.post('/withdraw', auth, withdrawalController.requestWithdrawal);

// Get user's withdrawal history
router.get('/withdrawals', auth, withdrawalController.getUserWithdrawals);

// Get all user transactions (combined)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get both deposits and withdrawals
    const Transaction = require('../../models/Transaction');
    const Withdrawal = require('../../models/Withdrawal');
    
    const deposits = await Transaction.find({ 
      userId, 
      type: 'deposit' 
    }).sort({ createdAt: -1 });
    
    const withdrawals = await Withdrawal.find({ 
      userId 
    }).sort({ createdAt: -1 });
    
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
