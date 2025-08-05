module.exports = {
  apps: [{
    name: 'whatsapp-api',
    script: 'server.cjs',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      API_KEY: 'whatsapp-api-key-2024'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      API_KEY: 'whatsapp-api-key-2024'
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    
    // Auto restart settings
    min_uptime: '10s',
    max_restarts: 5,
    
    // Memory and CPU monitoring
    max_memory_restart: '1G',
    
    // Graceful shutdown
    kill_timeout: 5000,
    
    // Environment variables for production
    node_args: '--max-old-space-size=1024'
  }],

  deploy: {
    production: {
      user: 'www-data',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/whatsapp-api.git',
      path: '/var/www/whatsapp-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};