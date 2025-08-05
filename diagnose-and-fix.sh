#!/bin/bash
set -e

# Make script executable
chmod +x "$0"

echo "🔍 Diagnosing WhatsApp API frontend issue..."

# 1. Check current directory structure
echo "📁 Current directory structure:"
ls -la

# 2. Check if dist exists and what's in it
echo ""
echo "📦 Checking dist directory:"
if [ -d "dist" ]; then
    echo "✅ dist directory exists"
    echo "Contents of dist:"
    ls -la dist/
    echo "Number of files in dist: $(find dist -type f | wc -l)"
else
    echo "❌ dist directory does not exist"
fi

# 3. Check package.json build script
echo ""
echo "🔧 Checking package.json build script:"
if [ -f "package.json" ]; then
    echo "Build script: $(grep -A1 '"build"' package.json)"
else
    echo "❌ package.json not found"
fi

# 4. Check PM2 status
echo ""
echo "⚙️ PM2 Status:"
pm2 list

# 5. Check if port 3000 is in use
echo ""
echo "🌐 Port 3000 status:"
if lsof -i :3000 >/dev/null 2>&1; then
    echo "✅ Port 3000 is in use"
    lsof -i :3000
else
    echo "❌ Port 3000 is not in use"
fi

# 6. Check recent PM2 logs
echo ""
echo "📋 Recent PM2 logs:"
pm2 logs whatsapp-api --lines 10 --nostream

echo ""
echo "🔧 Starting fix process..."

# 7. Clean and rebuild
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf node_modules/.vite

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building frontend..."
npm run build

# 8. Check if build was successful
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo "✅ Build successful! Files in dist:"
    ls -la dist/
    
    # Check if index.html exists and is not empty
    if [ -f "dist/index.html" ] && [ -s "dist/index.html" ]; then
        echo "✅ index.html exists and is not empty"
        echo "First few lines of index.html:"
        head -5 dist/index.html
    else
        echo "❌ index.html is missing or empty"
        exit 1
    fi
    
    # Set proper permissions
    echo "🔐 Setting permissions..."
    chown -R www-data:www-data dist/ 2>/dev/null || chown -R $USER:$USER dist/
    chmod -R 755 dist/
    
    # Restart PM2
    echo "🔄 Restarting PM2..."
    pm2 restart whatsapp-api
    
    # Wait a moment for restart
    sleep 3
    
    # Test the endpoint
    echo "🧪 Testing endpoint..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        echo "✅ Server responding with 200 OK"
    else
        echo "⚠️ Server not responding properly"
        echo "Response code: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
    fi
    
    echo ""
    echo "🎉 Fix complete! Try visiting: http://168.197.49.169:3000"
    echo "📋 Final PM2 status:"
    pm2 list
    
else
    echo "❌ Build failed or dist is still empty"
    echo "Build output:"
    npm run build
    exit 1
fi