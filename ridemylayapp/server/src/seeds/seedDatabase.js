const mongoose = require('mongoose');
const User = require('../models/User');
const Bet = require('../models/Bet');
const BettingSite = require('../models/BettingSite');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const logger = require('../utils/logger');

// Update the bettingSites array in seedDatabase.js
const bettingSites = [
  {
    name: 'DraftKings',
    logoUrl: 'https://example.com/draftkings-logo.png', // Changed from logo to logoUrl
    websiteUrl: 'https://draftkings.com', // Changed from url to websiteUrl
    apiEndpoint: 'https://api.draftkings.com',
    supportedSports: ['football', 'basketball', 'baseball', 'hockey'],
    isActive: true,
    countryAvailability: ['US']
  },
  {
    name: 'FanDuel',
    logoUrl: 'https://example.com/fanduel-logo.png',
    websiteUrl: 'https://fanduel.com',
    apiEndpoint: 'https://api.fanduel.com',
    supportedSports: ['football', 'basketball', 'baseball', 'hockey'],
    isActive: true,
    countryAvailability: ['US']
  },
  {
    name: 'BetMGM',
    logoUrl: 'https://example.com/betmgm-logo.png',
    websiteUrl: 'https://betmgm.com',
    apiEndpoint: 'https://api.betmgm.com',
    supportedSports: ['football', 'basketball', 'baseball', 'hockey'],
    isActive: true,
    countryAvailability: ['US']
  },
  {
    name: 'Caesars',
    logoUrl: 'https://example.com/caesars-logo.png',
    websiteUrl: 'https://caesars.com',
    apiEndpoint: 'https://api.caesars.com',
    supportedSports: ['football', 'basketball', 'baseball', 'hockey'],
    isActive: true,
    countryAvailability: ['US']
  }
];

const users = [
  {
    username: 'john_bettor',
    email: 'john@example.com',
    password: 'password123',
    name: 'John Smith',
    bio: 'Sports betting enthusiast with a knack for NFL parlays',
    profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
    isVerified: true,
    role: 'user'
  },
  {
    username: 'sarah_wins',
    email: 'sarah@example.com',
    password: 'password123',
    name: 'Sarah Johnson',
    bio: 'NBA specialist. Follow for daily basketball picks!',
    profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg',
    isVerified: true,
    role: 'user'
  },
  {
    username: 'mike_bets',
    email: 'mike@example.com',
    password: 'password123',
    name: 'Mike Wilson',
    bio: 'MLB and NHL picks. 60% win rate lifetime.',
    profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg',
    isVerified: true,
    role: 'user'
  },
  {
    username: 'admin_user',
    email: 'admin@example.com',
    password: 'adminpass123',
    name: 'Admin User',
    bio: 'Site administrator',
    profilePicture: 'https://randomuser.me/api/portraits/men/4.jpg',
    isVerified: true,
    role: 'admin'
  }
];

// Sample bets (will be populated with user IDs after user creation)
const betTemplates = [
  {
    title: 'NBA Finals Parlay',
    description: 'Lakers to win + LeBron over 30 points',
    odds: -110, // Changed from string to number
    stake: 50,
    potentialWinnings: 95.45, // Added required field
    sport: 'basketball', // Changed to lowercase to match enum
    league: 'NBA',
    status: 'pending', // Changed from 'active' to valid enum value
    legs: [
      {
        team: 'Los Angeles Lakers',
        betType: 'moneyline', // Changed from 'type' to 'betType'
        odds: -110,
        outcome: 'pending' // Changed from 'status' to 'outcome'
      },
      {
        team: 'LeBron James', // Player counts as team in schema
        betType: 'over', // Changed from 'type' to 'betType'
        odds: -115,
        outcome: 'pending'
      }
    ]
  },
  {
    title: 'NFL Sunday Special',
    description: 'Chiefs + Bills + Packers all to win',
    odds: 500,
    stake: 100,
    potentialWinnings: 600,
    sport: 'football',
    league: 'NFL',
    status: 'pending',
    legs: [
      {
        team: 'Kansas City Chiefs',
        betType: 'moneyline',
        odds: -150,
        outcome: 'pending'
      },
      {
        team: 'Buffalo Bills',
        betType: 'moneyline',
        odds: -200,
        outcome: 'pending'
      },
      {
        team: 'Green Bay Packers',
        betType: 'moneyline',
        odds: 120,
        outcome: 'pending'
      }
    ]
  },
 {
    title: 'MLB Double Header',
    description: 'Yankees and Dodgers both to win',
    odds: 300,
    stake: 75,
    potentialWinnings: 225,
    sport: 'baseball',
    league: 'MLB',
    status: 'won',
    legs: [
      {
        team: 'New York Yankees',
        betType: 'moneyline',
        odds: -120,
        outcome: 'won'
      },
      {
        team: 'Los Angeles Dodgers',
        betType: 'moneyline',
        odds: -130,
        outcome: 'won'
      }
    ]
    },
];

// Clear database and seed with new data
const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    logger.info('Clearing existing database data...');
    await Promise.all([
      User.deleteMany({}),
      Bet.deleteMany({}),
      BettingSite.deleteMany({}),
      Chat.deleteMany({}),
      Message.deleteMany({}),
      Comment.deleteMany({})
    ]);
    
    // Seed betting sites
    logger.info('Seeding betting sites...');
    const createdSites = await BettingSite.insertMany(bettingSites);
    
    // Seed users with hashed passwords
    // Update the userPromises creation
    logger.info('Seeding users...');
    const userPromises = users.map(async (user) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    return {
        ...user,
        passwordHash: hashedPassword, // Change password to passwordHash
        password: undefined, // Remove the password field
        preferredBettingSites: [createdSites[Math.floor(Math.random() * createdSites.length)]._id]
    };
    });
    
    const createdUsers = await User.create(await Promise.all(userPromises));
    
    // Set up followers
    logger.info('Setting up user relationships...');
    // Make user 1 follow user 2 and 3
    await User.findByIdAndUpdate(createdUsers[0]._id, {
      $push: { following: [createdUsers[1]._id, createdUsers[2]._id] }
    });
    // Update followers for user 2 and 3
    await User.findByIdAndUpdate(createdUsers[1]._id, {
      $push: { followers: createdUsers[0]._id }
    });
    await User.findByIdAndUpdate(createdUsers[2]._id, {
      $push: { followers: createdUsers[0]._id }
    });
    
    // Create bets linked to users
    logger.info('Seeding bets...');
    const bets = betTemplates.map((bet, index) => ({
        ...bet,
        userId: createdUsers[index % createdUsers.length]._id, // Changed from user to userId
        bettingSiteId: createdSites[index % createdSites.length]._id // Changed from bettingSite to bettingSiteId
    }));
    
    const createdBets = await Bet.insertMany(bets);
    
    // Create comments on bets
    logger.info('Creating comments...');
    const comments = [
      {
        userId: createdUsers[1]._id,  // Changed from user to userId
        betId: createdBets[0]._id,    // Changed from bet to betId
        content: 'Great pick! I think Lakers will win for sure.'
      },
      {
        userId: createdUsers[2]._id,   // Changed from user to userId
        betId: createdBets[0]._id,     // Changed from bet to betId
        content: 'LeBron has been on fire lately, solid bet!'
      },
      {
        userId: createdUsers[0]._id,   // Changed from user to userId
        betId: createdBets[1]._id,     // Changed from bet to betId
        content: 'Riding this one with you!'
      }
    ];
    
    const createdComments = await Comment.insertMany(comments);
    
    // Add comments to bets
    await Bet.findByIdAndUpdate(createdBets[0]._id, {
      $push: { comments: { $each: [createdComments[0]._id, createdComments[1]._id] } }
    });
    
    await Bet.findByIdAndUpdate(createdBets[1]._id, {
      $push: { comments: createdComments[2]._id }
    });
    
    // Create a group chat
    logger.info('Creating chat rooms...');
    const groupChat = await Chat.create({
      name: 'NBA Bettors',
      participants: [createdUsers[0]._id, createdUsers[1]._id, createdUsers[2]._id],
      isGroupChat: true,
      admin: createdUsers[0]._id
    });
    
    // Create a direct message chat
    const dmChat = await Chat.create({
      participants: [createdUsers[0]._id, createdUsers[1]._id],
      isGroupChat: false
    });
    
    // Create messages in both chats
    logger.info('Creating messages...');
    const messages = [
      {
        sender: createdUsers[0]._id,
        content: 'Hey everyone, what do you think about the Lakers game tonight?',
        chat: groupChat._id
      },
      {
        sender: createdUsers[1]._id,
        content: 'I think they\'ll cover the spread easily',
        chat: groupChat._id
      },
      {
        sender: createdUsers[0]._id,
        content: 'Hey Sarah, want to ride my Lakers parlay?',
        chat: dmChat._id
      },
      {
        sender: createdUsers[1]._id,
        content: 'Sure, I\'ll join you on that one!',
        chat: dmChat._id
      }
    ];
    
    await Message.insertMany(messages);
    
    // Update some bets with likes and rides
    logger.info('Setting up bet interactions...');
    await Bet.findByIdAndUpdate(createdBets[0]._id, {
      $push: {
        likes: [createdUsers[1]._id, createdUsers[2]._id],
        riders: createdUsers[1]._id
      },
      $inc: { ridesCount: 1, likesCount: 2 }
    });
    
    await Bet.findByIdAndUpdate(createdBets[1]._id, {
      $push: {
        likes: createdUsers[0]._id,
        riders: [createdUsers[0]._id, createdUsers[2]._id]
      },
      $inc: { ridesCount: 2, likesCount: 1 }
    });
    
    logger.info('✅ Database seeded successfully!');
    logger.info(`Created ${createdUsers.length} users`);
    logger.info(`Created ${createdBets.length} bets`);
    logger.info(`Created ${createdComments.length} comments`);
    
    // Disconnect from database
    await mongoose.disconnect();
    
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();
