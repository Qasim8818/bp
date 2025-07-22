const enhancedPrizePoolService = require('../../services/enhancedPrizePoolService');
const PrizePool = require('../../models/PrizePool');

class EnhancedPrizePoolController {
  async getPoolStats(req, res) {
    try {
      const [poolStats, health] = await Promise.all([
        enhancedPrizePoolService.getPoolStats(),
        enhancedPrizePoolService.getPoolHealthWithAlerts()
      ]);

      res.json({
        success: true,
        data: {
          ...poolStats,
          health,
          config: enhancedPrizePoolService.config
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserBehavior(req, res) {
    try {
      const { userId } = req.params;
      const behavior = await enhancedPrizePoolService.getUserBehaviorAnalysis(userId);
      
      res.json({
        success: true,
        data: behavior
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updatePoolConfig(req, res) {
    try {
      const { configType } = req.params;
      const newConfig = req.body;

      await enhancedPrizePoolService.updateConfig(newConfig);

      res.json({
        success: true,
        message: `${configType} configuration updated successfully`,
        data: enhancedPrizePoolService.config
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async adjustPoolBalance(req, res) {
    try {
      const { adjustment, reason } = req.body;
      
      if (!adjustment || typeof adjustment !== 'number') {
        return res.status(400).json({ 
          success: false, 
          message: 'Adjustment amount is required' 
        });
      }

      const pool = await PrizePool.findOne({ poolName: 'main_prize_pool' });
      
      if (!pool) {
        return res.status(404).json({ 
          success: false, 
          message: 'Prize pool not found' 
        });
      }

      const newBalance = Math.max(0, pool.currentBalance + adjustment);
      pool.currentBalance = newBalance;
      pool.lastAdjustment = new Date();
      
      await pool.save();

      res.json({
        success: true,
        message: 'Pool balance adjusted successfully',
        data: {
          newBalance,
          adjustment,
          reason
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async triggerManualJackpot(req, res) {
    try {
      const { amount, userId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Valid jackpot amount is required' 
        });
      }

      const result = await enhancedPrizePoolService.triggerManualJackpot(amount, userId);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Jackpot triggered successfully',
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getWinLossAnalytics(req, res) {
    try {
      const { days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const [winLossData, userStats] = await Promise.all([
        // Win/Loss ratio over time
        Transaction.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              type: { $in: ['win', 'bet'] }
            }
          },
          {
            $group: {
              _id: {
                date: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                type: "$type"
              },
              totalAmount: { $sum: "$amount" },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.date": 1 } }
        ]),
        // User statistics
        Transaction.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              type: { $in: ['win', 'bet'] }
            }
          },
          {
            $group: {
              _id: "$userId",
              totalWins: {
                $sum: {
                  $cond: [{ $eq: ["$type", "win"] }, "$amount", 0]
                }
              },
              totalBets: {
                $sum: {
                  $cond: [{ $eq: ["$type", "bet"] }, "$amount", 0]
                }
              },
              winCount: {
                $sum: {
                  $cond: [{ $eq: ["$type", "win"] }, 1, 0]
                }
              },
              betCount: {
                $sum: {
                  $cond: [{ $eq: ["$type", "bet"] }, 1, 0]
                }
              }
            }
          },
          {
            $addFields: {
              winRatio: {
                $cond: [
                  { $gt: [{ $add: ["$totalWins", "$totalBets"] }, 0] },
                  { $divide: ["$totalWins", { $add: ["$totalWins", "$totalBets"] }] },
                  0
                ]
              }
            }
          },
          { $sort: { winRatio: -1 } },
          { $limit: 50 }
        ])
      ]);

      // Process win/loss data for chart
      const chartData = {};
      winLossData.forEach(item => {
        const date = item._id.date;
        if (!chartData[date]) {
          chartData[date] = { date, wins: 0, losses: 0 };
        }
        
        if (item._id.type === 'win') {
          chartData[date].wins = item.totalAmount;
        } else {
          chartData[date].losses = item.totalAmount;
        }
      });

      const chartArray = Object.values(chartData);

      res.json({
        success: true,
        data: {
          chartData: chartArray,
          userStats,
          summary: {
            totalWins: winLossData.filter(d => d._id.type === 'win').reduce((sum, d) => sum + d.totalAmount, 0),
            totalLosses: winLossData.filter(d => d._id.type === 'bet').reduce((sum, d) => sum + d.totalAmount, 0),
            totalWinCount: winLossData.filter(d => d._id.type === 'win').reduce((sum, d) => sum + d.count, 0),
            totalBetCount: winLossData.filter(d => d._id.type === 'bet').reduce((sum, d) => sum + d.count, 0)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPoolAlerts(req, res) {
    try {
      const pool = await PrizePool.findOne({ poolName: 'main_prize_pool' });
      
      if (!pool) {
        return res.status(404).json({ 
          success: false, 
          message: 'Prize pool not found' 
        });
      }

      const alerts = [];

      // Check for low balance
      if (pool.currentBalance < 1000) {
        alerts.push({
          type: 'warning',
          title: 'Low Pool Balance',
          message: `Pool balance is $${pool.currentBalance}, below recommended minimum of $1000`,
          severity: 'high',
          timestamp: new Date()
        });
      }

      // Check for high utilization
      const utilizationRate = pool.totalContributions > 0 ? 
        (pool.totalPayouts / pool.totalContributions) * 100 : 0;
      
      if (utilizationRate > 90) {
        alerts.push({
          type: 'info',
          title: 'High Payout Rate',
          message: `Pool utilization rate is ${utilizationRate.toFixed(1)}%`,
          severity: 'medium',
          timestamp: new Date()
        });
      }

      // Check for unusual activity patterns
      const recentActivity = await PrizePool.aggregate([
        {
          $match: {
            poolName: 'main_prize_pool'
          }
        },
        {
          $lookup: {
            from: 'transactions',
            let: { poolName: '$poolName' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ['$type', ['pool_contribution', 'pool_payout']] },
                      { $gte: ['$createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000)] }
                    ]
                  }
                }
              }
            ],
            as: 'recentTransactions'
          }
        }
      ]);

      if (recentActivity[0]?.recentTransactions?.length > 100) {
        alerts.push({
          type: 'info',
          title: 'High Activity',
          message: 'Unusually high pool activity detected in the last 24 hours',
          severity: 'low',
          timestamp: new Date()
        });
      }

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async simulateGameOutcome(req, res) {
    try {
      const { userId, betAmount, gameType } = req.body;
      
      // Check if user should win based on enhanced logic
      const shouldWin = await enhancedPrizePoolService.shouldAllowWin(userId, betAmount * 2);
      
      // Calculate win amount based on game type and pool balance
      const pool = await PrizePool.findOne({ poolName: 'main_prize_pool' });
      const maxWin = Math.min(betAmount * 10, pool.currentBalance * 0.1);
      
      const winAmount = shouldWin ? Math.random() * maxWin : 0;
      
      res.json({
        success: true,
        data: {
          shouldWin,
          winAmount: Math.round(winAmount * 100) / 100,
          poolBalanceAfter: pool.currentBalance - winAmount,
          reasoning: {
            dailyCapOk: await enhancedPrizePoolService.checkDailyWinCap(userId),
            consecutiveWinsOk: await enhancedPrizePoolService.checkConsecutiveWins(userId),
            bigWinDelayOk: await enhancedPrizePoolService.checkBigWinDelay(userId, winAmount)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new EnhancedPrizePoolController();
