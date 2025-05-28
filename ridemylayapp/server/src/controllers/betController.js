const Bet = require('../models/Bet');
const User = require('../models/User');
const Comment = require('../models/Comment');
const logger = require('../utils/logger');

/**
 * @desc    Create new bet
 * @route   POST /api/bets
 * @access  Private
 */
exports.createBet = async (req, res, next) => {
  try {
    const { legs, stake, bettingSiteId, sport, isRide, isHedge, originalBetId } = req.body;

    // Calculate total odds from legs
    const totalOdds = legs.reduce((acc, leg) => acc * leg.odds, 1);
    
    // Calculate potential winnings
    const potentialWinnings = stake * totalOdds;

    // Create bet
    const bet = await Bet.create({
      userId: req.user.id,
      legs,
      odds: totalOdds,
      stake,
      potentialWinnings,
      bettingSiteId,
      sport,
      isRide,
      isHedge,
      originalBetId
    });

    res.status(201).json({
      success: true,
      bet
    });
  } catch (error) {
    logger.error('Create bet error:', error);
    next(error);
  }
};

/**
 * @desc    Get all bets with filters
 * @route   GET /api/bets
 * @access  Public
 */
exports.getBets = async (req, res, next) => {
  try {
    const { 
      sport, 
      status, 
      userId, 
      following,
      isRide,
      isHedge,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = {};

    if (sport) query.sport = sport;
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (isRide === 'true') query.isRide = true;
    if (isHedge === 'true') query.isHedge = true;

    // If following=true, get bets from users the current user follows
    if (following === 'true' && req.user) {
      const currentUser = await User.findById(req.user.id);
      if (currentUser && currentUser.following.length > 0) {
        query.userId = { $in: currentUser.following };
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get bets
    const bets = await Bet.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'username avatarUrl verified')
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
    logger.error('Get bets error:', error);
    next(error);
  }
};

/**
 * @desc    Get single bet
 * @route   GET /api/bets/:id
 * @access  Public
 */
exports.getBet = async (req, res, next) => {
  try {
    const bet = await Bet.findById(req.params.id)
      .populate('userId', 'username avatarUrl verified bio')
      .populate('bettingSiteId', 'name logoUrl websiteUrl')
      .populate('originalBetId', 'userId odds stake potentialWinnings status');

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found'
      });
    }

    // Populate originalBet's user if it exists
    if (bet.originalBetId) {
      await bet.populate({
        path: 'originalBetId',
        populate: {
          path: 'userId',
          select: 'username avatarUrl verified'
        }
      });
    }

    res.status(200).json({
      success: true,
      bet
    });
  } catch (error) {
    logger.error(`Get bet error for ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Update bet status
 * @route   PUT /api/bets/:id/status
 * @access  Private
 */
exports.updateBetStatus = async (req, res, next) => {
  try {
    const { status, legOutcomes } = req.body;
    
    // Find bet
    let bet = await Bet.findById(req.params.id);

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found'
      });
    }

    // Check ownership
    if (bet.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this bet'
      });
    }

    // Update leg outcomes if provided
    if (legOutcomes && Array.isArray(legOutcomes)) {
      for (let i = 0; i < legOutcomes.length && i < bet.legs.length; i++) {
        bet.legs[i].outcome = legOutcomes[i];
      }
    }

    // Update bet status
    bet.status = status;

    // Save bet
    await bet.save();

    res.status(200).json({
      success: true,
      bet
    });
  } catch (error) {
    logger.error(`Update bet status error for ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Like/Unlike a bet
 * @route   PUT /api/bets/:id/like
 * @access  Private
 */
exports.toggleLike = async (req, res, next) => {
  try {
    const bet = await Bet.findById(req.params.id);

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found'
      });
    }

    // Check if user already liked the bet
    const index = bet.likes.findIndex(
      id => id.toString() === req.user.id
    );    // Toggle like
    if (index === -1) {
      // Add like
      bet.likes.push(req.user.id);

      // Create notification for bet owner
      if (bet.userId.toString() !== req.user.id) {
        const notification = await Notification.create({
          recipient: bet.userId,
          sender: req.user._id,
          type: 'bet_interaction',
          content: `${req.user.username} liked your bet`,
          entityType: 'bet',
          entityId: bet._id,
          metadata: { interactionType: 'like' }
        });

        // Send real-time notification if user is online
        if (req.io && activeUsers.has(bet.userId.toString())) {
          req.io.to(`user:${bet.userId}`).emit('new_notification', notification);
        }
      }
    } else {
      // Remove like
      bet.likes.splice(index, 1);
    }

    await bet.save();

    res.status(200).json({
      success: true,
      likes: bet.likes.length,
      isLiked: index === -1
    });
  } catch (error) {
    logger.error(`Toggle like error for bet ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Get comments for a bet
 * @route   GET /api/bets/:id/comments
 * @access  Public
 */
exports.getBetComments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get top-level comments only (no parentId)
    const comments = await Comment.find({ 
      betId: req.params.id,
      parentId: { $exists: false }
    })
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'username avatarUrl verified')
      .populate({
        path: 'childComments',
        options: { sort: { createdAt: 1 } },
        populate: {
          path: 'userId',
          select: 'username avatarUrl verified'
        }
      });

    // Get total count
    const total = await Comment.countDocuments({ 
      betId: req.params.id,
      parentId: { $exists: false }
    });

    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      comments
    });
  } catch (error) {
    logger.error(`Get comments error for bet ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Add comment to bet
 * @route   POST /api/bets/:id/comments
 * @access  Private
 */
exports.addComment = async (req, res, next) => {
  try {
    const { content, parentId } = req.body;

    // Find bet
    const bet = await Bet.findById(req.params.id);

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found'
      });
    }

    // Create comment
    const comment = await Comment.create({
      userId: req.user.id,
      betId: req.params.id,
      content,
      parentId
    });

    // Add comment to bet's comments array
    bet.comments.push(comment._id);
    await bet.save();

    // Populate user data
    await comment.populate('userId', 'username avatarUrl verified');

    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    logger.error(`Add comment error for bet ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Delete a bet
 * @route   DELETE /api/bets/:id
 * @access  Private
 */
exports.deleteBet = async (req, res, next) => {
  try {
    const bet = await Bet.findById(req.params.id);

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found'
      });
    }

    // Check ownership
    if (bet.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this bet'
      });
    }

    // Delete all comments associated with the bet
    await Comment.deleteMany({ betId: req.params.id });

    // Delete the bet
    await bet.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Bet deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete bet error for ID ${req.params.id}:`, error);
    next(error);
  }
};
