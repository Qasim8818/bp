# Prize Pool & Spin Logic System - Usage Guide

## Overview
This system provides a complete prize pool management solution with custom spin logic, admin profit tracking, and withdrawal capabilities.

## Quick Start

### 1. System Initialization
```bash
npm install
npm start
```

### 2. API Endpoints

#### User Spin Endpoints
- **POST** `/api/games/spin/spin` - Process a spin
- **GET** `/api/games/spin/history` - Get spin history
- **GET** `/api/games/spin/stats` - Get user statistics

#### Admin Profit Endpoints
- **GET** `/api/admin/profit/dashboard` - Admin profit dashboard
- **POST** `/api/admin/profit/withdraw` - Process admin withdrawal
- **GET** `/api/admin/profit/history` - Admin withdrawal history
- **GET** `/api/admin/profit/breakdown` - Profit breakdown
- **GET** `/api/admin/profit/limits` - Withdrawal limits
- **GET** `/api/admin/profit/export` - Export profit report

## Usage Examples

### 1. Processing a Spin (User)
```javascript
// POST /api/games/spin/spin
{
  "betAmount": 10,
  "gameType": "slots"
}

// Response
{
  "success": true,
  "data": {
    "betAmount": 10,
    "winAmount": 20,
    "newBalance": 490,
    "pattern": "PATTERN_REVIVE",
    "contribution": 0,
    "gameResultId": "507f1f77bcf86cd799439011"
  }
}
```

### 2. Admin Dashboard
```javascript
// GET /api/admin/profit/dashboard
{
  "success": true,
  "data": {
    "totalDeposits": 100000,
    "totalWithdrawals": 25000,
    "currentPrizePool": 75000,
    "adminProfit": 35000,
    "poolBalance": 15000,
    "dailyStats": [...],
    "topContributors": [...],
    "forecast": {...}
  }
}
```

### 3. Admin Withdrawal
```javascript
// POST /api/admin/profit/withdraw
{
  "amount": 5000,
  "reason": "Monthly profit withdrawal",
  "withdrawalMethod": "bank_transfer",
  "accountDetails": {
    "accountNumber": "1234567890",
    "bankName": "Example Bank"
  }
}

// Response
{
  "success": true,
  "message": "Admin withdrawal processed successfully",
  "data": {
    "amount": 5000,
    "remainingProfit": 30000,
    "withdrawalRecord": {...}
  }
}
```

## Spin Logic Patterns

### Pattern 1: PATTERN_REVIVE (New Users)
- Initial losses to build tension
- Big win when balance drops below threshold
- Keeps users engaged

### Pattern 2: PATTERN_GRADUAL (Regular Users)
- Gradual decrease with strategic boosts
- Occasional wins to maintain hope
- Balanced house edge

### Pattern 3: PATTERN_BALANCED (Experienced Users)
- Consistent house edge
- Random wins based on probability
- Transparent odds

## Prize Pool Tracking

### Key Metrics
- **Total Deposits**: All user deposits
- **Total Withdrawals**: All user withdrawals
- **Current Prize Pool**: Net difference (Deposits - Withdrawals)
- **Admin Profit**: Prize Pool - Reserved Funds
- **Pool Balance**: Available for game payouts

### Financial Flow
```
User Deposits → Business Account → Prize Pool
Game Losses → Prize Pool Contribution
Game Wins → Prize Pool Payouts
Admin Profit → Admin Withdrawal
```

## Database Schema

### UserBalance
```javascript
{
  userId: ObjectId,
  depositedAmount: Number,
  winningsAmount: Number,
  withdrawnAmount: Number,
  currentBalance: Number,
  totalBetAmount: Number,
  totalWinAmount: Number,
  netProfit: Number
}
```

### GameResult
```javascript
{
  userId: ObjectId,
  gameType: String,
  betAmount: Number,
  winAmount: Number,
  result: String, // 'win' | 'loss'
  multiplier: Number,
  balanceAfter: Number,
  metadata: {
    pattern: String,
    contribution: Number
  }
}
```

### Transaction
```javascript
{
  userId: ObjectId,
  type: String, // 'deposit' | 'withdrawal' | 'admin_withdrawal' | 'pool_contribution' | 'pool_payout'
  amount: Number,
  status: String,
  description: String,
  metadata: Object
}
```

## Testing

### 1. Test Spin Sequence (Admin Only)
```bash
curl -X POST http://localhost:5000/api/games/spin/simulate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sequenceLength": 20, "baseBet": 10}'
```

### 2. Check Profit Dashboard
```bash
curl -X GET http://localhost:5000/api/admin/profit/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Export Profit Report
```bash
curl -X GET "http://localhost:5000/api/admin/profit/export?format=csv&startDate=2024-01-01" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Security Features
- JWT authentication for all endpoints
- Admin-only access for profit management
- Rate limiting on withdrawals
- Transaction logging for audit trail

## Monitoring
- Real-time profit tracking
- Daily/weekly/monthly reports
- User behavior analytics
- System health checks

## Integration Points
- Payment gateways (JazzCash, EasyPaisa, Bank Transfer)
- Game providers (JILI, Pragmatic, Evolution)
- Admin dashboard
- User mobile app
- Financial reporting systems
