const UserBalance = require('../models/UserBalance');
const Transaction = require('../models/Transaction');
const GameResult = require('../models/GameResult');
const Withdrawal = require('../models/Withdrawal');

class BalanceTrackingService {
  constructor() {
    this.transactionTypes = {
      DEPOSIT: 'deposit',
      WITHDRAWAL: 'withdrawal',
      BET: 'bet',
      WIN: 'win',
      BONUS: 'bonus',
      REFUND: 'refund'
    };
  }

  async initializeUserBalance(userId) {
    try {
      let userBalance = await UserBalance.findOne({ userId });
      if (!userBalance) {
        userBalance = new UserBalance({ userId });
        await userBalance.save();
      }
      return userBalance;
    } catch (error) {
      console.error('Error initializing user balance:', error);
      throw error;
    }
  }

  async recordDeposit(userId, amount, transactionId, method = 'easypaisa') {
    try {
      await this.initializeUserBalance(userId);
      
      const userBalance = await UserBalance.findOneAndUpdate(
        { userId },
        { 
          $inc: { 
            depositedAmount: amount,
            currentBalance: amount 
          },
          $set: { lastUpdated: new Date() }
        },
        { new: true, upsert: true }
      );

      await Transaction.create({
        userId,
        type: this.transactionTypes.DEPOSIT,
        amount,
        method,
        status: 'completed',
        reference: transactionId,
        description: `Deposit of ₹${amount}`
      });

      return userBalance;
    } catch (error) {
      console.error('Error recording deposit:', error);
      throw error;
    }
  }

  async recordWithdrawal(userId, amount, withdrawalId) {
    try {
      const userBalance = await UserBalance.findOne({ userId });
      
      if (!userBalance || userBalance.currentBalance < amount) {
        throw new Error('Insufficient balance for withdrawal');
      }

      const updatedBalance = await UserBalance.findOneAndUpdate(
        { userId, currentBalance: { $gte: amount } },
        { 
          $inc: { 
            withdrawnAmount: amount,
            currentBalance: -amount 
          },
          $set: { lastUpdated: new Date() }
        },
        { new: true }
      );

      if (!updatedBalance) {
        throw new Error('Balance changed during withdrawal process');
      }

      await Transaction.create({
        userId,
        type: this.transactionTypes.WITHDRAWAL,
        amount,
        status: 'pending',
        reference: withdrawalId,
        description: `Withdrawal request of ₹${amount}`
      });

      return updatedBalance;
    } catch (error) {
      console.error('Error recording withdrawal:', error);
      throw error;
    }
  }

  async recordGameResult(userId, betAmount, winAmount, gameResultId) {
    try {
      await this.initializeUserBalance(userId);
      
      const profit = winAmount - betAmount;
      
      const userBalance = await UserBalance.findOneAndUpdate(
        { userId },
        { 
          $inc: { 
            currentBalance: profit,
            totalBetAmount: betAmount,
            totalWinAmount: winAmount,
            netProfit: profit
          },
          $set: { lastUpdated: new Date() }
        },
        { new: true, upsert: true }
      );

      // Record bet transaction
      await Transaction.create({
        userId,
        type: this.transactionTypes.BET,
        amount: betAmount,
        status: 'completed',
        reference: gameResultId,
        description: `Bet placed: ₹${betAmount}`
      });

      // Record win transaction if there's a win
      if (winAmount > 0) {
        const winnings = winAmount - betAmount;
        if (winnings > 0) {
          await UserBalance.findOneAndUpdate(
            { userId },
            { $inc: { winningsAmount: winnings } }
          );
          
          await Transaction.create({
            userId,
            type: this.transactionTypes.WIN,
            amount: winnings,
            status: 'completed',
            reference: gameResultId,
            description: `Winnings: ₹${winnings}`
          });
        }
      }

      return userBalance;
    } catch (error) {
      console.error('Error recording game result:', error);
      throw error;
    }
  }

  async getUserBalance(userId) {
    try {
      const userBalance = await UserBalance.findOne({ userId });
      if (!userBalance) {
        return await this.initializeUserBalance(userId);
      }
      return userBalance;
    } catch (error) {
      console.error('Error getting user balance:', error);
      throw error;
    }
  }

  async getUserFinancialSummary(userId) {
    try {
      const userBalance = await this.getUserBalance(userId);
      
      const [
        totalDeposits,
        totalWithdrawals,
        totalBets,
        totalWins,
        recentTransactions
      ] = await Promise.all([
        Transaction.aggregate([
          { $match: { userId: userId, type: 'deposit', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { userId: userId, type: 'withdrawal', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { userId: userId, type: 'bet' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { userId: userId, type: 'win' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.find({ userId })
          .sort({ createdAt: -1 })
          .limit(10)
      ]);

      return {
        balance: userBalance,
        summary: {
          totalDeposited: totalDeposits[0]?.total || 0,
          totalWithdrawn: totalWithdrawals[0]?.total || 0,
          totalBet: totalBets[0]?.total || 0,
          totalWon: totalWins[0]?.total || 0,
          netProfit: (totalWins[0]?.total || 0) - (totalBets[0]?.total || 0)
        },
        recentTransactions
      };
    } catch (error) {
      console.error('Error getting user financial summary:', error);
      throw error;
    }
  }

  async getSystemFinancialOverview() {
    try {
      const [
        totalDeposits,
        totalWithdrawals,
        totalBets,
        totalWins,
        activeUsers,
        userBalances
      ] = await Promise.all([
        Transaction.aggregate([
          { $match: { type: 'deposit', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { type: 'withdrawal', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { type: 'bet' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { type: 'win' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        UserBalance.countDocuments(),
        UserBalance.aggregate([
          {
            $group: {
              _id: null,
              totalCurrentBalance: { $sum: '$currentBalance' },
              totalDeposited: { $sum: '$depositedAmount' },
              totalWithdrawn: { $sum: '$withdrawnAmount' },
              totalWinnings: { $sum: '$winningsAmount' },
              totalNetProfit: { $sum: '$netProfit' }
            }
          }
        ])
      ]);

      const prizePoolStats = await PrizePool.findOne({ poolName: 'main_prize_pool' });

      return {
        systemOverview: {
          totalDeposits: totalDeposits[0]?.total || 0,
          totalWithdrawals: totalWithdrawals[0]?.total || 0,
          totalBets: totalBets[0]?.total || 0,
          totalWins: totalWins[0]?.total || 0,
          activeUsers: activeUsers,
          houseProfit: (totalDeposits[0]?.total || 0) - (totalWithdrawals[0]?.total || 0) - (userBalances[0]?.totalCurrentBalance || 0)
        },
        userBalances: userBalances[0] || {},
        prizePool: prizePoolStats || { currentBalance: 0, totalContributions: 0, totalPayouts: 0 }
      };
    } catch (error) {
      console.error('Error getting system financial overview:', error);
      throw error;
    }
  }

  async getUserPlayHistory(userId, limit = 50) {
    try {
      const gameHistory = await GameResult.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email');

      const transactionHistory = await Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);

      return {
        games: gameHistory,
        transactions: transactionHistory
      };
    } catch (error) {
      console.error('Error getting user play history:', error);
      throw error;
    }
  }
}

module.exports = new BalanceTrackingService();
