# Guide d'utilisation LAHALEX

## 🚀 Démarrage rapide

### 1. Installation
\`\`\`bash
npm install
npm run setup
npm run dev
\`\`\`

### 2. Accès admin
- URL : `http://localhost:3000/admin/login`
- Mot de passe : `laha229`

## 📁 Structure des fichiers

### Métadonnées (JSON)
Créez un fichier `.json` dans `content/metadata/` :

\`\`\`json
{
  "id": "mon-article-001",
  "title": "Titre de mon article",
  "slug": "mon-article",
  "description": "Description courte",
  "summary": "Résumé optionnel",
  "source": "Source du document",
  "publishedAt": "2024-01-15T00:00:00.000Z",
  "category": {
    "id": "droit-prive",
    "name": "Droit privé", 
    "slug": "droit-prive",
    "color": "#2563EB"
  },
  "subcategories": [
    {
      "id": "droit-travail",
      "name": "Droit du travail",
      "slug": "droit-travail", 
      "color": "#1D4ED8"
    }
  ],
  "tags": [
    {
      "id": "code-travail",
      "name": "Code du travail",
      "slug": "code-travail",
      "color": "#6B7280"
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "title": "TITRE I - Introduction",
      "level": 1,
      "order": 1,
      "startIndex": 0,
      "endIndex": 50
    }
  ],
  "author": {
    "id": "admin",
    "name": "Administrateur"
  },
  "documentType": "Loi",
  "favoritesCount": 0
}
\`\`\`

### Contenu (Markdown)
Créez un fichier `.md` dans `content/markdown/` avec le même nom :

\`\`\`markdown
# TITRE I - Introduction

Ceci est le contenu de mon article juridique.

## Article 1

Le contenu de l'article 1...

### Article 2

Le contenu de l'article 2...
\`\`\`

## 🎯 Fonctionnalités

### ✅ Ce qui fonctionne exactement comme avant :
- **Design identique** - Aucun changement visuel
- **Navigation par sections** - Table des matières interactive
- **Recherche in-document** - Highlight et navigation
- **Responsive design** - Mobile, tablet, desktop
- **Breadcrumbs** - Navigation contextuelle
- **Filtres par catégorie** - Sidebar avec compteurs
- **Actions** - Imprimer, partager, favoris

### 🆕 Nouveautés :
- **Publication instantanée** - Plus d'attente de traitement IA
- **Contrôle total** - Métadonnées exactes
- **Coût zéro** - Plus de frais OpenAI
- **Simplicité** - Architecture plus simple
- **Contenu Markdown** - Facilité d'écriture et richesse du contenu

## 📋 Workflow de publication

1. **Préparer les fichiers** :
   - `mon-article.md` (contenu Markdown)
   - `mon-article.json` (métadonnées)

2. **Upload via admin** :
   - Aller sur `/admin`
   - Glisser-déposer les 2 fichiers
   - Cliquer "Publier"

3. **Article en ligne** :
   - Disponible immédiatement sur `/article/mon-article`
   - Indexé dans la recherche
   - Navigation automatique

## 🔧 Conseils pratiques

### Sections et navigation
- Les `startIndex`/`endIndex` dans le JSON ne sont plus utilisés pour le rendu HTML direct, mais peuvent servir pour des outils d'analyse ou de validation.
- Les `level` définissent la hiérarchie (1=h1, 2=h2, etc.)
- Les `id` doivent être uniques et stables
- **Important** : Les titres dans votre fichier Markdown (`# Mon Titre`, `## Sous-titre`) doivent correspondre **exactement** aux titres (`title`) définis dans la section `sections` de votre fichier JSON pour que les ancres soient correctement injectées.

### Catégories
- Utilisez des couleurs cohérentes
- Les sous-catégories sont optionnelles
- Les slugs doivent être en kebab-case

### Performance
- Pas de limite de taille de fichier
- Chargement instantané
- Recherche côté client très rapide

## 🆘 Dépannage

### Erreur "Article non trouvé"
- Vérifiez que les fichiers `.md` et `.json` ont le même nom
- Vérifiez que le `slug` dans le JSON correspond au nom de fichier

### Sections non cliquables
- Assurez-vous que les titres dans votre fichier Markdown correspondent **exactement** aux titres dans la section `sections` de votre fichier JSON.
- Vérifiez les `level` dans le JSON pour une hiérarchie correcte.

### Problème d'upload
- Vérifiez le format JSON (utilisez un validateur)
- Vérifiez que le slug n'existe pas déjà

## 📞 Support
Pour toute question : créez une issue sur le projet GitHub
\`\`\`

## 🎉 **Résumé de l'implémentation complète**

### ✅ **Ce qui a été fait :**

1.  **Architecture complète** - Système de fichiers Markdown (.md) + JSON
2.  **APIs adaptées** - Lecture des fichiers statiques et conversion Markdown vers HTML
3.  **Dashboard admin** - Upload Markdown + JSON avec validation
4.  **Traitement automatique** - Injection d'ancres HTML dans le Markdown converti
5.  **Navigation parfaite** - Table des matières, recherche, highlight
6.  **Design identique** - Aucun changement visuel
7.  **Performance optimale** - Plus de traitement IA, instantané
8.  **Documentation complète** - Guide d'utilisation détaillé

### 🚀 **Pour démarrer :**

\`\`\`bash
npm install
npm run setup
npm run dev
\`\`\`

Puis allez sur `/admin` (mot de passe: `laha229`) et uploadez vos premiers fichiers Markdown et JSON !

**Tout fonctionne exactement comme avant, mais en mieux : plus rapide, plus fiable, et sans coût d'IA !** 🎯
