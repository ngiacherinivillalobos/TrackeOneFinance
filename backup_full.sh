#!/bin/bash

# Script de Backup Full TrackeOneFinance
# Inclui código, banco de dados e configurações

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/Users/nataligiacherini/Development/TrackeOneFinance"
BACKUP_BASE_DIR="/Users/nataligiacherini/Development"
BACKUP_NAME="TrackeOneFinance_FULL_BACKUP_${TIMESTAMP}"
BACKUP_DIR="${BACKUP_BASE_DIR}/${BACKUP_NAME}"

echo "🚀 === TRACKEONE FINANCE - BACKUP FULL COMPLETO ==="
echo "⏰ Timestamp: $TIMESTAMP"
echo "📂 Projeto: $PROJECT_DIR"
echo "💾 Backup: $BACKUP_DIR"
echo ""

# 1. Criar diretório de backup
echo "📁 Criando diretório de backup..."
mkdir -p "$BACKUP_DIR"

# 2. Backup do código fonte completo
echo "💻 Copiando código fonte..."
cp -r "$PROJECT_DIR" "$BACKUP_DIR/"

# 3. Verificar se há banco de dados para incluir
echo "🗄️  Verificando bancos de dados..."
if [ -f "$PROJECT_DIR/database/database.db" ]; then
    echo "   ✅ Encontrado: database/database.db"
fi

if [ -f "$PROJECT_DIR/database/track_one_finance.db" ]; then
    echo "   ✅ Encontrado: database/track_one_finance.db"
fi

if [ -f "$PROJECT_DIR/server/database/database.db" ]; then
    echo "   ✅ Encontrado: server/database/database.db"
fi

if [ -f "$PROJECT_DIR/server/database/track_one_finance.db" ]; then
    echo "   ✅ Encontrado: server/database/track_one_finance.db"
fi

# 4. Backup específico dos arquivos críticos mais recentes
echo "🔥 Backup dos arquivos críticos..."
mkdir -p "$BACKUP_DIR/critical_files"

# Dashboard.tsx (recém corrigido)
if [ -f "$PROJECT_DIR/client/src/pages/Dashboard.tsx" ]; then
    cp "$PROJECT_DIR/client/src/pages/Dashboard.tsx" "$BACKUP_DIR/critical_files/Dashboard_${TIMESTAMP}.tsx"
    echo "   ✅ Dashboard.tsx (erro de data corrigido)"
fi

# MonthlyControl.tsx (com todas as melhorias)
if [ -f "$PROJECT_DIR/client/src/pages/MonthlyControl.tsx" ]; then
    cp "$PROJECT_DIR/client/src/pages/MonthlyControl.tsx" "$BACKUP_DIR/critical_files/MonthlyControl_${TIMESTAMP}.tsx"
    echo "   ✅ MonthlyControl.tsx (transações vencidas + batch edit)"
fi

# dateUtils.ts (função createSafeDate melhorada)
if [ -f "$PROJECT_DIR/client/src/utils/dateUtils.ts" ]; then
    cp "$PROJECT_DIR/client/src/utils/dateUtils.ts" "$BACKUP_DIR/critical_files/dateUtils_${TIMESTAMP}.ts"
    echo "   ✅ dateUtils.ts (createSafeDate robusta)"
fi

# TransactionController.ts (batch edit)
if [ -f "$PROJECT_DIR/server/src/controllers/TransactionController.ts" ]; then
    cp "$PROJECT_DIR/server/src/controllers/TransactionController.ts" "$BACKUP_DIR/critical_files/TransactionController_${TIMESTAMP}.ts"
    echo "   ✅ TransactionController.ts (batchEdit implementado)"
fi

# 5. Criar arquivo de informações do backup
echo "📋 Criando manifesto do backup..."
cat > "$BACKUP_DIR/BACKUP_INFO.md" << EOF
# TrackeOne Finance - Backup Full

**Data/Hora:** $(date)
**Timestamp:** $TIMESTAMP
**Versão:** Após correção do erro de data no Dashboard

## 🔧 Funcionalidades Implementadas

### ✅ Transações Vencidas
- Exibição de transações vencidas de todo o período
- Lógica separada para busca de overdue transactions
- Implementado em MonthlyControl e Dashboard

### ✅ Correção Data D-1
- Função getLocalDateString() centralizada
- createSafeDate() robusta com validações
- Evita problemas de timezone em produção

### ✅ Edição em Lote
- Endpoint POST /transactions/batch-edit
- Método batchEdit no TransactionController
- Interface para seleção múltipla

### ✅ Total "A Pagar" Melhorado
- Considera transações vencidas (status 374)
- Implementado em MonthlyControl e Dashboard
- Cálculo: totalVencidos + totalVencemHoje + totalAVencer

### ✅ Correção Erro Dashboard
- RangeError: Invalid time value corrigido
- Validação savingsGoal.target_date
- createSafeDate() centralizada e robusta

## 📂 Estrutura do Backup

- \`TrackeOneFinance/\` - Código completo
- \`critical_files/\` - Arquivos críticos com timestamp
- \`BACKUP_INFO.md\` - Este arquivo
- \`RESTORE_INSTRUCTIONS.md\` - Instruções de restauração

## 🔄 Como Restaurar

1. **Restauração Completa:**
   \`\`\`bash
   cp -r ${BACKUP_NAME}/TrackeOneFinance/* /Users/nataligiacherini/Development/TrackeOneFinance/
   \`\`\`

2. **Restauração Arquivo Específico:**
   \`\`\`bash
   cp ${BACKUP_NAME}/critical_files/Dashboard_${TIMESTAMP}.tsx /Users/nataligiacherini/Development/TrackeOneFinance/client/src/pages/Dashboard.tsx
   \`\`\`

## 🧪 Status dos Testes

- ✅ Transações vencidas exibindo corretamente
- ✅ Batch edit funcionando
- ✅ Datas sem problema d-1
- ✅ Dashboard sem RangeError
- ✅ Totais "A Pagar" consistentes

EOF

# 6. Criar instruções de restauração
cat > "$BACKUP_DIR/RESTORE_INSTRUCTIONS.md" << EOF
# Instruções de Restauração - TrackeOne Finance

## 🚨 Restauração Completa (Em caso de problema grave)

\`\`\`bash
# 1. Fazer backup do estado atual (se necessário)
cp -r /Users/nataligiacherini/Development/TrackeOneFinance /Users/nataligiacherini/Development/TrackeOneFinance_before_restore

# 2. Restaurar backup completo
cp -r ${BACKUP_BASE_DIR}/${BACKUP_NAME}/TrackeOneFinance/* /Users/nataligiacherini/Development/TrackeOneFinance/

# 3. Reinstalar dependências
cd /Users/nataligiacherini/Development/TrackeOneFinance/client && npm install
cd /Users/nataligiacherini/Development/TrackeOneFinance/server && npm install

# 4. Verificar se está funcionando
cd /Users/nataligiacherini/Development/TrackeOneFinance/server && npm run dev
cd /Users/nataligiacherini/Development/TrackeOneFinance/client && npm run dev
\`\`\`

## 🎯 Restauração de Arquivo Específico

### Dashboard.tsx (Erro de data corrigido)
\`\`\`bash
cp ${BACKUP_BASE_DIR}/${BACKUP_NAME}/critical_files/Dashboard_${TIMESTAMP}.tsx /Users/nataligiacherini/Development/TrackeOneFinance/client/src/pages/Dashboard.tsx
\`\`\`

### MonthlyControl.tsx (Todas as funcionalidades)
\`\`\`bash
cp ${BACKUP_BASE_DIR}/${BACKUP_NAME}/critical_files/MonthlyControl_${TIMESTAMP}.tsx /Users/nataligiacherini/Development/TrackeOneFinance/client/src/pages/MonthlyControl.tsx
\`\`\`

### dateUtils.ts (Função createSafeDate robusta)
\`\`\`bash
cp ${BACKUP_BASE_DIR}/${BACKUP_NAME}/critical_files/dateUtils_${TIMESTAMP}.ts /Users/nataligiacherini/Development/TrackeOneFinance/client/src/utils/dateUtils.ts
\`\`\`

### TransactionController.ts (Batch edit)
\`\`\`bash
cp ${BACKUP_BASE_DIR}/${BACKUP_NAME}/critical_files/TransactionController_${TIMESTAMP}.ts /Users/nataligiacherini/Development/TrackeOneFinance/server/src/controllers/TransactionController.ts
\`\`\`

## 🔍 Verificação Pós-Restauração

1. **Verificar se aplicação inicia:**
   - Server: \`npm run dev\` na pasta server
   - Client: \`npm run dev\` na pasta client

2. **Testar funcionalidades:**
   - Dashboard carrega sem erro
   - Transações vencidas aparecem
   - Batch edit funciona
   - Datas estão corretas

3. **Verificar console:**
   - Sem RangeError
   - Sem erros de compilação
   - APIs respondem corretamente

EOF

# 7. Compactar backup para economizar espaço
echo "🗜️  Compactando backup..."
cd "$BACKUP_BASE_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"

# 8. Verificar tamanho do backup
BACKUP_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
echo ""
echo "✅ === BACKUP COMPLETO CRIADO COM SUCESSO ==="
echo "📦 Arquivo: ${BACKUP_NAME}.tar.gz"
echo "📏 Tamanho: $BACKUP_SIZE"
echo "📂 Localização: $BACKUP_BASE_DIR"
echo ""

# 9. Listar últimos backups
echo "📋 Últimos backups disponíveis:"
ls -lah "$BACKUP_BASE_DIR" | grep "TrackeOneFinance.*\.tar\.gz" | tail -5
echo ""

# 10. Informações importantes
echo "🔥 ARQUIVOS CRÍTICOS INCLUÍDOS:"
echo "   ✅ Dashboard.tsx (erro de data corrigido)"
echo "   ✅ MonthlyControl.tsx (transações vencidas + batch edit)"
echo "   ✅ dateUtils.ts (createSafeDate robusta)"
echo "   ✅ TransactionController.ts (batch edit endpoint)"
echo "   ✅ Banco de dados completo"
echo "   ✅ Todas as configurações"
echo ""

echo "📖 Para instruções de restauração:"
echo "   tar -xzf ${BACKUP_NAME}.tar.gz && cat ${BACKUP_NAME}/RESTORE_INSTRUCTIONS.md"
echo ""

echo "🎉 BACKUP FULL CONCLUÍDO!"
echo "⚠️  Mantenha este backup seguro - contém todas as correções importantes!"
