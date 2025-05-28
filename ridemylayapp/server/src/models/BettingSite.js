const mongoose = require('mongoose');

const BettingSiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a betting site name'],
      unique: true,
      trim: true
    },
    logoUrl: {
      type: String,
      required: [true, 'Please provide a logo URL']
    },
    websiteUrl: {
      type: String,
      required: [true, 'Please provide a website URL']
    },
    apiEndpoint: {
      type: String
    },
    apiKey: {
      type: String,
      select: false // Don't include API key in query results by default
    },
    supportedSports: [{
      type: String,
      enum: ['football', 'basketball', 'baseball', 'hockey', 'soccer', 'tennis', 'golf', 'mma', 'other']
    }],
    bonusOffers: [{
      title: String,
      description: String,
      code: String,
      expiryDate: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    countryAvailability: [{
      type: String,
      default: 'US'
    }]
  },
  {
    timestamps: true
  }
);

// Index for querying active sites
BettingSiteSchema.index({ isActive: 1 });

module.exports = mongoose.model('BettingSite', BettingSiteSchema);
