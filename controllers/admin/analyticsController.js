const User = require('../../models/User');
const GameResult = require('../../models/GameResult');
const Transaction = require('../../models/Transaction');

exports.getAnalytics = async (req, res) => {
  const totalUsers = await User.countDocuments();

  const totalDeposits = await Transaction.aggregate([
    { $match: { status: 'approved', type: 'deposit' } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const totalWithdrawals = await Transaction.aggregate([
    { $match: { status: 'approved', type: 'withdraw' } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const totalGames = await GameResult.countDocuments();

  const profit = await GameResult.aggregate([
    {
      $group: {
        _id: null,
        bets: { $sum: "$betAmount" },
        wins: { $sum: "$winAmount" }
      }
    }
  ]);

  res.json({
    users: totalUsers,
    deposits: totalDeposits[0]?.total || 0,
    withdrawals: totalWithdrawals[0]?.total || 0,
    gamesPlayed: totalGames,
    profit: profit[0] ? profit[0].bets - profit[0].wins : 0
  });
};
