const behaviorTriggerService = require('../services/behaviorTriggerService');

// Mock test data
const testUserId = 'test_user_123';
const testSpinData = {
  betAmount: 100,
  gameType: 'slots'
};

async function testBehaviorTriggers() {
  console.log('🧠 Testing Behavior-Based Triggers...');
  
  // Test 1: New user behavior
  console.log('\n📊 Test 1: New User Behavior');
  const newUserBehavior = {
    totalSpins: 5,
    timeSinceFirstSpin: 2 * 60 * 1000, // 2 minutes
    balanceChange: -0.05, // 5% loss
    winHistory: { currentStreak: { win: 0, loss: 5 } }
  };
  
  const newUserTrigger = await behaviorTriggerService.evaluateTriggers(newUserBehavior, testSpinData);
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
    winHistory: { currentStreak: { win: 0, loss: 15 } }
  };
  
  const experiencedTrigger = await behaviorTriggerService.evaluateTriggers(experiencedUserBehavior, testSpinData);
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
    winHistory: { currentStreak: { win: 0, loss: 12 } }
  };
  
  const recoveryTrigger = await behaviorTriggerService.evaluateTriggers(recoveryBehavior, testSpinData);
  console.log('Recovery Mode Trigger:', {
    allowWin: recoveryTrigger.allowWin,
    winAmount: recoveryTrigger.winAmount,
    pattern: recoveryTrigger.pattern,
    reasoning: recoveryTrigger.reasoning[0]
  });
  
  console.log('\n✅ Behavior Trigger Tests Completed!');
}

// Run tests
testBehaviorTriggers().catch(console.error);
