# LAHA MARCHAND - Backend Package

Ce dossier contient tous les fichiers backend nécessaires pour créer un nouveau projet Laha Marchand (Bénin ou autre pays).

## 📁 Structure du Backend

```
backend/
├── api/                    # Routes API Next.js
│   ├── auth/              # Authentification NextAuth
│   ├── author/            # API pour les auteurs
│   ├── client/            # API pour les clients
│   ├── concepteur/        # API pour les concepteurs
│   ├── pdg/               # API pour le PDG
│   ├── partenaire/        # API pour les partenaires
│   └── representant/      # API pour les représentants
├── prisma/                # Configuration base de données
│   ├── schema.prisma      # Schéma de la base de données
│   ├── migrations/        # Migrations Prisma
│   └── seed.ts           # Données de démarrage
├── lib/                   # Utilitaires et configurations
│   ├── auth.ts           # Configuration NextAuth
│   ├── prisma.ts         # Client Prisma
│   └── utils.ts          # Fonctions utilitaires
├── types/                 # Définitions TypeScript
├── scripts/              # Scripts de configuration
└── *.ps1, *.js, *.sql    # Scripts de setup
```

## 🚀 Installation pour Nouveau Projet

### 1. Copier les Fichiers
```bash
# Copier le contenu de ce dossier dans votre nouveau projet
cp -r backend/* /path/to/new-project/
```

### 2. Installer les Dépendances
```bash
npm install
# ou
pnpm install
```

### 3. Configuration Base de Données

#### Option A: PostgreSQL (Recommandé pour Production)
```bash
# Créer un fichier .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/lahamarchand_benin"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

#### Option B: SQLite (Développement Local)
```bash
# Dans prisma/schema.prisma, changer:
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### 4. Setup Base de Données
```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# (Optionnel) Remplir avec des données de test
npx prisma db seed
```

## 🌍 Adaptation pour Bénin

### Modifications Nécessaires

1. **Nom de l'Application**
   - Remplacer "LAHA MARCHAND" par "LAHA MARCHAND BÉNIN"
   - Modifier les titres dans les composants UI

2. **Devise**
   - Remplacer "FCFA" par la devise locale
   - Mettre à jour les formatages de prix

3. **Localisation**
   - Adapter les textes français selon le contexte béninois
   - Modifier les adresses et informations de contact

4. **Configuration Pays**
   - Adapter la TVA selon la législation béninoise
   - Modifier les paramètres fiscaux dans le code

### Fichiers à Modifier

- `lib/utils.ts` : Formatage des prix et devises
- `api/*/route.ts` : Textes des notifications
- Configuration TVA dans les APIs de création d'articles

## 🔑 Fonctionnalités Incluses

### Rôles Utilisateurs
- **PDG** : Gestion complète du système
- **Représentant** : Gestion des partenaires
- **Concepteur** : Création et gestion des œuvres
- **Auteur** : Suivi des œuvres et royalties
- **Partenaire** : Commandes en gros
- **Client** : Achats individuels

### Modules API
- ✅ Authentification complète (NextAuth)
- ✅ Gestion des utilisateurs et rôles
- ✅ Catalogue d'œuvres
- ✅ Système de commandes
- ✅ Gestion du stock
- ✅ Calcul des royalties
- ✅ Notifications
- ✅ Statistiques et rapports

## 📊 Base de Données

Le schéma Prisma inclut :
- **Users** : Gestion des utilisateurs multi-rôles
- **Works** : Catalogue des œuvres
- **Orders** : Système de commandes
- **StockMovements** : Traçabilité du stock
- **Royalties** : Calcul des droits d'auteur
- **Notifications** : Système de notifications
- **Disciplines** : Catégories d'œuvres

## 🛠️ Scripts Utiles

- `setup-database.ps1` : Configuration initiale BDD
- `create-pdg-account.js` : Création compte administrateur
- `test-database-connection.js` : Test connexion BDD

## 📝 Notes Importantes

1. **Sécurité** : Changez toutes les clés secrètes
2. **Base de Données** : Utilisez PostgreSQL en production
3. **Variables d'Environnement** : Configurez .env.local
4. **Migration** : Testez les migrations sur un environnement de test

## 🤝 Support

Ce backend a été testé et utilisé pour Laha Marchand Gabon.
Pour le projet Bénin, adaptez les configurations selon vos besoins spécifiques.

---

**Version** : 1.0.0  
**Date** : Septembre 2024  
**Origine** : Laha Marchand Gabon
