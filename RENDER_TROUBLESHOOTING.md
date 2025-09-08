# 🔧 Troubleshooting Render Deploy

## 🚨 Status Atual: Failed Deploy

O serviço `trackeone-finance-api` está com falha no deploy. Vamos resolver:

## 🛠️ Soluções Rápidas

### 1. **Forçar Redeploy Automático**
```bash
./force-deploy.sh
```

### 2. **Deploy Manual no Dashboard**
1. Acesse: https://dashboard.render.com
2. Clique em `trackeone-finance-api`
3. Vá para a aba **"Manual Deploy"**
4. Clique em **"Deploy latest commit"**

### 3. **Verificar Logs do Deploy**
1. No dashboard do Render
2. Clique em `trackeone-finance-api`
3. Vá para **"Logs"**
4. Procure por erros na inicialização

## 🔍 Diagnóstico de Problemas

### ✅ **Últimas Correções Aplicadas:**
- ✅ TypeScript config corrigido
- ✅ Dependências de tipos movidas para production
- ✅ Migração PostgreSQL simplificada
- ✅ Parser de SQL compatível

### 🎯 **Possíveis Causas da Falha:**

#### 1. **Problema de Build**
```bash
# No terminal local, teste:
cd server && npm run build
```

#### 2. **Problema de Migração**
- Migração PostgreSQL pode estar falhando
- Verificar logs específicos da migração

#### 3. **Variáveis de Ambiente**
- `DATABASE_URL` do PostgreSQL
- `JWT_SECRET`
- `PORT` e `NODE_ENV`

#### 4. **Dependências Node.js**
- Versão Node.js incompatível
- Dependências em cache

## 🔄 **Ações de Recuperação**

### Opção 1: **Clear Cache + Redeploy**
1. Dashboard Render → Settings
2. **"Clear build cache"**
3. **"Manual deploy"**

### Opção 2: **Verificar render.yaml**
```yaml
services:
  - type: web
    name: trackeone-finance-api
    env: node
    plan: free
    rootDir: server
    buildCommand: npm install && npm run build
    startCommand: npm start
```

### Opção 3: **Debug Local com PostgreSQL**
```bash
# Simular ambiente de produção:
export NODE_ENV=production
export DATABASE_URL="postgresql://localhost/test"
npm start
```

## 📊 **Monitoramento**

### **URLs para Verificar:**
- 🔗 **Render Dashboard**: https://dashboard.render.com
- 🔗 **GitHub Commits**: https://github.com/ngiacherinivillalobos/TrackeOneFinance/commits/main
- 🔗 **Health Check**: https://trackeone-finance-api.onrender.com/api/health (quando funcionando)

### **Comandos de Teste:**
```bash
# Testar health do serviço
curl https://trackeone-finance-api.onrender.com/api/health

# Verificar status do banco
curl https://trackeone-finance-api.onrender.com/api/test
```

## 🚀 **Deploy Bem-Sucedido - Checklist**

### ✅ **Sinais de Sucesso:**
- [ ] Status "Live" no dashboard
- [ ] Logs mostram "Server running on port 3001"
- [ ] Health check responde
- [ ] Database conectado
- [ ] Migrações aplicadas

### ❌ **Sinais de Problema:**
- [ ] Status "Failed deploy"
- [ ] Logs mostram erros TypeScript
- [ ] Timeout de conexão
- [ ] Erro de migração PostgreSQL

## 📞 **Se Nada Funcionar:**

1. **Verificar logs completos** no Render Dashboard
2. **Testar build local** completo
3. **Verificar compatibilidade** Node.js
4. **Contatar suporte** Render se necessário

---

## 🎯 **Status Esperado Após Correção:**
```
✅ trackeone-finance-api: Live
✅ trackeone-finance-db: Available 
✅ Health check: 200 OK
✅ Frontend conectado
```
