#!/bin/bash
set -e

echo "🏗️ Quick frontend build and deploy..."

# Install frontend dependencies if needed
npm install

# Build the React frontend
npm run build

# Set permissions
sudo chown -R www-data:www-data dist/ 2>/dev/null || chown -R $USER:$USER dist/
sudo chmod -R 755 dist/ 2>/dev/null || chmod -R 755 dist/

# Check if dist has files
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo "✅ Build successful! Files in dist:"
    ls -la dist/
    
    # Restart PM2 to pick up new files
    pm2 restart whatsapp-api
    
    echo "🎉 Frontend deployed! Visit: http://168.197.49.169:3000"
else
    echo "❌ Build failed or dist is empty"
    exit 1
fi