#!/bin/bash

echo "InstaFlow Project Verification"
echo "=============================="
echo ""

check_file() {
  if [ -f "$1" ]; then
    echo "OK: $1"
  else
    echo "MISSING: $1"
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo "OK: $1/"
  else
    echo "MISSING: $1/"
  fi
}

echo "Checking Client Structure..."
check_dir "client"
check_dir "client/src"
check_dir "client/src/components"
check_dir "client/src/pages"
check_dir "client/src/hooks"
check_dir "client/src/store"
check_dir "client/src/services"
check_dir "client/src/utils"
check_dir "client/src/animations"

echo ""
echo "Checking Server Structure..."
check_dir "server"
check_dir "server/controllers"
check_dir "server/models"
check_dir "server/routes"
check_dir "server/middleware"

echo ""
echo "Checking Configuration Files..."
check_file "client/package.json"
check_file "client/vite.config.js"
check_file "client/tailwind.config.js"
check_file "client/index.html"
check_file "client/netlify.toml"
check_file "server/package.json"
check_file "server/server.js"
check_file "server/.env"

echo ""
echo "Verification complete."