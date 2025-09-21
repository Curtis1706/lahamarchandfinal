# Script PowerShell pour vérifier et configurer la base de données
Write-Host "🔍 Checking database configuration..." -ForegroundColor Yellow

# Vérifier si Node.js est disponible
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js available: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Vérifier si Prisma est installé
try {
    $prismaVersion = npx prisma --version
    Write-Host "✅ Prisma CLI available" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Prisma CLI not found. Installing..." -ForegroundColor Yellow
    npm install prisma @prisma/client
}

# Exécuter le script de vérification
Write-Host "`n🚀 Running database check..." -ForegroundColor Cyan
try {
    node check-database.js
    Write-Host "`n✅ Database check completed!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Database check failed: $_" -ForegroundColor Red
    Write-Host "Please check the error messages above and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart the development server: npm run dev" -ForegroundColor White
Write-Host "2. Login as concepteur: concepteur@test.com / password123" -ForegroundColor White
Write-Host "3. Access dashboard: http://localhost:3000/dashboard/concepteur" -ForegroundColor White


