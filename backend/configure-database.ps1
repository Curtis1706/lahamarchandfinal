# Script PowerShell pour configurer la base de données
Write-Host "🚀 Configuration de la base de données..." -ForegroundColor Green

# Vérifier si Node.js est disponible
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js disponible: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non trouvé. Veuillez installer Node.js d'abord." -ForegroundColor Red
    exit 1
}

# Vérifier si Prisma est installé
try {
    $prismaVersion = npx prisma --version
    Write-Host "✅ Prisma CLI disponible" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Prisma CLI non trouvé. Installation..." -ForegroundColor Yellow
    npm install prisma @prisma/client
}

# Exécuter le script de configuration
Write-Host "`n🚀 Exécution du script de configuration..." -ForegroundColor Cyan
try {
    node configure-database.js
    Write-Host "`n✅ Configuration terminée!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Configuration échouée: $_" -ForegroundColor Red
    Write-Host "Veuillez vérifier les messages d'erreur ci-dessus et réessayer." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🎯 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Redémarrer le serveur de développement: npm run dev" -ForegroundColor White
Write-Host "2. Se connecter comme concepteur: concepteur@test.com / password123" -ForegroundColor White
Write-Host "3. Accéder au dashboard: http://localhost:3000/dashboard/concepteur" -ForegroundColor White
Write-Host "4. Tester la création de projet" -ForegroundColor White


