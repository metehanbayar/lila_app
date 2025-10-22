// PM2 Ecosystem Configuration - Multi-Hosting VDS için
// CentOS Plesk Multi-Hosting VDS için hazırlanmış PM2 konfigürasyonu

module.exports = {
  apps: [
    {
      name: 'lila-group-menu-server',
      script: './server/server.js',
      cwd: '/var/www/vhosts/lilamenu.yourdomain.com/httpdocs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Logging
      error_file: '/var/log/pm2/lila-group-menu-error.log',
      out_file: '/var/log/pm2/lila-group-menu-out.log',
      log_file: '/var/log/pm2/lila-group-menu-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Restart policy
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Advanced options
      kill_timeout: 5000,
      listen_timeout: 3000,
      wait_ready: true,
      
      // Monitoring
      monitoring: false,
      
      // Source map support
      source_map_support: true,
      
      // Ignore watch
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        'temp'
      ]
    }
  ],

  // Deployment configuration (opsiyonel) - Multi-hosting için
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/globalmenu.git',
      path: '/var/www/vhosts/lilamenu.yourdomain.com/httpdocs',
      'post-deploy': 'npm run install-all && cd client && npm run build && chown -R psacln:psacln /var/www/vhosts/lilamenu.yourdomain.com/httpdocs && pm2 reload ecosystem.config.js --env production'
    }
  }
};
