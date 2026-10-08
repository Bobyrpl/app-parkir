@echo off
REM Midtrans Integration Verification Script (Windows)
REM Run: verify_midtrans.bat

echo =========================================
echo Midtrans Integration Verification
echo =========================================
echo.

echo Checking Backend Files...
if exist "app\Services\MidtransService.php" (echo   OK: MidtransService.php) else (echo   MISSING: MidtransService.php)
if exist "config\midtrans.php" (echo   OK: midtrans.php) else (echo   MISSING: midtrans.php)
if exist "app\Models\Transaksi.php" (echo   OK: Transaksi.php) else (echo   MISSING: Transaksi.php)
if exist "app\Http\Controllers\TransaksiController.php" (echo   OK: TransaksiController.php) else (echo   MISSING: TransaksiController.php)

echo.
echo Checking Frontend Files...
if exist "resources\js\components\ModalQris.jsx" (echo   OK: ModalQris.jsx) else (echo   MISSING: ModalQris.jsx)
if exist "resources\js\pages\petugas\KendaraanKeluar.jsx" (echo   OK: KendaraanKeluar.jsx) else (echo   MISSING: KendaraanKeluar.jsx)
if exist "resources\js\app.jsx" (echo   OK: app.jsx) else (echo   MISSING: app.jsx)

echo.
echo Checking Documentation...
if exist "QUICK_START.md" (echo   OK: QUICK_START.md) else (echo   MISSING: QUICK_START.md)
if exist "MIDTRANS_IMPLEMENTATION.md" (echo   OK: MIDTRANS_IMPLEMENTATION.md) else (echo   MISSING)
if exist "IMPLEMENTATION_SUMMARY.md" (echo   OK: IMPLEMENTATION_SUMMARY.md) else (echo   MISSING)

echo.
echo Checking PHP Syntax...
php -l app/Services/MidtransService.php | find "No syntax errors" >nul && echo   OK: MidtransService syntax || echo   ERROR in MidtransService
php -l app/Http/Controllers/TransaksiController.php | find "No syntax errors" >nul && echo   OK: TransaksiController syntax || echo   ERROR in TransaksiController

echo.
echo Checking .env Configuration...
findstr /M "MIDTRANS_SERVER_KEY" .env >nul && echo   OK: MIDTRANS_SERVER_KEY || echo   MISSING: MIDTRANS_SERVER_KEY
findstr /M "MIDTRANS_CLIENT_KEY" .env >nul && echo   OK: MIDTRANS_CLIENT_KEY || echo   MISSING: MIDTRANS_CLIENT_KEY

echo.
echo =========================================
echo Verification Complete!
echo =========================================
echo.
echo Next Steps:
echo 1. Get Midtrans credentials from dashboard
echo 2. Update .env with actual keys
echo 3. Run: php artisan migrate
echo 4. Run: npm run build
echo 5. Test payment flow
echo.
pause
