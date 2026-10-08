#!/bin/bash
# Midtrans Integration Verification Script
# Run: bash verify_midtrans.sh

echo "========================================="
echo "Midtrans Integration Verification"
echo "========================================="
echo ""

# Check 1: Files exist
echo "? Checking Backend Files..."
files=(
  "app/Services/MidtransService.php"
  "config/midtrans.php"
  "app/Models/Transaksi.php"
  "app/Http/Controllers/TransaksiController.php"
  "app/Http/Controllers/AuthController.php"
  "routes/api.php"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ? $file"
  else
    echo "  ? MISSING: $file"
  fi
done

echo ""
echo "? Checking Frontend Files..."
files=(
  "resources/js/components/ModalQris.jsx"
  "resources/js/pages/petugas/KendaraanKeluar.jsx"
  "resources/js/app.jsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ? $file"
  else
    echo "  ? MISSING: $file"
  fi
done

echo ""
echo "? Checking Documentation..."
files=(
  "QUICK_START.md"
  "MIDTRANS_IMPLEMENTATION.md"
  "MIDTRANS_SETUP_CHECKLIST.md"
  "IMPLEMENTATION_SUMMARY.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ? $file"
  else
    echo "  ? MISSING: $file"
  fi
done

echo ""
echo "? Checking PHP Syntax..."
php -l app/Services/MidtransService.php 2>&1 | grep -q "No syntax errors" && echo "  ? MidtransService.php" || echo "  ? Syntax error in MidtransService.php"
php -l app/Http/Controllers/TransaksiController.php 2>&1 | grep -q "No syntax errors" && echo "  ? TransaksiController.php" || echo "  ? Syntax error"

echo ""
echo "? Checking .env Configuration..."
if grep -q "MIDTRANS_SERVER_KEY" .env; then
  echo "  ? MIDTRANS_SERVER_KEY found"
else
  echo "  ? MIDTRANS_SERVER_KEY not found"
fi

if grep -q "MIDTRANS_CLIENT_KEY" .env; then
  echo "  ? MIDTRANS_CLIENT_KEY found"
else
  echo "  ? MIDTRANS_CLIENT_KEY not found"
fi

echo ""
echo "========================================="
echo "Verification Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Get Midtrans credentials from dashboard"
echo "2. Update .env with actual keys"
echo "3. Run: php artisan migrate"
echo "4. Run: npm run build"
echo "5. Test payment flow"
echo ""
