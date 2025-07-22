const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/authMiddleware');
const withdrawalController = require('../../controllers/withdrawalController');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');

// Create deposit request
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount, method, reference, proofImageUrl } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!amount || !method || !reference) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    // Create deposit transaction
    const deposit = new Transaction({
      userId,
      type: 'deposit',
      amount,
      method,
      reference,
      proofImageUrl,
      status: 'pending'
    });

    await deposit.save();

    res.json({ 
      success: true, 
      message: 'Deposit request submitted successfully', 
      deposit 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create withdrawal request
router.post('/withdraw', auth, withdrawalController.requestWithdrawal);

// Get user's deposit history
router.get('/deposits', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const deposits = await Transaction.find({ 
      userId, 
      type: 'deposit' 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      deposits
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's withdrawal history
router.get('/withdrawals', auth, withdrawalController.getUserWithdrawals);

// Get all user transactions (combined)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get both deposits and withdrawals
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
