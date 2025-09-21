# Script PowerShell pour configuration permanente
Write-Host "🚀 Configuration permanente de la base de données..." -ForegroundColor Green

Write-Host "`n📋 Étapes de configuration:" -ForegroundColor Cyan
Write-Host "1. Génération du client Prisma" -ForegroundColor White
Write-Host "2. Application des migrations" -ForegroundColor White
Write-Host "3. Création des données de base" -ForegroundColor White

Write-Host "`n🔄 Étape 1: Génération du client Prisma..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Client Prisma généré" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Génération échouée, continuation..." -ForegroundColor Yellow
}

Write-Host "`n🔄 Étape 2: Application des migrations..." -ForegroundColor Yellow
try {
    npx prisma migrate dev --name add-project-model
    Write-Host "✅ Migrations appliquées" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Migration échouée, tentative de reset..." -ForegroundColor Yellow
    try {
        npx prisma migrate reset --force
        Write-Host "✅ Base de données réinitialisée" -ForegroundColor Green
    } catch {
        Write-Host "❌ Reset échoué, continuation..." -ForegroundColor Red
    }
}

Write-Host "`n🔄 Étape 3: Création des données de base..." -ForegroundColor Yellow
try {
    node setup-db-final.js
    Write-Host "✅ Données de base créées" -ForegroundColor Green
} catch {
    Write-Host "❌ Création des données échouée: $_" -ForegroundColor Red
}

Write-Host "`n🎯 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Redémarrer le serveur: npm run dev" -ForegroundColor White
Write-Host "2. Tester la création de projet comme concepteur" -ForegroundColor White
Write-Host "3. Tester la validation comme PDG" -ForegroundColor White


