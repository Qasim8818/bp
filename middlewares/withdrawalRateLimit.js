const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

class WithdrawalRateLimit {
  constructor() {
    this.limits = {
      daily: {
        maxAmount: 5000,
        maxCount: 5
      },
      weekly: {
        maxAmount: 20000,
        maxCount: 15
      },
      monthly: {
        maxAmount: 50000,
        maxCount: 30
      }
    };
  }

  async checkLimits(userId, requestedAmount) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const timeframes = {
      daily: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      weekly: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      monthly: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };

    const results = {};

    for (const [period, since] of Object.entries(timeframes)) {
      const withdrawals = await Withdrawal.find({
        userId,
        createdAt: { $gte: since },
        status: { $in: ['pending', 'approved', 'processing', 'completed'] }
      });

      const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);
      const count = withdrawals.length;

      const limit = this.limits[period];
      
      results[period] = {
        totalAmount,
        count,
        maxAmount: limit.maxAmount,
        maxCount: limit.maxCount,
        canWithdrawAmount: requestedAmount <= (limit.maxAmount - totalAmount),
        canWithdrawCount: count < limit.maxCount,
        remainingAmount: Math.max(0, limit.maxAmount - totalAmount),
        remainingCount: Math.max(0, limit.maxCount - count)
      };
    }

    const canWithdraw = Object.values(results).every(r => r.canWithdrawAmount && r.canWithdrawCount);
    
    return {
      canWithdraw,
      details: results,
      requestedAmount,
      userBalance: user.balance
    };
  }

  async validateWithdrawal(userId, amount) {
    const check = await this.checkLimits(userId, amount);
    
    if (!check.canWithdraw) {
      const violations = [];
      
      for (const [period, details] of Object.entries(check.details)) {
        if (!details.canWithdrawAmount) {
          violations.push(`${period} amount limit exceeded (${details.totalAmount}/${details.maxAmount})`);
        }
        if (!details.canWithdrawCount) {
          violations.push(`${period} count limit exceeded (${details.count}/${details.maxCount})`);
        }
      }
      
      throw new Error(`Withdrawal limits exceeded: ${violations.join(', ')}`);
    }

    return check;
  }

  getLimits() {
    return this.limits;
  }

  async getUserWithdrawalHistory(userId, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return await Withdrawal.find({
      userId,
      createdAt: { $gte: since }
    })
    .sort({ createdAt: -1 })
    .select('amount status createdAt processedAt method transactionId');
  }

  async getPendingWithdrawalsCount(userId) {
    return await Withdrawal.countDocuments({
      userId,
      status: { $in: ['pending', 'approved', 'processing'] }
    });
  }
}

module.exports = new WithdrawalRateLimit();
