# Financial Tracking System Documentation

## Overview
This system provides comprehensive tracking of deposits, winnings, and withdrawals with proper prize pool management. It ensures accurate accounting of user balances and system profitability.

## Key Features

### 1. User Balance Tracking
- **Deposited Amount**: Real money deposited by users
- **Winnings Amount**: Money won from games (not deposited)
- **Withdrawn Amount**: Total amount withdrawn by users
- **Current Balance**: Available balance (deposited + winnings - withdrawn)
- **Net Profit**: Total wins - total bets across all games

### 2. Prize Pool Management
- **Current Balance**: Active prize pool amount
- **Total Contributions**: All contributions from game losses
- **Total Payouts**: All payouts from game wins
- **Contribution Rate**: Percentage of each bet that goes to prize pool

### 3. Transaction History
- Complete audit trail of all financial activities
- Separate tracking for deposits, withdrawals, bets, and wins
- Real-time balance updates

### 4. Admin Dashboard
- Real-time financial overview
- Top players by balance
- Daily transaction statistics
- System profit reports

## Models

### UserBalance
```javascript
{
  userId: ObjectId,
  depositedAmount: Number,    // Real money deposited
  winningsAmount: Number,     // Money won from games
  withdrawnAmount: Number,    // Total withdrawn
  currentBalance: Number,     // Available balance
  totalBetAmount: Number,     // Total bets placed
  totalWinAmount: Number,     // Total wins received
  netProfit: Number          // Net profit/loss
}
```

### Transaction
```javascript
{
  userId: ObjectId,
  type: 'deposit' | 'withdrawal' | 'bet' | 'win',
  amount: Number,
  status: 'pending' | 'completed' | 'failed',
  reference: String,
  description: String
}
```

## API Endpoints

### User Endpoints
- `GET /api/games/balance` - Get user balance and financial summary
- `GET /api/games/history` - Get game history with balance tracking

### Admin Endpoints
- `GET /api/admin/dashboard` - Get comprehensive dashboard data
- `GET /api/admin/financial/top-players` - Get top players by balance
- `GET /api/admin/financial/system-profit` - Get system profit report
- `GET /api/admin/financial/user/:userId` - Get detailed user financial data

## Usage Examples

### Recording a Deposit
```javascript
await BalanceTrackingService.recordDeposit(userId, 500, 'txn_12345');
// User deposits ₹500
// depositedAmount: 500, currentBalance: 500
```

### Recording a Game Result
```javascript
await BalanceTrackingService.recordGameResult(userId, 100, 500, 'game_123');
// User bets ₹100, wins ₹500
// totalBetAmount: 100, totalWinAmount: 500, winningsAmount: 400, currentBalance: 900
```

### Recording a Withdrawal
```javascript
await BalanceTrackingService.recordWithdrawal(userId, 200, 'withdraw_123');
// User withdraws ₹200
// withdrawnAmount: 200, currentBalance: 700
```

## Financial Flow Example

1. **User deposits ₹500**
   - depositedAmount: ₹500
   - currentBalance: ₹500

2. **User plays game: bets ₹100, wins ₹500**
   - totalBetAmount: ₹100
   - totalWinAmount: ₹500
   - winningsAmount: ₹400 (500 - 100)
   - currentBalance: ₹900 (500 + 400)

3. **User withdraws ₹200**
   - withdrawnAmount: ₹200
   - currentBalance: ₹700

4. **User loses remaining ₹700**
   - currentBalance: ₹0
   - System keeps: ₹500 (original deposit) + ₹400 (winnings recycled) = ₹900

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Initialize the system:
```bash
node scripts/initializeSystem.js
```

3. Start the server:
```bash
npm start
```

## Admin Dashboard Access

Visit `/admin` to access the financial dashboard with the following features:
- Real-time financial metrics
- User balance tracking
- Prize pool monitoring
- Transaction history
- Profit analytics

## Security Features

- All financial transactions are logged
- Balance updates are atomic
- Audit trail for all activities
- Admin authentication required for sensitive operations

## Monitoring

The system provides:
- Real-time balance tracking
- Prize pool health monitoring
- Profit margin calculations
- User activity analytics
- System-wide financial overview
