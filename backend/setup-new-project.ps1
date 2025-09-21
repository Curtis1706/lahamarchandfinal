# Script de Configuration pour Nouveau Projet Laha Marchand
# Usage: .\setup-new-project.ps1

Write-Host "🚀 Configuration Laha Marchand - Nouveau Projet" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# 1. Installation des dépendances
Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
npm install

# 2. Configuration Prisma
Write-Host "🗄️ Configuration Prisma..." -ForegroundColor Yellow
npx prisma generate

# 3. Copier le fichier d'environnement
Write-Host "⚙️ Configuration des variables d'environnement..." -ForegroundColor Yellow
if (!(Test-Path ".env.local")) {
    Copy-Item "env.example" ".env.local"
    Write-Host "✅ Fichier .env.local créé à partir de env.example" -ForegroundColor Green
    Write-Host "⚠️  N'oubliez pas de modifier .env.local avec vos vraies valeurs!" -ForegroundColor Red
} else {
    Write-Host "ℹ️  Le fichier .env.local existe déjà" -ForegroundColor Blue
}

# 4. Initialisation de la base de données
Write-Host "🗃️ Initialisation de la base de données..." -ForegroundColor Yellow
$response = Read-Host "Voulez-vous initialiser la base de données? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    npx prisma migrate dev --name init
    Write-Host "✅ Base de données initialisée" -ForegroundColor Green
    
    # 5. Création du compte PDG
    $createPdg = Read-Host "Voulez-vous créer un compte PDG? (y/n)"
    if ($createPdg -eq "y" -or $createPdg -eq "Y") {
        node create-pdg-account.js
    }
} else {
    Write-Host "⏭️  Initialisation de la base de données ignorée" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Configuration terminée!" -ForegroundColor Green
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Modifier .env.local avec vos vraies valeurs" -ForegroundColor White
Write-Host "   2. Adapter les textes pour le Bénin dans les composants" -ForegroundColor White
Write-Host "   3. Modifier la devise FCFA si nécessaire" -ForegroundColor White
Write-Host "   4. Lancer le serveur: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📖 Consultez README.md pour plus de détails" -ForegroundColor Blue
