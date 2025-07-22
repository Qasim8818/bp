const BalanceTrackingService = require('../../services/balanceTrackingService');
const PrizePoolService = require('../../services/prizePoolService');
const UserBalance = require('../../models/UserBalance');
const Transaction = require('../../models/Transaction');
const GameResult = require('../../models/GameResult');

class FinancialAnalyticsController {
  async getDashboardData(req, res) {
    try {
      const [
        systemOverview,
        prizePoolStats,
        topPlayers,
        recentActivity,
        dailyStats
      ] = await Promise.all([
        BalanceTrackingService.getSystemFinancialOverview(),
        PrizePoolService.getPoolStats(),
        this.getTopPlayers(),
        this.getRecentActivity(),
        this.getDailyStats()
      ]);

      res.json({
        success: true,
        data: {
          systemOverview,
          prizePool: prizePoolStats,
          topPlayers,
          recentActivity,
          dailyStats
        }
      });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getTopPlayers(req, res) {
    try {
      const topPlayers = await UserBalance.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: 1,
            username: '$user.name',
            email: '$user.email',
            currentBalance: 1,
            depositedAmount: 1,
            withdrawnAmount: 1,
            winningsAmount: 1,
            totalBetAmount: 1,
            totalWinAmount: 1,
            netProfit: 1,
            profitRatio: {
              $cond: [
                { $gt: ['$totalBetAmount', 0] },
                { $divide: ['$totalWinAmount', '$totalBetAmount'] },
                0
              ]
            }
          }
        },
        { $sort: { currentBalance: -1 } },
        { $limit: 20 }
      ]);

      res.json({ success: true, data: topPlayers });
    } catch (error) {
      console.error('Error getting top players:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getRecentActivity(req, res) {
    try {
      const recentTransactions = await Transaction.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('userId', 'name email');

      const recentGames = await GameResult.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('userId', 'name email');

      res.json({
        success: true,
        data: {
          transactions: recentTransactions,
          games: recentGames
        }
      });
    } catch (error) {
      console.error('Error getting recent activity:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getDailyStats(req, res) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyStats = await Transaction.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            deposits: {
              $sum: {
                $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0]
              }
            },
            withdrawals: {
              $sum: {
                $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0]
              }
            },
            bets: {
              $sum: {
                $cond: [{ $eq: ['$type', 'bet'] }, '$amount', 0]
              }
            },
            wins: {
              $sum: {
                $cond: [{ $eq: ['$type', 'win'] }, '$amount', 0]
              }
            },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      res.json({ success: true, data: dailyStats });
    } catch (error) {
      console.error('Error getting daily stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUserFinancialDetails(req, res) {
    try {
      const { userId } = req.params;
      
      const userFinancialSummary = await BalanceTrackingService.getUserFinancialSummary(userId);
      const userPlayHistory = await BalanceTrackingService.getUserPlayHistory(userId, 100);

      res.json({
        success: true,
        data: {
          ...userFinancialSummary,
          playHistory: userPlayHistory
        }
      });
    } catch (error) {
      console.error('Error getting user financial details:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getSystemProfitReport(req, res) {
    try {
      const [
        totalDeposits,
        totalWithdrawals,
        totalUserBalances,
        prizePoolBalance,
        gameStats
      ] = await Promise.all([
        Transaction.aggregate([
          { $match: { type: 'deposit', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { type: 'withdrawal', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        UserBalance.aggregate([
          { $group: { _id: null, total: { $sum: '$currentBalance' } } }
        ]),
        PrizePoolService.getPoolStats(),
        GameResult.aggregate([
          {
            $group: {
              _id: null,
              totalBets: { $sum: '$betAmount' },
              totalWins: { $sum: '$winAmount' },
              totalGames: { $sum: 1 },
              totalWinningGames: { $sum: { $cond: ['$isWin', 1, 0] } }
            }
          }
        ])
      ]);

      const totalDeposited = totalDeposits[0]?.total || 0;
      const totalWithdrawn = totalWithdrawals[0]?.total || 0;
      const totalUserBalance = totalUserBalances[0]?.total || 0;
      const prizePoolCurrent = prizePoolBalance.pool?.currentBalance || 0;
      const gameData = gameStats[0] || { totalBets: 0, totalWins: 0 };

      const houseProfit = totalDeposited - totalWithdrawn - totalUserBalance - prizePoolCurrent;
      const houseEdge = gameData.totalBets > 0 ? 
        ((gameData.totalBets - gameData.totalWins) / gameData.totalBets) * 100 : 0;

      res.json({
        success: true,
        data: {
          totalDeposited,
          totalWithdrawn,
          totalUserBalance,
          prizePoolCurrent,
          totalBets: gameData.totalBets,
          totalWins: gameData.totalWins,
          houseProfit,
          houseEdge,
          profitMargin: totalDeposited > 0 ? (houseProfit / totalDeposited) * 100 : 0,
          activeUsers: await UserBalance.countDocuments({ currentBalance: { $gt: 0 } })
        }
      });
    } catch (error) {
      console.error('Error getting system profit report:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new FinancialAnalyticsController();
