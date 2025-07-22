const User = require('../../models/User');
const Transaction = require('../../models/Transaction');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
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

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user statistics
    const depositStats = await Transaction.aggregate([
      { $match: { userId: user._id, type: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const withdrawalStats = await Transaction.aggregate([
      { $match: { userId: user._id, type: 'withdraw', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const gameStats = await Transaction.aggregate([
      { $match: { userId: user._id, type: { $in: ['bet', 'win'] } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      user,
      stats: {
        totalDeposits: depositStats[0]?.total || 0,
        depositCount: depositStats[0]?.count || 0,
        totalWithdrawals: withdrawalStats[0]?.total || 0,
        withdrawalCount: withdrawalStats[0]?.count || 0,
        gameStats: gameStats
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlocked = true;
    await user.save();

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlocked = false;
    await user.save();

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Adjust user balance
exports.adjustBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, reason } = req.body;

    if (!amount || !type || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    let newBalance;
    if (type === 'add') {
      newBalance = user.balance + numericAmount;
    } else if (type === 'subtract') {
      newBalance = user.balance - numericAmount;
    } else {
      return res.status(400).json({ message: 'Invalid adjustment type' });
    }

    if (newBalance < 0) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.balance = newBalance;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: id,
      type: type === 'add' ? 'admin_add' : 'admin_subtract',
      amount: numericAmount,
      status: 'completed',
      description: `Admin balance adjustment: ${reason}`
    });
    await transaction.save();

    res.json({
      success: true,
      message: 'Balance adjusted successfully',
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stats = await Transaction.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      user,
      stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
