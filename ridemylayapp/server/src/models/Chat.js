const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },
    isGroupChat: {
      type: Boolean,
      default: false
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    avatarUrl: {
      type: String,      default: function() {
        // Default group avatar using DiceBear API v7
        return this.isGroupChat ? 
          `https://https://api.dicebear.com/9.x/icons/svg?seed=${this._id}` : 
          null;
      }
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters']
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying of a user's chats
ChatSchema.index({ users: 1 });

// Index for efficient querying by latest message
ChatSchema.index({ latestMessage: 1 });

module.exports = mongoose.model('Chat', ChatSchema);
