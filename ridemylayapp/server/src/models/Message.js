const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a sender']
    },
    content: {
      type: String,
      trim: true,
      required: [true, 'Please provide message content']
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'Please provide a chat']
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'video', 'bet']
      },
      url: String,
      betId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bet'
      },
      betData: {
        status: String,
        odds: Number,
        stake: Number
      }
    }],
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient querying of a chat's messages
MessageSchema.index({ chat: 1, createdAt: 1 });

// Index for efficient querying of a user's messages
MessageSchema.index({ sender: 1 });

// Index for querying unread messages
MessageSchema.index({ readBy: 1 });

module.exports = mongoose.model('Message', MessageSchema);
