const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Don't include password in query results by default
    },    avatarUrl: {
      type: String,
      default: function() {
        // Default avatar based on username using updated DiceBear API v7
        return `https://api.dicebear.com/9.x/icons/svg?seed=${this.username}`;
      }
    },
    bio: {
      type: String,
      maxlength: [200, 'Bio cannot exceed 200 characters']
    },
    winRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    streak: {
      type: Number,
      default: 0
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    verified: {
      type: Boolean,
      default: false
    },
    settings: {
      showBio: {
        type: Boolean,
        default: true
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      }
    },
    country: {
      type: String,
      default: 'US'
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for betCount - returns the count of user's bets
UserSchema.virtual('betCount', {
  ref: 'Bet',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

// Virtual for followerCount - returns the count of user's followers
UserSchema.virtual('followerCount').get(function() {
  return this.followers?.length || 0;
});

// Virtual for followingCount - returns the count of users being followed
UserSchema.virtual('followingCount').get(function() {
  return this.following?.length || 0;
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  // Initialize followers and following arrays if undefined
  if (!this.followers) this.followers = [];
  if (!this.following) this.following = [];

  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) {
    return next();
  }
  
  // Generate a salt
  const salt = await bcrypt.genSalt(10);
  
  // Hash the password with the salt
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

module.exports = mongoose.model('User', UserSchema);
