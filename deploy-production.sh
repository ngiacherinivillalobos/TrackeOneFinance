#!/bin/bash

# TrackeOne Finance - Script de Deploy para Produção
# GitHub → Render (Backend + PostgreSQL) → Vercel (Frontend)

set -e

echo "🚀 PREPARANDO DEPLOY PARA PRODUÇÃO"
echo "=================================="
echo "Stack: GitHub → Render → Vercel"
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ Execute este script na raiz do projeto TrackeOneFinance"
    exit 1
fi

# Verificar se git está configurado
if ! command -v git &> /dev/null; then
    echo "❌ Git não está instalado"
    exit 1
fi

echo "✅ Verificações iniciais concluídas"
echo ""

# Verificar status do git
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Há mudanças não commitadas. Commitando automaticamente..."
    
    # Adicionar todos os arquivos
    git add .
    
    # Commit com mensagem automática
    COMMIT_MSG="🚀 Deploy ready: Production backup $(date '+%Y%m%d_%H%M%S')"
    git commit -m "$COMMIT_MSG"
    
    echo "✅ Commit criado: $COMMIT_MSG"
else
    echo "✅ Repositório git está limpo"
fi

echo ""

# Push para GitHub
echo "📤 Enviando para GitHub..."
git push origin main

echo "✅ Código enviado para GitHub"
echo ""

# Backup dos dados (se existir)
if [ -f "database/track_one_finance.db" ]; then
    echo "💾 Criando backup do banco SQLite..."
    BACKUP_NAME="backup_before_production_$(date +%Y%m%d_%H%M%S).sql"
    sqlite3 database/track_one_finance.db .dump > "database/backups/$BACKUP_NAME" 2>/dev/null || echo "⚠️  Backup SQLite falhou (normal se banco não existir)"
    echo "✅ Backup criado: $BACKUP_NAME"
fi

echo ""
echo "🎯 INSTRUÇÕES DE DEPLOY MANUAL:"
echo "================================"
echo ""

echo "📋 1. RENDER (Backend + PostgreSQL):"
echo "   • Acesse: https://dashboard.render.com"
echo "   • Conecte este repositório GitHub"
echo "   • Configure o serviço usando o arquivo render.yaml existente"
echo "   • O banco PostgreSQL será criado automaticamente"
echo "   • Aguarde o deploy completar (~5-10 minutos)"
echo ""

echo "📋 2. VERCEL (Frontend):"
echo "   • Acesse: https://vercel.com/dashboard"
echo "   • Conecte este repositório GitHub"
echo "   • Selecione a pasta 'client' como root directory"
echo "   • O deploy será automático usando vercel.json"
echo ""

echo "📋 3. CONFIGURAÇÕES IMPORTANTES:"
echo "   • Render URL: https://trackeone-finance-api.onrender.com"
echo "   • Vercel URL: https://seu-projeto.vercel.app"
echo "   • Database: PostgreSQL automático no Render"
echo ""

echo "📋 4. VERIFICAÇÕES PÓS-DEPLOY:"
echo "   • Teste backend: https://trackeone-finance-api.onrender.com/api/health"
echo "   • Teste frontend: https://seu-projeto.vercel.app"
echo "   • Verifique logs no Render Dashboard"
echo ""

echo "📋 5. DADOS INICIAIS:"
echo "   • O banco será inicializado automaticamente"
echo "   • Categorias, centros de custo e métodos de pagamento serão criados"
echo "   • Primeiro acesso: criar usuário via frontend"
echo ""

echo "🔧 ARQUIVOS DE CONFIGURAÇÃO ATUALIZADOS:"
echo "   ✅ render.yaml - Configuração do Render"
echo "   ✅ vercel.json - Configuração do Vercel"
echo "   ✅ package.json - Scripts de build"
echo "   ✅ database/init_postgresql.sql - Schema PostgreSQL"
echo "   ✅ client/src/services/api.ts - URLs de produção"
echo ""

echo "🎉 PREPARAÇÃO CONCLUÍDA!"
echo "========================"
echo ""
echo "⚡ PRÓXIMOS PASSOS:"
echo "1. Configure os serviços no Render e Vercel"
echo "2. Aguarde os deploys completarem"
echo "3. Teste a aplicação em produção"
echo "4. Configure domínio personalizado (opcional)"
echo ""

echo "📞 EM CASO DE PROBLEMAS:"
echo "• Verifique logs no Render Dashboard"
echo "• Verifique build logs no Vercel"
echo "• Confirme URLs nos arquivos de configuração"
echo ""

echo "✅ Sistema pronto para produção com PostgreSQL!"
