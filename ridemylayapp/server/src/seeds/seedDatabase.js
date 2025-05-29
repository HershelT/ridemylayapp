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
        username: 'basketball_guru',
        email: 'basketball_guru@example.com',
        password: 'password123',
        name: 'James Thompson',
        bio: '🏀 NBA analytics expert | Former college player | 72% win rate on basketball picks',
        profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=basketball_guru',
        isVerified: true,
        role: 'user',
        streak: 9
    },
    {
        username: 'hockey_king',
        email: 'hockey_king@example.com',
        password: 'password123',
        name: 'Alex Petrov',
        bio: '🏒 NHL betting specialist | 10+ years following hockey | Canadian market expert',
        profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=hockey_king',
        isVerified: true,
        role: 'user',
        streak: 4
    },
    {
        username: 'prop_master',
        email: 'prop_master@example.com',
        password: 'password123',
        name: 'Sophia Garcia',
        bio: '🎯 Player prop specialist | Deep statistical analysis | Fantasy sports background',
        profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=prop_master',
        isVerified: true,
        role: 'user',
        streak: 6
    },
    
    {
        username: 'bet_scientist',
        email: 'bet_scientist@example.com',
        password: 'password123',
        name: 'Emma Reynolds',
        bio: '📊 Data-driven bettor | Statistical modeling | Sports analytics researcher',
        profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=bet_scientist',
        isVerified: true,
        role: 'user',
        streak: 7
    },
    {
        username: 'underdog_hunter',
        email: 'underdog@example.com',
        password: 'password123',
        name: 'Marcus Johnson',
        bio: '🐕 Specializing in underdog picks | Finding value in plus money lines',
        profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=underdog_hunter',
        isVerified: true,
        role: 'user',
        streak: -1
    },
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
    selections: [      {
        game: "Miami Heat vs Denver Nuggets",
        pick: "Nuggets -8.5",
        odds: -110,
        status: "won",
        sport: "basketball",
        team: "Denver Nuggets",
        betType: "spread"
      },
      {
        game: "Miami Heat vs Denver Nuggets",
        pick: "Over 219.5",
        odds: -105,
        status: "won",
        sport: "basketball",
        team: "Heat vs Nuggets",
        betType: "over/under"
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
    selections: [      {
        game: "New York Yankees vs Boston Red Sox",
        pick: "Yankees ML",
        odds: -150,
        status: "won",
        sport: "baseball",
        team: "New York Yankees",
        betType: "moneyline"
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
    selections: [      {
        game: "Lakers vs Heat",
        pick: "Lakers ML",
        odds: -110,
        status: "won",
        sport: "basketball",
        team: "Los Angeles Lakers",
        betType: "moneyline"
      },
      {
        game: "Lakers vs Heat",
        pick: "LeBron James Over 30.5 Points",
        odds: -115,
        status: "won",
        sport: "basketball",
        team: "LeBron James",
        betType: "over"
      }
    ],
    status: "won",
    visibility: "public"
  },
  {
        title: 'NHL Stanley Cup Pick',
        description: 'Tampa Bay looking dominant in this matchup. Strong goaltending gives them the edge.',
        type: 'single',
        stake: 75,
        selections: [{
            game: "Tampa Bay Lightning vs New York Rangers",
            pick: "Lightning ML",
            odds: -130,
            status: "won",
            sport: "hockey",
            team: "Tampa Bay Lightning",
            betType: "moneyline"
        }],
        status: "won",
        visibility: "public"
    },
    {
        title: 'MLB Home Run Props',
        description: 'Judge and Ohtani both homering tonight. Power hitters against vulnerable pitching.',
        type: 'parlay',
        stake: 25,
        selections: [
            {
                game: "Yankees vs Red Sox",
                pick: "Aaron Judge to hit a HR",
                odds: 275,
                status: "won",
                sport: "baseball",
                team: "Aaron Judge",
                betType: "player prop"
            },
            {
                game: "Angels vs Mariners",
                pick: "Shohei Ohtani to hit a HR",
                odds: 300,
                status: "lost",
                sport: "baseball",
                team: "Shohei Ohtani",
                betType: "player prop"
            }
        ],
        status: "lost",
        visibility: "public"
    },
    {
        title: 'NBA Player Props Parlay',
        description: 'Focusing on rebounds tonight - both players facing teams weak on the glass.',
        type: 'parlay',
        stake: 50,
        selections: [
            {
                game: "Bucks vs 76ers",
                pick: "Giannis Over 12.5 Rebounds",
                odds: -115,
                status: "won",
                sport: "basketball",
                team: "Giannis Antetokounmpo",
                betType: "over"
            },
            {
                game: "Timberwolves vs Nuggets",
                pick: "Rudy Gobert Over 11.5 Rebounds",
                odds: -125,
                status: "won",
                sport: "basketball",
                team: "Rudy Gobert",
                betType: "over"
            }
        ],
        status: "won",
        visibility: "public"
    },
    {
        title: 'NFL Underdog Special',
        description: 'Dolphins getting too many points here. They match up well against this defense.',
        type: 'single',
        stake: 100,
        selections: [{
            game: "Miami Dolphins vs Buffalo Bills",
            pick: "Dolphins +7.5",
            odds: -110,
            status: "won",
            sport: "football",
            team: "Miami Dolphins",
            betType: "spread"
        }],
        status: "won",
        visibility: "public"
    },
    {
        title: 'Premier League Goals Parlay',
        description: 'Both teams have been scoring freely while conceding regularly. Goals galore expected!',
        type: 'parlay',
        stake: 40,
        selections: [
            {
                game: "Liverpool vs Manchester City",
                pick: "Over 3.5 Goals",
                odds: 140,
                status: "won",
                sport: "soccer",
                team: "Liverpool vs Man City",
                betType: "over/under"
            },
            {
                game: "Arsenal vs Chelsea",
                pick: "Both Teams to Score",
                odds: -130,
                status: "won",
                sport: "soccer",
                team: "Arsenal vs Chelsea",
                betType: "both teams to score"
            }
        ],
        status: "won",
        visibility: "public"
    },
    {
        title: 'Tennis Grand Slam Pick',
        description: 'Djokovic in top form heading into this match. Experience gives him the edge.',
        type: 'single',
        stake: 200,
        selections: [{
            game: "Novak Djokovic vs Carlos Alcaraz",
            pick: "Djokovic ML",
            odds: -150,
            status: "lost",
            sport: "tennis",
            team: "Novak Djokovic",
            betType: "moneyline"
        }],
        status: "lost",
        visibility: "public"
    },
  {
    title: 'NFL Sunday Special',
    description: 'Chiefs + Bills + Packers ML Parlay',
    type: 'parlay',
    stake: 100,
    selections: [      {
        game: "Chiefs vs Raiders",
        pick: "Chiefs ML",
        odds: -150,
        status: "won",
        sport: "football",
        team: "Kansas City Chiefs",
        betType: "moneyline"
      },
      {
        game: "Bills vs Jets",
        pick: "Bills ML",
        odds: -200,
        status: "won",
        sport: "football",
        team: "Buffalo Bills",
        betType: "moneyline"
      },
      {
        game: "Packers vs Bears",
        pick: "Packers ML",
        odds: 120,
        status: "lost",
        sport: "football",
        team: "Green Bay Packers",
        betType: "moneyline"
      }
    ],
    status: "lost",
    visibility: "public"
  },
  
];

// Clear database and seed with new data
const seedDatabase = async () => {
  try {
    await connectDB();

    
    // Clear existing data and HershelT
    logger.info('Clearing existing database data...');
    await Promise.all([
      User.deleteMany({}),      
      Bet.deleteMany({}),
      BettingSite.deleteMany({}),
      Chat.deleteMany({}),
      Message.deleteMany({}),
      Comment.deleteMany({})
    ]);

    // Create HershelT user always
    logger.info('Creating HershelT user...');      
    const email = process.env.EMAIL || 'hershel@example.com'; // Use environment variable or default email
    const password = process.env.PASSWORD || 'defaultPassword123'; // Use environment variable or default password
    
    hershelT = await User.create({
      username: 'hershelt',
      email: email,
      passwordHash: password, // Will be hashed by pre-save middleware
      name: 'Hershel Thomas',
      bio: '🎲 Sports betting enthusiast | Analytics-driven picks | Building RideMyLay',
      profilePicture: 'https://api.dicebear.com/9.x/icons/svg?seed=hershelt',
      isVerified: true,
      role: 'admin',
      streak: 7
    });

    logger.info(`Created HershelT user with ID: ${hershelT._id}, Username: hershelt`);
    
    // Seed betting sites
    logger.info('Seeding betting sites...');
    const createdSites = await BettingSite.insertMany(bettingSites);
    
    // Create HershelT's bets
    logger.info('Creating HershelT\'s bets...');    
    const hersheltBetData = hershelBets.map(bet => {
      // Map selections to legs if they exist
      const legs = bet.selections || bet.legs;
      const { selections, ...betWithoutSelections } = bet;
      
      return {
        ...betWithoutSelections,
        legs: legs,
        userId: hershelT._id,
        bettingSiteId: createdSites[Math.floor(Math.random() * createdSites.length)]._id
      };
    });
    
    const createdHershelBets = await Promise.all(
      hersheltBetData.map(bet => Bet.create(bet))
    );

    // Update HershelT's bet stats
    const hersheltStats = {
      betsCount: createdHershelBets.length,
      wonCount: createdHershelBets.filter(bet => bet.status === 'won').length,
      lostCount: createdHershelBets.filter(bet => bet.status === 'lost').length,
      pendingCount: createdHershelBets.filter(bet => bet.status === 'pending').length
    };
    
    await User.findByIdAndUpdate(hershelT._id, {
      $set: {
        'stats.betsCount': hersheltStats.betsCount,
        'stats.wonCount': hersheltStats.wonCount,
        'stats.lostCount': hersheltStats.lostCount,
        'stats.pendingCount': hersheltStats.pendingCount
      }
    });

    // Seed other users with hashed passwords
    logger.info('Seeding other users...');    
    const userPromises = users.map(async (user) => {
      return {
        ...user,
        passwordHash: user.password, // Will be hashed by pre-save middleware
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
    const otherBetsData = betTemplates.map(bet => {
        // Map selections to legs if they exist
        const legs = bet.selections || bet.legs;
        const { selections, ...betWithoutSelections } = bet;
        return {
            ...betWithoutSelections,
            legs: legs,
            userId: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
            bettingSiteId: createdSites[Math.floor(Math.random() * createdSites.length)]._id
        };
    });
    
    const createdOtherBets = await Promise.all(
      otherBetsData.map(bet => Bet.create(bet))
    );

    // Update all users' bet stats
    const userBets = {};
    [...createdHershelBets, ...createdOtherBets].forEach(bet => {
      if (!userBets[bet.userId]) {
        userBets[bet.userId] = {
          betsCount: 0,
          wonCount: 0,
          lostCount: 0,
          pendingCount: 0
        };
      }
      userBets[bet.userId].betsCount++;
      if
