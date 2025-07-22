const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  replies: [
    {
      sender: { type: String, enum: ['user', 'admin'], required: true },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  closedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
