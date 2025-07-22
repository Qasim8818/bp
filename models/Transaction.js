// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['deposit', 'withdraw', 'bet', 'win'], required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['easypaisa', 'jazzcash', null] }, // for deposits
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  reference: { type: String }, // txn ID or phone number
  proofImageUrl: { type: String }, // optional screenshot
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
