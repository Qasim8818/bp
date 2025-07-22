// controllers/user/walletController.js

const User = require('../../../models/User');

exports.updateWallet = async (req, res) => {
  const { wallet } = req.body;
  const userId = req.user.id;

  if (!wallet) {
    return res.status(400).json({ message: 'Wallet address is required' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { wallet },
      { new: true }
    );

    res.status(200).json({
      message: 'Wallet updated successfully',
      wallet: user.wallet
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update wallet' });
  }
};
// controllers/user/walletController.js

const User = require('../../../models/User');

exports.updateWallet = async (req, res) => {
  const { wallet } = req.body;
  const userId = req.user.id;

  if (!wallet) {
    return res.status(400).json({ message: 'Wallet address is required' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { wallet },
      { new: true }
    );

    res.status(200).json({
      message: 'Wallet updated successfully',
      wallet: user.wallet
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update wallet' });
  }
};
