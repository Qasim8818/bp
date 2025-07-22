const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Promo = require('../models/Promo');
const Referral = require('../models/Referral');

// Welcome bonus configuration
const WELCOME_BONUS = 1000; // PKR
const DAILY_LOGIN_BONUS = 50; // PKR
const REFERRAL_BONUS = 500; // PKR

// VIP tiers configuration
const VIP_TIERS = {
  bronze: { minDeposit: 0, cashback: 0.02 },
  silver: { minDeposit: 10000, cashback: 0.05 },
  gold: { minDeposit: 50000, cashback: 0.08 },
  platinum: { minDeposit: 100000, cashback: 0.12 },
  diamond: { minDeposit: 500000, cashback: 0.15 }
};

// Award welcome bonus to new users
exports.awardWelcomeBonus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.welcomeBonusClaimed) {
      return { success: false, message: 'Welcome bonus already claimed or user not found' };
    }

    user.balance += WELCOME_BONUS;
    user.welcomeBonusClaimed = true;
    await user.save();

    await Transaction.create({
      userId,
      type: 'welcome_bonus',
      amount: WELCOME_BONUS,
      status: 'completed',
      description: 'Welcome bonus for new user'
    });

    return { success: true, message: 'Welcome bonus awarded', amount: WELCOME_BONUS };
  } catch (error) {
    console.error('Award welcome bonus error:', error);
    return { success: false, message: 'Server error' };
  }
};

// Daily login bonus
exports.claimDailyLoginBonus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastClaim = user.lastDailyLogin ? new Date(user.lastDailyLogin) : null;
    if (lastClaim && lastClaim >= today) {
      return res.status(400).json({ message: 'Daily bonus already claimed today' });
    }

    user.balance += DAILY_LOGIN_BONUS;
    user.lastDailyLogin = new Date();
    user.consecutiveLogins = (user.consecutiveLogins || 0) + 1;
    
    // Bonus multiplier for consecutive logins
    const multiplier = Math.min(user.consecutiveLogins, 7);
    const finalBonus = DAILY_LOGIN_BONUS * multiplier;
    
    user.balance += (finalBonus - DAILY_LOGIN_BONUS);
    await user.save();

    await Transaction.create({
      userId,
      type: 'daily_login_bonus',
      amount: finalBonus,
      status: 'completed',
      description: `Daily login bonus (streak: ${user.consecutiveLogins} days)`
    });

    res.json({
      success: true,
      message: 'Daily bonus claimed',
      amount: finalBonus,
      streak: user.consecutiveLogins
    });
  } catch (error) {
    console.error('Daily login bonus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Referral bonus system
exports.awardReferralBonus = async (referrerId, referredId) => {
  try {
    // Award referrer
    const referrer = await User.findById(referrerId);
    referrer.balance += REFERRAL_BONUS;
    await referrer.save();

    await Transaction.create({
      userId: referrerId,
      type: 'referral_bonus',
      amount: REFERRAL_BONUS,
      status: 'completed',
      description: `Referral bonus for referring user ${referredId}`
    });

    // Award referred user
    const referred = await User.findById(referredId);
    referred.balance += REFERRAL_BONUS;
    await referred.save();

    await Transaction.create({
      userId: referredId,
      type: 'referred_bonus',
      amount: REFERRAL_BONUS,
      status: 'completed',
      description: `Bonus for being referred by user ${referrerId}`
    });

    return { success: true, message: 'Referral bonuses awarded' };
  } catch (error) {
    console.error('Award referral bonus error:', error);
    return { success: false, message: 'Server error' };
  }
};

// VIP tier calculation
exports.calculateVIPTier = async (userId) => {
  try {
    const user = await User.findById(userId);
    const totalDeposits = await Transaction.aggregate([
      { $match: { userId: user._id, type: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalDepositAmount = totalDeposits[0]?.total || 0;
    
    let currentTier = 'bronze';
    for (const [tier, config] of Object.entries(VIP_TIERS)) {
      if (totalDepositAmount >= config.minDeposit) {
        currentTier = tier;
      }
    }

    user.vipTier = currentTier;
    await user.save();

    return { success: true, tier: currentTier, cashbackRate: VIP_TIERS[currentTier].cashback };
  } catch (error) {
    console.error('Calculate VIP tier error:', error);
    return { success: false, message: 'Server error' };
  }
};

// Award cashback based on VIP tier
exports.awardCashback = async (userId, lossAmount) => {
  try {
    const user = await User.findById(userId);
    const cashbackRate = VIP_TIERS[user.vipTier]?.cashback || 0;
    
    if (cashbackRate > 0) {
      const cashbackAmount = Math.floor(lossAmount * cashbackRate);
      
      user.balance += cashbackAmount;
      await user.save();

      await Transaction.create({
        userId,
        type: 'cashback',
        amount: cashbackAmount,
        status: 'completed',
        description: `VIP cashback (${user.vipTier} tier)`
      });

      return { success: true, amount: cashbackAmount, tier: user.vipTier };
    }

    return { success: true, amount: 0, message: 'No cashback for this tier' };
  } catch (error) {
    console.error('Award cashback error:', error);
    return { success: false, message: 'Server error' };
  }
};

// Get user bonuses and rewards
exports.getUserBonuses = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    const bonuses = await Transaction.find({
      userId,
      type: { $in: ['welcome_bonus', 'daily_login_bonus', 'referral_bonus', 'cashback'] }
    }).sort({ createdAt: -1 }).limit(50);

    const vipInfo = await exports.calculateVIPTier(userId);

    res.json({
      success: true,
      bonuses,
      vip: {
        tier: vipInfo.tier,
        cashbackRate: VIP_TIERS[vipInfo.tier]?.cashback || 0,
        totalDeposits: user.totalDeposits || 0
      },
      welcomeBonusClaimed: user.welcomeBonusClaimed,
      consecutiveLogins: user.consecutiveLogins || 0
    });
  } catch (error) {
    console.error('Get user bonuses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
