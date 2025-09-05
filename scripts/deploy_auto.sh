#!/bin/bash

# Script de deploy automatizado para TrackeOne Finance
# Este script automatiza o processo de deploy para produção

echo "🚀 Deploy Automatizado do TrackeOne Finance"
echo "=========================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
  echo "❌ Erro: Não encontrado package.json. Execute este script na raiz do projeto."
  exit 1
fi

# Função para pausar e esperar confirmação do usuário
pause() {
  read -p "Pressione [Enter] para continuar ou Ctrl+C para cancelar..."
}

# 1. Verificação pré-deploy
echo "🔍 1. Executando verificação pré-deploy..."
node scripts/deploy_check.js
if [ $? -ne 0 ]; then
  echo "❌ Verificação pré-deploy falhou."
  exit 1
fi

echo "✅ Verificação pré-deploy concluída com sucesso."
echo ""
pause

# 2. Commit e push das alterações
echo "💾 2. Salvando alterações no repositório..."
git add .
if ! git diff --cached --quiet; then
  echo "📝 Há alterações para commit. Criando commit..."
  git commit -m "Deploy automático - $(date)"
else
  echo "ℹ️ Nenhuma alteração para commit."
fi

echo "📤 Enviando alterações para o repositório remoto..."
git push origin main
if [ $? -ne 0 ]; then
  echo "❌ Erro ao enviar alterações para o repositório."
  exit 1
fi

echo "✅ Alterações enviadas com sucesso para o repositório."
echo ""
pause

# 3. Build das aplicações
echo "🏗️ 3. Construindo aplicações para produção..."
echo "🔨 Construindo servidor..."
cd server && npm run build
if [ $? -ne 0 ]; then
  echo "❌ Erro ao construir servidor."
  exit 1
fi
cd ..

echo "🔨 Construindo cliente..."
cd client && npm run build
if [ $? -ne 0 ]; then
  echo "❌ Erro ao construir cliente."
  exit 1
fi
cd ..

echo "✅ Build das aplicações concluído com sucesso."
echo ""
pause

# 4. Gerar relatório do projeto
echo "📋 4. Gerando relatório do projeto..."
node scripts/generate_project_report.js
echo "✅ Relatório gerado com sucesso."
echo ""
pause

# 5. Gerar chave JWT segura
echo "🔐 5. Gerando chave JWT segura..."
node scripts/generate_secure_jwt.js
echo ""
echo "⚠️ Anote a chave JWT gerada acima!"
echo ""
pause

# 6. Instruções para deploy manual
echo "📋 6. Instruções para deploy manual:"
echo ""
echo "Backend (Render):"
echo "1. Acesse https://dashboard.render.com"
echo "2. Crie um novo Web Service"
echo "3. Conecte o repositório GitHub ngiacherinivillalobos/TrackeOneFinance"
echo "4. Configure:"
echo "   * Name: trackeone-finance-api"
echo "   * Root Directory: server"
echo "   * Build Command: npm install"
echo "   * Start Command: npm start"
echo "5. Adicione as variáveis de ambiente:"
echo "   * NODE_ENV=production"
echo "   * JWT_SECRET=(chave gerada acima)"
echo "   * DATABASE_URL=(URL do seu banco PostgreSQL)"
echo "   * PORT=3001"
echo ""
echo "Banco de Dados (PostgreSQL no Render):"
echo "1. Crie um novo PostgreSQL Database no Render"
echo "2. Anote a DATABASE_URL para usar no backend"
echo ""
echo "Frontend (Vercel):"
echo "1. Acesse https://vercel.com"
echo "2. Crie um novo projeto"
echo "3. Importe o repositório GitHub ngiacherinivillalobos/TrackeOneFinance"
echo "4. Configure:"
echo "   * Project Name: trackeone-finance"
echo "   * Framework Preset: Vite"
echo "   * Root Directory: client"
echo "5. Adicione a variável de ambiente:"
echo "   * VITE_API_URL=https://trackeone-finance-api.onrender.com/api"
echo ""
pause

# 7. Verificação final
echo "✅ Deploy automatizado concluído!"
echo ""
echo "📄 Consulte os seguintes arquivos para instruções detalhadas:"
echo "   - DEPLOY_COMPLETO_GUIA.md"
echo "   - DEPLOY_RESUMO_FINAL.md"
echo "   - TROUBLESHOOTING_DEPLOY.md"
echo ""
echo "📊 Para verificar o status do deploy após a implantação:"
echo "   node scripts/check_deploy_status.js"
echo ""
echo "🎉 Processo de deploy automatizado finalizado com sucesso!"