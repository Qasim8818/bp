const Referral = require('../../models/Referral');
const User = require('../../models/User');
const GameResult = require('../../models/GameResult');
const Transaction = require('../../models/Transaction');

// Get user's referral statistics
exports.getReferralStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total referrals
    const totalReferrals = await Referral.countDocuments({ referrerId: userId });
    
    // Get total bonus earned
    const referralData = await Referral.aggregate([
      { $match: { referrerId: userId } },
      { $group: { _id: null, totalBonus: { $sum: '$totalBonus' } } }
    ]);

    const totalBonus = referralData.length > 0 ? referralData[0].totalBonus : 0;

    // Get pending bonuses
    const pendingBonuses = await Referral.countDocuments({ 
      referrerId: userId, 
      'playBonus.status': 'pending' 
    });

    res.json({
      totalReferrals,
      totalBonus,
      pendingBonuses,
      referralCode: req.user.referralCode
    });

  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get referred users list
exports.getReferredUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const referrals = await Referral.find({ referrerId: userId })
      .populate('refereeId', 'name email createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Referral.countDocuments({ referrerId: userId });

    res.json({
      referrals: referrals.map(ref => ({
        id: ref._id,
        user: ref.refereeId,
        signupBonus: ref.signupBonus,
        playBonus: ref.playBonus,
        totalBonus: ref.totalBonus,
        createdAt: ref.createdAt
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Get referred users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process referral bonus when referred user plays a game
exports.processPlayBonus = async (refereeId, betAmount) => {
  try {
    // Find referral record
    const referral = await Referral.findOne({ refereeId });
    if (!referral) return;

    // Check if play bonus is already credited
    if (referral.playBonus.status === 'credited') return;

    // Check minimum bet amount (e.g., $1)
    const MIN_BET_AMOUNT = 1;
    if (betAmount < MIN_BET_AMOUNT) return;

    // Calculate bonus (e.g., 10% of bet amount, max $10)
    const bonusPercentage = 0.10;
    const maxBonus = 10;
    const bonusAmount = Math.min(betAmount * bonusPercentage, maxBonus);

    // Update referral record
    referral.playBonus.amount = bonusAmount;
    referral.playBonus.status = 'credited';
    referral.playBonus.triggeredAt = new Date();
    referral.totalBonus += bonusAmount;
    await referral.save();

    // Credit bonus to referrer
    await User.findByIdAndUpdate(referral.referrerId, {
      $inc: { balance: bonusAmount }
    });

    // Create transaction record
    await Transaction.create({
      userId: referral.referrerId,
      type: 'referral_bonus',
      amount: bonusAmount,
      description: `Referral bonus from ${refereeId}`
    });

  } catch (error) {
    console.error('Process play bonus error:', error);
  }
};

// Get referral leaderboard
exports.getReferralLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Referral.aggregate([
      {
        $group: {
          _id: '$referrerId',
          totalReferrals: { $sum: 1 },
          totalBonus: { $sum: '$totalBonus' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          name: '$user.name',
          totalReferrals: 1,
          totalBonus: 1
        }
      },
      {
        $sort: { totalBonus: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json(leaderboard);

  } catch (error) {
    console.error('Get referral leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
