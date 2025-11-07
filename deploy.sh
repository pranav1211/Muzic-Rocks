#!/bin/bash

# Deployment script for muzic.rocks
# Make this executable: chmod +x deploy.sh

echo "🚀 Building Voice Monitor for muzic.rocks..."

# Build the project
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📦 Files ready in ./dist folder"
    echo ""
    echo "📋 Next steps for deployment:"
    echo "1. Upload all files from ./dist/ to your web server"
    echo "2. Ensure .htaccess or server config is set up for SPA routing"
    echo ""
    echo "Deployment methods:"
    echo ""
    echo "Via FTP/SFTP:"
    echo "  Upload contents of ./dist/ to your web root (public_html, www, or htdocs)"
    echo ""
    echo "Via rsync (if you have SSH access):"
    echo "  rsync -avz --delete ./dist/ user@muzic.rocks:/path/to/webroot/"
    echo ""
    echo "Via SCP (if you have SSH access):"
    echo "  scp -r ./dist/* user@muzic.rocks:/path/to/webroot/"
    echo ""
    echo "⚠️  Important:"
    echo "  - Ensure HTTPS is enabled (required for microphone access)"
    echo "  - Clear browser cache after deployment"
    echo "  - Test PWA installation on mobile"
else
    echo "❌ Build failed!"
    exit 1
fi