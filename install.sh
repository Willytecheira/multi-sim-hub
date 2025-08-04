#!/bin/bash

echo "🚀 Installing WhatsApp Multi-Session API"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash install.sh"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update -y

# Install Node.js 18.x
echo "📥 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install dependencies for Puppeteer (required for WhatsApp Web)
echo "🔧 Installing Puppeteer dependencies..."
apt-get install -y wget curl unzip software-properties-common
apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
    libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
    libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
    fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils

# Install additional Chrome dependencies
echo "🌐 Installing Chrome dependencies..."
apt-get install -y fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
    libdrm2 libgtk-3-0 libgtk-4-1 xdg-utils

# Install PM2 globally
echo "⚙️ Installing PM2..."
npm install -g pm2

# Create logs directory
mkdir -p logs

# Set proper permissions
chown -R www-data:www-data logs
chmod 755 logs

# Verify installations
echo "✅ Installation verification:"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PM2 version: $(pm2 --version)"

# Create systemd service for PM2 (optional)
echo "🔄 Setting up PM2 startup script..."
pm2 startup systemd -u www-data --hp /var/www

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. cd your-project-directory/"
echo "2. npm install"
echo "3. pm2 start ecosystem.config.js"
echo "4. pm2 save"
echo ""
echo "🔧 Optional - Configure Nginx:"
echo "1. Copy nginx.conf to /etc/nginx/sites-available/whatsapp-api"
echo "2. Create SSL certificates"
echo "3. Enable the site: ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/"
echo "4. Restart Nginx: systemctl restart nginx"
echo ""
echo "📊 Access your dashboard at: http://your-server-ip:3000"
echo "🔑 Default API Key: whatsapp-api-key-2024"
echo ""
echo "⚠️ Important Security Notes:"
echo "- Change the default API key in production"
echo "- Set up SSL certificates for HTTPS"
echo "- Configure firewall rules"
echo "- Regular security updates"