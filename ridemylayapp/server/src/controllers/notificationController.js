const Notification = require('../models/Notification');
const logger = require('../utils/logger');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate('sender', 'username profilePicture')
      .limit(30);

    res.json(notifications);
  } catch (error) {
    logger.error(`Error fetching notifications: ${error.message}`);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({ count });
  } catch (error) {
    logger.error(`Error fetching unread count: ${error.message}`);
    res.status(500).json({ error: 'Error fetching unread count' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndUpdate(notificationId, {
      read: true
    });

    res.json({ success: true });
  } catch (error) {
    logger.error(`Error marking notification as read: ${error.message}`);
    res.status(500).json({ error: 'Error marking notification as read' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    logger.error(`Error marking all notifications as read: ${error.message}`);
    res.status(500).json({ error: 'Error marking all notifications as read' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndDelete(notificationId);

    res.json({ success: true });
  } catch (error) {
    logger.error(`Error deleting notification: ${error.message}`);
    res.status(500).json({ error: 'Error deleting notification' });
  }
};
