# Script PowerShell pour configuration permanente de la base de données
Write-Host "🚀 Configuration permanente de la base de données..." -ForegroundColor Green

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
    node configure-permanent-db.js
    Write-Host "`n✅ Configuration permanente terminée!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Configuration échouée: $_" -ForegroundColor Red
    Write-Host "Veuillez vérifier les messages d'erreur ci-dessus." -ForegroundColor Yellow
}

Write-Host "`n🎯 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Redémarrer le serveur: npm run dev" -ForegroundColor White
Write-Host "2. Se connecter comme concepteur: concepteur@test.com / password123" -ForegroundColor White
Write-Host "3. Créer un projet: /dashboard/concepteur/projets" -ForegroundColor White
Write-Host "4. Se connecter comme PDG: pdg@test.com / password123" -ForegroundColor White
Write-Host "5. Valider le projet: /dashboard/pdg/projets" -ForegroundColor White


