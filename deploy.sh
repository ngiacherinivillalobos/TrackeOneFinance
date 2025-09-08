#!/bin/bash

# TrackeOne Finance - Script de Deploy para Produção
# Autor: Assistente IA
# Data: $(date)

set -e

echo "🚀 INICIANDO DEPLOY PARA PRODUÇÃO - TrackeOne Finance"
echo "=================================================="
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker e Docker Compose detectados"
echo ""

# Parar containers existentes se estiverem rodando
echo "🛑 Parando containers existentes..."
docker-compose down --volumes --remove-orphans 2>/dev/null || true
echo ""

# Remover imagens antigas para forçar rebuild
echo "🗑️  Removendo imagens antigas..."
docker-compose build --no-cache
echo ""

# Verificar se arquivo .env.docker existe
if [ ! -f ".env.docker" ]; then
    echo "⚠️  Arquivo .env.docker não encontrado. Criando arquivo padrão..."
    cat > .env.docker << EOF
# Docker Environment Variables
DB_USER=trackone_user
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
FRONTEND_URL=http://localhost
EOF
    echo "✅ Arquivo .env.docker criado com senhas aleatórias"
fi

# Carregar variáveis de ambiente
export $(cat .env.docker | grep -v '^#' | xargs)

echo "🔧 Configurações de Deploy:"
echo "   - Database User: $DB_USER"
echo "   - Database Password: [HIDDEN]"
echo "   - JWT Secret: [HIDDEN]"
echo "   - Frontend URL: $FRONTEND_URL"
echo ""

# Iniciar serviços
echo "🐳 Iniciando containers..."
docker-compose --env-file .env.docker up -d

# Aguardar PostgreSQL ficar pronto
echo "⏳ Aguardando PostgreSQL ficar pronto..."
sleep 10

# Verificar se PostgreSQL está rodando
echo "🔍 Verificando status dos serviços..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Containers iniciados com sucesso!"
else
    echo "❌ Erro ao iniciar containers. Verificando logs..."
    docker-compose logs
    exit 1
fi

echo ""
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "================================="
echo ""
echo "📊 Status dos Serviços:"
docker-compose ps
echo ""
echo "🌐 URLs de Acesso:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:3001/api"
echo "   PostgreSQL: localhost:5432"
echo ""
echo "🔧 Comandos Úteis:"
echo "   Ver logs: docker-compose logs -f"
echo "   Parar serviços: docker-compose down"
echo "   Restart: docker-compose restart"
echo ""
echo "📝 Próximos Passos:"
echo "   1. Acesse http://localhost para verificar o frontend"
echo "   2. Teste a API em http://localhost:3001/api"
echo "   3. Configure seu domínio em .env.docker se necessário"
echo "   4. Configure backup automático do PostgreSQL"
echo ""

# Mostrar logs por alguns segundos
echo "📋 Últimos logs (10 segundos):"
timeout 10 docker-compose logs -f || true

echo ""
echo "✅ Deploy finalizado! Sistema rodando em produção."
