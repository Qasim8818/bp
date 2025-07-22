const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  refereeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  referralCode: {
    type: String,
    required: true
  },
  signupBonus: {
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'credited'], default: 'credited' }
  },
  playBonus: {
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'credited'], default: 'pending' },
    triggeredAt: Date
  },
  totalBonus: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
referralSchema.index({ referrerId: 1, createdAt: -1 });
referralSchema.index({ refereeId: 1 });

module.exports = mongoose.model('Referral', referralSchema);
