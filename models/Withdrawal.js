const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  method: { 
    type: String, 
    required: true,
    enum: ['JazzCash', 'EasyPaisa', 'Bank Transfer', 'USDT', 'BTC']
  },
  accountNumber: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed'], 
    default: 'pending',
    index: true
  },
  requestedAt: { 
    type: Date, 
    default: Date.now 
  },
  processedAt: { 
    type: Date 
  },
  processedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin' 
  },
  reason: { 
    type: String 
  },
  transactionId: { 
    type: String 
  },
  fees: { 
    type: Number, 
    default: 0 
  },
  netAmount: { 
    type: Number 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  }
}, {
  timestamps: true
});

// Indexes for performance
withdrawalSchema.index({ userId: 1, status: 1 });
withdrawalSchema.index({ createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
