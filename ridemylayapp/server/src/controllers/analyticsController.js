const Bet = require('../models/Bet');
const User = require('../models/User');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * @desc    Get user analytics
 * @route   GET /api/users/:username/analytics
 * @access  Private
 */
exports.getUserAnalytics = async (req, res, next) => {
  try {
    let userId;
    if (req.params.username === 'me') {
      userId = req.user.id;
    } else {
      // First try to find user by username
      const user = await User.findOne({ username: req.params.username });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }
      userId = user._id;
    }    // Convert userId to ObjectId if it's a string
    userId = mongoose.Types.ObjectId(userId);

    // Get total bets and wins for win rate
    const totalBets = await Bet.countDocuments({ userId });
    const wonBets = await Bet.countDocuments({ userId, status: 'won' });
    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

    // Calculate profit/loss
    const bets = await Bet.find({ userId });
    let profit = 0;
    let totalOdds = 0;
    bets.forEach(bet => {
      if (bet.status === 'won') {
        profit += bet.potentialWinnings - bet.stake;
      } else if (bet.status === 'lost') {
        profit -= bet.stake;
      }
      totalOdds += bet.odds || 0;
    });
    const avgOdds = totalBets > 0 ? totalOdds / totalBets : 0;

    // Get sport breakdown
    const sportBreakdown = await Bet.aggregate([
      { $match: { userId } },
      { 
        $group: {
          _id: '$sport',
          betsCount: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } }
        }
      },
      {
        $project: {
          sport: '$_id',
          betsCount: 1,
          winRate: {
            $multiply: [
              { $divide: ['$wins', '$betsCount'] },
              100
            ]
          }
        }
      },
      { $sort: { betsCount: -1 } }
    ]);

    // Get recent performance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentBets = await Bet.find({
      userId,
      createdAt: { $gte: sevenDaysAgo },
      status: { $in: ['won', 'lost'] }
    }).sort('createdAt');

    const recentPerformance = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayBets = recentBets.filter(bet => {
        const betDate = new Date(bet.createdAt);
        betDate.setHours(0, 0, 0, 0);
        return betDate.getTime() === date.getTime();
      });

      recentPerformance.unshift({
        date: date.toISOString(),
        won: dayBets.filter(bet => bet.status === 'won').length,
        lost: dayBets.filter(bet => bet.status === 'lost').length
      });
    }

    res.status(200).json({
      success: true,
      analytics: {
        winRate,
        totalBets,
        profit,
        avgOdds,
        sportBreakdown,
        recentPerformance
      }
    });
  } catch (error) {
    logger.error('Get user analytics error:', error);
    next(error);
  }
};
