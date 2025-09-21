#!/bin/bash

# Script de déploiement Lahamarchand
echo "🚀 Déploiement de Lahamarchand sur Vercel..."

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé. Installation..."
    npm install -g vercel
fi

# Vérifier la connexion à Vercel
echo "🔐 Vérification de la connexion Vercel..."
vercel whoami || {
    echo "❌ Non connecté à Vercel. Connexion..."
    vercel login
}

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate

# Déployer sur Vercel
echo "📦 Déploiement sur Vercel..."
vercel --prod

echo "✅ Déploiement terminé !"
echo "📋 N'oubliez pas de :"
echo "   1. Configurer les variables d'environnement sur Vercel"
echo "   2. Exécuter les migrations : npx prisma migrate deploy"
echo "   3. Tester l'application déployée"
