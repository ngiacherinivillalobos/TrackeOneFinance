#!/bin/bash

# Script para deploy no Render
echo "Iniciando deploy no Render..."

# Verificar se estamos no diretório correto
if [ ! -f "server/package.json" ] || [ ! -f "client/package.json" ]; then
  echo "Erro: Não foi possível encontrar os arquivos package.json nos diretórios server e client"
  exit 1
fi

# Commit e push para o repositório
echo "Fazendo commit e push das alterações..."
git add .
git commit -m "Atualização para deploy no Render"
git push origin main

echo "Deploy iniciado! Verifique o status no dashboard do Render."
echo "URL do serviço: https://trackeone-finance-api.onrender.com"