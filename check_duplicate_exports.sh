#!/bin/bash

# Script para verificar exportações duplicadas em arquivos TypeScript
# Autor: Qoder
# Data: 31/08/2025

echo "=============================================="
echo "  Verificador de Exportações Duplicadas"
echo "=============================================="
echo ""

# Diretório raiz do projeto
PROJECT_DIR="/Users/nataligiacherini/Development/TrackeOneFinance"
CLIENT_DIR="$PROJECT_DIR/client"

# Contadores
total_files=0
problematic_files=0

# Cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Procura por arquivos com múltiplas exportações default
check_duplicate_exports() {
    local file=$1
    local file_rel=${file#"$PROJECT_DIR/"}
    
    # Contagem de exports default
    local count=$(grep -c "export default" "$file")
    
    if [ $count -gt 1 ]; then
        echo -e "${RED}[ERRO]${NC} Múltiplas exportações default em: ${YELLOW}$file_rel${NC}"
        echo "      Linhas com exportação default:"
        grep -n "export default" "$file" | sed 's/^/      /'
        echo ""
        ((problematic_files++))
        return 1
    fi
    
    # Verifique exportações nomeadas duplicadas
    local exports=$(grep -o "export.*{.*}" "$file" | grep -v "from" | tr -d ' ' | sed 's/export{//g' | sed 's/}//g')
    if [ -n "$exports" ]; then
        local names=$(echo "$exports" | tr ',' '\n' | sort)
        local duplicates=$(echo "$names" | uniq -d)
        
        if [ -n "$duplicates" ]; then
            echo -e "${RED}[ERRO]${NC} Exportações nomeadas duplicadas em: ${YELLOW}$file_rel${NC}"
            echo "      Nomes duplicados:"
            echo "$duplicates" | sed 's/^/      /'
            
            # Encontrar as linhas com as exportações duplicadas
            for name in $duplicates; do
                echo "      Exportações de '$name':"
                grep -n "export.*$name" "$file" | sed 's/^/      /'
            done
            echo ""
            ((problematic_files++))
            return 1
        fi
    fi
    
    return 0
}

echo "Verificando arquivos no diretório cliente..."

# Encontrar todos os arquivos .ts e .tsx
while IFS= read -r file; do
    ((total_files++))
    check_duplicate_exports "$file"
done < <(find "$CLIENT_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*")

echo "=============================================="
echo "Verificação concluída!"
if [ $problematic_files -eq 0 ]; then
    echo -e "${GREEN}Nenhum problema encontrado!${NC} Todos os $total_files arquivos estão corretos."
else
    echo -e "${RED}Problemas encontrados em $problematic_files arquivo(s)${NC} de um total de $total_files."
    echo ""
    echo "Como corrigir:"
    echo "1. Verifique cada arquivo problemático"
    echo "2. Mantenha apenas uma declaração 'export default' por arquivo"
    echo "3. Remova exportações duplicadas dos mesmos símbolos"
    echo "4. Execute este script novamente para confirmar as correções"
fi
echo "=============================================="