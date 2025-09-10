#!/bin/bash

echo "🚀 Aplicando correções para problemas em produção"
echo "============================================="

# 1. Corrigir filtros padrão no MonthlyControl
echo "🔧 Corrigindo filtros padrão no MonthlyControl..."
sed -i '' 's/payment_status_id: \[.overdue.\]/payment_status_id: \["overdue", "open"\]/' client/src/pages/MonthlyControl.tsx

# 2. Corrigir processamento de data no SavingsGoalController
echo "🔧 Corrigindo processamento de data no SavingsGoalController..."
sed -i '' 's/\/\/ Para PostgreSQL em produção, adicionar indicador de timezone UTC para evitar conversão/\/\/ Para ambos os ambientes, usar a data como está para evitar conversão de timezone/' server/src/controllers/SavingsGoalController.ts
sed -i '' 's/if (isProduction) {/\/\//g' server/src/controllers/SavingsGoalController.ts
sed -i '' 's/\/\/ Em produção (PostgreSQL), usar apenas a data sem timezone para evitar conversão/processedDate = target_date; \/\/ Manter como YYYY-MM-DD/' server/src/controllers/SavingsGoalController.ts
sed -i '' 's/} else {/\/\//g' server/src/controllers/SavingsGoalController.ts
sed -i '' 's/\/\/ Em desenvolvimento (SQLite), usar como está/\/\//g' server/src/controllers/SavingsGoalController.ts

# 3. Corrigir exibição de data no Dashboard
echo "🔧 Corrigindo exibição de data no Dashboard..."
sed -i '' 's/`Prazo: \$\{formatToBrazilianDate(savingsGoal.target_date)\}`/`Prazo: \$\{formatToBrazilianDate(createSafeDate(savingsGoal.target_date))\}`/' client/src/pages/Dashboard.tsx

echo "✅ Todas as correções foram aplicadas!"
echo ""
echo "📋 Próximos passos:"
echo "1. git add ."
echo "2. git commit -m 'Correções para problemas em produção'"
echo "3. git push origin main"
echo "4. Verificar deploy no Vercel e Render"