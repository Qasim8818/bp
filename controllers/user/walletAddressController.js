const User = require('../../models/User');
const Transaction = require('../../models/Transaction');

// Add or update wallet address
exports.updateWalletAddress = async (req, res) => {
  try {
    const { walletType, address } = req.body;
    const userId = req.user._id;

    if (!['crypto', 'jazzcash', 'easypaisa', 'bank'].includes(walletType)) {
      return res.status(400).json({ message: 'Invalid wallet type' });
    }

    if (!address || address.trim() === '') {
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize wallet addresses if not exists
    if (!user.walletAddresses) {
      user.walletAddresses = {};
    }

    user.walletAddresses[walletType] = address.trim();
    await user.save();

    res.json({
      success: true,
      message: `${walletType} wallet address updated successfully`,
      walletAddresses: user.walletAddresses
    });
  } catch (error) {
    console.error('Update wallet address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's wallet addresses
exports.getWalletAddresses = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('walletAddresses');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      walletAddresses: user.walletAddresses || {}
    });
  } catch (error) {
    console.error('Get wallet addresses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete wallet address
exports.deleteWalletAddress = async (req, res) => {
  try {
    const { walletType } = req.body;
    const userId = req.user._id;

    if (!['crypto', 'jazzcash', 'easypaisa', 'bank'].includes(walletType)) {
      return res.status(400).json({ message: 'Invalid wallet type' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.walletAddresses && user.walletAddresses[walletType]) {
      delete user.walletAddresses[walletType];
      await user.save();
    }

    res.json({
      success: true,
      message: `${walletType} wallet address removed successfully`,
      walletAddresses: user.walletAddresses || {}
    });
  } catch (error) {
    console.error('Delete wallet address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify wallet address before withdrawal
exports.verifyWalletAddress = async (req, res) => {
  try {
    const { walletType, address } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if address matches saved address
    const savedAddress = user.walletAddresses?.[walletType];
    if (!savedAddress || savedAddress !== address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wallet address verification failed' 
      });
    }

    res.json({
      success: true,
      message: 'Wallet address verified successfully'
    });
  } catch (error) {
    console.error('Verify wallet address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get withdrawal methods with saved addresses
exports.getWithdrawalMethods = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('walletAddresses');

    const methods = [
      {
        type: 'jazzcash',
        name: 'JazzCash',
        icon: 'jazzcash-icon.png',
        savedAddress: user.walletAddresses?.jazzcash || null
      },
      {
        type: 'easypaisa',
        name: 'EasyPaisa',
        icon: 'easypaisa-icon.png',
        savedAddress: user.walletAddresses?.easypaisa || null
      },
      {
        type: 'crypto',
        name: 'Cryptocurrency',
        icon: 'crypto-icon.png',
        savedAddress: user.walletAddresses?.crypto || null
      },
      {
        type: 'bank',
        name: 'Bank Transfer',
        icon: 'bank-icon.png',
        savedAddress: user.walletAddresses?.bank || null
      }
    ];

    res.json({
      success: true,
      methods
    });
  } catch (error) {
    console.error('Get withdrawal methods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
