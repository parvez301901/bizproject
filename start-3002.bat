@echo off
echo Starting Enterprise Project and Task Platform (ApexBoard) on custom ports (Frontend: 3002, Backend: 5002)...
cd /d "%~dp0"

set PORT=5002
set BACKEND_PORT=5002

start "ApexBoard Backend Server (5002)" cmd /k "set PORT=5002 && node server/index.js"
start "ApexBoard Frontend Client (3002)" cmd /k "cd client && set PORT=3002 && set BACKEND_PORT=5002 && npm run dev -- --host --port 3002"

echo Services started!
echo Frontend is accessible at: http://localhost:3002
echo Backend is accessible at: http://localhost:5002
