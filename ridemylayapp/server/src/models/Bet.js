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
      }    ],    odds: {
      type: Number,
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
      type: Number
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

// Calculate odds and potential winnings before saving
BetSchema.pre('save', function(next) {
  if (this.isModified('legs') || this.isModified('stake')) {
    // Convert odds to numbers
    const parsedLegs = this.legs.map(leg => ({
      ...leg,
      odds: typeof leg.odds === 'string' ? parseInt(leg.odds) : leg.odds
    }));

    // Calculate total odds
    if (parsedLegs.length === 1) {
      this.odds = parsedLegs[0].odds;
    } else {
      // Convert all legs to decimal and multiply
      const decimalOdds = parsedLegs.reduce((acc, leg) => {
        const decimal = leg.odds > 0
          ? (leg.odds / 100) + 1
          : (100 / Math.abs(leg.odds)) + 1;
        return acc * decimal;
      }, 1);

      // Convert back to American odds
      if (decimalOdds <= 1) this.odds = 0;
      else if (decimalOdds >= 2) {
        this.odds = Math.round((decimalOdds - 1) * 100);
      } else {
        this.odds = Math.round(-100 / (decimalOdds - 1));
      }
    }

    // Calculate potential winnings
    const decimalOdds = this.odds > 0
      ? (this.odds / 100) + 1
      : (100 / Math.abs(this.odds)) + 1;

    this.potentialWinnings = Number(Math.round(this.stake * (decimalOdds - 1) * 100) / 100);
  }
  next();
});

module.exports = mongoose.model('Bet', BetSchema);
