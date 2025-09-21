# Script de déploiement Lahamarchand pour Windows
Write-Host "🚀 Déploiement de Lahamarchand sur Vercel..." -ForegroundColor Green

# Vérifier que Vercel CLI est installé
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI n'est pas installé. Installation..." -ForegroundColor Red
    npm install -g vercel
}

# Vérifier la connexion à Vercel
Write-Host "🔐 Vérification de la connexion Vercel..." -ForegroundColor Yellow
try {
    vercel whoami | Out-Null
    Write-Host "✅ Connecté à Vercel" -ForegroundColor Green
} catch {
    Write-Host "❌ Non connecté à Vercel. Connexion..." -ForegroundColor Red
    vercel login
}

# Générer le client Prisma
Write-Host "🔧 Génération du client Prisma..." -ForegroundColor Yellow
npx prisma generate

# Déployer sur Vercel
Write-Host "📦 Déploiement sur Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
Write-Host "📋 N'oubliez pas de :" -ForegroundColor Cyan
Write-Host "   1. Configurer les variables d'environnement sur Vercel" -ForegroundColor White
Write-Host "   2. Exécuter les migrations : npx prisma migrate deploy" -ForegroundColor White
Write-Host "   3. Tester l'application déployée" -ForegroundColor White
