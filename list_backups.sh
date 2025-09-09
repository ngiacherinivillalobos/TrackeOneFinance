#!/bin/bash

echo "📋 === LISTA DE BACKUPS TRACKEONE FINANCE ==="
echo "📅 Data atual: $(date)"
echo ""

BACKUP_DIR="/Users/nataligiacherini/Development"

echo "🗂️  BACKUPS COMPACTADOS (*.tar.gz):"
echo "──────────────────────────────────────────"
ls -lah "$BACKUP_DIR" | grep "TrackeOneFinance.*\.tar\.gz" | while read -r line; do
    # Extrair informações
    filename=$(echo "$line" | awk '{print $9}')
    size=$(echo "$line" | awk '{print $5}')
    date=$(echo "$line" | awk '{print $6, $7, $8}')
    
    echo "📦 $filename"
    echo "   📏 Tamanho: $size"
    echo "   📅 Criado em: $date"
    echo ""
done

echo "📁 BACKUPS DESCOMPACTADOS (pastas):"
echo "──────────────────────────────────────────"
ls -la "$BACKUP_DIR" | grep "^d.*TrackeOneFinance_backup" | while read -r line; do
    # Extrair informações
    dirname=$(echo "$line" | awk '{print $9}')
    date=$(echo "$line" | awk '{print $6, $7, $8}')
    
    echo "📂 $dirname"
    echo "   📅 Criado em: $date"
    echo ""
done

echo "🗃️  BACKUPS INTERNOS (pasta backups/):"
echo "──────────────────────────────────────────"
INTERNAL_BACKUP_DIR="/Users/nataligiacherini/Development/TrackeOneFinance/backups"
if [ -d "$INTERNAL_BACKUP_DIR" ]; then
    ls -la "$INTERNAL_BACKUP_DIR" | grep "\.tsx\|\.ts\|\.sql" | tail -10 | while read -r line; do
        filename=$(echo "$line" | awk '{print $9}')
        size=$(echo "$line" | awk '{print $5}')
        date=$(echo "$line" | awk '{print $6, $7, $8}')
        
        echo "📄 $filename"
        echo "   📏 $size bytes"
        echo "   📅 $date"
        echo ""
    done
else
    echo "❌ Pasta backups/ não encontrada"
fi

echo "🔥 BACKUP MAIS RECENTE:"
echo "──────────────────────────────────────────"
latest_backup=$(ls -t "$BACKUP_DIR"/TrackeOneFinance*.tar.gz 2>/dev/null | head -1)
if [ -n "$latest_backup" ]; then
    latest_info=$(ls -lah "$latest_backup")
    filename=$(basename "$latest_backup")
    size=$(echo "$latest_info" | awk '{print $5}')
    date=$(echo "$latest_info" | awk '{print $6, $7, $8}')
    
    echo "🌟 $filename"
    echo "   📏 Tamanho: $size"
    echo "   📅 Criado em: $date"
    echo "   📂 Localização: $latest_backup"
    echo ""
    echo "🔄 Para restaurar:"
    echo "   tar -xzf \"$latest_backup\""
else
    echo "❌ Nenhum backup encontrado"
fi

echo "💾 ESPAÇO EM DISCO:"
echo "──────────────────────────────────────────"
df -h "$BACKUP_DIR" | tail -1 | awk '{print "💿 Disponível: " $4 " de " $2 " (" $5 " usado)"}'

echo ""
echo "✅ Lista de backups concluída!"
