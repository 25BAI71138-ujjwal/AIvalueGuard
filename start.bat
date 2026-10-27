@echo off
echo ========================================================
echo Starting AIValueGuard - AI Cost Optimization Gateway
echo Code Yudh Hackathon PS-08
echo ========================================================

echo [1/2] Starting Backend FastAPI Server on http://127.0.0.1:8000 ...
start "AIValueGuard Backend" cmd /k ".\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Vite Server on http://localhost:5173 ...
cd frontend
start "AIValueGuard Frontend" cmd /k "npm.cmd run dev"

echo.
echo ========================================================
echo AIValueGuard is running!
echo Access the web interface at: http://localhost:5173
echo Backend API Docs at:        http://127.0.0.1:8000/docs
echo ========================================================
pause
