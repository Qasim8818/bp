# 🧠 Behavior-Based Triggers System

## Overview
The behavior-based triggers system provides intelligent win/loss management by analyzing user behavior patterns and making data-driven decisions about when to allow wins, how big they should be, and when to let users lose.

## Key Features

### 📊 Behavior Tracking
- **Total Spins**: Tracks lifetime spin count per user
- **Time Analysis**: Monitors time since first spin and session duration
- **Balance Changes**: Tracks percentage changes in user balance
- **Win History**: Analyzes win/loss streaks and patterns
- **Risk Profile**: Determines user risk tolerance based on betting patterns

### 🎯 Trigger Decisions
- **When to allow wins**: Based on user behavior patterns
- **Win amount calculation**: Dynamic based on triggers and bet amount
- **Loss streak management**: Controls when to let users lose again
- **Recovery mode**: Special handling for users with large losses

## API Endpoints

### Admin Dashboard
- `GET /api/admin/behavior/:userId` - Get user behavior analysis
- `GET /api/admin/triggers/:userId` - Get trigger decisions
- `GET /api/admin/system-stats` - Get system-wide statistics
- `GET /api/admin/patterns` - Get behavior patterns summary
- `DELETE /api/admin/cache/:userId` - Clear behavior cache

### Response Examples

#### User Behavior Analysis
```json
{
  "success": true,
  "data": {
    "totalSpins": 150,
    "timeSinceFirstSpin": 2700000,
    "balanceChange": -0.3,
    "winHistory": {
      "totalWins": 45,
      "totalLosses": 105,
      "winRate": 30,
      "currentStreak": { "win": 0, "loss": 8 },
      "biggestWin": 500,
      "longestWinStreak": 5,
      "longestLossStreak": 12
    },
    "bettingPatterns": {
      "averageBet": 150,
      "totalBet": 22500,
      "totalWon": 15750,
      "netProfit": -6750,
      "volatility": 0.8
    },
    "riskProfile": "medium_risk"
  }
}
```

#### Trigger Decisions
```json
{
  "success": true,
  "data": {
    "allowWin": true,
    "winAmount": 300,
    "nextLossStreak": 3,
    "pattern": "recovery",
    "reasoning": ["Large losses detected - recovery mode"]
  }
}
```

## Behavior Patterns

### 1. New User Pattern
- **Trigger**: < 10 total spins
- **Win Rate**: 60-70% for engagement
- **Win Amount**: 1.5x bet amount
- **Strategy**: Build confidence with small wins

### 2. Recovery Pattern
- **Trigger**: > 50% balance loss
- **Win Rate**: 80-90% guaranteed
- **Win Amount**: 2.5-3x bet amount
- **Strategy**: Prevent user abandonment

### 3. Streak Cooldown
- **Trigger**: 3+ consecutive wins
- **Win Rate**: 10-20% 
- **Win Amount**: 0.5x bet amount
- **Strategy**: Maintain house edge

### 4. Engagement Boost
- **Trigger**: Long session (> 2 hours)
- **Win Rate**: 70-80%
- **Win Amount**: 1.8x bet amount
- **Strategy**: Retain active users

### 5. Experienced User
- **Trigger**: > 100 total spins
- **Win Rate**: 35-45% (balanced)
- **Win Amount**: 2x bet amount
- **Strategy**: Maintain sustainable win rate

## Integration

### Spin Logic Engine
The behavior trigger system is integrated into the existing spin logic engine:
- Replaces basic pattern selection with intelligent behavior analysis
- Provides real-time trigger decisions for each spin
- Maintains backward compatibility with existing patterns

### Usage Example
```javascript
const behaviorTriggerService = require('./services/behaviorTriggerService');

// Get trigger decision for a user
const trigger = await behaviorTriggerService.analyzeBehavior(userId, {
  betAmount: 100,
  gameType: 'slots'
});

if (trigger.allowWin) {
  // Calculate win based on trigger.winAmount
  const winAmount = trigger.winAmount;
  // Process win
}
```

## Configuration

### Trigger Thresholds
```javascript
triggerThresholds: {
  totalSpins: { low: 10, medium: 50, high: 100 },
  timeSinceFirstSpin: { short: 5min, medium: 30min, long: 2hours },
  balanceChange: { small: 10%, medium: 25%, large: 50% },
  winHistory: { streak: 3, drought: 10 }
}
```

## Testing
Run the behavior trigger tests:
```bash
node tests/behaviorTriggers.test.js
```

## Monitoring
- Real-time behavior tracking
- System-wide analytics
- User pattern identification
- Performance metrics dashboard
