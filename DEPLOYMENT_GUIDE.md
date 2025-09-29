# 🚀 Guide de Déploiement - Lahamarchand sur Vercel + Neon

## 📋 Prérequis

1. **Compte Vercel** : [vercel.com](https://vercel.com)
2. **Compte Neon** : [neon.tech](https://neon.tech)
3. **GitHub Repository** : Votre code doit être sur GitHub

## 🗄️ Étape 1 : Configuration de la base de données Neon

### 1.1 Créer un projet Neon
1. Connectez-vous à [neon.tech](https://neon.tech)
2. Cliquez sur "Create Project"
3. Choisissez un nom : `lahamarchand-db`
4. Sélectionnez la région la plus proche (Europe)
5. Cliquez sur "Create Project"

### 1.2 Récupérer la connection string
1. Dans votre projet Neon, allez dans "Dashboard"
2. Cliquez sur "Connection Details"
3. Copiez la **Connection String** (format PostgreSQL)
4. Elle ressemble à : `postgresql://username:password@hostname:port/database?sslmode=require`

## 🔧 Étape 2 : Configuration des variables d'environnement

### 2.1 Variables locales (pour le développement)
Créez un fichier `.env.local` à la racine du projet :

```env
# Database
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-clé-secrète-très-longue-et-complexe"

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# App Configuration
NODE_ENV="development"
```

### 2.2 Variables Vercel (pour la production)
Dans votre projet Vercel, allez dans "Settings" > "Environment Variables" et ajoutez :

- `DATABASE_URL` : Votre connection string Neon
- `NEXTAUTH_SECRET` : Une clé secrète complexe (générez avec `openssl rand -base64 32`)
- `NEXTAUTH_URL` : L'URL de votre site Vercel (ex: `https://lahamarchand.vercel.app`)

## 🏗️ Étape 3 : Migration de la base de données

### 3.1 Générer le client Prisma
```bash
npm run db:generate
```

### 3.2 Appliquer les migrations
```bash
npm run db:migrate:deploy
```

### 3.3 (Optionnel) Seeder la base de données
```bash
npm run db:seed
```

## 🚀 Étape 4 : Déploiement sur Vercel

### 4.1 Via l'interface Vercel
1. Connectez votre compte GitHub à Vercel
2. Importez votre repository `lahamarchand-front`
3. Vercel détectera automatiquement Next.js
4. Ajoutez les variables d'environnement
5. Cliquez sur "Deploy"

### 4.2 Via CLI Vercel
```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Déployer en production
vercel --prod
```

## 🔍 Étape 5 : Vérification du déploiement

### 5.1 Vérifier la base de données
1. Connectez-vous à votre application déployée
2. Testez la création d'un compte utilisateur
3. Vérifiez que les données sont bien enregistrées dans Neon

### 5.2 Vérifier les fonctionnalités
- [ ] Connexion/Déconnexion
- [ ] Création de comptes
- [ ] Dashboard PDG
- [ ] Gestion des commandes
- [ ] Upload de fichiers

## 🛠️ Étape 6 : Configuration post-déploiement

### 6.1 Créer le compte PDG
Une fois déployé, vous devrez créer le compte PDG via l'interface ou via un script.

### 6.2 Configurer les domaines (optionnel)
1. Dans Vercel, allez dans "Settings" > "Domains"
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS

## 🔧 Scripts utiles

### Générer une clé secrète
```bash
openssl rand -base64 32
```

### Vérifier la connexion à la base
```bash
npx prisma db pull
```

### Ouvrir Prisma Studio
```bash
npm run db:studio
```

## 🚨 Dépannage

### Erreur de connexion à la base
- Vérifiez que `DATABASE_URL` est correct
- Vérifiez que la base Neon est active
- Vérifiez les permissions SSL

### Erreur de build
- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez que `prisma generate` a été exécuté

### Erreur d'authentification
- Vérifiez que `NEXTAUTH_SECRET` est défini
- Vérifiez que `NEXTAUTH_URL` correspond à votre domaine

## 📞 Support

- **Vercel** : [vercel.com/docs](https://vercel.com/docs)
- **Neon** : [neon.tech/docs](https://neon.tech/docs)
- **Prisma** : [prisma.io/docs](https://prisma.io/docs)
