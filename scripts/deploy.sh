#!/bin/bash
set -e

echo "🚀 Review Cruncher Deploy Script"
echo "================================"

cd /opt/Review-Cruncher

echo "📦 Building React app..."
npm run build

echo "📋 Deploying to /var/www/html/..."
cp -r build/* /var/www/html/

echo "✅ Deployed successfully at $(date)"
echo ""
echo "New bundle: $(grep -o 'main\.[a-f0-9]*\.js' /var/www/html/index.html)"
