const Transaction = require('../../models/Transaction');
const User = require('../../models/User');

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
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

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDeposits = await Transaction.countDocuments({ type: 'deposit', status: 'completed' });
    const totalWithdrawals = await Transaction.countDocuments({ type: 'withdraw', status: 'completed' });
    
    const totalDepositAmount = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalWithdrawalAmount = await Transaction.aggregate([
      { $match: { type: 'withdraw', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const recentTransactions = await Transaction.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalDeposits,
        totalWithdrawals,
        totalDepositAmount: totalDepositAmount[0]?.total || 0,
        totalWithdrawalAmount: totalWithdrawalAmount[0]?.total || 0,
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
