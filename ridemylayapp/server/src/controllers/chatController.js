const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @desc    Get user's chats
 * @route   GET /api/chats
 * @access  Private
 */
exports.getUserChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ users: req.user.id })
      .populate('users', 'username avatarUrl')
      .populate('groupAdmin', 'username avatarUrl')
      .populate('latestMessage')
      .sort('-updatedAt');

    // Populate sender info for latestMessage
    for (let chat of chats) {
      if (chat.latestMessage) {
        await chat.populate({
          path: 'latestMessage',
          populate: {
            path: 'sender',
            select: 'username avatarUrl'
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      chats
    });
  } catch (error) {
    logger.error('Get user chats error:', error);
    next(error);
  }
};

/**
 * @desc    Create or access one-on-one chat
 * @route   POST /api/chats
 * @access  Private
 */
exports.accessChat = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'UserId param not sent with request'
      });
    }

    // Check if chat exists
    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [req.user.id, userId] }
    })
      .populate('users', 'username avatarUrl')
      .populate('latestMessage');

    if (chat) {
      // Populate sender info for latestMessage
      if (chat.latestMessage) {
        await chat.populate({
          path: 'latestMessage',
          populate: {
            path: 'sender',
            select: 'username avatarUrl'
          }
        });
      }
    } else {
      // Create new chat
      const chatData = {
        name: 'sender',
        isGroupChat: false,
        users: [req.user.id, userId]
      };

      chat = await Chat.create(chatData);
      chat = await chat.populate('users', 'username avatarUrl');
    }

    res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    logger.error('Access chat error:', error);
    next(error);
  }
};

/**
 * @desc    Create group chat
 * @route   POST /api/chats/group
 * @access  Private
 */
exports.createGroupChat = async (req, res, next) => {
  try {
    const { name, users, avatarUrl, description } = req.body;

    if (!name || !users || !Array.isArray(users) || users.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a name and at least 2 users'
      });
    }

    // Add current user to group
    users.push(req.user.id);

    // Create group chat
    const groupChat = await Chat.create({
      name,
      isGroupChat: true,
      users,
      groupAdmin: req.user.id,
      avatarUrl,
      description
    });

    // Get full chat details
    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate('users', 'username avatarUrl')
      .populate('groupAdmin', 'username avatarUrl');

    res.status(201).json({
      success: true,
      chat: fullGroupChat
    });
  } catch (error) {
    logger.error('Create group chat error:', error);
    next(error);
  }
};

/**
 * @desc    Update group chat
 * @route   PUT /api/chats/group/:id
 * @access  Private
 */
exports.updateGroupChat = async (req, res, next) => {
  try {
    const { name, avatarUrl, description } = req.body;

    // Find chat
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Check if group chat
    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update non-group chat'
      });
    }

    // Check if admin
    if (chat.groupAdmin.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only admin can update group'
      });
    }

    // Update chat
    chat.name = name || chat.name;
    chat.avatarUrl = avatarUrl || chat.avatarUrl;
    chat.description = description || chat.description;

    const updatedChat = await chat.save();

    // Get full chat details
    const fullUpdatedChat = await Chat.findById(updatedChat._id)
      .populate('users', 'username avatarUrl')
      .populate('groupAdmin', 'username avatarUrl');

    res.status(200).json({
      success: true,
      chat: fullUpdatedChat
    });
  } catch (error) {
    logger.error(`Update group chat error for ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Add user to group
 * @route   PUT /api/chats/group/:id/add
 * @access  Private
 */
exports.addToGroup = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Find chat
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Check if group chat
    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        error: 'Cannot add user to non-group chat'
      });
    }

    // Check if admin
    if (chat.groupAdmin.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only admin can add users'
      });
    }

    // Check if user already in group
    if (chat.users.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'User already in group'
      });
    }

    // Add user to group
    chat.users.push(userId);
    const updatedChat = await chat.save();

    // Get full chat details
    const fullUpdatedChat = await Chat.findById(updatedChat._id)
      .populate('users', 'username avatarUrl')
      .populate('groupAdmin', 'username avatarUrl');

    res.status(200).json({
      success: true,
      chat: fullUpdatedChat
    });
  } catch (error) {
    logger.error(`Add to group error for ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Remove user from group
 * @route   PUT /api/chats/group/:id/remove
 * @access  Private
 */
exports.removeFromGroup = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Find chat
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Check if group chat
    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove user from non-group chat'
      });
    }

    // Check if admin or self-removal
    if (chat.groupAdmin.toString() !== req.user.id && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only admin can remove users'
      });
    }

    // Prevent admin removal
    if (userId === chat.groupAdmin.toString() && userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Admin cannot leave group, transfer admin role first'
      });
    }

    // Remove user from group
    chat.users = chat.users.filter(u => u.toString() !== userId);
    const updatedChat = await chat.save();

    // Get full chat details
    const fullUpdatedChat = await Chat.findById(updatedChat._id)
      .populate('users', 'username avatarUrl')
      .populate('groupAdmin', 'username avatarUrl');

    res.status(200).json({
      success: true,
      chat: fullUpdatedChat
    });
  } catch (error) {
    logger.error(`Remove from group error for ID ${req.params.id}:`, error);
    next(error);
  }
};
