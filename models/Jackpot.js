const mongoose = require('mongoose');

const jackpotSchema = new mongoose.Schema({
  currentAmount: {
    type: Number,
    required: true,
    default: 1000
  },
  minAmount: {
    type: Number,
    required: true,
    default: 1000
  },
  maxAmount: {
    type: Number,
    required: true,
    default: 100000
  },
  contributionRate: {
    type: Number,
    required: true,
    default: 0.01
  },
  winProbability: {
    type: Number,
    required: true,
    default: 0.0001
  },
  lastWinAmount: {
    type: Number,
    default: 0
  },
  lastWinner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastWinDate: {
    type: Date,
    default: null
  },
  totalContributions: {
    type: Number,
    default: 0
  },
  totalWins: {
    type: Number,
    default: 0
  },
  contributions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    gameId: {
      type: String,
      required: true
    },
    gameResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameResult',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  wins: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    gameId: {
      type: String,
      required: true
    },
    gameResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameResult',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
jackpotSchema.index({ lastWinDate: -1 });
jackpotSchema.index({ 'contributions.userId': 1, 'contributions.timestamp': -1 });
jackpotSchema.index({ 'wins.userId': 1, 'wins.timestamp': -1 });

// Static methods
jackpotSchema.statics.getCurrentJackpot = async function() {
  const jackpot = await this.findOne().sort({ createdAt: -1 });
  return jackpot || await this.create({});
};

jackpotSchema.statics.contributeToJackpot = async function(userId, amount, gameId, gameResultId) {
  const jackpot = await this.getCurrentJackpot();
  
  jackpot.currentAmount += amount;
  jackpot.totalContributions += amount;
  
  jackpot.contributions.push({
    userId,
    amount,
    gameId,
    gameResultId
  });
  
  await jackpot.save();
  return jackpot;
};

jackpotSchema.statics.awardJackpot = async function(userId, amount, gameId, gameResultId) {
  const jackpot = await this.getCurrentJackpot();
  
  // Ensure we don't exceed max amount
  const actualAmount = Math.min(amount, jackpot.currentAmount);
  
  jackpot.currentAmount -= actualAmount;
  jackpot.lastWinAmount = actualAmount;
  jackpot.lastWinner = userId;
  jackpot.lastWinDate = new Date();
  jackpot.totalWins += actualAmount;
  
  jackpot.wins.push({
    userId,
    amount: actualAmount,
    gameId,
    gameResultId
  });
  
  await jackpot.save();
  return { jackpot, actualAmount };
};

jackpotSchema.statics.getJackpotHistory = async function(limit = 50) {
  const jackpot = await this.getCurrentJackpot();
  
  return {
    currentAmount: jackpot.currentAmount,
    minAmount: jackpot.minAmount,
    maxAmount: jackpot.maxAmount,
    lastWinAmount: jackpot.lastWinAmount,
    lastWinDate: jackpot.lastWinDate,
    lastWinner: jackpot.lastWinner,
    totalContributions: jackpot.totalContributions,
    totalWins: jackpot.totalWins,
    recentWins: jackpot.wins.slice(-limit).reverse(),
    recentContributions: jackpot.contributions.slice(-limit).reverse()
  };
};

jackpotSchema.statics.getUserJackpotStats = async function(userId) {
  const jackpot = await this.getCurrentJackpot();
  
  const userContributions = jackpot.contributions.filter(c => 
    c.userId.toString() === userId.toString()
  );
  
  const userWins = jackpot.wins.filter(w => 
    w.userId.toString() === userId.toString()
  );
  
  return {
    totalContributed: userContributions.reduce((sum, c) => sum + c.amount, 0),
    totalWon: userWins.reduce((sum, w) => sum + w.amount, 0),
    contributionsCount: userContributions.length,
    winsCount: userWins.length,
    lastContribution: userContributions[userContributions.length - 1],
    lastWin: userWins[userWins.length - 1]
  };
};

module.exports = mongoose.model('Jackpot', jackpotSchema);
