const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @desc    Like/Unlike a comment
 * @route   PUT /api/comments/:id/like
 * @access  Private
 */
router.put('/:id/like', protect, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user already liked the comment
    const index = comment.likes.findIndex(
      id => id.toString() === req.user.id
    );

    // Toggle like
    if (index === -1) {
      // Add like
      comment.likes.push(req.user.id);
    } else {
      // Remove like
      comment.likes.splice(index, 1);
    }

    await comment.save();

    // Populate user info for response
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username avatarUrl verified');

    res.status(200).json({
      success: true,
      comment: populatedComment
    });
  } catch (error) {
    logger.error(`Toggle comment like error for ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check ownership
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete comment error for ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * @desc    Update a comment
 * @route   PUT /api/comments/:id
 * @access  Private
 */
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check ownership
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this comment'
      });
    }

    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    // Populate user info for response
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username avatarUrl verified');

    res.status(200).json({
      success: true,
      comment: populatedComment
    });
  } catch (error) {
    logger.error(`Update comment error for ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * @desc    Get a single comment
 * @route   GET /api/comments/:id
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('userId', 'username avatarUrl verified');

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    res.status(200).json({
      success: true,
      comment
    });
  } catch (error) {
    logger.error(`Get comment error for ID ${req.params.id}:`, error);
    next(error);
  }
});

module.exports = router;
