module.exports = {
  apps: [{
    name: 'trackone-finance-api',
    script: 'dist/server.js',
    cwd: '/Users/nataligiacherini/Development/TrackeOneFinance/server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_PATH: '../database/track_one_finance.db'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
