# Script PowerShell pour appliquer les migrations Prisma
Write-Host "🚀 Applying Prisma migrations..." -ForegroundColor Green

# Vérifier si Prisma est installé
try {
    $prismaVersion = npx prisma --version
    Write-Host "✅ Prisma CLI available" -ForegroundColor Green
} catch {
    Write-Host "❌ Prisma CLI not found. Installing..." -ForegroundColor Yellow
    npm install prisma @prisma/client
}

# Générer le client Prisma
Write-Host "📦 Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated" -ForegroundColor Green
} catch {
    Write-Host "❌ Error generating Prisma client: $_" -ForegroundColor Red
    exit 1
}

# Appliquer les migrations
Write-Host "🔄 Applying database migrations..." -ForegroundColor Yellow
try {
    npx prisma migrate dev --name add-project-model
    Write-Host "✅ Migrations applied successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Migration failed, trying to reset database..." -ForegroundColor Yellow
    try {
        npx prisma migrate reset --force
        Write-Host "✅ Database reset and migrations applied" -ForegroundColor Green
    } catch {
        Write-Host "❌ Database reset failed: $_" -ForegroundColor Red
        Write-Host "Please check your database connection and try again." -ForegroundColor Yellow
        exit 1
    }
}

# Créer les données de base
Write-Host "📝 Creating basic data..." -ForegroundColor Yellow
try {
    node setup-database.js
    Write-Host "✅ Basic data created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creating basic data: $_" -ForegroundColor Red
}

Write-Host "`n🎉 Database setup completed!" -ForegroundColor Green
Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the development server: npm run dev" -ForegroundColor White
Write-Host "2. Login as concepteur: concepteur@test.com / password123" -ForegroundColor White
Write-Host "3. Access dashboard: http://localhost:3000/dashboard/concepteur" -ForegroundColor White


