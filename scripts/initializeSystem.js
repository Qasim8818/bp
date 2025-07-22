const mongoose = require('mongoose');
const config = require('../config/db');
const BalanceTrackingService = require('../services/balanceTrackingService');
const PrizePoolService = require('../services/prizePoolService');
const User = require('../models/User');
const UserBalance = require('../models/UserBalance');

async function initializeSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI);
    console.log('Connected to MongoDB');

    // Initialize prize pool
    await PrizePoolService.initializePool();
    console.log('Prize pool initialized');

    // Create test users if they don't exist
    const testUsers = [
      { name: 'Test User 1', email: 'test1@example.com', password: 'password123' },
      { name: 'Test User 2', email: 'test2@example.com', password: 'password123' }
    ];

    for (const userData of testUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.email}`);
      }

      // Initialize user balance
      await BalanceTrackingService.initializeUserBalance(user._id);
      console.log(`Initialized balance for user: ${userData.email}`);
    }

    console.log('System initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing system:', error);
    process.exit(1);
  }
}

// Run initialization
initializeSystem();
