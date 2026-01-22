# 🚀 Guia de Deploy 2FA em Produção

## ✅ Checklist Pré-Deploy

Antes de fazer o deploy, certifique-se de:

- [ ] Todas as dependências foram instaladas localmente (`npm install`)
- [ ] Migration foi testada localmente
- [ ] Testes passaram sem erro (`node test_two_factor_auth.js`)
- [ ] Código foi commitado e pusheado para GitHub
- [ ] Variáveis de ambiente estão configuradas

---

## 📋 Passo a Passo para Deploy

### 1️⃣ Preparar o Código

```bash
# No diretório raiz do projeto
cd server

# Instalar dependências (inclui speakeasy e qrcode)
npm install

# Compilar TypeScript
npm run build

# Voltar para raiz
cd ..

# Fazer commit das mudanças
git add .
git commit -m "feat: implementar autenticação em dois fatores (2FA) com TOTP"

# Push para GitHub
git push origin main
```

### 2️⃣ Deploy Backend (Render)

#### Opção A: Render fará automaticamente (se configurado com CI/CD)

Se você já tem CI/CD configurado no Render:
1. O Render detectará o push para GitHub
2. Fará build automaticamente
3. Deploy será realizado

#### Opção B: Manual via Render Dashboard

1. Acesse [render.com](https://render.com)
2. Vá para seu Web Service "trackeone-finance-api"
3. Clique em "Manual Deploy" > "Deploy latest commit"
4. Aguarde o build completar

### 3️⃣ Aplicar Migration em Produção

Após o backend estar online:

```bash
# Opção 1: Via Terminal do Render
# (Render Dashboard → Web Service → Shell)

# Se usando PostgreSQL:
DB_TYPE=postgres DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=... node database/migrations/add_two_factor_support.js

# Se usando SQLite:
node database/migrations/add_two_factor_support.js
```

**Importante**: Configure as variáveis de ambiente antes!

### 4️⃣ Verificar Variáveis de Ambiente

No seu Render Dashboard, em "Environment":

```
JWT_SECRET=<sua-chave-secreta>
NODE_ENV=production
PORT=10000
DATABASE_URL=<url-postgres-se-usar>
DB_TYPE=postgres  (ou sqlite)
```

### 5️⃣ Deploy Frontend (Vercel)

1. Acesse [vercel.com](https://vercel.com)
2. Seu projeto deve detectar o push automaticamente
3. Clique em "Deployments" e aguarde
4. Se não detectar, clique "Redeploy" no último deployment

### 6️⃣ Verificar Deploy

#### Backend
```bash
# Testar API health
curl https://trackeone-finance-api.onrender.com/api/health

# Testar login (sem 2FA)
curl -X POST https://trackeone-finance-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

#### Frontend
1. Acesse sua URL no Vercel
2. Tente fazer login
3. Vá para Configurações > Segurança
4. Deve haver opção de "Configurar 2FA"

---

## 🔧 Troubleshooting de Deploy

### Erro: "Module not found: speakeasy"

**Causa**: Dependências não foram instaladas  
**Solução**:
```bash
cd server
npm install speakeasy qrcode
npm run build
git push
```

### Erro: "Cannot find migration file"

**Causa**: Arquivo de migration não foi feito push  
**Solução**:
```bash
# Verifique se o arquivo existe
ls database/migrations/add_two_factor_support.js

# Faça o commit e push
git add database/migrations/add_two_factor_support.js
git commit -m "feat: adicionar migration de 2FA"
git push
```

### Erro: "Database error during migration"

**Causa**: Variáveis de ambiente incorretas  
**Solução**:
1. Acesse Render Dashboard
2. Verifique variáveis em "Environment"
3. Para PostgreSQL, use: `postgresql://user:pass@host:5432/db`
4. Execute novamente a migration

### Erro: "2FA button not showing"

**Causa**: Frontend não foi atualizado  
**Solução**:
1. Verifique se o frontend foi deployado com sucesso
2. Limpe cache: Ctrl+Shift+Del (ou Cmd+Shift+Del)
3. Recarregue a página (F5)
4. Verifique console (F12) para erros

---

## 🧪 Teste em Produção

Após o deploy estar online:

```bash
# 1. Criar conta de teste (ou usar existente)
# Acesse https://ngvtech.com.br e faça login

# 2. Ir para Configurações > Segurança
# 3. Clique em "Configurar 2FA"
# 4. Escaneie o QR code com seu autenticador
# 5. Digite o código
# 6. Clique "Confirmar"

# 7. Desça do site
# 8. Faça login novamente
# 9. Deve pedir o código 2FA
# 10. Digite e confirme

# ✓ Sucesso!
```

---

## 📊 Monitoramento Pós-Deploy

### Render Dashboard

Monitore:
- **Build Logs**: Verifique se não há erros
- **Runtime Logs**: Procure por erros de 2FA
- **Metrics**: CPU, memória, latência

```bash
# Ver logs em tempo real (via terminal Render)
tail -f /var/log/app.log | grep -i "2fa\|auth"
```

### Frontend (Vercel)

- Verifique na aba "Deployments" se o build foi bem-sucedido
- Clique em "Logs" para ver erros

### Erros Comuns em Log

```
ERROR: two_factor_enabled column not found
→ Migration não foi aplicada

ERROR: Cannot find module 'speakeasy'
→ npm install não foi executado

ERROR: Invalid 2FA code
→ Relógio do servidor está dessincronizado
```

---

## 🔒 Segurança em Produção

### Após o Deploy

1. **Encripte Secrets**:
   ```javascript
   // Em authController.ts, adicione encriptação:
   const crypto = require('crypto');
   const encryptedSecret = crypto.encrypt(secret);
   ```

2. **HTTPS Obrigatório**:
   - ✅ Render: Automático com wildcard SSL
   - ✅ Vercel: Automático
   - ✓ Verificar: Tudo em seu site deve usar HTTPS

3. **Rate Limiting**:
   ```typescript
   // Adicione em server/src/server.ts
   import rateLimit from 'express-rate-limit';
   
   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5 // 5 tentativas por IP
   });
   
   router.post('/auth/login', loginLimiter, ...);
   ```

4. **Headers de Segurança**:
   ```typescript
   app.use((req, res, next) => {
     res.setHeader('X-Content-Type-Options', 'nosniff');
     res.setHeader('X-Frame-Options', 'DENY');
     res.setHeader('X-XSS-Protection', '1; mode=block');
     next();
   });
   ```

5. **Backup de Código de Recuperação** (Futuro):
   - Implementar códigos que podem ser usados se o usuário perder acesso

---

## 📝 Rollback (Se Necessário)

Se algo der errado, você pode reverter:

```bash
# Reverter último commit
git revert HEAD
git push

# Ou reverter para uma versão anterior
git reset --hard <commit-hash>
git push -f origin main

# Render fará redeploy automaticamente
```

---

## ✅ Após Deploy Bem-Sucedido

1. ✓ Teste login com 2FA
2. ✓ Teste desabilitar 2FA
3. ✓ Teste código inválido
4. ✓ Teste interface de segurança
5. ✓ Verifique logs do servidor
6. ✓ Notifique usuários sobre 2FA opcional
7. ✓ Considere tornar 2FA obrigatório para admins

---

## 📢 Anúncio aos Usuários

Exemplo de comunicado:

> **🔐 Nova Funcionalidade: Autenticação em Dois Fatores (2FA)**
>
> Estamos felizes em anunciar a disponibilidade de 2FA para sua conta TrackOne Finance!
>
> **O que é 2FA?**
> Adiciona uma camada extra de segurança pedindo um código de 6 dígitos ao fazer login.
>
> **Como ativar?**
> 1. Vá para Configurações > Segurança
> 2. Clique em "Configurar 2FA"
> 3. Escaneie o código QR com seu autenticador
> 4. Confirme com o código gerado
>
> **Aplicativos Recomendados:**
> - Google Authenticator
> - Microsoft Authenticator
> - Authy
>
> **⚠️ Importante**: Guarde seus códigos de backup em local seguro!

---

## 🆘 Suporte Técnico

Se encontrar problemas:

1. **Verifique os logs**:
   - Render: Dashboard > Web Service > Logs
   - Vercel: Deployments > Logs

2. **Teste localmente**:
   ```bash
   npm run dev
   node test_two_factor_auth.js
   ```

3. **Consulte documentação**:
   - TWO_FACTOR_AUTH_GUIDE.md
   - IMPLEMENTATION_2FA_SUMMARY.md

4. **Reset manual** (último recurso):
   ```bash
   # Remover 2FA de um usuário (via banco de dados)
   UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL 
   WHERE email = 'user@example.com';
   ```

---

## 📅 Agenda de Rollout (Recomendado)

- **Semana 1**: Deploy silencioso (apenas para admin)
- **Semana 2**: Disponível como opcional para todos
- **Semana 3-4**: Teste com grupo de beta testers
- **Semana 5+**: 2FA obrigatório para admins (opcional para usuários)

---

**Data de Deployment**: _______________  
**Responsável**: _______________  
**Status**: ⬜ Planejado | ⬜ Em Progresso | ⬜ Completo

---

*Última atualização: Janeiro 2026*  
*Versão: 1.0.0*
