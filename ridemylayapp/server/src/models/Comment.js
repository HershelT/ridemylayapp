const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID']
    },
    betId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bet',
      required: [true, 'Please provide a bet ID']
    },
    content: {
      type: String,
      required: [true, 'Please provide comment content'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for likeCount - returns the count of likes
CommentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for childComments - returns child comments
CommentSchema.virtual('childComments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentId'
});

// Compound index for efficient querying of a bet's comments
CommentSchema.index({ betId: 1, createdAt: -1 });

// Compound index for efficient querying of a user's comments
CommentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);
