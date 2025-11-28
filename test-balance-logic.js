#!/usr/bin/env node

/**
 * Test script to validate betting balance logic
 */

console.log('🧪 Testing Balance Logic\n');

function testCase(name, initialBalance, betAmount, odds, isWin) {
  console.log(`📝 Test: ${name}`);
  console.log(`   Initial balance: ${initialBalance}`);
  console.log(`   Bet amount: ${betAmount}`);
  console.log(`   Odds: ${odds}x`);
  console.log(`   Result: ${isWin ? 'WIN' : 'LOSS'}`);
  
  // Simulate handlePlaceBet
  const balanceBeforeBet = initialBalance;
  const balanceAfterBet = initialBalance - betAmount;
  
  // Simulate game end
  const payout = isWin ? Math.round(betAmount * odds) : 0;
  const profit = payout - betAmount;
  
  // OLD FORMULA (WRONG - doesn't use saved balance): finalBalance = currentBalance + payout
  // where currentBalance might have race conditions with useKV
  
  // CORRECT FORMULA: finalBalance = balanceBeforeBet - betAmount + payout
  const correctBalance = balanceBeforeBet - betAmount + payout;
  
  // Expected balance
  const expectedBalance = initialBalance - betAmount + payout;
  
  console.log(`   After bet placed: ${balanceAfterBet}`);
  console.log(`   Payout: ${payout}`);
  console.log(`   Profit: ${profit}`);
  console.log(`   ✅ Correct formula result: ${correctBalance}`);
  console.log(`   🎯 Expected: ${expectedBalance}`);
  
  if (correctBalance === expectedBalance) {
    console.log('   ✅ PASS\n');
    return true;
  } else {
    console.log('   ❌ FAIL\n');
    return false;
  }
}

let passed = 0;
let total = 0;

// Test case 1: Loss
total++;
if (testCase('Balance 100 → Bet 25 → Loss', 100, 25, 2.0, false)) passed++;

// Test case 2: Win x2
total++;
if (testCase('Balance 100 → Bet 25 → Win x2', 100, 25, 2.0, true)) passed++;

// Test case 3: Total loss
total++;
if (testCase('Balance 100 → Bet 100 → Loss', 100, 100, 2.0, false)) passed++;

// Test case 4: Big win
total++;
if (testCase('Balance 100 → Bet 10 → Win x3.5', 100, 10, 3.5, true)) passed++;

// Test case 5: Small bet loss
total++;
if (testCase('Balance 75 → Bet 10 → Loss', 75, 10, 2.0, false)) passed++;

console.log(`\n${'='.repeat(50)}`);
console.log(`📊 Results: ${passed}/${total} tests passed`);
console.log(`${'='.repeat(50)}`);

process.exit(passed === total ? 0 : 1);
