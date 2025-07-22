const mongoose = require('mongoose');

const userBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Real money deposited by user
  depositedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Winnings from games (not deposited)
  winningsAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Total amount withdrawn by user
  withdrawnAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Current available balance (deposited + winnings - withdrawn)
  currentBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  // Total amount bet across all games
  totalBetAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Total amount won across all games
  totalWinAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Net profit/loss (totalWinAmount - totalBetAmount)
  netProfit: {
    type: Number,
    default: 0
  },
  // Last updated timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for performance
userBalanceSchema.index({ userId: 1 });
userBalanceSchema.index({ currentBalance: 1 });

// Virtual for total lifetime deposits
userBalanceSchema.virtual('totalDeposited').get(function() {
  return this.depositedAmount;
});

// Virtual for total lifetime winnings
userBalanceSchema.virtual('totalWinnings').get(function() {
  return this.winningsAmount;
});

// Virtual for net position (deposited - withdrawn + winnings)
userBalanceSchema.virtual('netPosition').get(function() {
  return this.depositedAmount - this.withdrawnAmount + this.winningsAmount;
});

module.exports = mongoose.model('UserBalance', userBalanceSchema);
