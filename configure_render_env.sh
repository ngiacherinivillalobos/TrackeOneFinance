#!/bin/bash

echo "=== CONFIGURAÇÃO DAS VARIÁVEIS DE AMBIENTE PARA O RENDER ==="
echo ""

# Verificar se o arquivo .env existe
if [ -f "server/.env" ]; then
  echo "✅ Arquivo .env encontrado"
  
  # Verificar NODE_ENV
  if grep -q "NODE_ENV=production" "server/.env"; then
    echo "✅ NODE_ENV já está configurado como production"
  else
    echo "🔄 Atualizando NODE_ENV para production..."
    sed -i '' 's/NODE_ENV=development/NODE_ENV=production/' server/.env
    echo "✅ NODE_ENV atualizado para production"
  fi
  
  # Verificar se DATABASE_URL está presente
  if grep -q "DATABASE_URL=" "server/.env"; then
    echo "✅ DATABASE_URL já está configurada"
  else
    echo "⚠️  DATABASE_URL não encontrada no .env"
    echo "💡 Adicione a variável DATABASE_URL com a URL do seu banco de dados PostgreSQL no Render"
  fi
  
else
  echo "❌ Arquivo .env não encontrado"
  echo "💡 Crie um arquivo .env com as seguintes variáveis:"
  echo "   NODE_ENV=production"
  echo "   DATABASE_URL=sua_url_do_banco_de_dados"
  echo "   JWT_SECRET=sua_chave_secreta"
  echo "   PORT=3001"
fi

echo ""
echo "=== VERIFICAÇÃO DO ARQUIVO RENDER.YAML ==="

# Verificar o arquivo render.yaml
if [ -f "server/render.yaml" ]; then
  echo "✅ Arquivo render.yaml encontrado"
  
  # Verificar se DATABASE_URL está configurada como sync: false
  if grep -q "DATABASE_URL" "server/render.yaml" && grep -q "sync: false" "server/render.yaml"; then
    echo "✅ DATABASE_URL configurada corretamente como sync: false"
  else
    echo "⚠️  Verifique se DATABASE_URL está configurada como sync: false no render.yaml"
  fi
  
  # Verificar NODE_ENV
  if grep -q "NODE_ENV" "server/render.yaml" && grep -q "value: production" "server/render.yaml"; then
    echo "✅ NODE_ENV configurado corretamente como production"
  else
    echo "⚠️  Verifique se NODE_ENV está configurado como production no render.yaml"
  fi
  
else
  echo "❌ Arquivo render.yaml não encontrado"
fi

echo ""
echo "=== RECOMENDAÇÕES ==="
echo "1. No painel do Render, configure as variáveis de ambiente:"
echo "   - DATABASE_URL: URL do seu banco de dados PostgreSQL"
echo "   - JWT_SECRET: Sua chave secreta JWT"
echo "   - NODE_ENV: production"
echo ""
echo "2. Certifique-se de que o banco de dados PostgreSQL está criado no Render"
echo "3. Verifique se as credenciais do banco de dados estão corretas"
echo "4. Após fazer as alterações, faça um novo deploy"

echo ""
echo "=== FIM DA CONFIGURAÇÃO ==="