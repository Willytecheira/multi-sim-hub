#!/bin/bash

# WhatsApp Multi-Session API - Update Script
# Usage: bash update.sh [branch]

set -e  # Exit on any error

PROJECT_DIR="/var/www/multi-sim-hub"
BACKUP_DIR="/var/www/backups"
BRANCH=${1:-main}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🔄 Starting update process..."
echo "📁 Project Directory: $PROJECT_DIR"
echo "🌿 Branch: $BRANCH"
echo "📅 Timestamp: $TIMESTAMP"

# Check if running as www-data or root
if [ "$USER" != "www-data" ] && [ "$EUID" -ne 0 ]; then
    echo "❌ Run as www-data user or root: sudo -u www-data bash update.sh"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Navigate to project directory
cd "$PROJECT_DIR" || {
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
}

# Create backup
echo "💾 Creating backup..."
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='logs' \
    --exclude='.git' \
    . || {
    echo "⚠️ Backup failed, continuing anyway..."
}

# Stop PM2 processes
echo "⏹️ Stopping PM2 processes..."
pm2 stop whatsapp-api || echo "⚠️ PM2 process not running"

# Stash any local changes
echo "📦 Stashing local changes..."
git stash push -m "Auto-stash before update $TIMESTAMP" || echo "⚠️ Nothing to stash"

# Fetch latest changes
echo "📥 Fetching latest changes from GitHub..."
git fetch origin || {
    echo "❌ Failed to fetch from GitHub"
    exit 1
}

# Switch to specified branch
echo "🌿 Switching to branch: $BRANCH"
git checkout "$BRANCH" || {
    echo "❌ Failed to checkout branch: $BRANCH"
    exit 1
}

# Pull latest changes
echo "⬇️ Pulling latest changes..."
git pull origin "$BRANCH" || {
    echo "❌ Failed to pull changes"
    exit 1
}

# Install/update frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install || {
    echo "❌ Failed to install frontend dependencies"
    exit 1
}

# Build frontend
echo "🏗️ Building frontend..."
npm run build || {
    echo "❌ Frontend build failed"
    exit 1
}

# Install/update server dependencies
echo "📦 Installing server dependencies..."
npm install --prefix . --package-lock-only=false package-server.json || {
    echo "❌ Failed to install server dependencies"
    exit 1
}

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs sessions dist/qrcodes

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data . || echo "⚠️ Permission setting failed"
chmod -R 755 . || echo "⚠️ Chmod failed"
chmod +x *.sh || echo "⚠️ Script permissions failed"

# Start PM2 processes
echo "▶️ Starting PM2 processes..."
pm2 start ecosystem.config.js || {
    echo "❌ Failed to start PM2"
    echo "🔄 Attempting to restore from backup..."
    
    # Rollback logic
    if [ -f "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" ]; then
        echo "🔄 Restoring from backup..."
        tar -xzf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$PROJECT_DIR"
        pm2 start ecosystem.config.js || echo "❌ Rollback failed"
    fi
    exit 1
}

# Health check
echo "🏥 Performing health check..."
sleep 5
bash health-check.sh || {
    echo "⚠️ Health check failed, but update completed"
}

# Clean old backups (keep last 5)
echo "🧹 Cleaning old backups..."
cd "$BACKUP_DIR"
ls -t backup_*.tar.gz | tail -n +6 | xargs -r rm || echo "⚠️ Backup cleanup failed"

echo ""
echo "✅ Update completed successfully!"
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "📝 Recent logs:"
pm2 logs whatsapp-api --lines 10 --nostream
echo ""
echo "🌐 Application should be running at: http://localhost:3000"
echo "📋 To monitor: pm2 monit"
echo "📊 To check logs: pm2 logs whatsapp-api"