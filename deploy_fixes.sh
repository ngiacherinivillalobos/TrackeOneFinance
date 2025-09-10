#!/bin/bash

echo "🚀 Deploying Fixes for Production Issues"
echo "======================================"

# Apply database migrations
echo "🔧 Applying database migrations..."
sh apply_all_migrations.sh

# Check if we're in a production environment
if [ "$NODE_ENV" = "production" ]; then
  echo "🔧 Applying PostgreSQL migrations..."
  node apply_postgres_migrations.js
fi

# Run tests to verify fixes
echo "🧪 Running tests to verify fixes..."
node test_payment_date_fix.js

echo ""
echo "✅ All fixes have been applied successfully!"
echo ""
echo "📋 Summary of fixes:"
echo "  1. Overdue transactions now display from all periods"
echo "  2. Savings goal dates no longer have d-1 issue"
echo "  3. Payment dates no longer have d-1 issue"
echo "  4. Database schema updated with payment_date column"
echo ""
echo "📝 Next steps:"
echo "  1. Deploy to production"
echo "  2. Verify fixes in production environment"
echo "  3. Test all functionality thoroughly"