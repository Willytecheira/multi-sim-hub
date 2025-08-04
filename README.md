# WhatsApp Multi-Session API

A complete WhatsApp Multi-Session API with an administrative web dashboard for managing multiple WhatsApp sessions, sending/receiving messages, webhooks, and real-time monitoring.

![WhatsApp API Dashboard](https://img.shields.io/badge/Dashboard-React-blue) ![API](https://img.shields.io/badge/API-Node.js-green) ![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

## 🚀 Features

### 📊 Administrative Dashboard
- **Real-time Dashboard** with metrics and analytics
- **Session Management** - Create, delete, and monitor WhatsApp sessions
- **Message Management** - Send/receive messages with media support
- **Webhook Configuration** - Configure endpoints for real-time events
- **User Management** - Role-based access control (Admin, Operator, Viewer)
- **Activity Logs** - Comprehensive logging and monitoring
- **Dark/Light Theme** - Responsive design with theme switching

### 🔌 REST API
- **Session Management** - Create, list, and delete sessions
- **Message Sending** - Send text, images, videos, audio, and documents
- **QR Code Generation** - Real-time QR codes for session authentication
- **Webhook Support** - Configure webhooks for events
- **Metrics & Analytics** - Get detailed usage statistics
- **Authentication** - JWT-based API authentication

### 🔄 Real-time Features
- **Socket.IO Integration** - Real-time updates for session status
- **Live QR Codes** - Instant QR code updates
- **Message Notifications** - Real-time message delivery status
- **Session Status** - Live connection monitoring

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Recharts** for analytics graphs
- **Zustand** for state management
- **React Router** for navigation
- **Next Themes** for dark/light mode

### Backend
- **Node.js** with Express
- **whatsapp-web.js** for WhatsApp integration
- **Socket.IO** for real-time communication
- **Puppeteer** for browser automation
- **QR Code** generation
- **bcrypt** for password hashing
- **PM2** for process management

## 📋 System Requirements

### Recommended OS: Ubuntu Server 22.04 LTS
- **Node.js**: 18.x or higher
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 10GB available space
- **CPU**: 2 cores minimum
- **Network**: Stable internet connection

## 🚀 Quick Installation (Ubuntu)

### Method 1: Automated Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/whatsapp-multi-session-api.git
cd whatsapp-multi-session-api

# 2. Run automated installation (as root)
chmod +x install.sh
sudo bash install.sh

# 3. Install Node.js dependencies
npm install

# 4. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Method 2: Manual Installation

```bash
# Update system
sudo apt update -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Puppeteer dependencies
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 \
lsb-release xdg-utils

# Install PM2
sudo npm install -g pm2

# Clone and setup project
git clone https://github.com/your-username/whatsapp-multi-session-api.git
cd whatsapp-multi-session-api
npm install

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔧 Configuration

### Environment Variables
The application uses the following default configuration:

```bash
NODE_ENV=production
PORT=3000
API_KEY=whatsapp-api-key-2024
```

### Default Users
```javascript
// Admin user
Username: admin
Password: admin123
Role: admin

// Operator user  
Username: operator
Password: operator123
Role: operator

// Viewer user
Username: viewer
Password: viewer123
Role: viewer
```

**⚠️ Important: Change default passwords in production!**

## 🌐 Nginx Configuration (Production)

### 1. Copy Nginx Configuration
```bash
sudo cp nginx.conf /etc/nginx/sites-available/whatsapp-api
sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/
```

### 2. SSL Setup (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 3. Restart Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 📚 API Documentation

### Authentication
All API requests require authentication header:
```bash
Authorization: Bearer whatsapp-api-key-2024
```

### Core Endpoints

#### Sessions
```bash
# List all sessions
GET /api/sessions

# Create new session
POST /api/sessions
Content-Type: application/json
{
  "name": "Session Name"
}

# Get QR code
GET /api/sessions/:id/qr

# Send text message
POST /api/sessions/:id/send-text
Content-Type: application/json
{
  "to": "1234567890@c.us",
  "message": "Hello World!"
}

# Delete session
DELETE /api/sessions/:id
```

#### Webhooks
```bash
# Configure webhook
POST /api/webhook/configure
Content-Type: application/json
{
  "sessionId": "session_id",
  "url": "https://your-webhook-url.com/webhook",
  "events": ["message_received", "message_sent"]
}
```

#### Metrics
```bash
# Get system metrics
GET /api/metrics

# Get activity logs
GET /api/logs?limit=100&type=message_sent
```

### Webhook Events
The API sends webhooks for the following events:
- `message_received` - New message received
- `message_sent` - Message sent successfully
- `session_connected` - Session connected to WhatsApp
- `session_disconnected` - Session disconnected

## 🔄 PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js

# Stop application
pm2 stop whatsapp-api

# Restart application
pm2 restart whatsapp-api

# View logs
pm2 logs whatsapp-api

# Monitor processes
pm2 monit

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
```

## 📊 Monitoring & Logs

### Application Logs
```bash
# Real-time logs
pm2 logs whatsapp-api --lines 100

# Error logs only
pm2 logs whatsapp-api --err

# Log files location
tail -f logs/combined.log
tail -f logs/error.log
```

### System Monitoring
```bash
# PM2 monitoring
pm2 monit

# Memory usage
free -h

# Disk usage
df -h

# Process monitoring
htop
```

## 🔒 Security Best Practices

### 1. Change Default Credentials
```javascript
// In production, update these in server.js:
const users = [
  { 
    username: 'your-admin-user', 
    password: bcrypt.hashSync('your-secure-password', 10),
    role: 'admin'
  }
];
```

### 2. Environment Variables
```bash
# Create .env file (optional)
NODE_ENV=production
PORT=3000
API_KEY=your-secure-api-key-here
```

### 3. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 4. SSL/HTTPS
Always use HTTPS in production with valid SSL certificates.

## 🐛 Troubleshooting

### Common Issues

#### 1. Puppeteer/Chrome Issues
```bash
# Install missing dependencies
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libdrm2 libgtk-3-0 libgtk-4-1
```

#### 2. Permission Issues
```bash
# Fix permissions for session storage
sudo chown -R www-data:www-data ./sessions
sudo chmod -R 755 ./sessions
```

#### 3. Memory Issues
```bash
# Increase Node.js memory limit
node --max-old-space-size=2048 server.js

# Or in PM2 ecosystem.config.js:
node_args: '--max-old-space-size=2048'
```

#### 4. Port Already in Use
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>
```

### Debug Mode
```bash
# Start in debug mode
DEBUG=* node server.js

# PM2 debug logs
pm2 logs --lines 200
```

## 🔄 Updates & Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart with PM2
pm2 restart whatsapp-api
```

### Regular Maintenance
```bash
# Clear old logs (keep last 7 days)
find logs/ -name "*.log" -mtime +7 -delete

# Clean old session data
pm2 restart whatsapp-api

# Update system packages
sudo apt update && sudo apt upgrade
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [WhatsApp Web.js Documentation](https://wwebjs.dev/)
- [React Documentation](https://reactjs.org/)
- [Node.js Documentation](https://nodejs.org/)

### Community
- **Issues**: [GitHub Issues](https://github.com/your-username/whatsapp-multi-session-api/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/whatsapp-multi-session-api/discussions)

### Commercial Support
For commercial support, custom development, or enterprise features, contact us at: support@your-domain.com

---

## 📸 Screenshots

### Dashboard
![Dashboard Preview](https://via.placeholder.com/800x600/25D366/FFFFFF?text=Dashboard+Preview)

### Session Management
![Sessions Preview](https://via.placeholder.com/800x600/25D366/FFFFFF?text=Sessions+Management)

### Message Interface
![Messages Preview](https://via.placeholder.com/800x600/25D366/FFFFFF?text=Message+Interface)

---

**⭐ Star this repository if you find it useful!**

Made with ❤️ for the WhatsApp automation community.
