@echo off
echo =========================================
echo Starting MERN Project (MongoDB + Backend + Frontend)
echo =========================================


REM ---- Start MongoDB ----
echo [1/5] Starting MongoDB...
start "" "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "C:\data\db"
timeout /t 5 >nul

REM ---- Run seed.js ----
echo [2/5] Seeding Database with seed.js...
cd backend
start cmd /k "node seed.js && echo Seed.js complete. Press any key to close... & pause"
cd ..

REM ---- Run seedAdmin.js ----
echo [3/5] Seeding Admin with seedAdmin.js...
cd backend
start cmd /k "node seedAdmin.js && echo seedAdmin.js complete. Press any key to close... & pause"
cd ..

REM ---- Start Backend with Nodemon ----
echo [4/5] Starting Backend (Nodemon - npm run dev)...
cd backend
start cmd /k "npm run dev"
cd ..

REM ---- Start User Frontend (React @3000) ----
echo [5/5] Starting Frontend (React App)...
cd frontend
start cmd /k "npm start"
cd ..

REM ---- Start Admin Frontend (React @3001) ----
echo [Admin] Starting Admin Frontend...
cd admin
start cmd /k "set PORT=3001 && set BROWSER=chrome && npm start"
cd ..

REM ---- Open VS Code ----
start cmd /k code .

echo =========================================
echo ✅ All services started! MongoDB, Seeds, Backend, Frontend running.
echo =========================================
pause