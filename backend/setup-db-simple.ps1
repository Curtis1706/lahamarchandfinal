# Script PowerShell simple pour configurer la base de données
Write-Host "🚀 Configuration de la base de données..." -ForegroundColor Green

# Exécuter le script de configuration
Write-Host "`n📝 Exécution du script de configuration..." -ForegroundColor Cyan
try {
    node setup-db-simple.js
    Write-Host "`n✅ Configuration terminée!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Configuration échouée: $_" -ForegroundColor Red
    Write-Host "Veuillez vérifier les messages d'erreur ci-dessus." -ForegroundColor Yellow
}

Write-Host "`n🎯 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Redémarrer le serveur: npm run dev" -ForegroundColor White
Write-Host "2. Se connecter: concepteur@test.com / password123" -ForegroundColor White
Write-Host "3. Vérifier les projets: /dashboard/concepteur/projets" -ForegroundColor White


