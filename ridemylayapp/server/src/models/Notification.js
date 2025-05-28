const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['message', 'bet_interaction', 'follow', 'bet_outcome', 'mention']
  },
  read: {
    type: Boolean,
    default: false
  },
  content: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    enum: ['chat', 'bet', 'user'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for quick lookups by recipient and read status
notificationSchema.index({ recipient: 1, read: 1 });
// TTL index to auto-delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Compound index for efficient querying of user's notifications
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Index for efficient cleaning up of old notifications that have been read
notificationSchema.index({ read: 1, createdAt: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
