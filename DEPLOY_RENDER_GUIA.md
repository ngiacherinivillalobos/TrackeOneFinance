# Deploy do Backend no Render

## Passo 1: Preparação do Projeto para Deploy

Antes de importar para o Render, precisamos garantir que o projeto backend está configurado corretamente.

### Verificação do package.json do Server

Certifique-se de que o arquivo `server/package.json` tem os scripts necessários:

```json
{
  "name": "trackone-finance-server",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "nodemon src/server.ts",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "sqlite3": "^5.1.6",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1"
  }
}
```

### Criação do Arquivo de Configuração do Render

Crie um arquivo `server/render.yaml` na raiz da pasta `server`:

```yaml
services:
  - type: web
    name: trackeone-finance-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    plan: free
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        sync: false
      - key: DATABASE_URL
        sync: false
      - key: PORT
        value: 3001
```

### Atualização do Arquivo .gitignore

Verifique se o arquivo `server/.gitignore` está correto:

```
node_modules/
dist/
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

## Passo 2: Configuração no Render

### 1. Acesse o Render
1. Vá para [render.com](https://render.com)
2. Faça login ou crie uma conta (você pode usar seu GitHub)

### 2. Importe o Projeto
1. Clique em "New" > "Web Service"
2. Conecte sua conta do GitHub se ainda não estiver conectada
3. Selecione o repositório "ngiacherinivillalobos/TrackeOneFinance"
4. Clique em "Connect"

### 3. Configure o Web Service
Na tela de configuração:

**Basic Settings:**
- **Name**: trackeone-finance-api
- **Region**: Ohio (US East)
- **Branch**: main
- **Root Directory**: server
- **Environment**: Node

**Build Settings:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Settings:**
- **Instance Type**: Free (para começar)

### 4. Configure as Variáveis de Ambiente
Na seção "Advanced" > "Environment Variables", adicione:

```
JWT_SECRET=seu_segredo_jwt_aqui (substitua por um valor seguro)
DATABASE_URL=caminho_para_seu_banco_de_dados (ver observações abaixo)
PORT=3001
```

## Passo 3: Considerações sobre Banco de Dados

### Para Ambiente de Produção (Recomendado)
Para produção, recomendo migrar do SQLite para PostgreSQL:

1. Crie um banco de dados PostgreSQL gratuito no Render:
   - Clique em "New" > "PostgreSQL"
   - Configure com um nome (ex: trackeone-finance-db)
   - Escolha o plano gratuito
   - Anote a URL de conexão

2. Atualize as variáveis de ambiente:
   - `DATABASE_URL` = URL fornecida pelo Render para o PostgreSQL

### Para Ambiente de Teste (SQLite)
Se quiser continuar com SQLite por enquanto:

1. Modifique o código para usar um caminho absoluto para o banco:
   - No arquivo `server/src/database/connection.ts`, altere o caminho do banco para algo como:
   ```typescript
   const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../database.sqlite');
   ```

2. Adicione o arquivo do banco ao repositório (remova do .gitignore temporariamente):
   - Remova `database.sqlite` do `.gitignore` (apenas para testes iniciais)

## Passo 4: Deploy

1. Clique em "Create Web Service"
2. Aguarde o processo de build e deploy (pode levar alguns minutos)
3. Acompanhe os logs para verificar se tudo está funcionando corretamente

## Passo 5: Configuração Pós-Deploy

### Verificação do Deploy
1. Após o deploy, você será redirecionado para a página do serviço
2. Verifique se a aplicação está funcionando corretamente
3. Anote a URL de produção (algo como: https://trackeone-finance-api.onrender.com)

### Teste o Endpoint
1. Acesse a URL de produção + `/api/test`
2. Você deve ver uma resposta JSON: `{"message": "Server is working!"}`

### Configuração de Domínio Personalizado (Opcional)
1. Na página do serviço, clique em "Settings"
2. Vá para "Custom Domains"
3. Adicione seu domínio personalizado
4. Siga as instruções para configurar os registros DNS

## Passo 6: Atualização do Frontend

Após obter a URL do backend, você precisa atualizar a variável de ambiente no Vercel:

1. Acesse as configurações do projeto frontend no Vercel
2. Vá para "Settings" > "Environment Variables"
3. Edite a variável `VITE_API_URL`:
   - Key: `VITE_API_URL`
   - Value: `https://trackeone-finance-api.onrender.com/api` (substitua pela sua URL real)
4. Clique em "Save"
5. Faça um novo deploy do frontend para aplicar as mudanças

## Troubleshooting

### Se o Build Falhar
1. Verifique os logs do build no painel do Render
2. Certifique-se de que todas as dependências estão corretas
3. Verifique se não há erros no código

### Se o Serviço não Iniciar
1. Verifique os logs de runtime
2. Confirme que as variáveis de ambiente estão configuradas corretamente
3. Verifique se a porta está configurada como 3001

### Problemas com Banco de Dados
1. Se estiver usando SQLite, certifique-se de que o arquivo do banco está acessível
2. Para PostgreSQL, verifique a string de conexão
3. Confirme que as migrações estão sendo aplicadas corretamente

### Erros de CORS
Atualize o arquivo `server/src/server.ts` para permitir requisições do seu frontend:

```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'https://seu-frontend.vercel.app'],
  credentials: true
}));
```

## Próximos Passos

1. Após o deploy bem-sucedido do backend, atualize a variável `VITE_API_URL` no Vercel
2. Faça um novo deploy do frontend
3. Teste a integração entre frontend e backend
4. Configure domínios personalizados se necessário
5. Considere migrar para PostgreSQL para produção real