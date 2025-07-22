const mongoose = require('mongoose');

const prizePoolSchema = new mongoose.Schema({
  poolName: {
    type: String,
    required: true,
    unique: true,
    enum: ['main_prize_pool', 'jackpot_pool', 'tournament_pool']
  },
  currentBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalContributions: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPayouts: {
    type: Number,
    default: 0,
    min: 0
  },
  contributionRate: {
    type: Number,
    default: 0.05,
    min: 0,
    max: 1
  },
  minimumBalance: {
    type: Number,
    default: 100
  },
  maximumPayout: {
    type: Number,
    default: 10000
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'maintenance'],
    default: 'active'
  },
  lastAdjustment: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Virtual for net balance
prizePoolSchema.virtual('netBalance').get(function() {
  return this.totalContributions - this.totalPayouts;
});

// Virtual for utilization rate
prizePoolSchema.virtual('utilizationRate').get(function() {
  return this.totalContributions > 0 ? (this.totalPayouts / this.totalContributions) * 100 : 0;
});

// Instance methods
prizePoolSchema.methods.canAfford = function(amount) {
  return this.currentBalance >= amount && amount <= this.maximumPayout;
};

prizePoolSchema.methods.addContribution = function(amount) {
  this.currentBalance += amount;
  this.totalContributions += amount;
  this.lastAdjustment = new Date();
  return this.save();
};

prizePoolSchema.methods.makePayout = function(amount) {
  if (!this.canAfford(amount)) {
    throw new Error('Insufficient balance or exceeds maximum payout');
  }
  
  this.currentBalance -= amount;
  this.totalPayouts += amount;
  this.lastAdjustment = new Date();
  return this.save();
};

module.exports = mongoose.model('PrizePool', prizePoolSchema);
