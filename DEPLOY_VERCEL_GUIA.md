# Deploy do Frontend no Vercel

## Passo 1: Preparação do Projeto para Deploy

Antes de importar para o Vercel, precisamos garantir que o projeto frontend está configurado corretamente.

### Verificação do package.json do Client

Certifique-se de que o arquivo `client/package.json` tem os scripts necessários:

```json
{
  "name": "trackone-finance-client",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### Configuração do Vite

Verifique o arquivo `client/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
```

## Passo 2: Configuração no Vercel

### 1. Acesse o Vercel
1. Vá para [vercel.com](https://vercel.com)
2. Faça login ou crie uma conta (você pode usar seu GitHub)

### 2. Importe o Projeto
1. Clique em "New Project"
2. Clique em "Import" (ou "Import Git Repository")
3. Selecione o repositório "ngiacherinivillalobos/TrackeOneFinance"
4. Clique em "Import"

### 3. Configure o Projeto
Na tela de configuração:

**Project Settings:**
- **Project Name**: trackeone-finance
- **Framework Preset**: Vite
- **Root Directory**: client
- **Build and Output Settings**:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

**Environment Variables** (adicione estas variáveis):
```
VITE_API_URL=https://seu-backend-url-aqui.onrender.com/api
```
(Você vai atualizar esta variável depois que fizer o deploy do backend)

### 4. Deploy
1. Clique em "Deploy"
2. Aguarde o processo de build e deploy (pode levar alguns minutos)

## Passo 3: Configuração Pós-Deploy

### Verificação do Deploy
1. Após o deploy, você será redirecionado para a página do projeto
2. Verifique se a aplicação está funcionando corretamente
3. Anote a URL de produção (algo como: https://trackeone-finance.vercel.app)

### Configuração de Domínio Personalizado (Opcional)
1. Na página do projeto, clique em "Settings"
2. Vá para "Domains"
3. Adicione seu domínio personalizado
4. Siga as instruções para configurar os registros DNS

## Passo 4: Configuração de Variáveis de Ambiente

### Atualização da VITE_API_URL
Após fazer o deploy do backend no Render:

1. Acesse as configurações do projeto no Vercel
2. Vá para "Settings" > "Environment Variables"
3. Edite a variável `VITE_API_URL` com a URL real do seu backend
4. Clique em "Save"
5. Faça um novo deploy para aplicar as mudanças

## Troubleshooting

### Se o Build Falhar
1. Verifique os logs do build no painel do Vercel
2. Certifique-se de que todas as dependências estão corretas
3. Verifique se não há erros no código

### Se a Aplicação não Carregar
1. Verifique se a API_URL está correta
2. Confirme que o backend está acessível
3. Verifique as configurações de CORS no backend

### Problemas com Rotas
Se estiver usando React Router, adicione um arquivo `client/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Próximos Passos

1. Após o deploy bem-sucedido do frontend, prossiga com o deploy do backend no Render
2. Configure corretamente a variável de ambiente `VITE_API_URL` com a URL do backend
3. Teste a integração entre frontend e backend
4. Configure domínios personalizados se necessário