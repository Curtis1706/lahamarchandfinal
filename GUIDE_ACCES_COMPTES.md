# 🔐 Guide d'Accès - Comptes Utilisateurs Lahamarchand

## 📍 URL de Connexion
**http://localhost:3000/auth/login**

---

## 🔑 Mot de Passe Universel
**Tous les comptes utilisent le même mot de passe pour les tests :**
```
password123
```

---

## 👥 Comptes par Rôle

### 👑 **PDG (Président Directeur Général)**
*Accès complet à toutes les fonctionnalités d'administration*

| Nom | Email | Dashboard |
|-----|-------|-----------|
| Jean-Pierre Directeur | `pdg@lahamarchand.com` | `/dashboard/pdg` |
| Marie Administratrice | `admin@lahamarchand.com` | `/dashboard/pdg` |

**Fonctionnalités PDG :**
- ✅ Validation des projets concepteurs
- ✅ Validation des œuvres auteurs/concepteurs  
- ✅ Gestion des utilisateurs
- ✅ Gestion des écoles/partenaires
- ✅ Audit et historique complets
- ✅ Statistiques et rapports
- ✅ Gestion des stocks
- ✅ Validation des inscriptions

---

### 🎨 **CONCEPTEUR**
*Création et gestion de projets, puis d'œuvres associées*

| Nom | Email | Spécialité | Dashboard |
|-----|-------|------------|-----------|
| Alphonse Concepteur | `alphonse.concepteur@lahamarchand.com` | Littérature | `/dashboard/concepteur` |
| Sophie Mathématiques | `sophie.maths@lahamarchand.com` | Mathématiques | `/dashboard/concepteur` |
| Pierre Sciences | `pierre.sciences@lahamarchand.com` | Sciences Physiques | `/dashboard/concepteur` |

**Fonctionnalités Concepteur :**
- ✅ Créer des projets (brouillon)
- ✅ Soumettre des projets au PDG
- ✅ Créer des œuvres (sur projets validés)
- ✅ Suivre le statut des projets/œuvres
- ✅ Recevoir des notifications
- ✅ Messagerie interne
- ✅ Gestion du profil

---

### ✍️ **AUTEUR**
*Soumission directe d'œuvres finalisées*

| Nom | Email | Spécialité | Dashboard |
|-----|-------|------------|-----------|
| Émilie Auteure | `emilie.auteure@lahamarchand.com` | Littérature | `/dashboard/auteur` |
| Marc Historien | `marc.historien@lahamarchand.com` | Histoire-Géographie | `/dashboard/auteur` |
| Claire Philosophe | `claire.philosophe@lahamarchand.com` | Philosophie | `/dashboard/auteur` |

**Fonctionnalités Auteur :**
- ✅ Soumettre des œuvres directement
- ✅ Suivre le statut des œuvres
- ✅ Recevoir des notifications
- ✅ Consulter les royalties
- ✅ Gestion du profil

---

### 💼 **REPRÉSENTANT**
*Suivi commercial et relation client*

| Nom | Email | Région | Dashboard |
|-----|-------|--------|-----------|
| Thomas Représentant | `thomas.rep@lahamarchand.com` | Nord | `/dashboard/representant` |
| Julie Commerciale | `julie.commerciale@lahamarchand.com` | Sud | `/dashboard/representant` |

**Fonctionnalités Représentant :**
- ✅ Suivi des commandes clients
- ✅ Gestion des écoles assignées
- ✅ Statistiques de vente
- ✅ Communication avec les clients
- ✅ Rapports d'activité

---

### 🏫 **CLIENT**
*Consultation et commande d'œuvres*

| Nom | Email | Type | Dashboard |
|-----|-------|------|-----------|
| École Primaire Saint-Martin | `ecole.saintmartin@education.fr` | École Primaire | `/dashboard/client` |
| Lycée Victor Hugo | `lycee.victorhugo@education.fr` | Lycée | `/dashboard/client` |
| Collège Jean Moulin | `college.jeanmoulin@education.fr` | Collège | `/dashboard/client` |

**Fonctionnalités Client :**
- ✅ Consulter le catalogue d'œuvres
- ✅ Passer des commandes
- ✅ Suivre les livraisons
- ✅ Historique des achats
- ✅ Gestion du profil établissement

---

## 🧪 Parcours de Test Recommandés

### 🎯 **Test Workflow Complet Projet → Œuvre**

1. **Connexion Concepteur**
   ```
   📧 alphonse.concepteur@lahamarchand.com
   🔑 password123
   🌐 /dashboard/concepteur
   ```

2. **Créer un Projet**
   - Aller sur "Nouveau Projet"
   - Remplir le formulaire
   - Sauvegarder en brouillon

3. **Soumettre au PDG**
   - Aller sur "Mes Projets"
   - Cliquer "Soumettre au PDG"

4. **Connexion PDG**
   ```
   📧 pdg@lahamarchand.com
   🔑 password123
   🌐 /dashboard/pdg
   ```

5. **Valider le Projet**
   - Aller sur "Gestion Projets"
   - Accepter le projet soumis

6. **Retour Concepteur**
   - Vérifier notification reçue
   - Créer une œuvre sur le projet validé

### 🎯 **Test Workflow Auteur Direct**

1. **Connexion Auteur**
   ```
   📧 emilie.auteure@lahamarchand.com
   🔑 password123
   🌐 /dashboard/auteur
   ```

2. **Soumettre une Œuvre**
   - Créer œuvre directement
   - Soumettre pour validation

3. **Validation PDG**
   - Connexion PDG
   - Valider/Refuser l'œuvre

---

## 🔧 Résolution de Problèmes

### ❌ **Erreur "404 Not Found" sur API**
- **Cause :** Route API manquante
- **Solution :** Vérifier que le serveur est démarré (`npm run dev`)

### ❌ **Erreur de Permissions**
- **Cause :** Rôle incorrect ou session expirée
- **Solution :** Se déconnecter/reconnecter avec le bon compte

### ❌ **Base de Données Vide**
- **Cause :** Migration non appliquée
- **Solution :** Exécuter `node scripts/create-all-role-accounts.js`

---

## 📊 Statistiques des Comptes

| Rôle | Nombre | Fonctionnalités Principales |
|------|--------|------------------------------|
| PDG | 2 | Administration complète |
| CONCEPTEUR | 3 | Projets → Œuvres |
| AUTEUR | 3 | Œuvres directes |
| REPRÉSENTANT | 2 | Suivi commercial |
| CLIENT | 3 | Commandes |
| **TOTAL** | **13** | **Système complet** |

---

## 🚀 Démarrage Rapide

1. **Démarrer l'application**
   ```bash
   npm run dev
   ```

2. **Ouvrir le navigateur**
   ```
   http://localhost:3000
   ```

3. **Se connecter avec n'importe quel compte**
   ```
   Email: [voir tableau ci-dessus]
   Mot de passe: password123
   ```

4. **Explorer les fonctionnalités selon le rôle**

---

## 🎉 Système Multi-Rôles Opérationnel !

Tous les rôles sont maintenant configurés avec des comptes de test fonctionnels. Vous pouvez tester l'intégralité des workflows métier de la plateforme Lahamarchand.
