# YZ Construction - VPS Deployment Guide

This guide walks you through deploying the complete YZ Construction system (backend API, admin dashboard, and frontend) to your Ubuntu VPS.

## Prerequisites

- Ubuntu VPS (20.04 LTS or later recommended)
- Domain name pointed to your VPS IP address
- SSH access to your VPS
- Basic knowledge of Linux command line

## Step 1: Initial Server Setup

### 1.1 Update System and Install Dependencies

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx ufw fail2ban

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install ImageMagick (for image processing)
sudo apt install -y imagemagick
```

### 1.2 Configure Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## Step 2: Database Setup

### 2.1 Create PostgreSQL Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql prompt, run:
CREATE DATABASE yz_construction;
CREATE USER yz_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE yz_construction TO yz_user;
\q
```

### 2.2 Test Database Connection

```bash
psql -h localhost -U yz_user -d yz_construction
# Enter password when prompted
\q
```

## Step 3: Deploy Backend API

### 3.1 Clone Repository and Setup Backend

```bash
# Create project directory
sudo mkdir -p /var/www/yz-construction
sudo chown $USER:$USER /var/www/yz-construction
cd /var/www/yz-construction

# Clone your repository (or upload files)
# git clone your-repo-url .
# Or upload files using SCP/SFTP

# Navigate to backend
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Create uploads directory
mkdir -p uploads/projects

# Copy production environment file
cp ../deployment/.env.production .env
# Edit .env with your actual values
nano .env
```

### 3.2 Build Backend

```bash
# Build TypeScript
npm run build

# Test the API
npm start
# Press Ctrl+C to stop after testing
```

### 3.3 Setup PM2

```bash
# Copy PM2 config
cp ../deployment/ecosystem.config.js .

# Start API with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs
```

## Step 4: Build and Deploy Frontend

### 4.1 Build Frontend

```bash
cd /var/www/yz-construction

# Navigate to frontend (your existing React app)
cd yz_construction  # or whatever your frontend folder is named

# Install dependencies
npm install

# Build for production
npm run build

# Copy build to deployment directory
sudo mkdir -p /var/www/yz-construction/frontend
sudo cp -r dist/* /var/www/yz-construction/frontend/
sudo chown -R www-data:www-data /var/www/yz-construction/frontend
```

### 4.2 Build Admin Dashboard

```bash
cd /var/www/yz-construction/admin-dashboard

# Install dependencies
npm install

# Build for production
npm run build

# Copy build to deployment directory
sudo mkdir -p /var/www/yz-construction/admin
sudo cp -r dist/* /var/www/yz-construction/admin/
sudo chown -R www-data:www-data /var/www/yz-construction/admin
```

## Step 5: Configure Nginx

### 5.1 Copy Nginx Configuration

```bash
# Copy nginx config
sudo cp /var/www/yz-construction/deployment/nginx.conf /etc/nginx/sites-available/yz-construction

# Edit the config to replace your-domain.com with your actual domain
sudo nano /etc/nginx/sites-available/yz-construction

# Enable the site
sudo ln -s /etc/nginx/sites-available/yz-construction /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
```

### 5.2 Obtain SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts to enter your email and agree to terms

# Certbot will automatically configure SSL in your Nginx config
```

### 5.3 Restart Nginx

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 6: Setup Automatic SSL Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
# Verify it's configured
sudo systemctl status certbot.timer
```

## Step 7: Setup Log Rotation

```bash
# Create log rotation config for PM2
sudo nano /etc/logrotate.d/pm2-yz-construction

# Add this content:
/var/log/pm2/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

## Step 8: Final Testing

### 8.1 Test Frontend

```bash
# Visit your domain in a browser
https://your-domain.com
```

### 8.2 Test Admin Dashboard

```bash
# Visit admin dashboard
https://your-domain.com/admin
```

### 8.3 Test API

```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 8.4 Test Login

```bash
# Login to admin dashboard using the seeded admin account
# Email: admin@yzconstruction.com
# Password: admin123 (CHANGE THIS IMMEDIATELY!)
```

## Step 9: Security Hardening

### 9.1 Change Default Admin Password

1. Login to admin dashboard
2. Go to Settings
3. Change password immediately

### 9.2 Update Environment Variables

```bash
# Generate secure JWT secrets
openssl rand -base64 32

# Update backend .env with secure values
cd /var/www/yz-construction/backend
nano .env

# Restart PM2
pm2 restart yz-construction-api
```

### 9.3 Setup Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-yz-db.sh

# Add this content:
#!/bin/bash
BACKUP_DIR="/var/backups/yz-construction"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U yz_user yz_construction > $BACKUP_DIR/yz_construction_$DATE.sql
gzip $BACKUP_DIR/yz_construction_$DATE.sql
# Keep only last 7 days of backups
find $BACKUP_DIR -name "yz_construction_*.sql.gz" -mtime +7 -delete

# Make script executable
sudo chmod +x /usr/local/bin/backup-yz-db.sh

# Add to cron (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-yz-db.sh") | crontab -
```

### 9.4 Setup File Backups

```bash
# Create backup script for uploads
sudo nano /usr/local/bin/backup-yz-uploads.sh

# Add this content:
#!/bin/bash
BACKUP_DIR="/var/backups/yz-construction"
SOURCE_DIR="/var/www/yz-construction/backend/uploads"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz $SOURCE_DIR
# Keep only last 7 days of backups
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

# Make script executable
sudo chmod +x /usr/local/bin/backup-yz-uploads.sh

# Add to cron (daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-yz-uploads.sh") | crontab -
```

## Step 10: Monitoring

### 10.1 Monitor PM2

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs yz-construction-api

# Monitor in real-time
pm2 monit
```

### 10.2 Monitor Nginx

```bash
# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/yz_construction_error.log
```

### 10.3 Monitor System Resources

```bash
# Install htop if not present
sudo apt install -y htop

# Monitor system resources
htop
```

## Troubleshooting

### API Not Starting

```bash
# Check PM2 logs
pm2 logs yz-construction-api --err

# Check if port is in use
sudo netstat -tlnp | grep 3001

# Check database connection
cd /var/www/yz-construction/backend
npx prisma studio
```

### Nginx 502 Bad Gateway

```bash
# Check if API is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/yz_construction_error.log

# Restart Nginx
sudo systemctl restart nginx
```

### File Upload Issues

```bash
# Check uploads directory permissions
ls -la /var/www/yz-construction/backend/uploads

# Fix permissions if_needed
sudo chown -R www-data:www-data /var/www/yz-construction/backend/uploads
sudo chmod -R 755 /var/www/yz-construction/backend/uploads
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if database exists
sudo -u postgres psql -l

# Test connection
psql -h localhost -U yz_user -d yz_construction
```

## Maintenance Tasks

### Weekly

- Check PM2 logs for errors
- Review Nginx access logs for unusual activity
- Verify backups are running correctly

### Monthly

- Update system packages: `sudo apt update && sudo apt upgrade -y`
- Check disk space: `df -h`
- Review and rotate logs if needed

### As Needed

- Update Node.js dependencies in backend
- Update frontend dependencies
- Renew SSL manually if auto-renewal fails

## Support

For issues with:
- **Backend API**: Check PM2 logs and database connection
- **Frontend**: Check Nginx configuration and build process
- **Database**: Check PostgreSQL status and connection
- **SSL**: Check Certbot logs and Nginx configuration
