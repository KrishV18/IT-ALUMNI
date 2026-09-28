#!/usr/bin/env bash
set -e

echo "==> Installing Python dependencies into project directory..."
python3 -m pip install -r requirements.txt --target ./python_libs --upgrade

echo "==> Installing Node.js dependencies..."
npm install

echo "==> Building Next.js app..."
npm run build

echo "==> Build complete!"
