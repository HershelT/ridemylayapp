const User = require('../models/User');
const Bet = require('../models/Bet');
const logger = require('../utils/logger');

/**
 * @desc    Get user profile by username
 * @route   GET /api/users/:username
 * @access  Public
 */
exports.getUserProfile = async (req, res, next) => {
  try {    let user;
    // Check if it's a valid MongoDB ID
    if (req.params.username.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(req.params.username);
    } 

    // If not found by ID or not a valid ID, try username
    if (!user) {
      user = await User.findOne({ username: req.params.username });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }    // Get user stats
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

    // Add isFollowing field if we have an authenticated user
    let isFollowing = false;
    if (req.user) {
      const currentUser = await User.findById(req.user.id);
      if (currentUser) {
        isFollowing = currentUser.following.some(
          id => id.toString() === user._id.toString()
        );
        // Add the isFollowing field to the user object
        user = user.toObject();
        user.isFollowing = isFollowing;
      }
    }

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
    let user;
    if (req.params.username === 'me' && req.user) {
      user = req.user;
    } else {
      // First try to find user by username
      user = await User.findOne({ username: req.params.username });
      
      // If not found, check if it's a valid MongoDB ID and try that
      if (!user && req.params.username.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(req.params.username);
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user's bets with pagination
    const bets = await Bet.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username avatarUrl verified bio streak')
      .populate('bettingSiteId', 'name logoUrl websiteUrl');

    // Get total count for pagination
    const total = await Bet.countDocuments({ userId: user._id });

    res.status(200).json({
      success: true,
      bets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Error fetching bets for user ${req.params.username}:`, error);
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
      userToFollow.followers.push(currentUser._id);    }    // Save changes
    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      isFollowing: !isFollowing,
      userId: userToFollow._id
    });
  } catch (error) {
    logger.error(`Toggle follow error for username ${req.params.username}:`, error);
    next(error);
  }
};

/**
 * @desc    Search for users
 * @route   GET /api/users/search
 * @access  Public
 */
exports.searchUsers = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Search users by username or name
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username name avatarUrl verified')
      .skip(skip)
      .limit(limitNum)
      .sort('username');

    // Get total count
    const total = await User.countDocuments({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      users
    });
  } catch (error) {
    logger.error('Search users error:', error);
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
      page = 1,
      limit = 10,
      type = 'all'  // 'all', 'friends', 'country', 'influencers'
    } = req.query;
    
    // Convert page and limit to numbers and calculate skip
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get current user for friend filtering
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'Current user not found'
      });
    }
    
    // Build date query based on timeframe
    const dateQuery = {};
    const now = new Date();
    
    if (timeframe !== 'all') {
      if (timeframe === 'day') {
        const dayAgo = new Date(now);
        dayAgo.setDate(now.getDate() - 1);
        dateQuery.createdAt = { $gte: dayAgo };
      } else if (timeframe === 'week') {
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
    }

    // Prepare match query for aggregation
    const matchQuery = {
      status: { $in: ['won', 'lost'] }  // Only include completed bets
    };

    // Add date filter if exists
    if (Object.keys(dateQuery).length > 0) {
      matchQuery.createdAt = dateQuery.createdAt;
    }

    // Add user filter based on leaderboard type
    if (type === 'friends') {
      matchQuery.userId = { $in: currentUser.following };
    }
    // Add additional filters for 'country' and 'influencers' types if needed

    // Aggregate to get user stats
    const userStats = await Bet.aggregate([
      { $match: matchQuery },
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
        $project: {
          _id: 1,
          totalBets: 1,
          wonBets: 1,
          winRate: {
            $cond: [
              { $eq: ['$totalBets', 0] },
              0,
              { $multiply: [{ $divide: ['$wonBets', '$totalBets'] }, 100] }
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

    // Combine user details with stats and format data
    const leaderboard = userStats.map(stat => {
      const user = users.find(u => u._id.toString() === stat._id.toString());
      if (!user) return null;
      
      return {
        _id: stat._id,
        username: user.username,
        avatarUrl: user.avatarUrl || '',
        verified: user.verified || false,
        totalBets: stat.totalBets || 0,
        wonBets: stat.wonBets || 0,
        winRate: stat.winRate || 0,
        profit: stat.profit || 0,
        streak: user.streak || 0,
        isFollowing: currentUser.following.includes(user._id)
      };
    }).filter(Boolean);

    // Get total count for pagination
    const totalUsersResult = await Bet.aggregate([
      { $match: matchQuery },
      { 
        $group: {
          _id: '$userId',
          totalBets: { $sum: 1 }
        }
      },
      { $count: 'total' }
    ]);

    const total = totalUsersResult.length > 0 ? totalUsersResult[0].total : 0;

    res.status(200).json({
      success: true,
      timeframe,
      count: leaderboard.length,
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      leaderboard
    });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    next(error);
  }
};
