const behaviorTriggerService = require('../services/behaviorTriggerService');

async function testBehaviorTriggers() {
  console.log('🧠 Testing Behavior-Based Triggers...');
  
  // Test 1: New user behavior
  console.log('\n📊 Test 1: New User Behavior');
  const newUserBehavior = {
    totalSpins: 5,
    timeSinceFirstSpin: 2 * 60 * 1000, // 2 minutes
    balanceChange: -0.05, // 5% loss
    winHistory: { 
      totalWins: 1, 
      totalLosses: 4, 
      winRate: 20,
      currentStreak: { win: 0, loss: 4 } 
    },
    bettingPatterns: { averageBet: 100 },
    timePatterns: { spinsPerMinute: 2.5 },
    riskProfile: 'low_risk'
  };
  
  const newUserTrigger = await behaviorTriggerService.evaluateTriggers(newUserBehavior, { betAmount: 100 });
  console.log('New User Trigger:', {
    allowWin: newUserTrigger.allowWin,
    winAmount: newUserTrigger.winAmount,
    pattern: newUserTrigger.pattern,
    reasoning: newUserTrigger.reasoning[0]
  });
  
  // Test 2: Experienced user behavior
  console.log('\n📊 Test 2: Experienced User Behavior');
  const experiencedUserBehavior = {
    totalSpins: 150,
    timeSinceFirstSpin: 45 * 60 * 1000, // 45 minutes
    balanceChange: -0.3, // 30% loss
    winHistory: { 
      totalWins: 45, 
      totalLosses: 105, 
      winRate: 30,
      currentStreak: { win: 0, loss: 8 } 
    },
    bettingPatterns: { averageBet: 150 },
    timePatterns: { spinsPerMinute: 3.3 },
    riskProfile: 'medium_risk'
  };
  
  const experiencedTrigger = await behaviorTriggerService.evaluateTriggers(experiencedUserBehavior, { betAmount: 100 });
  console.log('Experienced User Trigger:', {
    allowWin: experiencedTrigger.allowWin,
    winAmount: experiencedTrigger.winAmount,
    pattern: experiencedTrigger.pattern,
    reasoning: experiencedTrigger.reasoning[0]
  });
  
  // Test 3: Recovery mode
  console.log('\n📊 Test 3: Recovery Mode');
  const recoveryBehavior = {
    totalSpins: 80,
    timeSinceFirstSpin: 90 * 60 * 1000, // 90 minutes
    balanceChange: -0.6, // 60% loss
    winHistory: { 
      totalWins: 20, 
      totalLosses: 60, 
      winRate: 25,
      currentStreak: { win: 0, loss: 12 } 
    },
    bettingPatterns: { averageBet: 120 },
    timePatterns: { spinsPerMinute: 0.9 },
    riskProfile: 'high_risk'
  };
  
  const recoveryTrigger = await behaviorTriggerService.evaluateTriggers(recoveryBehavior, { betAmount: 100 });
  console.log('Recovery Mode Trigger:', {
    allowWin: recoveryTrigger.allowWin,
    winAmount: recoveryTrigger.winAmount,
    pattern: recoveryTrigger.pattern,
    reasoning: recoveryTrigger.reasoning[0]
  });
  
  console.log('\n✅ Behavior Trigger Tests Completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testBehaviorTriggers().catch(console.error);
}

module.exports = { testBehaviorTriggers };
