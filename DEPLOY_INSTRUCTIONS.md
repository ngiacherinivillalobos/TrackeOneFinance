# Instruções para Deploy da Aplicação TrackeOne Finance

## Deploy no Vercel (Frontend)

1. Acesse [https://vercel.com](https://vercel.com) e faça login
2. Clique em "New Project"
3. Importe o repositório GitHub `ngiacherinivillalobos/TrackeOneFinance`
4. Selecione o diretório `/client` como raiz do projeto
5. Configure as variáveis de ambiente se necessário:
   - `VITE_API_URL` = `https://trackeone-finance-api.onrender.com`
6. Clique em "Deploy"
7. O Vercel fará o build e deploy automático da aplicação

## Deploy no Render (Backend)

1. Acesse [https://render.com](https://render.com) e faça login
2. Clique em "New" e selecione "Web Service"
3. Conecte sua conta GitHub e selecione o repositório `ngiacherinivillalobos/TrackeOneFinance`
4. Configure as seguintes opções:
   - Name: `trackeone-finance-api`
   - Root Directory: Deixe em branco (raiz do projeto)
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Adicione as variáveis de ambiente necessárias:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = sua URL do banco de dados
   - `JWT_SECRET` = sua chave secreta para JWT
6. Clique em "Create Web Service"
7. O Render fará o build e deploy automático da API

## Atualizações Futuras

Para atualizar a aplicação após modificações:

1. Faça commit e push das alterações para o repositório GitHub
2. O Vercel e Render detectarão automaticamente as mudanças e iniciarão o deploy
3. Acompanhe o progresso nos painéis do Vercel e Render

## Configurações Adicionais

- O arquivo `vercel.json` na raiz do cliente configura os rewrites para a API
- O arquivo `render.yaml` configura o serviço web no Render
- Ambos os arquivos já estão configurados para funcionar corretamente