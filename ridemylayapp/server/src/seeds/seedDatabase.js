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
    logoUrl: 'https://th.bing.com/th/id/R.5df99c707ab2ad4af852a29bfc924b49?rik=hlYUsMH5kvdPlw&pid=ImgRaw&r=0', // Changed from logo to logoUrl
    websiteUrl: 'https://draftkings.com', // Changed from url to websiteUrl
    apiEndpoint: 'https://api.draftkings.com',
    supportedSports: ['football', 'basketball', 'baseball', 'hockey'],
    isActive: true,
    countryAvailability: ['US']
  },
  {
    name: 'FanDuel',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2024/10/FanDuel-Logo-500x281.png',
    websiteUrl: 'https://fanduel.com',
    apiEndpoint: 'https://api.fanduel.com',
    supportedSports: ['football', 'basketball', 'baseball', 'hockey'],
    isActive: true,
    countryAvailability: ['US']
  },
  {
    name: 'BetMGM',
    logoUrl: 'https://www.odds.com/cms/wp-content/uploads/2020/04/logo_large_betmgm@2x.png',
    websiteUrl: 'https://betmgm.com',
    apiEndpoint: 'https://api.betmgm.com',
    supportedSports: ['football', 'basketball', 'baseball', 'hockey'],
    isActive: true,
    countryAvailability: ['US']
  },
  {
    name: 'Caesars',
    logoUrl: 'https://companieslogo.com/img/orig/CZR-be64a80f.png?t=1673235343',
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
    profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=john_bettor',
    isVerified: true,
    role: 'user',
    streak: 3
  },
  {
    username: 'sarah_wins',
    email: 'sarah@example.com',
    password: 'password123',
    name: 'Sarah Johnson',
    bio: 'NBA specialist. Follow for daily basketball picks!',
    profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=sarah_wins',
    isVerified: true,
    role: 'user',
    streak: 5
  },
  {
    username: 'mike_bets',
    email: 'mike@example.com',
    password: 'password123',
    name: 'Mike Wilson',
    bio: 'MLB and NHL picks. 60% win rate lifetime.',
    profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=mike_bets',
    isVerified: true,
    role: 'user',
    streak: -2
  },
  {
    username: 'admin_user',
    email: 'admin@example.com',
    password: 'adminpass123',
    name: 'Admin User',
    bio: 'Site administrator',
    profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=admin_user',
    isVerified: true,
    role: 'admin',
    streak: 0
  },
  {
    username: 'vegas_insider',
    email: 'vegas@example.com',
    password: 'password123',
    name: 'Tom Vegas',
    bio: '🎲 Professional Sports Bettor | 15 years experience | VIP picks available',
    profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=vegas_insider',
    isVerified: true,
    role: 'user',
    streak: 8
  },
  {
    username: 'parlay_queen',
    email: 'ashley@example.com',
    password: 'password123',
    name: 'Ashley Parker',
    bio: '👑 Parlay Specialist | 70% hit rate on 3+ leg parlays',
    profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=parlay_queen',
    isVerified: true,
    role: 'user',
    streak: 4
  },
  {
    username: 'stats_master',
    email: 'david@example.com',
    password: 'password123',
    name: 'David Chen',
    bio: '📊 Data Analyst | Sports Betting Analytics | Mathematical approach to betting',
    profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=stats_master',
    isVerified: true,
    role: 'user',
    streak: 2
  },
  {
    username: 'soccer_expert',
    email: 'maria@example.com',
    password: 'password123',
    name: 'Maria Rodriguez',
    bio: '⚽ European Soccer Specialist | Premier League & La Liga Expert',
    profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=soccer_expert',
    isVerified: true,
    role: 'user',
    streak: 6
  }
];

// HershelT's pre-existing bets
const hershelBets = [
  {
    type: 'parlay',
    stake: 100,
    title: "NBA Finals Parlay Special",
    description: "Heat vs Nuggets Game 1 parlay. Feeling confident about these picks! 🏀",
    selections: [
      {
        game: "Miami Heat vs Denver Nuggets",
        pick: "Nuggets -8.5",
        odds: -110,
        status: "won"
      },
      {
        game: "Miami Heat vs Denver Nuggets",
        pick: "Over 219.5",
        odds: -105,
        status: "won"
      }
    ],
    status: "won",
    visibility: "public",
    createdAt: new Date('2023-06-01T20:00:00Z')
  },
  {
    type: 'single',
    stake: 50,
    title: "MLB Value Pick",
    description: "Yankees looking strong tonight. Great value at these odds! ⚾",
    selections: [
      {
        game: "New York Yankees vs Boston Red Sox",
        pick: "Yankees ML",
        odds: -150,
        status: "won"
      }
    ],
    status: "won",
    visibility: "public",
    createdAt: new Date('2023-06-03T23:00:00Z')
  }
];

// Sample bets (will be populated with user IDs after user creation)
const betTemplates = [
  {
    title: 'NBA Finals Parlay',
    description: 'Lakers to win + LeBron over 30 points',
    type: 'parlay',
    stake: 50,
    selections: [
      {
        game: "Lakers vs Heat",
        pick: "Lakers ML",
        odds: -110,
        status: "won"
      },
      {
        game: "Lakers vs Heat",
        pick: "LeBron James Over 30.5 Points",
        odds: -115,
        status: "won"
      }
    ],
    status: "won",
    visibility: "public"
  },
  {
    title: 'NFL Sunday Special',
    description: 'Chiefs + Bills + Packers ML Parlay',
    type: 'parlay',
    stake: 100,
    selections: [
      {
        game: "Chiefs vs Raiders",
        pick: "Chiefs ML",
        odds: -150,
        status: "won"
      },
      {
        game: "Bills vs Jets",
        pick: "Bills ML",
        odds: -200,
        status: "won"
      },
      {
        game: "Packers vs Bears",
        pick: "Packers ML",
        odds: 120,
        status: "lost"
      }
    ],
    status: "lost",
    visibility: "public"
  }
];

// Clear database and seed with new data
const seedDatabase = async () => {
  try {
    await connectDB();

    // Get existing HershelT user or create if doesn't exist
    logger.info('Finding or creating HershelT user...');
    let hershelT = await User.findOne({ username: 'hershelt' });
    if (!hershelT) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('your-secure-password', salt);
      hershelT = await User.create({
        username: 'hershelt',
        email: 'hershel@example.com',
        passwordHash: hashedPassword,
        name: 'Hershel T',
        bio: '🎲 Sports betting enthusiast | Analytics-driven picks | Building RideMyLay',
        profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=hershelt',
        isVerified: true,
        role: 'admin',
        streak: 7
      });
    }

    // Clear existing data except HershelT
    logger.info('Clearing existing database data...');
    await Promise.all([
      User.deleteMany({ username: { $ne: 'hershelt' } }),
      Bet.deleteMany({ userId: { $ne: hershelT._id } }),
      BettingSite.deleteMany({}),
      Chat.deleteMany({}),
      Message.deleteMany({}),
      Comment.deleteMany({})
    ]);
    
    // Seed betting sites
    logger.info('Seeding betting sites...');
    const createdSites = await BettingSite.insertMany(bettingSites);
    
    // Create HershelT's bets
    logger.info('Creating HershelT\'s bets...');
    const hersheltBetData = hershelBets.map(bet => ({
      ...bet,
      userId: hershelT._id,
      bettingSiteId: createdSites[Math.floor(Math.random() * createdSites.length)]._id
    }));
    const createdHershelBets = await Promise.all(
      hersheltBetData.map(bet => Bet.create(bet))
    );

    // Seed other users with hashed passwords
    logger.info('Seeding other users...');
    const userPromises = users.map(async (user) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      return {
        ...user,
        passwordHash: hashedPassword,
        password: undefined,
        preferredBettingSites: [createdSites[Math.floor(Math.random() * createdSites.length)]._id]
      };
    });
    
    const createdUsers = await User.create(await Promise.all(userPromises));
    
    // Set up followers for HershelT
    logger.info('Setting up HershelT\'s relationships...');
    const followerIds = [createdUsers[0]._id, createdUsers[1]._id, createdUsers[4]._id];
    const followingIds = [createdUsers[4]._id, createdUsers[5]._id];
    
    await User.findByIdAndUpdate(hershelT._id, {
      $push: {
        followers: followerIds,
        following: followingIds
      }
    });

    // Update followers' following list
    await Promise.all(followerIds.map(id => 
      User.findByIdAndUpdate(id, {
        $push: { following: hershelT._id }
      })
    ));

    // Update following users' followers list
    await Promise.all(followingIds.map(id =>
      User.findByIdAndUpdate(id, {
        $push: { followers: hershelT._id }
      })
    ));

    // Create bets for other users
    logger.info('Creating bets for other users...');
    const otherBetsData = betTemplates.map((bet, index) => ({
      ...bet,
      userId: createdUsers[index % createdUsers.length]._id,
      bettingSiteId: createdSites[index % createdSites.length]._id
    }));
    
    const createdOtherBets = await Promise.all(
      otherBetsData.map(bet => Bet.create(bet))
    );

    const allBets = [...createdHershelBets, ...createdOtherBets];
    
    // Create comments
    logger.info('Creating comments...');
    const commentsData = [
      {
        userId: createdUsers[0]._id,
        betId: createdHershelBets[0]._id,
        content: 'Great analysis on this Nuggets game! Tailing 🔥'
      },
      {
        userId: createdUsers[1]._id,
        betId: createdHershelBets[0]._id,
        content: 'This parlay hit perfectly. Your NBA picks are solid!'
      },
      {
        userId: hershelT._id,
        betId: createdOtherBets[0]._id,
        content: 'Love this Lakers play. LeBron has been unstoppable lately.'
      }
    ];
    
    const createdComments = await Comment.insertMany(commentsData);
    
    // Add comments to bets
    await Promise.all([
      Bet.findByIdAndUpdate(createdHershelBets[0]._id, {
        $push: { comments: { $each: [createdComments[0]._id, createdComments[1]._id] } }
      }),
      Bet.findByIdAndUpdate(createdOtherBets[0]._id, {
        $push: { comments: createdComments[2]._id }
      })
    ]);

    // Create chat rooms
    logger.info('Creating chat rooms...');
    const chats = [
      {
        name: 'NBA Discussion',
        participants: [
          hershelT._id,
          createdUsers[0]._id,
          createdUsers[1]._id,
          createdUsers[4]._id
        ],
        isGroupChat: true,
        admin: hershelT._id
      },
      {
        participants: [hershelT._id, createdUsers[4]._id],
        isGroupChat: false
      }
    ];

    const createdChats = await Chat.create(chats);

    // Create messages
    logger.info('Creating messages...');
    const messages = [
      {
        sender: hershelT._id,
        content: 'What do you all think about the Nuggets spread tonight?',
        chat: createdChats[0]._id
      },
      {
        sender: createdUsers[0]._id,
        content: 'I really like it. Home court advantage will be huge.',
        chat: createdChats[0]._id
      },
      {
        sender: hershelT._id,
        content: 'Hey, got any good MLB picks today?',
        chat: createdChats[1]._id
      },
      {
        sender: createdUsers[4]._id,
        content: 'Yankees looking strong, check my latest post',
        chat: createdChats[1]._id
      }
    ];
    
    await Message.insertMany(messages);
    
    // Add likes and rides to HershelT's bets
    logger.info('Setting up bet interactions...');
    
    // NBA Finals Parlay interactions
    await Bet.findByIdAndUpdate(createdHershelBets[0]._id, {
      $push: {
        likes: [createdUsers[0]._id, createdUsers[1]._id, createdUsers[4]._id],
        riders: [createdUsers[0]._id, createdUsers[4]._id]
      },
      $inc: { ridesCount: 2, likesCount: 3 }
    });
    
    // MLB Value Pick interactions
    await Bet.findByIdAndUpdate(createdHershelBets[1]._id, {
      $push: {
        likes: [createdUsers[1]._id, createdUsers[4]._id],
        riders: [createdUsers[1]._id]
      },
      $inc: { ridesCount: 1, likesCount: 2 }
    });

    logger.info('✅ Database seeded successfully!');
    logger.info(`Created ${createdUsers.length + 1} users (including HershelT)`);
    logger.info(`Created ${allBets.length} bets`);
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
