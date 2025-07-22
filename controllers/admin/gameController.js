const GameResult = require('../../models/GameResult');
const User = require('../../models/User');
const Referral = require('../../models/Referral');

// Get game statistics
exports.getGameStats = async (req, res) => {
  try {
    const { page = 1, limit = 10, gameType, startDate, endDate, userId } = req.query;
    
    let query = {};
    
    if (gameType) query.gameType = gameType;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const results = await GameResult.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await GameResult.countDocuments(query);

    res.json({
      results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user game history
exports.getUserGameHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { page = 1, limit = 10, gameType, startDate, endDate } = req.query;

    let query = { userId };
    
    if (gameType) query.gameType = gameType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const results = await GameResult.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await GameResult.countDocuments(query);

    // Calculate statistics
    const stats = await GameResult.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalBetAmount: { $sum: '$betAmount' },
          totalWinAmount: { $sum: '$winAmount' },
          totalProfit: { $sum: { $subtract: ['$winAmount', '$betAmount'] } },
          winRate: {
            $avg: {
              $cond: [{ $eq: ['$isWin', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      results,
      statistics: stats[0] || {
        totalBets: 0,
        totalBetAmount: 0,
        totalWinAmount: 0,
        totalProfit: 0,
        winRate: 0
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Get user game history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { type = 'winnings', limit = 10 } = req.query;

    let pipeline = [];

    if (type === 'winnings') {
      pipeline = [
        { $group: { _id: "$userId", totalWon: { $sum: "$winAmount" } } },
        { $sort: { totalWon: -1 } },
        { $limit: parseInt(limit) }
      ];
    } else if (type === 'profit') {
      pipeline = [
        {
          $group: {
            _id: "$userId",
            totalProfit: { $sum: { $subtract: ['$winAmount', '$betAmount'] } }
          }
        },
        { $sort: { totalProfit: -1 } },
        { $limit: parseInt(limit) }
      ];
    } else if (type === 'winRate') {
      pipeline = [
        {
          $group: {
            _id: "$userId",
            winRate: {
              $avg: {
                $cond: [{ $eq: ['$isWin', true] }, 1, 0]
              }
            },
            totalGames: { $sum: 1 }
          }
        },
        { $match: { totalGames: { $gte: 10 } } }, // Only users with 10+ games
        { $sort: { winRate: -1 } },
        { $limit: parseInt(limit) }
      ];
    }

    const leaderboard = await GameResult.aggregate(pipeline);

    const withUserData = await User.populate(leaderboard, {
      path: "_id",
      select: "name email"
    });

    res.json(withUserData);

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get game analytics
exports.getGameAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const analytics = await GameResult.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: {
            gameType: '$gameType',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          totalBets: { $sum: 1 },
          totalBetAmount: { $sum: '$betAmount' },
          totalWinAmount: { $sum: '$winAmount' },
          totalProfit: { $sum: { $subtract: ['$winAmount', '$betAmount'] } },
          winRate: {
            $avg: {
              $cond: [{ $eq: ['$isWin', true] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.date': -1, '_id.gameType': 1 } }
    ]);

    // Get overall stats
    const overallStats = await GameResult.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalBetAmount: { $sum: '$betAmount' },
          totalWinAmount: { $sum: '$winAmount' },
          totalProfit: { $sum: { $subtract: ['$winAmount', '$betAmount'] } },
          averageWinRate: {
            $avg: {
              $cond: [{ $eq: ['$isWin', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      dailyAnalytics: analytics,
      overallStats: overallStats[0] || {
        totalBets: 0,
        totalBetAmount: 0,
        totalWinAmount: 0,
        totalProfit: 0,
        averageWinRate: 0
      }
    });

  } catch (error) {
    console.error('Get game analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
