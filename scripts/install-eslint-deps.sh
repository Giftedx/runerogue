#!/bin/sh

echo "🔧 Installing ESLint dependencies..."

# Install ESLint and related dependencies
if pnpm add -D -w \
  eslint@latest \
  @eslint/js@latest \
  typescript-eslint@latest \
  eslint-config-prettier@latest \
  globals@latest \
  @types/node@latest; then
  
  echo "✅ ESLint dependencies installed successfully!"
  exit 0
else
  echo "❌ Failed to install ESLint dependencies"
  exit 1
fi
