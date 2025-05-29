const mongoose = require('mongoose');

const BetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID']
    },
    legs: [
      {
        team: {
          type: String,
          required: [true, 'Please provide a team name']
        },
        betType: {
          type: String,
          required: [true, 'Please provide a bet type']
        },        odds: {
          type: Number,
          required: [true, 'Please provide odds'],
          validate: {
            validator: function(v) {
              return v >= -10000 && v <= 10000;
            },
            message: props => `${props.value} is not a valid American odds value for leg!`
          }
        },
        outcome: {
          type: String,
          enum: ['won', 'lost', 'push', 'pending'],
          default: 'pending'
        }
      }
    ],    odds: {
      type: Number,
      required: [true, 'Please provide total odds'],
      validate: {
        validator: function(v) {
          // Allow reasonable American odds range (-10000 to +10000)
          return v >= -10000 && v <= 10000;
        },
        message: props => `${props.value} is not a valid American odds value!`
      }
    },
    stake: {
      type: Number,
      required: [true, 'Please provide a stake amount'],
      min: [0.01, 'Stake must be greater than 0'],
      max: [1000000, 'Stake cannot exceed 1,000,000']
    },
    potentialWinnings: {
      type: Number,
      required: [true, 'Please provide potential winnings']
    },
    status: {
      type: String,
      enum: ['won', 'lost', 'push', 'pending', 'voided'],
      default: 'pending'
    },
    bettingSiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BettingSite',
      required: [true, 'Please provide a betting site']
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
      }
    ],
    shares: {
      type: Number,
      default: 0
    },
    isRide: {
      type: Boolean,
      default: false
    },
    isHedge: {
      type: Boolean,
      default: false
    },
    originalBetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bet'
    },
    sport: {
      type: String,
      enum: ['football', 'basketball', 'baseball', 'hockey', 'soccer', 'tennis', 'golf', 'mma', 'other'],
      required: [true, 'Please provide a sport']
    },
    gameIds: [{
      type: String
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for likeCount - returns the count of likes
BetSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for commentCount - returns the count of comments
BetSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Compound index for efficient querying of a user's bets
BetSchema.index({ userId: 1, createdAt: -1 });

// Index for efficient querying of bets by status
BetSchema.index({ status: 1 });

// Index for searching bets by sport
BetSchema.index({ sport: 1 });

module.exports = mongoose.model('Bet', BetSchema);
