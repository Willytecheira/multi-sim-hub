#!/bin/bash
set -e

echo "🔧 Fixing frontend build issue..."

# 1. Verificar que estamos en el directorio correcto
echo "📍 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

# 2. Ejecutar directamente vite build (bypass npm script que está corrompido en el servidor)
echo "🏗️ Building frontend with vite..."
npx vite build

# 3. Verificar que el build funcionó
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo "✅ Build successful! Files in dist:"
    ls -la dist/
    
    # Verificar index.html
    if [ -f "dist/index.html" ] && [ -s "dist/index.html" ]; then
        echo "✅ index.html exists and is not empty"
        echo "First few lines of index.html:"
        head -5 dist/index.html
    else
        echo "❌ index.html is missing or empty"
        exit 1
    fi
    
    # 4. Establecer permisos correctos
    echo "🔐 Setting permissions..."
    chown -R www-data:www-data dist/ 2>/dev/null || chown -R $USER:$USER dist/
    chmod -R 755 dist/
    
    # 5. Reiniciar PM2
    echo "🔄 Restarting PM2..."
    pm2 restart whatsapp-api
    
    # Esperar un momento
    sleep 3
    
    # 6. Probar el endpoint
    echo "🧪 Testing endpoint..."
    response_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    echo "Response code: $response_code"
    
    if [ "$response_code" = "200" ]; then
        echo "✅ Server responding with 200 OK"
    else
        echo "⚠️ Server responding with: $response_code"
        echo "Let's check what the server is returning:"
        curl -s http://localhost:3000 | head -10
    fi
    
    echo ""
    echo "🎉 Frontend fix complete!"
    echo "🌐 Visit: http://168.197.49.169:3000"
    echo ""
    echo "📋 PM2 status:"
    pm2 list
    
else
    echo "❌ Build failed or dist is empty"
    echo "Trying to debug the issue..."
    
    # Verificar dependencias
    echo "📦 Checking if node_modules exists:"
    if [ -d "node_modules" ]; then
        echo "✅ node_modules exists"
    else
        echo "❌ node_modules missing, installing..."
        npm install
        echo "🔄 Retrying build..."
        npx vite build
    fi
    
    # Verificar vite config
    echo "⚙️ Checking vite config:"
    if [ -f "vite.config.ts" ]; then
        echo "✅ vite.config.ts exists"
        head -10 vite.config.ts
    else
        echo "❌ vite.config.ts missing"
    fi
    
    exit 1
fi