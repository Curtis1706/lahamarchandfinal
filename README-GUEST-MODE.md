# Mode Invité (Guest Mode) - Documentation

## Vue d'ensemble

Le mode invité permet aux visiteurs d'accéder à certaines fonctionnalités publiques de la plateforme **sans créer de compte ni s'authentifier**.

## Architecture

### 1. Rôle Guest

Le rôle `GUEST` est défini dans `lib/guest.ts` et représente un utilisateur non authentifié.

```typescript
export const GUEST_ROLE = 'GUEST' as const
```

### 2. Permissions

Les permissions sont définies dans `lib/guest.ts` via l'objet `ROLE_PERMISSIONS` :

- **GUEST peut** :
  - Voir les œuvres publiques (statut ON_SALE)
  - Voir les projets publics
  - Accéder aux pages publiques (about, faq, terms, contact)

- **GUEST ne peut pas** :
  - Créer/modifier/supprimer des données
  - Accéder au dashboard
  - Gérer le stock
  - Télécharger des fichiers privés

### 3. Middleware

Le middleware (`middleware.ts`) :
- Détecte automatiquement les utilisateurs non authentifiés
- Redirige vers `/auth/login` pour les routes protégées
- Permet l'accès aux routes publiques

### 4. Routes publiques

Routes accessibles en mode invité :
- `/` - Page d'accueil
- `/works/public` - Catalogue des œuvres publiques
- `/projects/public` - Projets publics
- `/about` - À propos
- `/faq` - Questions fréquentes
- `/terms` - Conditions d'utilisation
- `/contact` - Contact

### 5. Routes protégées

Routes nécessitant une authentification :
- `/dashboard/*` - Tous les dashboards
- `/works/*` (sauf `/works/public`)
- `/projects/*` (sauf `/projects/public`)
- `/stock/*`
- `/partners/*`
- `/representatives/*`

## Utilisation

### Dans les composants React

```typescript
import { useGuest } from "@/hooks/use-guest"
import { AuthRequiredPrompt } from "@/components/auth-required-prompt"

function MyComponent() {
  const { isGuest } = useGuest()
  const [showPrompt, setShowPrompt] = useState(false)

  const handleAction = () => {
    if (isGuest) {
      setShowPrompt(true)
    } else {
      // Action autorisée
    }
  }

  return (
    <>
      <button onClick={handleAction}>Action</button>
      <AuthRequiredPrompt
        open={showPrompt}
        onClose={() => setShowPrompt(false)}
      />
    </>
  )
}
```

### Dans les routes API

```typescript
import { allowGuest, requireAuth, requireRole } from "@/lib/auth-guard"

// Route accessible en mode invité
export const GET = allowGuest(async (request, context) => {
  // context.isGuest indique si l'utilisateur est en mode invité
  // context.user contient les informations utilisateur (null si guest)
})

// Route nécessitant une authentification
export const POST = requireAuth(async (request, context) => {
  // context.isGuest sera toujours false
  // context.user contient les informations utilisateur
})

// Route nécessitant un rôle spécifique
export const PUT = requireRole(['PDG', 'CONCEPTEUR'], async (request, context) => {
  // Seuls les PDG et CONCEPTEUR peuvent accéder
})
```

### Afficher la bannière guest

```typescript
import { GuestBanner } from "@/components/guest-banner"

function MyPage() {
  return (
    <>
      <GuestBanner />
      {/* Contenu de la page */}
    </>
  )
}
```

## Sécurité

### Points importants

1. **Aucune session persistante** : Le mode invité ne crée pas de session
2. **Pas de cookies sensibles** : Aucune donnée personnelle n'est stockée
3. **Vérification côté serveur** : Toutes les routes API vérifient les permissions
4. **Isolation des données** : Les invités ne peuvent accéder qu'aux données publiques

### Tests de sécurité

- ✅ Tentative d'accès direct à `/dashboard` → Redirection vers login
- ✅ Tentative d'accès à une route API protégée → 401/403
- ✅ Aucune donnée sensible chargée côté client pour les invités

## Exemples

### Exemple 1 : Page publique avec bannière

```typescript
"use client"

import { GuestBanner } from "@/components/guest-banner"

export default function PublicPage() {
  return (
    <>
      <GuestBanner />
      <div>Contenu public</div>
    </>
  )
}
```

### Exemple 2 : API publique

```typescript
import { allowGuest } from "@/lib/auth-guard"

export const GET = allowGuest(async (request, context) => {
  // Récupérer uniquement les données publiques
  const publicData = await getPublicData()
  return NextResponse.json({ data: publicData })
})
```

### Exemple 3 : Action nécessitant authentification

```typescript
"use client"

import { useGuest } from "@/hooks/use-guest"
import { AuthRequiredPrompt } from "@/components/auth-required-prompt"

export default function MyComponent() {
  const { isGuest, requireAuth } = useGuestMode()
  const [showPrompt, setShowPrompt] = useState(false)

  const handleCreate = () => {
    if (isGuest) {
      setShowPrompt(true)
    } else {
      // Créer l'élément
    }
  }

  return (
    <>
      <button onClick={handleCreate}>Créer</button>
      <AuthRequiredPrompt
        open={showPrompt}
        onClose={() => setShowPrompt(false)}
        callbackUrl="/current-page"
      />
    </>
  )
}
```

## Migration

Pour migrer une route existante vers le mode invité :

1. **Route API** :
   ```typescript
   // Avant
   export async function GET(request: NextRequest) {
     const session = await getServerSession(authOptions)
     if (!session?.user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
     }
     // ...
   }

   // Après
   import { allowGuest } from "@/lib/auth-guard"
   export const GET = allowGuest(async (request, context) => {
     if (context.isGuest) {
       // Retourner uniquement les données publiques
     }
     // ...
   })
   ```

2. **Composant React** :
   ```typescript
   // Ajouter la bannière guest
   import { GuestBanner } from "@/components/guest-banner"
   
   // Utiliser le hook useGuest pour vérifier le mode
   import { useGuest } from "@/hooks/use-guest"
   ```

## Support

Pour toute question ou problème lié au mode invité, consultez :
- `lib/guest.ts` - Définitions des permissions
- `lib/auth-guard.ts` - Guards d'authentification
- `middleware.ts` - Middleware de routage
- `hooks/use-guest.ts` - Hook React pour le mode invité

