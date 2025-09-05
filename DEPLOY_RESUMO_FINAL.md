# 🚀 Deploy do TrackeOne Finance - Resumo Final

## 📋 Pré-requisitos

1. Conta no [Render](https://render.com) para o backend
2. Conta no [Vercel](https://vercel.com) para o frontend
3. Banco de dados PostgreSQL (pode ser criado no Render)

## 🔧 Deploy do Backend (API) no Render

### 1. Criar Web Service
- Acesse o [Render Dashboard](https://dashboard.render.com)
- Clique em "New" → "Web Service"
- Conecte seu repositório GitHub `ngiacherinivillalobos/TrackeOneFinance`

### 2. Configurações do Serviço
```
Name: trackeone-finance-api
Root Directory: server
Build Command: npm install
Start Command: npm start
Plan: Free
```

### 3. Variáveis de Ambiente
Adicione as seguintes variáveis de ambiente:
```
NODE_ENV=production
JWT_SECRET=cec857911e1461cb031ebf01684e1d2f2e421be93ebdb945e3a9771cb68c60d494e7741efbfc73ab1e4ee87b62e77493068c68fd8cb5f2d120c624e58d5c7e61
DATABASE_URL=*** URL do seu banco de dados PostgreSQL ***
PORT=3001
```

## 🗄️ Criar Banco de Dados PostgreSQL no Render

### 1. Criar Database
- No Render Dashboard, clique em "New" → "PostgreSQL"
- Escolha o plano gratuito
- Anote a `DATABASE_URL` gerada

### 2. Aplicar Migrações
Após o banco ser criado, você precisará aplicar as migrações manualmente ou configurar um script de inicialização.

## 🌐 Deploy do Frontend no Vercel

### 1. Criar Projeto
- Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
- Clique em "New Project"
- Importe o repositório GitHub `ngiacherinivillalobos/TrackeOneFinance`

### 2. Configurações do Projeto
```
Project Name: trackeone-finance
Framework Preset: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

### 3. Variáveis de Ambiente
Adicione a seguinte variável de ambiente:
```
VITE_API_URL=https://trackeone-finance-api.onrender.com/api
```

## 📝 Passos Finais

1. **Aplicar migrações no banco de dados** após o deploy do backend
2. **Testar a API** acessando `https://trackeone-finance-api.onrender.com/api/transactions`
3. **Verificar o frontend** acessando a URL fornecida pelo Vercel
4. **Criar usuário de teste** usando o script `create_test_user.js` se necessário

## 🆘 Troubleshooting

### Problemas Comuns
- **Timeout no primeiro acesso**: O serviço gratuito do Render "dorme" após inatividade
- **Erros de CORS**: Verifique se a URL do frontend está correta no `vercel.json`
- **Erros de banco de dados**: Certifique-se de que a `DATABASE_URL` está correta

### Links Úteis
- [Documentação Completa de Deploy](DEPLOY_COMPLETO_GUIA.md)
- [Guia de Troubleshooting](TROUBLESHOOTING_DEPLOY.md)
- [Guia de Migração](MIGRATION_GUIDE.md)

## 📊 Status Atual

✅ Build local concluído com sucesso
✅ Código enviado para o repositório
✅ Chave JWT gerada
⚠️ Deploy nas plataformas ainda precisa ser feito manualmente

---

📅 Última atualização: 05/09/2025
🔐 Chave JWT gerada: cec857911e1461cb031ebf01684e1d2f2e421be93ebdb945e3a9771cb68c60d494e7741efbfc73ab1e4ee87b62e77493068c68fd8cb5f2d120c624e58d5c7e61