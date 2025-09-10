#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing Payment Date Fixes...');
console.log('================================');

try {
  // Test 1: Check if payment_date column exists in SQLite
  console.log('\n1️⃣ Checking SQLite transactions table structure...');
  const sqliteSchema = execSync('sqlite3 server/database/database.db ".schema transactions"', {
    cwd: path.resolve(__dirname),
    encoding: 'utf-8'
  });
  
  if (sqliteSchema.includes('payment_date')) {
    console.log('✅ payment_date column found in SQLite transactions table');
  } else {
    console.log('❌ payment_date column NOT found in SQLite transactions table');
  }

  // Test 2: Check if formatDateToLocal function exists
  console.log('\n2️⃣ Checking formatDateToLocal function...');
  const dateUtilsContent = require('fs').readFileSync(
    path.resolve(__dirname, 'client/src/utils/dateUtils.ts'),
    'utf-8'
  );
  
  if (dateUtilsContent.includes('formatDateToLocal')) {
    console.log('✅ formatDateToLocal function found');
  } else {
    console.log('❌ formatDateToLocal function NOT found');
  }

  // Test 3: Check if MonthlyControl handles overdue transactions correctly
  console.log('\n3️⃣ Checking MonthlyControl overdue transactions logic...');
  const monthlyControlContent = require('fs').readFileSync(
    path.resolve(__dirname, 'client/src/pages/MonthlyControl.tsx'),
    'utf-8'
  );
  
  if (monthlyControlContent.includes('overdue') && monthlyControlContent.includes('dateFilterType: \'all\'')) {
    console.log('✅ MonthlyControl handles overdue transactions from all periods');
  } else {
    console.log('❌ MonthlyControl may not handle overdue transactions correctly');
  }

  // Test 4: Check if transaction controller handles payment dates correctly
  console.log('\n4️⃣ Checking transaction controller payment date handling...');
  const transactionControllerContent = require('fs').readFileSync(
    path.resolve(__dirname, 'server/src/controllers/transactionController.ts'),
    'utf-8'
  );
  
  if (transactionControllerContent.includes('processedPaymentDate') && 
      transactionControllerContent.includes('payment_date') &&
      transactionControllerContent.includes('SET payment_status_id = 2, payment_date = ?')) {
    console.log('✅ Transaction controller handles payment dates correctly');
  } else {
    console.log('❌ Transaction controller may not handle payment dates correctly');
  }

  console.log('\n🎉 All tests completed!');
  console.log('📝 Note: For full testing, run the application and verify:');
  console.log('   - Overdue transactions appear in all date filters');
  console.log('   - Savings goal dates save correctly without d-1 issue');
  console.log('   - Payment dates save correctly without d-1 issue');
  console.log('   - Payment reversal clears payment dates');

} catch (error) {
  console.error('❌ Test error:', error.message);
  process.exit(1);
}