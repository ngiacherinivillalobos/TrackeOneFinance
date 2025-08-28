#!/bin/bash

# Script de Backup Automático do TrackeOneFinance
# Execute antes de qualquer modificação importante

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/Users/nataligiacherini/Development/TrackeOneFinance"
BACKUP_DIR="/Users/nataligiacherini/Development"

echo "🔄 Iniciando backup automático..."

# 1. Backup completo do projeto
echo "📦 Criando backup completo..."
cp -r "$PROJECT_DIR" "$BACKUP_DIR/TrackeOneFinance_backup_$TIMESTAMP"

# 2. Backup específico do arquivo crítico
echo "📄 Backup do MonthlyControl.tsx..."
cp "$PROJECT_DIR/client/src/pages/MonthlyControl.tsx" "$PROJECT_DIR/backups/MonthlyControl_$TIMESTAMP.tsx"

# 3. Verificar se backups foram criados
if [ -d "$BACKUP_DIR/TrackeOneFinance_backup_$TIMESTAMP" ]; then
    echo "✅ Backup completo criado: TrackeOneFinance_backup_$TIMESTAMP"
else
    echo "❌ Erro no backup completo!"
    exit 1
fi

if [ -f "$PROJECT_DIR/backups/MonthlyControl_$TIMESTAMP.tsx" ]; then
    echo "✅ Backup do arquivo criado: MonthlyControl_$TIMESTAMP.tsx"
else
    echo "❌ Erro no backup do arquivo!"
    exit 1
fi

# 4. Listar backups existentes
echo "📋 Backups disponíveis:"
ls -la "$BACKUP_DIR" | grep TrackeOneFinance_backup | tail -5
echo ""
ls -la "$PROJECT_DIR/backups" | grep MonthlyControl | tail -5

echo "🎉 Backup concluído com sucesso!"
echo "⚠️  Agora é seguro fazer modificações!"

# 5. Mostrar instruções de restauração
echo ""
echo "🔄 Para restaurar em caso de problemas:"
echo "   1. Backup completo: cp -r $BACKUP_DIR/TrackeOneFinance_backup_$TIMESTAMP/* $PROJECT_DIR/"
echo "   2. Arquivo específico: cp $PROJECT_DIR/backups/MonthlyControl_$TIMESTAMP.tsx $PROJECT_DIR/client/src/pages/MonthlyControl.tsx"
echo ""
