const User = require('../models/User');
const Bet = require('../models/Bet');
const logger = require('../utils/logger');

/**
 * @desc    Get user profile by username
 * @route   GET /api/users/:username
 * @access  Public
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ 
      username: req.params.username 
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Get user stats
    const betsCount = await Bet.countDocuments({ userId: user._id });
    const wonBetsCount = await Bet.countDocuments({ 
      userId: user._id, 
      status: 'won' 
    });
    
    const userStats = {
      betsCount,
      wonBetsCount,
      winRate: betsCount > 0 ? (wonBetsCount / betsCount) * 100 : 0
    };

    res.status(200).json({
      success: true,
      user,
      stats: userStats
    });
  } catch (error) {
    logger.error(`Get user profile error for username ${req.params.username}:`, error);
    next(error);
  }
};

/**
 * @desc    Get user bets
 * @route   GET /api/users/:username/bets
 * @access  Public
 */
exports.getUserBets = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const { 
      status, 
      sport,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = { userId: user._id };

    if (status) query.status = status;
    if (sport) query.sport = sport;

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get bets
    const bets = await Bet.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('bettingSiteId', 'name logoUrl');

    // Get total count
    const total = await Bet.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bets.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      bets
    });
  } catch (error) {
    logger.error(`Get user bets error for username ${req.params.username}:`, error);
    next(error);
  }
};

/**
 * @desc    Follow/Unfollow user
 * @route   PUT /api/users/:username/follow
 * @access  Private
 */
exports.toggleFollow = async (req, res, next) => {
  try {
    // Find user to follow/unfollow
    const userToFollow = await User.findOne({ username: req.params.username });

    if (!userToFollow) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Check if trying to follow self
    if (userToFollow._id.toString() === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'You cannot follow yourself' 
      });
    }

    // Find current user
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'Current user not found' 
      });
    }

    // Check if already following
    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== userToFollow._id.toString()
      );
      userToFollow.followers = userToFollow.followers.filter(
        id => id.toString() !== currentUser._id.toString()
      );
    } else {
      // Follow
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
    }

    // Save changes
    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: userToFollow.followers.length
    });
  } catch (error) {
    logger.error(`Toggle follow error for username ${req.params.username}:`, error);
    next(error);
  }
};

/**
 * @desc    Get leaderboard
 * @route   GET /api/users/leaderboard
 * @access  Public
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { 
      timeframe = 'all', 
      limit = 10,
      page = 1 
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Determine date range based on timeframe
    const dateQuery = {};
    const now = new Date();

    if (timeframe === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateQuery.createdAt = { $gte: weekAgo };
    } else if (timeframe === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateQuery.createdAt = { $gte: monthAgo };
    } else if (timeframe === 'year') {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      dateQuery.createdAt = { $gte: yearAgo };
    }

    // Aggregate to get user stats
    const userStats = await Bet.aggregate([
      { $match: { ...dateQuery, status: { $in: ['won', 'lost'] } } },
      { 
        $group: {
          _id: '$userId',
          totalBets: { $sum: 1 },
          wonBets: {
            $sum: {
              $cond: [{ $eq: ['$status', 'won'] }, 1, 0]
            }
          },
          totalWinnings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'won'] }, '$potentialWinnings', 0]
            }
          },
          totalStake: { $sum: '$stake' }
        }
      },
      {
        $addFields: {
          winRate: {
            $multiply: [
              { $divide: ['$wonBets', '$totalBets'] },
              100
            ]
          },
          profit: { $subtract: ['$totalWinnings', '$totalStake'] }
        }
      },
      { $sort: { profit: -1 } },
      { $skip: skip },
      { $limit: limitNum }
    ]);

    // Get user details
    const userIds = userStats.map(stat => stat._id);
    const users = await User.find({ _id: { $in: userIds } });

    // Combine user details with stats
    const leaderboard = userStats.map(stat => {
      const user = users.find(u => u._id.toString() === stat._id.toString());
      return {
        _id: stat._id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        verified: user.verified,
        totalBets: stat.totalBets,
        wonBets: stat.wonBets,
        winRate: stat.winRate,
        profit: stat.profit,
        streak: user.streak
      };
    });

    // Get total count for pagination
    const totalUsers = await Bet.aggregate([
      { $match: { ...dateQuery, status: { $in: ['won', 'lost'] } } },
      { $group: { _id: '$userId' } },
      { $count: 'total' }
    ]);

    const total = totalUsers.length > 0 ? totalUsers[0].total : 0;

    res.status(200).json({
      success: true,
      timeframe,
      count: leaderboard.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      leaderboard
    });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    next(error);
  }
};
