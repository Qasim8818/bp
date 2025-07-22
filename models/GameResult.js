const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    enum: ['dice', 'coin', 'number', 'color', 'roulette', 'crash'],
    required: true
  },
  betAmount: {
    type: Number,
    required: true,
    min: 0
  },
  chosenValue: {
    type: String,
    required: true
  },
  resultValue: {
    type: String,
    required: true
  },
  winAmount: {
    type: Number,
    default: 0
  },
  multiplier: {
    type: Number,
    default: 1
  },
  isWin: {
    type: Boolean,
    required: true
  },
  gameHash: {
    type: String,
    required: true
  },
  nonce: {
    type: Number,
    required: true
  },
  serverSeed: {
    type: String,
    required: true
  },
  clientSeed: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GameResult', gameResultSchema);
