#!/bin/bash

# Deploy Uus.js documentation to GitHub Pages

echo "🚀 Deploying Uus.js documentation..."

# Build the documentation site
echo "📦 Building documentation..."

# Create a temporary directory for deployment
DEPLOY_DIR=$(mktemp -d)
CURRENT_DIR=$(pwd)

# Copy documentation files
cp -r docs/* $DEPLOY_DIR/
cp -r examples $DEPLOY_DIR/

# Ensure we have the necessary files
if [ ! -f "$DEPLOY_DIR/docsify.html" ]; then
  echo "❌ Error: docsify.html not found"
  exit 1
fi

# Rename docsify.html to index.html for GitHub Pages
mv $DEPLOY_DIR/docsify.html $DEPLOY_DIR/index.html

# Initialize git in deploy directory
cd $DEPLOY_DIR
git init
git add -A
git commit -m "Deploy documentation"

# Push to gh-pages branch
echo "📤 Pushing to GitHub Pages..."
git push -f https://github.com/uus-js/uus.git master:gh-pages

# Cleanup
cd $CURRENT_DIR
rm -rf $DEPLOY_DIR

echo "✅ Documentation deployed successfully!"
echo "🌐 Visit: https://uus-js.github.io/uus/"