# Guia de Deploy do Frontend no Vercel

## Passo 1: Instalar o Vercel CLI

```bash
npm install -g vercel
```

## Passo 2: Fazer login no Vercel

```bash
vercel login
```

## Passo 3: Navegar para o diretório do cliente

```bash
cd client
```

## Passo 4: Fazer o deploy

```bash
vercel --prod
```

## Configurações Necessárias

Durante o processo de deploy, configure as seguintes opções:

- **Set up and deploy**: Yes
- **Which scope**: Seu usuário ou time do Vercel
- **Link to existing project**: No (se for a primeira vez)
- **What's your project's name**: trackeone-finance
- **In which directory is your code located?**: ./
- **Want to override the settings**: No
- **Framework**: Vite
- **Root Directory**: ./
- **Output Directory**: dist
- **Build Command**: npm run build
- **Development Command**: npm run dev
- **Install Command**: npm install

## Variáveis de Ambiente

Após o deploy, adicione a seguinte variável de ambiente no painel do Vercel:

- **Key**: VITE_API_URL
- **Value**: https://trackeone-finance-api.onrender.com/api

## Redeploy

Para fazer novos deploys após atualizações:

```bash
vercel --prod
```

Ou através do painel do Vercel, clicando em "Deploy" na página do projeto.