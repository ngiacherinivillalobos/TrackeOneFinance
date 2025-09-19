# 🚀 TrackeOne Finance - Production Deployment Guide

## 🎯 Deployment Overview

This guide explains how to deploy TrackeOne Finance to production with PostgreSQL while maintaining SQLite for development.

**Environment Differences:**
- **Development**: SQLite database (`track_one_finance.db`)
- **Production**: PostgreSQL database (Render/Cloud)

## 📋 Prerequisites

1. **For Render Deployment**:
   - Render account (https://render.com)
   - GitHub account for automatic deployments

2. **For Docker Deployment**:
   - Docker Engine >= 20.10
   - Docker Compose >= 1.29

## 🚀 Option 1: Deploy to Render (Recommended)

### Step 1: Prepare Repository

1. Ensure your code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Deploy to Render

1. Go to https://render.com and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure settings:
   - **Name**: trackeone-finance
   - **Region**: Choose your preferred region
   - **Branch**: main
   - **Root Directory**: server
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

5. Add environment variables:
   - `NODE_ENV`: production
   - `JWT_SECRET`: [your secure JWT secret]
   - `FRONTEND_URL`: [your frontend URL]

6. Create Database:
   - Click "Add Database"
   - Select PostgreSQL
   - Name: trackeone-finance-db

7. Click "Create Web Service"

### Step 3: Deploy Frontend (Optional)

If you want to host the frontend on Render:

1. Click "New" → "Static Site"
2. Connect your GitHub repository
3. Configure settings:
   - **Build Command**: `npm install && npm run build` (in client directory)
   - **Publish Directory**: `client/dist`

## 🐳 Option 2: Deploy with Docker

### Step 1: Local Testing

1. Test deployment locally:
```bash
cd /path/to/TrackeOneFinance
./deploy.sh
```

This will:
- Start PostgreSQL container
- Start backend API container
- Start frontend container
- Apply database migrations

### Step 2: Production Deployment

1. Update `.env.docker` with production values:
```bash
# Database credentials
DB_USER=production_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=https://yourdomain.com
```

2. Run deployment:
```bash
./deploy.sh
```

3. Access your application:
   - Frontend: http://localhost
   - API: http://localhost:3001/api

## 🗄️ Database Migration Process

### PostgreSQL Migration

Your application automatically handles PostgreSQL migrations through the database connection layer:

1. On first run in production, tables are created automatically
2. Credit card transactions table is created via migration scripts
3. All database operations are abstracted to work with both SQLite and PostgreSQL

### Migration Scripts

Migration scripts are located in `database/migrations/`:
- PostgreSQL: `create_credit_card_transactions_table.sql`
- SQLite: `create_credit_card_transactions_table_sqlite.sql`

## 🔧 Environment Configuration

### Development (.env)
```env
NODE_ENV=development
DATABASE_PATH=../database/track_one_finance.db
JWT_SECRET=your-development-jwt-secret
PORT=3001
```

### Production (Render)
Environment variables are configured in Render dashboard:
- `NODE_ENV`: production
- `DATABASE_URL`: Provided by Render
- `JWT_SECRET`: Your secure secret
- `PORT`: 3001

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

To set up automatic deployments on push:

1. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Render
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: your-service-id
          api-key: ${{ secrets.RENDER_API_KEY }}
```

## 🔍 Post-Deployment Verification

### Check Services Status
```bash
# For Docker deployment
docker-compose ps

# For Render deployment
# Check Render dashboard
```

### Test API Endpoints
```bash
# Health check
curl https://your-app.onrender.com/api/health

# Test authentication
curl https://your-app.onrender.com/api/auth/login
```

### Verify Database
```sql
-- Connect to PostgreSQL and verify tables
\dt
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM transactions;
SELECT COUNT(*) FROM credit_card_transactions;
```

## 🔐 Security Considerations

1. **JWT Secret**: Use a strong, unique secret in production
2. **Database Credentials**: Never commit credentials to repository
3. **HTTPS**: Enable SSL/TLS for production (Render provides this automatically)
4. **CORS**: Configure allowed origins appropriately

## 📈 Monitoring and Maintenance

### Logs
```bash
# Docker
docker-compose logs -f

# Render
# Check Render dashboard logs
```

### Backups
```bash
# Database backup (Docker)
docker exec trackone-postgres pg_dump -U trackone_user trackone_finance > backup.sql

# Render
# Use Render's built-in backup features
```

### Updates
1. Push changes to GitHub
2. Render will automatically deploy (if auto-deploy is enabled)
3. Or manually trigger deployment from Render dashboard

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check DATABASE_URL environment variable
   - Verify PostgreSQL is running

2. **Migration Errors**:
   - Check migration scripts in `database/migrations/`
   - Ensure PostgreSQL extensions are installed

3. **Frontend Not Loading**:
   - Check nginx configuration
   - Verify API URL in frontend environment

### Rollback Procedure

1. Revert code to previous version:
```bash
git revert <commit-hash>
git push origin main
```

2. Render will automatically redeploy the previous version

## ✅ Production Checklist

- [ ] Repository pushed to GitHub
- [ ] Environment variables configured
- [ ] JWT secret updated for production
- [ ] Domain configured (if applicable)
- [ ] SSL certificate enabled
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Test deployment successful
- [ ] User access configured

## 🎉 Success!

Your TrackeOne Finance application is now ready for production deployment with PostgreSQL database support while maintaining SQLite for development.

For any issues, refer to the detailed logs and error messages. The application is designed to be resilient and handle most common deployment scenarios automatically.