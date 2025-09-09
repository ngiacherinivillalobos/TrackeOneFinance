#!/bin/bash

echo "🔍 TESTANDO AS 3 CORREÇÕES ESPECÍFICAS"
echo "======================================"

# Problema 1: Checkbox is_paid
echo ""
echo "1️⃣ TESTE: Campo is_paid no backend"
echo "Verificando se o campo is_paid está sendo processado..."
grep -n "is_paid === true" server/src/controllers/TransactionController.ts | head -2

# Problema 2: Transações vencidas 
echo ""
echo "2️⃣ TESTE: Compatibilidade PostgreSQL para transações vencidas"
echo "Verificando funções de data PostgreSQL..."
grep -n "CURRENT_DATE\|date('now')" server/src/controllers/TransactionController.ts | head -3

# Problema 3: Meta de Economia d-1
echo ""
echo "3️⃣ TESTE: createSafeDate no SavingsGoalSettings"
echo "Verificando se parseISO foi substituído por createSafeDate..."
grep -n "createSafeDate\|parseISO" client/src/components/SavingsGoalSettings.tsx

# Verificar se as migrações PostgreSQL existem
echo ""
echo "4️⃣ TESTE: Migração PostgreSQL para is_paid"
echo "Verificando se a migração PostgreSQL existe..."
ls -la database/migrations/*is_paid*postgres*

echo ""
echo "5️⃣ TESTE: Deploy status"
echo "Verificando último deploy..."
git log --oneline -3
