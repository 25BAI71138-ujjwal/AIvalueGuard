Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting AIValueGuard - AI Cost Optimization Gateway" -ForegroundColor Cyan
Write-Host "Code Yudh Hackathon PS-08" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Starting Backend FastAPI Server on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", ".\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting Frontend Vite Server on http://localhost:5173 ..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd frontend; npm.cmd run dev"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "AIValueGuard is live!" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
