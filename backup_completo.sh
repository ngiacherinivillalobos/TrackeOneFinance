#!/bin/bash

# Script de backup completo do projeto TrackeOne Finance
# Data: 19/09/2025
# Versão: 1.0

echo "=== BACKUP COMPLETO DO PROJETO TRACKONE FINANCE ==="
echo "Data: $(date)"
echo "=============================================="

# Criar diretório de backup
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Criando backup no diretório: $BACKUP_DIR"

# Backup da estrutura principal
echo "Realizando backup da estrutura principal..."
cp -r client "$BACKUP_DIR/"
cp -r server "$BACKUP_DIR/"
cp -r database "$BACKUP_DIR/"
cp -r scripts "$BACKUP_DIR/"

# Backup de arquivos de configuração
echo "Realizando backup de arquivos de configuração..."
cp .gitignore "$BACKUP_DIR/"
cp package.json "$BACKUP_DIR/"
cp docker-compose.yml "$BACKUP_DIR/" 2>/dev/null || echo "Arquivo docker-compose.yml não encontrado"
cp nginx.conf "$BACKUP_DIR/" 2>/dev/null || echo "Arquivo nginx.conf não encontrado"
cp render.yaml "$BACKUP_DIR/" 2>/dev/null || echo "Arquivo render.yaml não encontrado"

# Backup de documentação importante
echo "Realizando backup de documentação importante..."
cp README.md "$BACKUP_DIR/" 2>/dev/null || echo "Arquivo README.md não encontrado"
cp *.md "$BACKUP_DIR/" 2>/dev/null || echo "Nenhum arquivo .md encontrado na raiz"

# Backup de scripts importantes
echo "Realizando backup de scripts importantes..."
cp *.sh "$BACKUP_DIR/" 2>/dev/null || echo "Nenhum script .sh encontrado na raiz"
cp *.js "$BACKUP_DIR/" 2>/dev/null || echo "Nenhum script .js encontrado na raiz"

# Criar arquivo de informações do backup
cat > "$BACKUP_DIR/BACKUP_INFO.txt" << EOF
BACKUP DO PROJETO TRACKONE FINANCE
=================================

Data do backup: $(date)
Diretório original: $(pwd)

Conteúdo do backup:
- Código fonte do frontend (client/)
- Código fonte do backend (server/)
- Banco de dados e migrações (database/)
- Scripts de automação (scripts/)
- Arquivos de configuração
- Documentação

Este backup inclui todas as evoluções e implementações realizadas até a data acima.
EOF

# Compactar o backup
echo "Compactando backup..."
tar -czf "TrackeOneFinance_BACKUP_COMPLETO_$(date +%Y%m%d_%H%M%S).tar.gz" "$BACKUP_DIR"

# Remover diretório temporário
rm -rf "$BACKUP_DIR"

echo "Backup completo criado com sucesso!"
echo "Arquivo: TrackeOneFinance_BACKUP_COMPLETO_$(date +%Y%m%d_%H%M%S).tar.gz"