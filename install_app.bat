@echo off
echo Memeriksa instalasi Node.js...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terinstall!
    echo Silakan install dulu dari https://nodejs.org/
    echo Setelah install, restart komputer atau VS Code.
    pause
    exit /b
)

echo.
echo [INFO] Menginstall dependencies (node_modules)...
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Gagal menginstall dependencies. Cek koneksi internet.
    pause
    exit /b
)

echo.
echo [SUCCESS] Instalasi selesai! Menjalankan aplikasi...
echo Buka browser di http://localhost:5173
call npm run dev
pause
