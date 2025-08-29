# Guia de Hospedagem em Produção - TrackeOne Finance

## Visão Geral

Este guia irá te ajudar a hospedar o projeto TrackeOne Finance em um ambiente de produção. O projeto consiste em duas partes principais:
- **Backend**: API Node.js/Express (porta 3001)
- **Frontend**: Aplicação React (porta 3000)

## Opções de Hospedagem

### Opção 1: Hospedagem em Serviço em Nuvem (Recomendada para Iniciantes)

#### Vercel (Frontend) + Render/Heroku (Backend)
- **Vantagens**: Fácil de configurar, gratuito para projetos pequenos
- **Desvantagens**: Limitações no plano gratuito

#### Netlify (Frontend) + Render (Backend)
- **Vantagens**: Boa integração, fácil deployment
- **Desvantagens**: Configuração de variáveis de ambiente necessária

### Opção 2: Servidor VPS (Recomendada para Produção)

#### DigitalOcean, AWS EC2, Google Cloud Platform
- **Vantagens**: Controle total, escalabilidade
- **Desvantagens**: Mais complexa, requer conhecimento de servidores

## Passo a Passo Detalhado

### Passo 1: Preparação do Código

1. Certifique-se de que todas as alterações estão salvas no Git:
   ```bash
   cd /Users/nataligiacherini/Development/TrackeOneFinance
   git add .
   git commit -m "Preparação para produção"
   git push origin main
   ```

2. Verifique as variáveis de ambiente:
   - Backend: Verifique o arquivo `.env` na pasta `server/`
   - Frontend: Verifique o arquivo `.env` na pasta `client/`

### Passo 2: Configuração do Banco de Dados

Para produção, recomendo migrar do SQLite para PostgreSQL ou MySQL:
1. Atualize as configurações de conexão no `server/src/database/connection.ts`
2. Atualize as variáveis de ambiente no `.env` do servidor

### Passo 3: Build das Aplicações

#### Backend:
```bash
cd /Users/nataligiacherini/Development/TrackeOneFinance/server
npm run build
```

#### Frontend:
```bash
cd /Users/nataligiacherini/Development/TrackeOneFinance/client
npm run build
```

### Passo 4: Deploy no Vercel + Render (Opção Recomendada)

#### Deploy do Backend no Render:

1. Acesse [render.com](https://render.com) e crie uma conta
2. Clique em "New" > "Web Service"
3. Conecte seu repositório Git
4. Configure:
   - Name: trackeone-finance-api
   - Root Directory: server
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free (para começar)
5. Adicione as variáveis de ambiente em "Advanced" > "Environment Variables"
6. Clique em "Create Web Service"

#### Deploy do Frontend no Vercel:

1. Acesse [vercel.com](https://vercel.com) e crie uma conta
2. Clique em "New Project"
3. Importe seu repositório Git
4. Configure:
   - Project Name: trackeone-finance
   - Framework Preset: Vite
   - Root Directory: client
5. Clique em "Deploy"

### Passo 5: Configuração de Variáveis de Ambiente

#### Backend (Render):
```
JWT_SECRET=seu_segredo_jwt_aqui
DATABASE_URL=sua_url_do_banco_de_dados
PORT=3001
```

#### Frontend (Vercel):
```
VITE_API_URL=https://seu-endpoint-do-render.onrender.com/api
```

### Passo 6: Configuração de CORS (Importante)

Atualize o arquivo `server/src/server.ts` para permitir requisições do seu frontend:

```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'https://seu-dominio.vercel.app'],
  credentials: true
}));
```

## Monitoramento e Manutenção

1. **Logs**: Verifique os logs no painel do Render/Vercel
2. **Backups**: Configure backups automáticos do banco de dados
3. **SSL**: Ambos os serviços oferecem SSL gratuito
4. **Domínio Personalizado**: Configure seu próprio domínio nas configurações

## Considerações de Segurança

1. **JWT Secret**: Use uma chave secreta forte
2. **HTTPS**: Garanta que todas as comunicações sejam criptografadas
3. **Rate Limiting**: Implemente limites de requisições para evitar abusos
4. **Validação de Dados**: Certifique-se de que todas as entradas são validadas

## Custos Estimados

- **Vercel (Frontend)**: Plano gratuito adequado para início
- **Render (Backend)**: Plano gratuito com algumas limitações
- **Banco de Dados**: Opções gratuitas disponíveis (com limitações)

Para produção real, considere:
- Vercel Pro: ~$20/mês
- Render Pro: ~$7/mês
- Banco de Dados: ~$5-15/mês

## Suporte e Manutenção

1. Monitore regularmente os logs de erro
2. Mantenha dependências atualizadas
3. Realize backups regulares
4. Teste a recuperação de desastres

## Próximos Passos

1. Implementar autenticação social (Google, etc.)
2. Adicionar sistema de notificações por e-mail
3. Configurar monitoramento de performance
4. Implementar testes automatizados

## Contato para Suporte

Para suporte adicional, entre em contato com a equipe de desenvolvimento.