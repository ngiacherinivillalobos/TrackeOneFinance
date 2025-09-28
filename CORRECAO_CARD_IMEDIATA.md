# 🔥 CORREÇÃO IMEDIATA - ERRO 500 AO SALVAR CARTÕES

## ❌ PROBLEMA
**Erro:** `value too long for type character varying(4)`  
**Causa:** Campo `card_number` na tabela `cards` limitado a 4 caracteres no PostgreSQL de produção

## ✅ SOLUÇÕES APLICADAS

### 1. CORREÇÃO AUTOMÁTICA VIA API
**Endpoint criado:** `POST /api/cards/fix-card-number-length`

```bash
# Testar após redeploy (aguardar ~5 minutos)
curl -X POST https://ngvtech.com.br/api/cards/fix-card-number-length \
  -H "Content-Type: application/json"
```

### 2. CORREÇÃO MANUAL NO RENDER
1. Acesse o painel do PostgreSQL no Render
2. Abra o Query Console
3. Execute o comando:
```sql
ALTER TABLE cards ALTER COLUMN card_number TYPE VARCHAR(20);
```

### 3. SCRIPT DE VERIFICAÇÃO
Execute depois da correção:
```sql
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'cards' AND column_name = 'card_number';
```

**Resultado esperado:** `character_maximum_length = 20`

## 📋 STATUS
- ✅ Código corrigido e enviado para o GitHub
- 🔄 Render fazendo redeploy automático (aguardar ~5 minutos)
- ⏳ Teste do endpoint após redeploy

## 🧪 TESTE RÁPIDO
Após o redeploy, execute:
```bash
node test_card_fix.js
```

## ⚠️ RESULTADO ESPERADO
Após a correção, os cartões poderão ser salvos com números de até 20 caracteres, resolvendo o erro 500.