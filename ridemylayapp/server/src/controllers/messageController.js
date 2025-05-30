const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @desc    Get messages for a chat
 * @route   GET /api/messages/:chatId
 * @access  Private
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20 
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    // Find chat
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Check if user is in chat
    if (!chat.users.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this chat'
      });
    }

    // Get total count
    const total = await Message.countDocuments({ chat: req.params.chatId });
    
    // Calculate skip based on pagination from newest to oldest
    const skip = Math.max(0, total - (pageNum * limitNum));
    
    // Adjusted limit to handle edge cases
    const adjustedLimit = Math.min(limitNum, total - ((pageNum - 1) * limitNum));

    // Get messages with pagination (from newest to oldest)
    const messages = await Message.find({ chat: req.params.chatId })
      .sort('createdAt')
      .skip(skip >= 0 ? skip : 0)
      .limit(adjustedLimit > 0 ? adjustedLimit : limitNum)
      .populate('sender', 'username avatarUrl')
      .populate('readBy', 'username');

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      messages
    });
  } catch (error) {
    logger.error(`Get messages error for chat ID ${req.params.chatId}:`, error);
    next(error);
  }
};

/**
 * @desc    Send message
 * @route   POST /api/messages
 * @access  Private
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { content, chatId, attachments } = req.body;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Message content or attachments are required'
      });
    }

    // Find chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Check if user is in chat
    if (!chat.users.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to send message to this chat'
      });
    }

    // Create message with validated attachments
    let processedAttachments = [];
    if (attachments && attachments.length > 0) {
      processedAttachments = attachments.map(att => {
        // Basic validation for attachment data
        if (att.type === 'bet' && !att.betId) {
          return null; // Skip invalid attachments
        }
        return att;
      }).filter(Boolean); // Remove null entries
    }

    // Create message
    let message = await Message.create({
      sender: req.user.id,
      content: content || '',
      chat: chatId,
      attachments: processedAttachments,
      readBy: [req.user.id] // Mark as read by sender
    });
    
    // Populate sender info
    message = await message.populate('sender', 'username avatarUrl');
    message = await message.populate('readBy', 'username');

    // If attachments have betId, populate bet details
    if (message.attachments && message.attachments.some(att => att.betId)) {
      message = await message.populate({
        path: 'attachments.betId',
        select: 'status odds stake potentialWinnings'
      });
    }

    // Update latest message in chat
    chat.latestMessage = message._id;
    await chat.save();

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    logger.error('Send message error:', error);
    next(error);
  }
};

/**
 * @desc    Mark messages as read
 * @route   PUT /api/messages/read/:chatId
 * @access  Private
 */
exports.markMessagesAsRead = async (req, res, next) => {
  try {
    // Find chat
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Check if user is in chat
    if (!chat.users.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this chat'
      });
    }

    // Update all unread messages in chat
    const result = await Message.updateMany(
      { 
        chat: req.params.chatId,
        readBy: { $ne: req.user.id }
      },
      {
        $addToSet: { readBy: req.user.id }
      }
    );

    res.status(200).json({
      success: true,
      markedCount: result.modifiedCount
    });
  } catch (error) {
    logger.error(`Mark messages as read error for chat ID ${req.params.chatId}:`, error);
    next(error);
  }
};

/**
 * @desc    Delete message
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    // Find message
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check ownership
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }

    // Delete message
    await message.remove();

    // If this was the latest message in the chat, update the latestMessage
    const chat = await Chat.findById(message.chat);
    if (chat && chat.latestMessage && chat.latestMessage.toString() === req.params.id) {
      // Find the new latest message
      const latestMessage = await Message.findOne({ chat: chat._id })
        .sort('-createdAt');

      chat.latestMessage = latestMessage ? latestMessage._id : undefined;
      await chat.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    logger.error(`Delete message error for ID ${req.params.id}:`, error);
    next(error);
  }
};
