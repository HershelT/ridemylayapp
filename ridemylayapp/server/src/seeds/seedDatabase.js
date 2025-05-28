const mongoose = require('mongoose');
const User = require('../models/User');
const Bet = require('../models/Bet');
const BettingSite = require('../models/BettingSite');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const bcrypt = require('bcryptjs');
const { connectDB, closeDB } = require('../config/db');
const logger = require('../utils/logger');

// Sample data for seeding
const bettingSites = [
  {
    name: 'DraftKings',
    logo: 'https://example.com/draftkings-logo.png',
    url: 'https://draftkings.com',
    isActive: true
  },
  {
    name: 'FanDuel',
    logo: 'https://example.com/fanduel-logo.png',
    url: 'https://fanduel.com',
    isActive: true
  },
  {
    name: 'BetMGM',
    logo: 'https://example.com/betmgm-logo.png',
    url: 'https://betmgm.com',
    isActive: true
  },
  {
    name: 'Caesars',
    logo: 'https://example.com/caesars-logo.png',
    url: 'https://caesars.com',
    isActive: true
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
    odds: '+350',
    stake: 50,
    potentialPayout: 225,
    sport: 'Basketball',
    league: 'NBA',
    status: 'active',
    legs: [
      {
        team: 'Los Angeles Lakers',
        type: 'Moneyline',
        odds: '-110',
        status: 'pending'
      },
      {
        player: 'LeBron James',
        type: 'Over',
        stat: 'Points',
        line: 30.5,
        odds: '-115',
        status: 'pending'
      }
    ]
  },
  {
    title: 'NFL Sunday Special',
    description: 'Chiefs + Bills + Packers all to win',
    odds: '+500',
    stake: 100,
    potentialPayout: 600,
    sport: 'Football',
    league: 'NFL',
    status: 'active',
    legs: [
      {
        team: 'Kansas City Chiefs',
        type: 'Moneyline',
        odds: '-150',
        status: 'pending'
      },
      {
        team: 'Buffalo Bills',
        type: 'Moneyline',
        odds: '-200',
        status: 'pending'
      },
      {
        team: 'Green Bay Packers',
        type: 'Moneyline',
        odds: '+120',
        status: 'pending'
      }
    ]
  },
  {
    title: 'MLB Home Run Prop',
    description: 'Judge & Ohtani both to hit HRs today',
    odds: '+750',
    stake: 25,
    potentialPayout: 212.5,
    sport: 'Baseball',
    league: 'MLB',
    status: 'active',
    legs: [
      {
        player: 'Aaron Judge',
        type: 'To Hit Home Run',
        odds: '+320',
        status: 'pending'
      },
      {
        player: 'Shohei Ohtani',
        type: 'To Hit Home Run',
        odds: '+350',
        status: 'pending'
      }
    ]
  }
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
    logger.info('Seeding users...');
    const userPromises = users.map(async (user) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      return {
        ...user,
        password: hashedPassword,
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
      user: createdUsers[index % createdUsers.length]._id,
      bettingSite: createdSites[index % createdSites.length]._id
    }));
    
    const createdBets = await Bet.insertMany(bets);
    
    // Create comments on bets
    logger.info('Creating comments...');
    const comments = [
      {
        user: createdUsers[1]._id,
        bet: createdBets[0]._id,
        content: 'Great pick! I think Lakers will win for sure.'
      },
      {
        user: createdUsers[2]._id,
        bet: createdBets[0]._id,
        content: 'LeBron has been on fire lately, solid bet!'
      },
      {
        user: createdUsers[0]._id,
        bet: createdBets[1]._id,
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
    await closeDB();
    
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();
