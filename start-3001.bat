@echo off
echo Starting Enterprise Project and Task Platform (ApexBoard) on custom ports (Frontend: 3001, Backend: 5001)...
cd /d "%~dp0"

set PORT=5001
set BACKEND_PORT=5001

start "ApexBoard Backend Server (5001)" cmd /k "set PORT=5001 && node server/index.js"
start "ApexBoard Frontend Client (3001)" cmd /k "cd client && set PORT=3001 && set BACKEND_PORT=5001 && npm run dev -- --host --port 3001"

echo Services started!
echo Frontend is accessible at: http://localhost:3001
echo Backend is accessible at: http://localhost:5001
