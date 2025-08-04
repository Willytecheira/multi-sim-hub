#!/bin/bash

# WhatsApp Multi-Session API - Health Check Script
# This script verifies that the application is running correctly

set -e

API_URL="http://localhost:3000"
TIMEOUT=10
MAX_RETRIES=3

echo "🏥 Starting health check..."

# Function to check if port is open
check_port() {
    local port=$1
    if command -v nc &> /dev/null; then
        nc -z localhost $port 2>/dev/null
    elif command -v telnet &> /dev/null; then
        timeout 3 telnet localhost $port 2>/dev/null | grep -q "Connected"
    else
        # Fallback using /dev/tcp
        timeout 3 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null
    fi
}

# Check if PM2 process is running
echo "📋 Checking PM2 process..."
if ! pm2 describe whatsapp-api &>/dev/null; then
    echo "❌ PM2 process 'whatsapp-api' is not running"
    exit 1
fi

PM2_STATUS=$(pm2 describe whatsapp-api | grep "status" | head -1 | awk '{print $4}')
if [ "$PM2_STATUS" != "online" ]; then
    echo "❌ PM2 process status: $PM2_STATUS (expected: online)"
    exit 1
fi

echo "✅ PM2 process is online"

# Check if port 3000 is open
echo "🔌 Checking port 3000..."
if ! check_port 3000; then
    echo "❌ Port 3000 is not open"
    exit 1
fi

echo "✅ Port 3000 is open"

# Check HTTP response
echo "🌐 Checking HTTP response..."
for i in $(seq 1 $MAX_RETRIES); do
    if command -v curl &> /dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$API_URL" || echo "000")
    elif command -v wget &> /dev/null; then
        HTTP_CODE=$(wget -q -O /dev/null -T $TIMEOUT "$API_URL" 2>&1 && echo "200" || echo "000")
    else
        echo "⚠️ Neither curl nor wget available, skipping HTTP check"
        break
    fi
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ HTTP response OK (200)"
        break
    elif [ $i -eq $MAX_RETRIES ]; then
        echo "❌ HTTP response failed after $MAX_RETRIES retries (code: $HTTP_CODE)"
        exit 1
    else
        echo "⚠️ HTTP response failed (code: $HTTP_CODE), retrying in 2s... ($i/$MAX_RETRIES)"
        sleep 2
    fi
done

# Check API endpoint
echo "🔌 Checking API endpoints..."
if command -v curl &> /dev/null; then
    API_RESPONSE=$(curl -s --connect-timeout $TIMEOUT "$API_URL/api/metrics" || echo "failed")
    if echo "$API_RESPONSE" | grep -q "sessions\|memory\|uptime"; then
        echo "✅ API endpoints responding"
    else
        echo "⚠️ API endpoints may not be working properly"
    fi
else
    echo "⚠️ Curl not available, skipping API endpoint check"
fi

# Check disk space
echo "💾 Checking disk space..."
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "⚠️ Disk usage high: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️ Disk usage moderate: ${DISK_USAGE}%"
else
    echo "✅ Disk usage OK: ${DISK_USAGE}%"
fi

# Check memory usage
echo "🧠 Checking memory usage..."
if command -v free &> /dev/null; then
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ "$MEMORY_USAGE" -gt 90 ]; then
        echo "⚠️ Memory usage high: ${MEMORY_USAGE}%"
    elif [ "$MEMORY_USAGE" -gt 80 ]; then
        echo "⚠️ Memory usage moderate: ${MEMORY_USAGE}%"
    else
        echo "✅ Memory usage OK: ${MEMORY_USAGE}%"
    fi
else
    echo "⚠️ Cannot check memory usage"
fi

# Check log files
echo "📄 Checking log files..."
LOG_DIR="./logs"
if [ -d "$LOG_DIR" ]; then
    ERROR_COUNT=$(find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -l "ERROR\|FATAL" {} \; 2>/dev/null | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo "⚠️ Found error logs in the last 24 hours"
        echo "📋 Recent errors:"
        find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep "ERROR\|FATAL" {} \; 2>/dev/null | tail -3
    else
        echo "✅ No recent errors in logs"
    fi
else
    echo "⚠️ Log directory not found"
fi

echo ""
echo "🎉 Health check completed!"
echo "📊 System Status Summary:"
echo "  • PM2 Process: ✅ Online"
echo "  • Port 3000: ✅ Open"
echo "  • HTTP Response: ✅ OK"
echo "  • Disk Usage: ${DISK_USAGE:-unknown}%"
echo "  • Memory Usage: ${MEMORY_USAGE:-unknown}%"
echo ""
echo "🔧 Useful commands:"
echo "  • View logs: pm2 logs whatsapp-api"
echo "  • Monitor: pm2 monit"
echo "  • Restart: pm2 restart whatsapp-api"
echo "  • Status: pm2 status"