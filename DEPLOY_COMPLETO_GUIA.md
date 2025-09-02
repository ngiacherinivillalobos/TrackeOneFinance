# 🚀 Guia Completo para Deploy em Produção - TrackeOne Finance

## 📋 Visão Geral

Este guia detalha o processo completo para fazer o deploy da aplicação TrackeOne Finance em produção, utilizando:

- **Frontend**: Vercel (https://vercel.com)
- **Backend**: Render (https://render.com)
- **Banco de Dados**: PostgreSQL (fornecido pelo Render)

## ⚙️ Passo 1: Preparação do Código

### 1.1. Verificação Final do Código

Antes de fazer o deploy, certifique-se de que todas as alterações estão salvas:

```bash
cd /Users/nataligiacherini/Development/TrackeOneFinance
git add .
git commit -m "Preparação final para produção"
git push origin main
```

### 1.2. Verificação das Variáveis de Ambiente

Verifique se os arquivos `.env` estão configurados corretamente:

**server/.env** (para desenvolvimento local):
```env
DATABASE_PATH=database/track_one_finance.db
JWT_SECRET=trackeone_finance_secret_key_2025
PORT=3001
NODE_ENV=development
```

**client/.env** (para desenvolvimento local):
```env
VITE_API_URL=http://localhost:3001
```

## 🗄 Passo 2: Configuração do Banco de Dados PostgreSQL no Render

### 2.1. Criar Banco de Dados PostgreSQL

1. Acesse [render.com](https://render.com) e faça login
2. Clique em "New" > "PostgreSQL"
3. Configure as opções:
   - **Name**: `trackeone-finance-db`
   - **Region**: Ohio (US East) - recomendado para menor latência
   - **Plan**: Free (para começar)
4. Clique em "Create Database"
5. Aguarde a criação do banco de dados (pode levar alguns minutos)

### 2.2. Anotar Informações de Conexão

Após a criação, anote as seguintes informações na aba "Info":
- **External Database URL**: Será usado como `DATABASE_URL`
- **User**: Nome de usuário do banco
- **Password**: Senha do banco
- **Hostname**: Endereço do servidor

## ☁️ Passo 3: Deploy do Backend no Render

### 3.1. Criar Web Service

1. No painel do Render, clique em "New" > "Web Service"
2. Conecte sua conta do GitHub e selecione o repositório `ngiacherinivillalobos/TrackeOneFinance`
3. Configure as opções:

**Basic Settings:**
- **Name**: `trackeone-finance-api`
- **Region**: Ohio (US East)
- **Branch**: main
- **Root Directory**: `server`
- **Environment**: Node

**Build Settings:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3.2. Configurar Variáveis de Ambiente

Na seção "Advanced" > "Environment Variables", adicione:

```
NODE_ENV=production
JWT_SECRET=sua_chave_secreta_segura_aqui (use uma chave forte)
DATABASE_URL=cole_aqui_a_URL_do_banco_de_dados_PostgreSQL
PORT=3001
```

### 3.3. Deploy

1. Clique em "Create Web Service"
2. Aguarde o processo de build e deploy (pode levar 5-10 minutos)
3. Acompanhe os logs na aba "Logs" para verificar se tudo está funcionando

### 3.4. Verificação do Deploy do Backend

Após o deploy bem-sucedido:
1. Anote a URL do serviço (algo como: `https://trackeone-finance-api.onrender.com`)
2. Teste o endpoint básico:
   ```bash
   curl https://trackeone-finance-api.onrender.com/api/test
   ```
   Deve retornar: `{"message": "Server is working!", "timestamp": "..."}`

## 🌐 Passo 4: Deploy do Frontend no Vercel

### 4.1. Criar Projeto no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "New Project"
3. Clique em "Import" e selecione o repositório `ngiacherinivillalobos/TrackeOneFinance`
4. Configure as opções:

**Project Settings:**
- **Project Name**: `trackeone-finance`
- **Framework Preset**: Vite
- **Root Directory**: `client`

**Build and Output Settings:**
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4.2. Configurar Variáveis de Ambiente

Na seção "Environment Variables", adicione:

```
VITE_API_URL=https://trackeone-finance-api.onrender.com/api
```

### 4.3. Deploy

1. Clique em "Deploy"
2. Aguarde o processo de build e deploy (pode levar 3-5 minutos)
3. Acompanhe o progresso na tela

### 4.4. Verificação do Deploy do Frontend

Após o deploy bem-sucedido:
1. Acesse a URL fornecida pelo Vercel (algo como: `https://trackeone-finance.vercel.app`)
2. Verifique se a aplicação carrega corretamente

## 🔧 Passo 5: Configurações Pós-Deploy

### 5.1. Atualização de Variáveis de Ambiente (se necessário)

Se você precisar atualizar a URL da API no frontend:

1. No painel do Vercel, acesse "Settings" > "Environment Variables"
2. Edite a variável `VITE_API_URL` com a URL correta do backend
3. Clique em "Save"
4. Faça um novo deploy para aplicar as mudanças

### 5.2. Criação de Usuário Administrador

Para criar um usuário administrador:

1. Acesse a URL do frontend no navegador
2. Clique em "Registrar" ou "Sign Up"
3. Crie uma conta com um e-mail e senha seguros
4. Ou execute o script de criação de usuário de teste:
   ```bash
   cd /Users/nataligiacherini/Development/TrackeOneFinance
   node create_test_user.js
   ```
   Isso gerará um script SQL para criar um usuário de teste com:
   - Email: admin@trackone.com
   - Senha: admin123

### 5.3. Configuração de CORS (se necessário)

O CORS já está configurado no arquivo `server/src/server.ts` para permitir qualquer origem, mas se precisar restringir:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://trackeone-finance.vercel.app',
    'https://seu-dominio-personalizado.com'
  ],
  credentials: true
}));
```

## 🧪 Passo 6: Testes Finais

### 6.1. Teste de Funcionalidades Principais

1. **Login/Registro**: Verifique se é possível fazer login e registro
2. **Dashboard**: Verifique se o dashboard carrega corretamente
3. **Controle Mensal**: Teste a criação e filtragem de transações
4. **Fluxo de Caixa**: Verifique se o fluxo de caixa funciona corretamente
5. **Pagamentos**: Teste a funcionalidade de marcar transações como pagas

### 6.2. Teste de API

```bash
# Teste básico
curl https://trackeone-finance-api.onrender.com/api/test

# Teste de autenticação (substitua EMAIL e SENHA)
curl -X POST https://trackeone-finance-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"EMAIL","password":"SENHA"}'
```

## 🛡 Passo 7: Configurações de Segurança

### 7.1. Atualização da Chave JWT

1. Gere uma chave secreta forte:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Atualize a variável `JWT_SECRET` no Render com a nova chave

### 7.2. Configuração de HTTPS

Ambos Render e Vercel fornecem HTTPS automático, então não é necessário configuração adicional.

### 7.3. Proteção contra Abusos

Considere adicionar rate limiting no backend para proteger contra abusos:

```bash
cd /Users/nataligiacherini/Development/TrackeOneFinance/server
npm install express-rate-limit
```

## 🌍 Passo 8: Configuração de Domínios Personalizados (Opcional)

### 8.1. Domínio para o Backend (API)

1. No painel do Render, acesse o serviço
2. Vá para "Settings" > "Custom Domains"
3. Adicione seu domínio personalizado
4. Siga as instruções para configurar os registros DNS

### 8.2. Domínio para o Frontend

1. No painel do Vercel, acesse o projeto
2. Vá para "Settings" > "Domains"
3. Adicione seu domínio personalizado
4. Siga as instruções para configurar os registros DNS

## 📊 Passo 9: Monitoramento e Manutenção

### 9.1. Monitoramento de Logs

- **Render**: Acesse a aba "Logs" do serviço para monitorar erros
- **Vercel**: Acesse a aba "Functions" para ver os logs do frontend

### 9.2. Backups do Banco de Dados

Configure backups automáticos do banco de dados PostgreSQL no painel do Render:
1. Acesse o banco de dados
2. Vá para "Backups"
3. Configure backups automáticos conforme necessário

### 9.3. Atualizações de Dependências

Monitore regularmente as atualizações de dependências:
```bash
# No diretório raiz do projeto
npm outdated
cd client && npm outdated
cd ../server && npm outdated
```

## 💰 Considerações de Custos

### Plano Gratuito (Para Início)

- **Vercel**: Plano gratuito adequado para projetos pequenos
- **Render**: Plano gratuito com algumas limitações:
  - Serviços entram em modo "sleep" após 15 minutos de inatividade
  - 512MB de RAM
  - 1GB de armazenamento

### Upgrade para Produção Real

- **Vercel Pro**: ~$20/mês
- **Render Pro**: ~$7/mês
- **PostgreSQL**: ~$5-15/mês

## 🆘 Troubleshooting

### Problemas Comuns e Soluções

#### 1. Erros de Build
- Verifique os logs do build no painel do serviço
- Certifique-se de que todas as dependências estão corretas
- Verifique se não há erros de sintaxe no código

#### 2. Erros de CORS
- Verifique se a variável `VITE_API_URL` está correta no Vercel
- Confirme que o CORS está configurado corretamente no backend

#### 3. Problemas com Banco de Dados
- Verifique se a `DATABASE_URL` está correta no Render
- Confirme que as migrações estão sendo aplicadas corretamente
- Verifique se o banco de dados está acessível

#### 4. Timeout do Serviço (Sleep Mode)
- Para evitar que o serviço entre em modo sleep, considere upgrade para plano pago
- Ou implemente um serviço de "keep alive" que faça requisições periódicas

## 🔄 Atualizações Contínuas

### Deploy Automático

Ambos Render e Vercel oferecem deploy automático quando você faz push para o repositório GitHub:

1. Faça commit e push das alterações:
   ```bash
   git add .
   git commit -m "Descrição das alterações"
   git push origin main
   ```

2. Os serviços detectarão automaticamente as mudanças e iniciarão o deploy

### Deploy Manual

Se precisar fazer deploy manualmente:

**Backend (Render):**
1. Acesse o serviço no painel do Render
2. Clique em "Manual Deploy" > "Deploy latest commit"

**Frontend (Vercel):**
1. Acesse o projeto no painel do Vercel
2. Clique em "Redeploy"

## 📞 Suporte

Para suporte adicional:
- Verifique a documentação nos arquivos `DEPLOY_INSTRUCTIONS.md`, `DEPLOY_RENDER_GUIA.md` e `DEPLOY_VERCEL_GUIA.md`
- Abra issues no repositório GitHub se encontrar problemas
- Consulte os logs dos serviços para diagnóstico de erros

---

✅ **Parabéns! Seu deploy foi concluído com sucesso!**

Agora você pode acessar sua aplicação TrackeOne Finance em produção e começar a gerenciar suas finanças de forma eficiente.