@echo off
echo Starting Enterprise Project & Task Platform (ApexBoard)...
cd /d "%~dp0"

start "ApexBoard Backend Server" cmd /k "node server/index.js"
start "ApexBoard Frontend Client" cmd /k "cd client && npm run dev -- --host"

echo Services started!
echo Frontend will be accessible at: http://localhost:3000
echo Backend will be accessible at: http://localhost:5000
