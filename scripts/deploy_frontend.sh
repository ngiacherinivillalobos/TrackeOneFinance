#!/bin/bash

# Script para deploy do frontend no Vercel
echo "🚀 Iniciando deploy do frontend no Vercel..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
  echo "❌ Erro: Não encontrado package.json. Execute este script na raiz do projeto."
  exit 1
fi

# Navegar para o diretório do cliente
cd client

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
  echo "⚠️  Vercel CLI não encontrado. Instalando..."
  npm install -g vercel
fi

# Fazer login no Vercel (se necessário)
echo "🔐 Verificando autenticação no Vercel..."
vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "⚠️  Não autenticado no Vercel. Por favor, faça login:"
  vercel login
fi

# Verificar se o projeto já existe
echo "🔍 Verificando se o projeto já existe no Vercel..."
PROJECT_EXISTS=$(vercel ls | grep "trackeone-finance" | wc -l)

if [ $PROJECT_EXISTS -gt 0 ]; then
  echo "✅ Projeto já existe. Fazendo deploy..."
  vercel --prod
else
  echo "🆕 Projeto não encontrado. Criando novo projeto..."
  vercel --prod
fi

echo "✅ Deploy do frontend concluído!"