# 🚀 Deployment Instructions - WhatsApp Multi-Session API

## Quick Deployment (Ubuntu 22.04 LTS)

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Git
sudo apt install git -y

# Create project directory
sudo mkdir -p /var/www
cd /var/www
```

### 2. Clone Repository
```bash
# Clone from GitHub
sudo git clone https://github.com/Willytecheira/multi-sim-hub.git
cd multi-sim-hub

# Set permissions
sudo chown -R www-data:www-data .
sudo chmod +x *.sh
```

### 3. Run Installation Script
```bash
# Execute installation script
sudo bash install.sh

# Wait for installation to complete (5-10 minutes)
```

### 4. Install Dependencies and Build
```bash
# Switch to www-data user
sudo -u www-data bash

# Install frontend dependencies
npm install

# Build frontend
npm run build

# Install server dependencies using the server package.json
cp package-server.json package.json
npm install

# Create necessary directories
mkdir -p logs sessions dist/qrcodes uploads
```

### 5. Configure Environment
```bash
# Copy production environment file
cp .env.production .env

# Edit environment variables (IMPORTANT!)
nano .env

# Change these values:
# - API_KEY: Use a strong, unique API key
# - JWT_SECRET: Use a strong, unique JWT secret
# - DEFAULT_ADMIN_PASSWORD: Change default admin password
```

### 6. Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup systemd -u www-data --hp /var/www

# Verify it's running
pm2 status
```

### 7. Health Check
```bash
# Run health check
bash health-check.sh

# Check if application is accessible
curl http://localhost:3000
```

## 🔄 Easy Updates from GitHub

### Update Script Usage
```bash
# Update to latest main branch
sudo -u www-data bash update.sh

# Update to specific branch
sudo -u www-data bash update.sh development

# The script will:
# 1. Create automatic backup
# 2. Pull latest changes from GitHub
# 3. Install dependencies
# 4. Build frontend
# 5. Restart services
# 6. Perform health check
```

### Manual Update Process
```bash
# Navigate to project directory
cd /var/www/multi-sim-hub

# Pull latest changes
git pull origin main

# Install dependencies and build
npm install
npm run build

# Restart PM2
pm2 restart whatsapp-api

# Health check
bash health-check.sh
```

## 🌐 Nginx Configuration (Optional)

### Install and Configure Nginx
```bash
# Install Nginx
sudo apt install nginx -y

# Copy configuration
sudo cp nginx.conf /etc/nginx/sites-available/whatsapp-api

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace your-domain.com)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## 🔒 Security Configuration

### Firewall Setup
```bash
# Enable UFW
sudo ufw enable

# Allow SSH (change 22 if using different port)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application port (if not using Nginx)
sudo ufw allow 3000/tcp

# Check status
sudo ufw status
```

### Change Default Credentials
1. Access the web interface: `http://your-server-ip:3000`
2. Login with default credentials: `admin/admin123`
3. Go to Users section and change password
4. Create additional users as needed

## 📊 Monitoring and Maintenance

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs whatsapp-api

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart whatsapp-api

# Stop application
pm2 stop whatsapp-api

# View detailed info
pm2 describe whatsapp-api
```

### Log Files
```bash
# Application logs
tail -f logs/combined.log

# Error logs
tail -f logs/error.log

# Access logs (if using Nginx)
sudo tail -f /var/log/nginx/access.log
```

### System Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
htop

# Check running processes
ps aux | grep node
```

## 🛠️ Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check PM2 logs
pm2 logs whatsapp-api

# Check if port is in use
sudo netstat -tlnp | grep :3000

# Check permissions
ls -la /var/www/multi-sim-hub
```

**WhatsApp sessions failing:**
```bash
# Check Chrome/Puppeteer dependencies
google-chrome --version

# Install missing dependencies
sudo apt install -y fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0
```

**Memory issues:**
```bash
# Increase PM2 memory limit
pm2 restart whatsapp-api --max-memory-restart 2G

# Clear old sessions
rm -rf sessions/*
```

### Get Help
- Check logs: `pm2 logs whatsapp-api`
- Run health check: `bash health-check.sh`
- Check GitHub issues: [Repository Issues](https://github.com/Willytecheira/multi-sim-hub/issues)

## 🚀 Production Checklist

- [ ] Changed default API key
- [ ] Changed default admin password
- [ ] Configured environment variables
- [ ] Set up SSL certificates
- [ ] Configured firewall
- [ ] Set up automatic backups
- [ ] Configured monitoring
- [ ] Tested update process
- [ ] Documented custom configurations

## 📝 Notes

- **OS Recommendation:** Ubuntu Server 22.04 LTS
- **Minimum Requirements:** 2GB RAM, 20GB disk space
- **Node.js Version:** 18.x or higher
- **Default Access:** http://your-server-ip:3000
- **Default Credentials:** admin/admin123 (CHANGE IN PRODUCTION!)

---

Need help? Check the [README.md](README.md) for detailed API documentation.