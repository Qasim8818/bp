// models/User.js

const mongoose = require('mongoose');
const { nanoid } = require('nanoid'); // ✅ Import nanoid for referralCode

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  balance: {
    type: Number,
    default: 0
  },
  wallet: {
    type: String,
    default: null
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  referralCode: {
    type: String,
    unique: true,
    default: () => nanoid(8) // generates a unique 8-character code
  },
  referredBy: {
    type: String, // Stores the referral code of the referring user
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
