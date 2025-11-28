# 📁 ORGANISATION DES SCRIPTS

Ce dossier contient tous les scripts utilitaires du projet, organisés par catégorie.

## 📂 Structure

```
scripts/
├── database/       # Scripts de gestion de base de données
├── test/          # Scripts de test
├── debug/         # Scripts de débogage
├── setup/         # Scripts de configuration/installation
├── migration/     # Scripts de migration
├── fix/           # Scripts de correction
└── archive/       # Scripts obsolètes (à supprimer après vérification)
```

## 🔍 Catégories

### Database (`database/`)
Scripts pour gérer la base de données :
- `check-database.js` - Vérifier la connexion
- `check-disciplines.js` - Vérifier les disciplines
- `check-pdg-users.js` - Vérifier les utilisateurs PDG
- `check-validated-projects.js` - Vérifier les projets validés
- `check-work-statuses.js` - Vérifier les statuts des œuvres

### Test (`test/`)
Scripts de test pour les fonctionnalités :
- `test-*.js` - Tous les scripts de test

### Debug (`debug/`)
Scripts de débogage :
- `debug-*.js` - Scripts de débogage
- `diagnose-*.js` - Scripts de diagnostic

### Setup (`setup/`)
Scripts de configuration et installation :
- `setup-*.js` - Scripts de configuration
- `create-*.js` - Scripts de création de données initiales

### Migration (`migration/`)
Scripts de migration de données :
- `migrate-*.js` - Scripts de migration

### Fix (`fix/`)
Scripts de correction de problèmes :
- `fix-*.js` - Scripts de correction

### Archive (`archive/`)
Scripts obsolètes ou non utilisés (à supprimer après vérification)

## 📝 Notes

- Les scripts dans `archive/` peuvent être supprimés après vérification
- Les scripts de test peuvent être exécutés individuellement
- Les scripts de debug sont temporaires et peuvent être supprimés après résolution des problèmes





