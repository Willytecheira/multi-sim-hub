#!/bin/bash

echo "🏗️ Building frontend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the frontend
echo "🔨 Building React app..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Frontend build successful!"
    echo "📁 Dist directory created with $(ls -la dist | wc -l) files"
    
    # Set proper permissions
    chown -R www-data:www-data dist/
    chmod -R 755 dist/
    
    # Restart PM2 to serve the new build
    echo "🔄 Restarting PM2..."
    pm2 restart whatsapp-api
    
    echo "🎉 Frontend deployed successfully!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi