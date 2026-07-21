module.exports = {
  apps: [
    {
      name: 'yz-construction-api',
      script: './dist/server.js',
      cwd: '/var/www/yz-construction/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/pm2/yz-api-error.log',
      out_file: '/var/log/pm2/yz-api-out.log',
      log_file: '/var/log/pm2/yz-api-combined.log',
      time: true,
    },
  ],
};
