const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true },
  messages: [
    {
      sender: { type: String, enum: ['user', 'admin'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    }
  ],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

// Already added earlier models: User, Admin, Transaction, Promo

// Ticket (Support)
const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  message: String,
  response: String,
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
});
const Ticket = mongoose.model('Ticket', ticketSchema);

// Game Result (for stats/leaderboard)
const gameResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  game: String, // e.g. "slots", "crash"
  betAmount: Number,
  winAmount: Number,
  createdAt: { type: Date, default: Date.now },
});
const GameResult = mongoose.model('GameResult', gameResultSchema);


module.exports = mongoose.model('SupportTicket', supportTicketSchema);
