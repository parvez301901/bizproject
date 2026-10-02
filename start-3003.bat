@echo off
echo Starting Enterprise Project and Task Platform (ApexBoard) on custom ports (Frontend: 3003, Backend: 5003)...
cd /d "%~dp0"

set PORT=5003
set BACKEND_PORT=5003

start "ApexBoard Backend Server (5003)" cmd /k "set PORT=5003 && node server/index.js"
start "ApexBoard Frontend Client (3003)" cmd /k "cd client && set PORT=3003 && set BACKEND_PORT=5003 && npm run dev -- --host --port 3003"

echo Services started!
echo Frontend is accessible at: http://localhost:3003
echo Backend is accessible at: http://localhost:5003
