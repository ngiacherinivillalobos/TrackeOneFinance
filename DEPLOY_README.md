# 🚀 Deploy para Produção - TrackeOne Finance

Este projeto está configurado para deploy automático na seguinte arquitetura:

```
GitHub → Render (Backend + PostgreSQL) → Vercel (Frontend)
```

## 📋 Arquivos de Configuração

### ✅ Render (Backend)
- **Arquivo**: `render.yaml`
- **Serviço**: Node.js backend com PostgreSQL
- **URL**: `https://trackeone-finance-api.onrender.com`

### ✅ Vercel (Frontend)  
- **Arquivo**: `client/vercel.json`
- **Serviço**: React/Vite SPA
- **Root Directory**: `client/`

### ✅ PostgreSQL
- **Arquivo**: `database/init_postgresql.sql`
- **Banco**: PostgreSQL automático no Render
- **Dados iniciais**: Categorias, métodos de pagamento, centros de custo

## 🚀 Deploy Automático

### 1. Executar Script de Deploy
```bash
./deploy-production.sh
```

Este script irá:
- ✅ Verificar o estado do repositório
- ✅ Fazer commit das mudanças
- ✅ Push para GitHub
- ✅ Criar backup do banco SQLite
- ✅ Mostrar instruções detalhadas

### 2. Configurar Render
1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Conecte este repositório GitHub
3. O arquivo `render.yaml` será detectado automaticamente
4. O deploy iniciará automaticamente

### 3. Configurar Vercel
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Conecte este repositório GitHub
3. Defina `client` como Root Directory
4. O deploy iniciará automaticamente

## 🔧 Configurações Importantes

### Variáveis de Ambiente (Render)
```yaml
NODE_ENV: production
JWT_SECRET: [gerado automaticamente]
DATABASE_URL: [PostgreSQL automático]
PORT: 3001
FRONTEND_URL: https://seu-projeto.vercel.app
```

### Variáveis de Ambiente (Vercel)
```bash
VITE_API_URL=https://trackeone-finance-api.onrender.com/api
```

## 🧪 Testes Pós-Deploy

### Backend (Render)
```bash
# Health check
curl https://trackeone-finance-api.onrender.com/api/health

# Teste API
curl https://trackeone-finance-api.onrender.com/api/test
```

### Frontend (Vercel)
```bash
# Acesso direto
https://seu-projeto.vercel.app

# Teste de rota
https://seu-projeto.vercel.app/login
```

## 📊 Monitoramento

### Logs do Render
- Dashboard → Seu Serviço → Logs
- Real-time logs durante deploy
- Error tracking automático

### Logs do Vercel
- Dashboard → Seu Projeto → Functions
- Build logs e runtime logs
- Performance analytics

## 🔄 Diferenças Desenvolvimento vs Produção

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| **Database** | SQLite | PostgreSQL |
| **Backend URL** | localhost:3001 | trackeone-finance-api.onrender.com |
| **Frontend URL** | localhost:3004 | seu-projeto.vercel.app |
| **CORS** | Permissivo | Restrito |
| **SSL** | Não | Sim (automático) |

## 🛠️ Troubleshooting

### Erro 500 no Backend
1. Verifique logs no Render Dashboard
2. Confirme se PostgreSQL está conectado
3. Verifique variáveis de ambiente

### Frontend não carrega
1. Verifique se build passou no Vercel
2. Confirme VITE_API_URL
3. Teste CORS entre frontend e backend

### Database não inicializa
1. Verifique `database/init_postgresql.sql`
2. Confirme se PostgreSQL está criado no Render
3. Teste conexão manual

## 📝 Backup e Migração

### Backup Automático
- SQLite → PostgreSQL via script de migração
- Backup antes de cada deploy
- Dados preservados durante atualizações

### Migração Manual
```bash
# Exportar dados SQLite
sqlite3 database/track_one_finance.db .dump > backup.sql

# Importar para PostgreSQL (ajustar sintaxe)
psql DATABASE_URL < backup_converted.sql
```

## 🎯 Próximos Passos

1. ✅ **Deploy Inicial**: Configure Render e Vercel
2. ✅ **Teste Completo**: Verifique todas as funcionalidades
3. ✅ **Domínio Personalizado**: Configure DNS se necessário
4. ✅ **Monitoramento**: Configure alertas de uptime
5. ✅ **Backup Regular**: Configure backup automático dos dados

## 🔐 Segurança

- ✅ **HTTPS**: Automático no Render e Vercel
- ✅ **CORS**: Configurado para produção
- ✅ **JWT**: Secret seguro em variável de ambiente
- ✅ **Headers**: Security headers configurados
- ✅ **Database**: PostgreSQL com SSL

---

## 📞 Suporte

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/

🎉 **Sistema pronto para produção com alta disponibilidade!**
