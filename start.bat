@echo off
echo ===================================================
echo 🚦 SmartCommute Launcher (Phase 1)
echo ===================================================
echo.

echo [1/3] Checking Node.js environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH. Please install Node.js first.
    pause
    exit /b 1
)

echo [2/3] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install backend dependencies.
    pause
    exit /b 1
)

echo [3/3] Installing frontend dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install frontend dependencies.
    pause
    exit /b 1
)

echo.
echo Installing completed! Launching servers...
echo.
echo Launching Backend server (port 5000) and Frontend dev server (port 3000)...
echo.

cd ..
start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"

echo ===================================================
echo 🎉 SmartCommute has been launched!
echo.
echo - Backend server running on: http://localhost:5000
echo - Frontend app running on: http://localhost:3000
echo.
echo The servers are running in separate background windows.
echo Keep those windows open to test the app.
echo ===================================================
pause
