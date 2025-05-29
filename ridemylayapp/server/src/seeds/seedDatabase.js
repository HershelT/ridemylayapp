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

// Sample bets (will be populated with user IDs after user creation)
const betTemplates = [
  {    title: 'NBA Finals Parlay',
    description: 'Lakers to win + LeBron over 30 points',
    odds: 257,
    stake: 50,
    potentialWinnings: 128.35,
    sport: 'basketball',
    league: 'NBA',
    status: 'won',
    legs: [
      {
        team: 'Los Angeles Lakers',
        betType: 'moneyline',
        odds: -110,
        outcome: 'won'
      },
      {
        team: 'LeBron James',
        betType: 'over',
        odds: -115,
        outcome: 'won'
      }
    ]
  },
  {    title: 'NFL Sunday Special',
    description: 'Chiefs + Bills + Packers all to win',
    odds: 275,
    stake: 100,
    potentialWinnings: 275,
    sport: 'football',
    league: 'NFL',
    status: 'lost',
    legs: [
      {
        team: 'Kansas City Chiefs',
        betType: 'moneyline',
        odds: -150,
        outcome: 'won'
      },
      {
        team: 'Buffalo Bills',
        betType: 'moneyline',
        odds: -200,
        outcome: 'won'
      },
      {
        team: 'Green Bay Packers',
        betType: 'moneyline',
        odds: 120,
        outcome: 'lost'
      }
    ]
  },
  {    title: 'MLB Double Header',
    description: 'Yankees and Dodgers both to win',
    odds: 224,
    stake: 75,
    potentialWinnings: 168.08,
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
  {    title: 'Premier League Accumulator',
    description: 'Manchester City, Arsenal, Liverpool all to win',
    odds: 379,
    stake: 50,
    potentialWinnings: 189.50,
    sport: 'soccer',
    league: 'Premier League',
    status: 'pending',
    legs: [
      {
        team: 'Manchester City',
        betType: 'moneyline',
        odds: -150,
        outcome: 'pending'
      },
      {
        team: 'Arsenal',
        betType: 'moneyline',
        odds: -130,
        outcome: 'pending'
      },
      {
        team: 'Liverpool',
        betType: 'moneyline',
        odds: -160,
        outcome: 'pending'
      }
    ]
  },
  {    title: 'NHL Playoff Special',
    description: 'Bruins to win + Total goals over 5.5',
    odds: 238,
    stake: 100,
    potentialWinnings: 238,
    sport: 'hockey',
    league: 'NHL',
    status: 'lost',
    legs: [
      {
        team: 'Boston Bruins',
        betType: 'moneyline',
        odds: -130,
        outcome: 'lost'
      },
      {
        team: 'Game Total',
        betType: 'over',
        odds: -110,
        outcome: 'won'
      }
    ]
  },
  {    title: 'NBA Player Props Parlay',
    description: 'Curry 25+ points, Jokic triple-double, Tatum 30+ points',
    odds: 711,
    stake: 50,
    potentialWinnings: 355.50,
    sport: 'basketball',
    league: 'NBA',
    status: 'pending',
    legs: [
      {
        team: 'Stephen Curry',
        betType: 'over',
        odds: -120,
        outcome: 'pending'
      },
      {
        team: 'Nikola Jokic',
        betType: 'special',
        odds: 200,
        outcome: 'pending'
      },
      {
        team: 'Jayson Tatum',
        betType: 'over',
        odds: -110,
        outcome: 'pending'
      }
    ]
  },
  {    title: 'UFC Fight Night Parlay',
    description: 'Main Event + Co-Main Winners',
    odds: 143,
    stake: 100,
    potentialWinnings: 143,
    sport: 'mma',
    league: 'UFC',
    status: 'won',
    legs: [
      {
        team: 'Israel Adesanya',
        betType: 'moneyline',
        odds: -200,
        outcome: 'won'
      },
      {
        team: 'Alex Pereira',
        betType: 'moneyline',
        odds: -150,
        outcome: 'won'
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
      User.deleteMany({ username: { $ne: 'hershelt' } }),
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
        userId: createdUsers[1]._id,
        betId: createdBets[0]._id,
        content: 'Great pick! I think Lakers will win for sure.'
      },
      {
        userId: createdUsers[2]._id,
        betId: createdBets[0]._id,
        content: 'LeBron has been on fire lately, solid bet!'
      },
      {
        userId: createdUsers[0]._id,
        betId: createdBets[1]._id,
        content: 'Riding this one with you!'
      },
      {
        userId: createdUsers[4]._id,
        betId: createdBets[3]._id,
        content: 'As a Premier League expert, I love this accumulator. Manchester City is in great form!'
      },
      {
        userId: createdUsers[5]._id,
        betId: createdBets[3]._id,
        content: 'Tailing this! The odds are too good to pass up.'
      },
      {
        userId: createdUsers[6]._id,
        betId: createdBets[5]._id,
        content: 'Based on my statistical analysis, Curry has hit 25+ in 80% of his last 20 games. Strong prop!'
      },
      {
        userId: createdUsers[3]._id,
        betId: createdBets[5]._id,
        content: 'Great research! Adding this to my picks.'
      },
      {
        userId: createdUsers[7]._id,
        betId: createdBets[4]._id,
        content: 'Tough loss on the Bruins bet. They were dominating but couldn\'t finish.'
      },
      {
        userId: createdUsers[2]._id,
        betId: createdBets[4]._id,
        content: 'Yeah, hockey can be unpredictable. At least the over hit!'
      },
      {
        userId: createdUsers[1]._id,
        betId: createdBets[6]._id,
        content: 'UFC parlays are risky but this one looks solid!'
      },
      {
        userId: createdUsers[5]._id,
        betId: createdBets[6]._id,
        content: 'Agreed! Both fighters are in great form. BOL!'
      }
    ];
    
    const createdComments = await Comment.insertMany(comments);
    
    // Add comments to bets with more complex relationships
    await Bet.findByIdAndUpdate(createdBets[0]._id, {
      $push: { comments: { $each: [createdComments[0]._id, createdComments[1]._id] } }
    });
    
    await Bet.findByIdAndUpdate(createdBets[1]._id, {
      $push: { comments: createdComments[2]._id }
    });

    await Bet.findByIdAndUpdate(createdBets[3]._id, {
      $push: { comments: { $each: [createdComments[3]._id, createdComments[4]._id] } }
    });

    await Bet.findByIdAndUpdate(createdBets[5]._id, {
      $push: { comments: { $each: [createdComments[5]._id, createdComments[6]._id] } }
    });

    await Bet.findByIdAndUpdate(createdBets[4]._id, {
      $push: { comments: { $each: [createdComments[7]._id, createdComments[8]._id] } }
    });

    await Bet.findByIdAndUpdate(createdBets[6]._id, {
      $push: { comments: { $each: [createdComments[9]._id, createdComments[10]._id] } }
    });
    
    // Create chat rooms
    logger.info('Creating chat rooms...');
    const chats = [
      {
        name: 'NBA Bettors',
        participants: [
          createdUsers[0]._id, 
          createdUsers[1]._id, 
          createdUsers[2]._id,
          createdUsers[6]._id // stats_master
        ],
        isGroupChat: true,
        admin: createdUsers[0]._id
      },
      {
        name: 'Premier League Tips',
        participants: [
          createdUsers[7]._id, // soccer_expert
          createdUsers[4]._id, // vegas_insider
          createdUsers[5]._id // parlay_queen
        ],
        isGroupChat: true,
        admin: createdUsers[7]._id
      },
      {
        name: 'VIP Picks',
        participants: [
          createdUsers[4]._id, // vegas_insider
          createdUsers[5]._id, // parlay_queen
          createdUsers[6]._id, // stats_master
          createdUsers[7]._id  // soccer_expert
        ],
        isGroupChat: true,
        admin: createdUsers[4]._id
      },
      {
        participants: [createdUsers[0]._id, createdUsers[1]._id],
        isGroupChat: false
      },
      {
        participants: [createdUsers[4]._id, createdUsers[7]._id],
        isGroupChat: false
      }
    ];

    const createdChats = await Chat.create(chats);

    // Create messages in chats
    logger.info('Creating messages...');
    const messages = [
      {
        sender: createdUsers[0]._id,
        content: 'Hey everyone, what do you think about the Lakers game tonight?',
        chat: createdChats[0]._id
      },
      {
        sender: createdUsers[1]._id,
        content: 'I think they\'ll cover the spread easily',
        chat: createdChats[0]._id
      },
      {
        sender: createdUsers[6]._id,
        content: 'According to my models, Lakers have a 65% chance to cover',
        chat: createdChats[0]._id
      },
      {
        sender: createdUsers[7]._id,
        content: 'Manchester City vs Arsenal this weekend - who\'s betting?',
        chat: createdChats[1]._id
      },
      {
        sender: createdUsers[4]._id,
        content: 'City at home is almost automatic. Adding to my card.',
        chat: createdChats[1]._id
      },
      {
        sender: createdUsers[4]._id,
        content: 'New VIP pick posted - check the analysis in the thread',
        chat: createdChats[2]._id
      },
      {
        sender: createdUsers[6]._id,
        content: 'The stats support this pick 100%. Great find!',
        chat: createdChats[2]._id
      },
      {
        sender: createdUsers[0]._id,
        content: 'Hey Sarah, want to ride my Lakers parlay?',
        chat: createdChats[3]._id
      },
      {
        sender: createdUsers[1]._id,
        content: 'Sure, I\'ll join you on that one!',
        chat: createdChats[3]._id
      },
      {
        sender: createdUsers[4]._id,
        content: 'Got some insider info on the Premier League matches',
        chat: createdChats[4]._id
      },
      {
        sender: createdUsers[7]._id,
        content: 'Perfect timing, I was just analyzing those games',
        chat: createdChats[4]._id
      }
    ];
    
    await Message.insertMany(messages);
    
    // Update bets with likes and rides
    logger.info('Setting up bet interactions...');
    
    // Popular NBA bet with multiple interactions
    await Bet.findByIdAndUpdate(createdBets[0]._id, {
      $push: {
        likes: [createdUsers[1]._id, createdUsers[2]._id, createdUsers[6]._id],
        riders: [createdUsers[1]._id, createdUsers[5]._id]
      },
      $inc: { ridesCount: 2, likesCount: 3 }
    });
    
    // NFL bet with medium engagement
    await Bet.findByIdAndUpdate(createdBets[1]._id, {
      $push: {
        likes: [createdUsers[0]._id, createdUsers[4]._id],
        riders: [createdUsers[0]._id, createdUsers[2]._id, createdUsers[3]._id]
      },
      $inc: { ridesCount: 3, likesCount: 2 }
    });

    // Premier League bet with high engagement
    await Bet.findByIdAndUpdate(createdBets[3]._id, {
      $push: {
        likes: [createdUsers[4]._id, createdUsers[5]._id, createdUsers[6]._id, createdUsers[7]._id],
        riders: [createdUsers[5]._id, createdUsers[6]._id, createdUsers[7]._id]
      },
      $inc: { ridesCount: 3, likesCount: 4 }
    });

    // NBA Player Props with medium engagement
    await Bet.findByIdAndUpdate(createdBets[5]._id, {
      $push: {
        likes: [createdUsers[1]._id, createdUsers[3]._id, createdUsers[6]._id],
        riders: [createdUsers[1]._id, createdUsers[6]._id]
      },
      $inc: { ridesCount: 2, likesCount: 3 }
    });

    // UFC bet with high engagement
    await Bet.findByIdAndUpdate(createdBets[6]._id, {
      $push: {
        likes: [createdUsers[0]._id, createdUsers[2]._id, createdUsers[4]._id, createdUsers[5]._id],
        riders: [createdUsers[2]._id, createdUsers[4]._id, createdUsers[5]._id]
      },
      $inc: { ridesCount: 3, likesCount: 4 }
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
