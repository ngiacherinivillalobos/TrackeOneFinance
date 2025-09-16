#!/bin/bash

# TrackeOneFinance - Backup Completo da Evolução do Projeto
# Data: $(date '+%Y-%m-%d %H:%M:%S')
# Descrição: Backup abrangente incluindo código, banco de dados, configurações e documentação

set -e  # Parar execução em caso de erro

# Configurações
PROJECT_NAME="TrackeOneFinance"
BACKUP_DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="/Users/nataligiacherini/Development/TrackeOneFinance_BACKUP_EVOLUTION_$BACKUP_DATE"
SOURCE_DIR="/Users/nataligiacherini/Development/TrackeOneFinance"

echo "🚀 Iniciando backup completo da evolução do $PROJECT_NAME"
echo "📅 Data/Hora: $(date '+%Y-%m-%d %H:%M:%S')"
echo "📂 Diretório de backup: $BACKUP_DIR"
echo "📍 Diretório origem: $SOURCE_DIR"

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# 1. BACKUP DO CÓDIGO FONTE COMPLETO
echo ""
echo "📋 1. COPIANDO CÓDIGO FONTE COMPLETO..."
rsync -av --exclude='node_modules' \
          --exclude='.git' \
          --exclude='dist' \
          --exclude='build' \
          --exclude='.next' \
          --exclude='coverage' \
          --exclude='.nyc_output' \
          --exclude='*.log' \
          --exclude='*.tmp' \
          --exclude='.DS_Store' \
          "$SOURCE_DIR/" "$BACKUP_DIR/source/"

echo "✅ Código fonte copiado com sucesso"

# 2. BACKUP DO BANCO DE DADOS
echo ""
echo "🗃️ 2. FAZENDO BACKUP DO BANCO DE DADOS..."
mkdir -p "$BACKUP_DIR/database"

# Backup do SQLite
if [ -f "$SOURCE_DIR/database/track_one_finance.db" ]; then
    cp "$SOURCE_DIR/database/track_one_finance.db" "$BACKUP_DIR/database/track_one_finance_backup_$BACKUP_DATE.db"
    echo "✅ Backup do banco SQLite criado"
    
    # Criar dump SQL para legibilidade
    sqlite3 "$SOURCE_DIR/database/track_one_finance.db" .dump > "$BACKUP_DIR/database/track_one_finance_dump_$BACKUP_DATE.sql"
    echo "✅ Dump SQL criado"
else
    echo "⚠️ Banco de dados SQLite não encontrado"
fi

# Backup de outros arquivos de banco se existirem
if [ -f "$SOURCE_DIR/server/database/track_one_finance.db" ]; then
    cp "$SOURCE_DIR/server/database/track_one_finance.db" "$BACKUP_DIR/database/server_track_one_finance_backup_$BACKUP_DATE.db"
    echo "✅ Backup do banco do servidor criado"
fi

# 3. BACKUP DA DOCUMENTAÇÃO E LOGS
echo ""
echo "📚 3. COPIANDO DOCUMENTAÇÃO E LOGS..."
mkdir -p "$BACKUP_DIR/documentation"

# Copiar todos os arquivos de documentação
find "$SOURCE_DIR" -maxdepth 1 -name "*.md" -exec cp {} "$BACKUP_DIR/documentation/" \;
find "$SOURCE_DIR" -maxdepth 1 -name "*.txt" -exec cp {} "$BACKUP_DIR/documentation/" \;
find "$SOURCE_DIR" -maxdepth 1 -name "*README*" -exec cp {} "$BACKUP_DIR/documentation/" \;
find "$SOURCE_DIR" -maxdepth 1 -name "*DEPLOY*" -exec cp {} "$BACKUP_DIR/documentation/" \;
find "$SOURCE_DIR" -maxdepth 1 -name "*BACKUP*" -exec cp {} "$BACKUP_DIR/documentation/" \;
find "$SOURCE_DIR" -maxdepth 1 -name "*GUIDE*" -exec cp {} "$BACKUP_DIR/documentation/" \;
find "$SOURCE_DIR" -maxdepth 1 -name "*MILESTONE*" -exec cp {} "$BACKUP_DIR/documentation/" \;

echo "✅ Documentação copiada"

# 4. INFORMAÇÕES DO SISTEMA E DEPENDÊNCIAS
echo ""
echo "🔧 4. COLETANDO INFORMAÇÕES DO SISTEMA..."
mkdir -p "$BACKUP_DIR/system_info"

# Informações do Node.js
echo "Node.js Version:" > "$BACKUP_DIR/system_info/system_info.txt"
node --version >> "$BACKUP_DIR/system_info/system_info.txt" 2>/dev/null || echo "Node.js não encontrado" >> "$BACKUP_DIR/system_info/system_info.txt"

echo "" >> "$BACKUP_DIR/system_info/system_info.txt"
echo "NPM Version:" >> "$BACKUP_DIR/system_info/system_info.txt"
npm --version >> "$BACKUP_DIR/system_info/system_info.txt" 2>/dev/null || echo "NPM não encontrado" >> "$BACKUP_DIR/system_info/system_info.txt"

echo "" >> "$BACKUP_DIR/system_info/system_info.txt"
echo "Sistema Operacional:" >> "$BACKUP_DIR/system_info/system_info.txt"
uname -a >> "$BACKUP_DIR/system_info/system_info.txt"

# Backup dos package.json
if [ -f "$SOURCE_DIR/package.json" ]; then
    cp "$SOURCE_DIR/package.json" "$BACKUP_DIR/system_info/root_package.json"
fi

if [ -f "$SOURCE_DIR/server/package.json" ]; then
    cp "$SOURCE_DIR/server/package.json" "$BACKUP_DIR/system_info/server_package.json"
fi

if [ -f "$SOURCE_DIR/client/package.json" ]; then
    cp "$SOURCE_DIR/client/package.json" "$BACKUP_DIR/system_info/client_package.json"
fi

echo "✅ Informações do sistema coletadas"

# 5. ESTRUTURA DO PROJETO
echo ""
echo "🏗️ 5. DOCUMENTANDO ESTRUTURA DO PROJETO..."

# Criar árvore de arquivos
tree "$SOURCE_DIR" -I 'node_modules|.git|dist|build|.next|coverage' > "$BACKUP_DIR/system_info/project_structure.txt" 2>/dev/null || \
find "$SOURCE_DIR" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/build/*" > "$BACKUP_DIR/system_info/file_list.txt"

echo "✅ Estrutura do projeto documentada"

# 6. BACKUP DOS SCRIPTS E CONFIGURAÇÕES
echo ""
echo "⚙️ 6. COPIANDO SCRIPTS E CONFIGURAÇÕES..."
mkdir -p "$BACKUP_DIR/scripts"

# Copiar scripts de deploy e backup
find "$SOURCE_DIR" -maxdepth 1 -name "*.sh" -exec cp {} "$BACKUP_DIR/scripts/" \;
find "$SOURCE_DIR" -maxdepth 1 -name "*.js" -name "*check*" -exec cp {} "$BACKUP_DIR/scripts/" \; 2>/dev/null || true
find "$SOURCE_DIR" -maxdepth 1 -name "*.js" -name "*deploy*" -exec cp {} "$BACKUP_DIR/scripts/" \; 2>/dev/null || true
find "$SOURCE_DIR" -maxdepth 1 -name "*.js" -name "*backup*" -exec cp {} "$BACKUP_DIR/scripts/" \; 2>/dev/null || true

# Copiar arquivos de configuração
if [ -f "$SOURCE_DIR/docker-compose.yml" ]; then
    cp "$SOURCE_DIR/docker-compose.yml" "$BACKUP_DIR/scripts/"
fi

if [ -f "$SOURCE_DIR/nginx.conf" ]; then
    cp "$SOURCE_DIR/nginx.conf" "$BACKUP_DIR/scripts/"
fi

if [ -f "$SOURCE_DIR/render.yaml" ]; then
    cp "$SOURCE_DIR/render.yaml" "$BACKUP_DIR/scripts/"
fi

echo "✅ Scripts e configurações copiados"

# 7. ESTATÍSTICAS DO BANCO DE DADOS
echo ""
echo "📊 7. COLETANDO ESTATÍSTICAS DO BANCO..."

if [ -f "$SOURCE_DIR/database/track_one_finance.db" ]; then
    {
        echo "=== ESTATÍSTICAS DO BANCO DE DADOS ==="
        echo "Data do backup: $(date)"
        echo ""
        
        echo "=== TABELAS ==="
        sqlite3 "$SOURCE_DIR/database/track_one_finance.db" ".tables"
        echo ""
        
        echo "=== CONTAGEM DE REGISTROS ==="
        sqlite3 "$SOURCE_DIR/database/track_one_finance.db" "SELECT 'transactions', COUNT(*) FROM transactions;"
        sqlite3 "$SOURCE_DIR/database/track_one_finance.db" "SELECT 'users', COUNT(*) FROM users;" 2>/dev/null || echo "Tabela users não existe"
        sqlite3 "$SOURCE_DIR/database/track_one_finance.db" "SELECT 'categories', COUNT(*) FROM categories;" 2>/dev/null || echo "Tabela categories não existe"
        sqlite3 "$SOURCE_DIR/database/track_one_finance.db" "SELECT 'contacts', COUNT(*) FROM contacts;" 2>/dev/null || echo "Tabela contacts não existe"
        echo ""
        
        echo "=== ÚLTIMAS TRANSAÇÕES ==="
        sqlite3 "$SOURCE_DIR/database/track_one_finance.db" "SELECT id, description, amount, type, transaction_date FROM transactions ORDER BY created_at DESC LIMIT 10;" 2>/dev/null || echo "Erro ao buscar transações"
        echo ""
        
        echo "=== RESUMO POR TIPO ==="
        sqlite3 "$SOURCE_DIR/database/track_one_finance.db" "SELECT type, COUNT(*), SUM(amount) FROM transactions GROUP BY type;" 2>/dev/null || echo "Erro ao calcular resumo"
        
    } > "$BACKUP_DIR/database/database_statistics.txt"
    
    echo "✅ Estatísticas do banco coletadas"
else
    echo "⚠️ Banco não encontrado para estatísticas"
fi

# 8. RELATÓRIO FINAL
echo ""
echo "📋 8. GERANDO RELATÓRIO FINAL..."

{
    echo "====================================================================="
    echo "RELATÓRIO DE BACKUP COMPLETO - TRACKEONE FINANCE"
    echo "====================================================================="
    echo ""
    echo "📅 Data/Hora do Backup: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "🏷️ Nome do Backup: TrackeOneFinance_BACKUP_EVOLUTION_$BACKUP_DATE"
    echo "📂 Local do Backup: $BACKUP_DIR"
    echo "📍 Projeto Original: $SOURCE_DIR"
    echo ""
    echo "====================================================================="
    echo "ESTRUTURA DO BACKUP:"
    echo "====================================================================="
    echo ""
    echo "📁 source/              - Código fonte completo (exceto node_modules)"
    echo "📁 database/            - Backup do banco SQLite + dump SQL"
    echo "📁 documentation/       - Todos os arquivos .md, guias e documentação"
    echo "📁 scripts/             - Scripts de deploy, backup e configurações"
    echo "📁 system_info/         - Informações do sistema, dependências e estrutura"
    echo ""
    echo "====================================================================="
    echo "ARQUIVOS IMPORTANTES INCLUÍDOS:"
    echo "====================================================================="
    echo ""
    echo "🗃️ BANCO DE DADOS:"
    ls -la "$BACKUP_DIR/database/" 2>/dev/null || echo "Nenhum arquivo de banco encontrado"
    echo ""
    echo "📚 DOCUMENTAÇÃO:"
    ls -la "$BACKUP_DIR/documentation/" | head -20
    echo ""
    echo "⚙️ SCRIPTS:"
    ls -la "$BACKUP_DIR/scripts/" 2>/dev/null || echo "Nenhum script encontrado"
    echo ""
    echo "====================================================================="
    echo "TAMANHO DO BACKUP:"
    echo "====================================================================="
    echo ""
    du -sh "$BACKUP_DIR"
    echo ""
    echo "====================================================================="
    echo "VERIFICAÇÃO DE INTEGRIDADE:"
    echo "====================================================================="
    echo ""
    echo "Total de arquivos copiados: $(find "$BACKUP_DIR" -type f | wc -l)"
    echo "Total de diretórios criados: $(find "$BACKUP_DIR" -type d | wc -l)"
    echo ""
    echo "====================================================================="
    echo "PRINCIPAIS FUNCIONALIDADES PRESERVADAS:"
    echo "====================================================================="
    echo ""
    echo "✅ Sistema de autenticação e autorização"
    echo "✅ Controle Mensal com filtros avançados"
    echo "✅ Dashboard com totalizadores corrigidos"
    echo "✅ Sistema de pagamento de transações"
    echo "✅ Gestão de categorias, subcategorias e contatos"
    echo "✅ Gestão de centros de custo"
    echo "✅ Sistema de metas de economia"
    echo "✅ Fluxo de caixa integrado"
    echo "✅ Configurações de contas bancárias"
    echo "✅ Sistema responsivo com Material-UI"
    echo "✅ API REST completa com SQLite"
    echo "✅ Deployment configurado para Render"
    echo ""
    echo "====================================================================="
    echo "MELHORIAS RECENTES IMPLEMENTADAS:"
    echo "====================================================================="
    echo ""
    echo "🔧 Correção dos totalizadores (Receitas e Despesas do Mês)"
    echo "🔧 Ajuste do totalizador 'Economizado até agora'"
    echo "🔧 Separação de dados filtrados vs. não filtrados"
    echo "🔧 Melhoria na consistência entre ambientes (dev/prod)"
    echo "🔧 Otimização das consultas de transações"
    echo ""
    echo "====================================================================="
    echo "INSTRUÇÕES DE RESTAURAÇÃO:"
    echo "====================================================================="
    echo ""
    echo "1. Extrair o backup para o local desejado"
    echo "2. Navegar até o diretório source/"
    echo "3. Instalar dependências: npm install (raiz, server/ e client/)"
    echo "4. Restaurar banco de dados da pasta database/"
    echo "5. Configurar variáveis de ambiente se necessário"
    echo "6. Executar: npm run dev"
    echo ""
    echo "====================================================================="
    echo "BACKUP CONCLUÍDO COM SUCESSO!"
    echo "====================================================================="
    echo ""
    echo "📧 Em caso de dúvidas, verificar a documentação em documentation/"
    echo "🔍 Para logs detalhados, verificar os arquivos *.md do projeto"
    echo ""
    echo "Backup finalizado em: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
} > "$BACKUP_DIR/BACKUP_REPORT.txt"

# 9. CRIAR ARQUIVO COMPACTADO
echo ""
echo "📦 9. COMPACTANDO BACKUP..."

cd "/Users/nataligiacherini/Development"
tar -czf "TrackeOneFinance_BACKUP_EVOLUTION_${BACKUP_DATE}.tar.gz" "TrackeOneFinance_BACKUP_EVOLUTION_$BACKUP_DATE"

BACKUP_SIZE=$(du -sh "TrackeOneFinance_BACKUP_EVOLUTION_${BACKUP_DATE}.tar.gz" | cut -f1)

echo "✅ Backup compactado criado: TrackeOneFinance_BACKUP_EVOLUTION_${BACKUP_DATE}.tar.gz"
echo "📏 Tamanho do arquivo: $BACKUP_SIZE"

# 10. RESUMO FINAL
echo ""
echo "🎉 =========================================="
echo "🎉 BACKUP COMPLETO FINALIZADO COM SUCESSO!"
echo "🎉 =========================================="
echo ""
echo "📅 Data: $(date '+%Y-%m-%d %H:%M:%S')"
echo "📁 Pasta do backup: $BACKUP_DIR"
echo "📦 Arquivo compactado: TrackeOneFinance_BACKUP_EVOLUTION_${BACKUP_DATE}.tar.gz"
echo "📏 Tamanho: $BACKUP_SIZE"
echo ""
echo "📋 Relatório completo disponível em:"
echo "    $BACKUP_DIR/BACKUP_REPORT.txt"
echo ""
echo "✨ O backup inclui:"
echo "   • Código fonte completo"
echo "   • Banco de dados SQLite + dump SQL"
echo "   • Toda documentação e guias"
echo "   • Scripts de deploy e configuração"
echo "   • Informações do sistema e dependências"
echo "   • Estatísticas do banco de dados"
echo ""
echo "🚀 Projeto TrackeOneFinance totalmente preservado!"
echo ""