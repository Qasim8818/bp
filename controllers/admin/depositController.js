const Deposit = require('../../models/Deposit');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');

// Get all deposit requests
exports.getAllDeposits = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const deposits = await Deposit.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Deposit.countDocuments(query);

    res.json({
      success: true,
      deposits,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single deposit details
exports.getDepositById = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id)
      .populate('userId', 'name email balance');
    
    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' });
    }

    res.json({ success: true, deposit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve deposit request
exports.approveDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const deposit = await Deposit.findById(id);
    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ message: 'Deposit already processed' });
    }

    // Update deposit status
    deposit.status = 'approved';
    deposit.approvedBy = req.user.id;
    deposit.approvedAt = new Date();
    deposit.notes = notes || deposit.notes;
    await deposit.save();

    // Update user balance
    const user = await User.findById(deposit.userId);
    user.balance += deposit.amount;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: deposit.userId,
      type: 'deposit',
      amount: deposit.amount,
      status: 'completed',
      description: `Deposit approved - ${deposit.method}`
    });
    await transaction.save();

    res.json({ success: true, message: 'Deposit approved successfully', deposit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject deposit request
exports.rejectDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const deposit = await Deposit.findById(id);
    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ message: 'Deposit already processed' });
    }

    deposit.status = 'rejected';
    deposit.approvedBy = req.user.id;
    deposit.approvedAt = new Date();
    deposit.notes = notes || deposit.notes;
    await deposit.save();

    res.json({ success: true, message: 'Deposit rejected', deposit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create deposit request
exports.createDeposit = async (req, res) => {
  try {
    const { amount, method, accountDetails, transactionId, proofImageUrl } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!amount || !method || !accountDetails || !transactionId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    const deposit = new Deposit({
      userId,
      amount,
      method,
      accountDetails,
      transactionId,
      proofImageUrl
    });

    await deposit.save();

    res.json({ success: true, message: 'Deposit request submitted successfully', deposit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's deposit history
exports.getUserDeposits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const deposits = await Deposit.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Deposit.countDocuments({ userId });

    res.json({
      success: true,
      deposits,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
