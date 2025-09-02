# 🛠️ Guia de Troubleshooting - Deploy do TrackeOne Finance

## 📋 Visão Geral

Este guia aborda os problemas mais comuns que podem ocorrer durante o deploy do TrackeOne Finance e fornece soluções para resolvê-los.

## 🚨 Problemas Comuns e Soluções

### 1. Erros de Build

#### 1.1. Erro: "Module not found"

**Sintomas**:
```
Error: Cannot find module 'X'
```

**Soluções**:
1. Verifique se todas as dependências estão instaladas:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
2. Verifique se há erros de digitação nos imports
3. Limpe o cache do npm:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

#### 1.2. Erro de TypeScript

**Sintomas**:
```
TS2307: Cannot find module 'X' or its corresponding type declarations
```

**Soluções**:
1. Verifique se os tipos estão instalados:
   ```bash
   npm install --save-dev @types/nome-do-pacote
   ```
2. Verifique as versões do TypeScript no client e server
3. Limpe o cache do TypeScript:
   ```bash
   cd client && rm -rf node_modules/.cache
   cd ../server && rm -rf node_modules/.cache
   ```

### 2. Problemas de Banco de Dados

#### 2.1. Erro de Conexão com PostgreSQL

**Sintomas**:
```
Error: connect ECONNREFUSED
```

**Soluções**:
1. Verifique a variável de ambiente `DATABASE_URL` no Render
2. Confirme que o banco de dados PostgreSQL está ativo
3. Verifique as credenciais de acesso
4. Teste a conexão localmente:
   ```bash
   # Substitua pela sua DATABASE_URL
   psql "postgresql://usuario:senha@host:porta/banco"
   ```

#### 2.2. Erro de Migração

**Sintomas**:
```
Error running migrations
```

**Soluções**:
1. Verifique os logs do Render para detalhes do erro
2. Confirme que o arquivo `database/initial_postgres.sql` está correto
3. Verifique se as migrações estão no formato correto para PostgreSQL
4. Teste as migrações localmente com um banco PostgreSQL

#### 2.3. Sequências não configuradas

**Sintomas**:
```
duplicate key value violates unique constraint
```

**Soluções**:
1. Ajuste as sequências após importação de dados:
   ```sql
   SELECT setval('tabela_id_seq', (SELECT MAX(id) FROM tabela));
   ```

### 3. Problemas de CORS

#### 3.1. Erro de CORS no Navegador

**Sintomas**:
```
Access to fetch at 'X' from origin 'Y' has been blocked by CORS policy
```

**Soluções**:
1. Verifique a configuração de CORS no `server/src/server.ts`:
   ```typescript
   app.use(cors({
     origin: [
       'http://localhost:3000',
       'https://seu-frontend.vercel.app'
     ],
     credentials: true
   }));
   ```
2. Confirme que a variável `VITE_API_URL` no Vercel está correta
3. Reinicie o serviço no Render após alterações

### 4. Problemas de Variáveis de Ambiente

#### 4.1. Variáveis não definidas

**Sintomas**:
```
process.env.VARIAVEL is undefined
```

**Soluções**:
1. Verifique se todas as variáveis de ambiente estão configuradas:
   - **Render (Backend)**:
     - `NODE_ENV=production`
     - `JWT_SECRET=sua_chave_secreta`
     - `DATABASE_URL=sua_url_do_banco`
     - `PORT=3001`
   - **Vercel (Frontend)**:
     - `VITE_API_URL=https://seu-backend.onrender.com/api`
2. Reinicie os serviços após alterar variáveis de ambiente

#### 4.2. Erro de JWT_SECRET

**Sintomas**:
```
Invalid JWT secret
```

**Soluções**:
1. Gere uma nova chave secreta:
   ```bash
   cd /Users/nataligiacherini/Development/TrackeOneFinance
   npm run generate-secure-jwt
   ```
2. Atualize a variável `JWT_SECRET` no Render com a nova chave

### 5. Problemas de Timeout (Sleep Mode)

#### 5.1. Serviço demora para responder

**Sintomas**:
- Primeira requisição demora muito
- Erros de timeout

**Soluções**:
1. Para ambiente de produção real, considere upgrade para plano pago no Render
2. Implemente um serviço de "keep alive":
   ```javascript
   // keep_alive.js
   const axios = require('axios');
   
   setInterval(() => {
     axios.get('https://seu-backend.onrender.com/api/test')
       .then(() => console.log('Keep alive ping enviado'))
       .catch(err => console.error('Erro no keep alive:', err.message));
   }, 5 * 60 * 1000); // A cada 5 minutos
   ```
3. Configure um serviço de monitoramento externo (como UptimeRobot)

### 6. Problemas de Deploy Automático

#### 6.1. Deploy não é acionado

**Sintomas**:
- Alterações no GitHub não disparam deploy automático

**Soluções**:
1. Verifique se o repositório está corretamente conectado ao Render/Vercel
2. Confirme que o branch correto está configurado (geralmente `main`)
3. Verifique as permissões do GitHub
4. Tente deploy manual:
   - **Render**: Manual Deploy > Deploy latest commit
   - **Vercel**: Redeploy

### 7. Problemas de Performance

#### 7.1. Aplicação lenta

**Sintomas**:
- Tempo de carregamento alto
- Queries demoradas

**Soluções**:
1. Verifique os índices do banco de dados:
   ```sql
   -- Verificar índices existentes
   \d tabela_nome
   
   -- Criar índices se necessário
   CREATE INDEX idx_tabela_campo ON tabela(campo);
   ```
2. Otimize queries complexas
3. Considere implementar caching
4. Monitore os logs para identificar gargalos

## 🧪 Ferramentas de Diagnóstico

### 1. Verificação Local

```bash
# Verificar estrutura do projeto
npm run deploy-check

# Testar API localmente
npm run test-api

# Verificar banco de dados
npm run check-db
```

### 2. Testes de Conectividade

```bash
# Testar conexão com backend
curl -X GET "https://seu-backend.onrender.com/api/test"

# Testar autenticação
curl -X POST "https://seu-backend.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@teste.com","password":"senha"}'
```

### 3. Logs e Monitoramento

#### 3.1. Logs do Render
1. Acesse o painel do Render
2. Navegue até o serviço
3. Verifique a aba "Logs"

#### 3.2. Logs do Vercel
1. Acesse o painel do Vercel
2. Navegue até o projeto
3. Verifique a aba "Functions"

## 🔄 Processo de Recuperação

### 1. Rollback de Deploy

Se um deploy causar problemas:

#### 1.1. No Render
1. Acesse o serviço no painel do Render
2. Vá para a aba "Manual Deploy"
3. Selecione um commit anterior estável
4. Clique em "Deploy"

#### 1.2. No Vercel
1. Acesse o projeto no painel do Vercel
2. Vá para "Deployments"
3. Encontre um deploy anterior estável
4. Clique em "Rollback to this Deployment"

### 2. Restauração de Banco de Dados

#### 2.1. Se tiver backup
1. Restaure o backup do banco de dados
2. Verifique a integridade dos dados
3. Reinicie os serviços

#### 2.2. Se não tiver backup
1. Recrie os dados manualmente
2. Importe dados de fontes externas
3. Considere implementar backups automáticos

## 📞 Suporte Adicional

### 1. Comunidade e Documentação
- Verifique a documentação oficial do [Render](https://render.com/docs)
- Verifique a documentação oficial do [Vercel](https://vercel.com/docs)
- Consulte a documentação do [PostgreSQL](https://www.postgresql.org/docs/)

### 2. Issues no GitHub
- Abra uma issue no repositório do projeto
- Forneça detalhes sobre o problema
- Inclua logs e capturas de tela quando possível

### 3. Contato com Desenvolvedores
- Entre em contato com a equipe de desenvolvimento
- Forneça informações detalhadas sobre o ambiente
- Descreva os passos para reproduzir o problema

## 📝 Registro de Problemas

Mantenha um registro dos problemas encontrados e suas soluções:

| Data | Problema | Solução | Ambiente |
|------|----------|---------|----------|
|      |          |         |          |

Isso ajudará na resolução de problemas futuros e na melhoria do processo de deploy.