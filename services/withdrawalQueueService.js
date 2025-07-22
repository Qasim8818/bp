const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const EventEmitter = require('events');

class WithdrawalQueueService extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 1;
    this.activeJobs = 0;
  }

  async addToQueue(withdrawalId) {
    this.queue.push(withdrawalId);
    this.emit('jobAdded', withdrawalId);
    
    if (!this.processing) {
      this.startProcessing();
    }
  }

  async startProcessing() {
    if (this.processing || this.activeJobs >= this.maxConcurrent) {
      return;
    }

    this.processing = true;
    
    while (this.queue.length > 0 && this.activeJobs < this.maxConcurrent) {
      const withdrawalId = this.queue.shift();
      this.activeJobs++;
      
      this.processWithdrawal(withdrawalId)
        .then(() => {
          this.emit('jobCompleted', withdrawalId);
        })
        .catch(error => {
          this.emit('jobFailed', withdrawalId, error);
        })
        .finally(() => {
          this.activeJobs--;
        });
    }

    this.processing = false;
  }

  async processWithdrawal(withdrawalId) {
    try {
      const withdrawal = await Withdrawal.findById(withdrawalId)
        .populate('userId', 'email username balance');

      if (!withdrawal) {
        throw new Error('Withdrawal not found');
      }

      if (withdrawal.status !== 'approved') {
        throw new Error('Withdrawal not approved');
      }

      // Update status to processing
      withdrawal.status = 'processing';
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      // Simulate external payout processing
      const transactionId = await this.processExternalPayout(withdrawal);

      // Update withdrawal as completed
      withdrawal.status = 'completed';
      withdrawal.transactionId = transactionId;
      await withdrawal.save();

      // Log completion transaction
      await Transaction.create({
        userId: withdrawal.userId,
        type: 'withdrawal_completed',
        amount: -withdrawal.amount,
        status: 'completed',
        description: `Withdrawal completed via ${withdrawal.method}`,
        metadata: {
          withdrawalId: withdrawal._id,
          transactionId,
          method: withdrawal.method,
          accountNumber: withdrawal.accountNumber
        }
      });

      this.emit('withdrawalCompleted', withdrawal);

    } catch (error) {
      console.error('Error processing withdrawal:', error);
      
      // Update withdrawal as failed
      await Withdrawal.findByIdAndUpdate(withdrawalId, {
        status: 'failed',
        reason: error.message
      });

      // Refund user balance
      const withdrawal = await Withdrawal.findById(withdrawalId);
      if (withdrawal) {
        const user = await User.findById(withdrawal.userId);
        user.balance += withdrawal.amount;
        await user.save();

        await Transaction.create({
          userId: withdrawal.userId,
          type: 'withdrawal_failed',
          amount: withdrawal.amount,
          status: 'completed',
          description: 'Withdrawal failed - amount refunded',
          metadata: {
            withdrawalId: withdrawal._id,
            error: error.message
          }
        });
      }

      throw error;
    }
  }

  async processExternalPayout(withdrawal) {
    // This would integrate with actual payment providers
    // For now, we'll simulate the process
    
    const providers = {
      'JazzCash': this.processJazzCashPayout,
      'EasyPaisa': this.processEasyPaisaPayout,
      'Bank Transfer': this.processBankTransfer,
      'USDT': this.processUSDTPayout,
      'BTC': this.processBTCPayout
    };

    const processor = providers[withdrawal.method];
    if (!processor) {
      throw new Error(`Unsupported payment method: ${withdrawal.method}`);
    }

    return await processor.call(this, withdrawal);
  }

  async processJazzCashPayout(withdrawal) {
    // Simulate JazzCash API integration
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `JC${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  async processEasyPaisaPayout(withdrawal) {
    // Simulate EasyPaisa API integration
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `EP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  async processBankTransfer(withdrawal) {
    // Simulate Bank Transfer processing
    await new Promise(resolve => setTimeout(resolve, 5000));
    return `BT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  async processUSDTPayout(withdrawal) {
    // Simulate USDT blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 3000));
    return `USDT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  async processBTCPayout(withdrawal) {
    // Simulate BTC blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 6000));
    return `BTC${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs,
      maxConcurrent: this.maxConcurrent,
      isProcessing: this.processing
    };
  }

  async getPendingWithdrawals() {
    return await Withdrawal.find({ status: 'approved' })
      .populate('userId', 'email username')
      .sort({ createdAt: 1 });
  }
}

module.exports = new WithdrawalQueueService();
