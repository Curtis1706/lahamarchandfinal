# Workflow Proforma - Documentation

## Vue d'ensemble

Le système de proforma de LAHA ÉDITIONS permet de créer, envoyer, suivre et convertir des devis en commandes. Ce document décrit le workflow complet et les fonctionnalités implémentées.

## Workflow des statuts

```
DRAFT → SENT → ACCEPTED → (CONVERTED via orderId)
         ↓         ↓
      EXPIRED   CANCELLED
```

### Statuts disponibles

- **DRAFT** : Brouillon, peut être modifié ou supprimé
- **SENT** : Envoyé au client, en attente de réponse
- **ACCEPTED** : Accepté par le client, prêt à être converti en commande
- **EXPIRED** : Expiré (validUntil dépassée)
- **CANCELLED** : Annulé avec raison

## Création d'un proforma

### Endpoint
`POST /api/pdg/proforma`

### Paramètres importants

- `initialStatus`: `"DRAFT"` (par défaut) ou `"SENT"` (si "Enregistrer & Envoyer")
- `clientType`: `"ECOLE"`, `"PARTENAIRE"`, `"CLIENT"`, ou `"INVITE"`
- `validUntil`: Date de validité (ISO string)
- `items`: Tableau des livres avec quantités, prix, remises, TVA

### Comportement

1. **Statut DRAFT** :
   - Le proforma est créé en brouillon
   - Aucune notification envoyée
   - Peut être modifié, supprimé ou envoyé plus tard

2. **Statut SENT** :
   - Le proforma est créé et envoyé directement
   - Une notification est créée pour le destinataire (si userId disponible)
   - Journal d'audit : `[AUDIT] Proforma créé: ... Statut: SENT`

## Actions disponibles

### Envoyer un proforma (DRAFT → SENT)

**Endpoint**: `PUT /api/pdg/proforma` avec `action: "send"`

**Comportement**:
- Change le statut de `DRAFT` à `SENT`
- Crée une notification pour le destinataire
- Journal d'audit : `[AUDIT] Proforma envoyé: ... Statut: DRAFT → SENT`

### Marquer comme accepté (SENT → ACCEPTED)

**Endpoint**: `PUT /api/pdg/proforma` avec `action: "accept"`

**Comportement**:
- Change le statut de `SENT` à `ACCEPTED`
- Enregistre `acceptedAt`
- Notifie le PDG (créateur du proforma)
- Journal d'audit : `[AUDIT] Proforma accepté: ... Statut: SENT → ACCEPTED`

### Annuler un proforma

**Endpoint**: `PUT /api/pdg/proforma` avec `action: "cancel"`

**Paramètres**:
- `cancellationReason`: Raison de l'annulation (optionnel)

**Comportement**:
- Change le statut à `CANCELLED`
- Enregistre `cancelledAt` et `cancellationReason`
- Journal d'audit : `[AUDIT] Proforma annulé: ... Raison: ...`

**Règles**:
- Impossible d'annuler un proforma déjà converti en commande (`orderId` présent)

### Convertir en commande (ACCEPTED → CONVERTED)

**Endpoint**: `PUT /api/pdg/proforma` avec `action: "convert"`

**Comportement**:
- Crée une nouvelle `Order` avec les items du proforma
- Lie le proforma à la commande via `orderId`
- Le statut reste `ACCEPTED`, mais `orderId` indique la conversion
- Journal d'audit : `[AUDIT] Proforma converti: ... → Commande ...`

**Règles**:
- Seulement si `status === 'ACCEPTED'`
- Impossible de reconvertir un proforma déjà converti

## Gestion des proformas expirés

### Route API dédiée

**Endpoint**: `POST /api/pdg/proforma/expire`

Cette route marque automatiquement tous les proformas `SENT` avec `validUntil < now` comme `EXPIRED`.

**Authentification**:
- Session PDG normale, OU
- Header `Authorization: Bearer {CRON_SECRET}` (pour cron jobs)

**Réponse**:
```json
{
  "message": "X proforma(s) marqué(s) comme expiré(s)",
  "count": 5,
  "proformas": ["PF-2026-000001", "PF-2026-000002", ...],
  "notificationsSent": 3
}
```

### Configuration d'un cron job

#### Option 1 : Cron job externe (recommandé)

Utilisez un service comme **cron-job.org**, **EasyCron**, ou un cron job sur votre serveur :

```bash
# Exécuter toutes les heures
0 * * * * curl -X POST https://votre-domaine.com/api/pdg/proforma/expire \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

#### Option 2 : Vercel Cron (si déployé sur Vercel)

Créez `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/pdg/proforma/expire",
      "schedule": "0 * * * *"
    }
  ]
}
```

#### Option 3 : Next.js API Route avec scheduler

Vous pouvez utiliser une bibliothèque comme `node-cron` dans une route API Next.js (attention aux limitations de Vercel).

### Variable d'environnement

Ajoutez dans `.env` :

```env
CRON_SECRET=votre_secret_aleatoire_ici
```

## Notifications

### Types de notifications

- **PROFORMA_SENT** : Proforma envoyé au client
- **PROFORMA_ACCEPTED** : Proforma accepté (notifie le PDG)
- **PROFORMA_EXPIRED** : Proforma expiré (notifie le destinataire)

### Destinataires

- **PROFORMA_SENT** : Client/Partenaire/École (via `userId`)
- **PROFORMA_ACCEPTED** : PDG (créateur du proforma)
- **PROFORMA_EXPIRED** : Client/Partenaire/École (via `userId`)

**Note** : Les clients invités (`INVITE`) ne reçoivent pas de notifications car ils n'ont pas de `userId`.

## Règles de non-modification

### Proformas non modifiables

Un proforma ne peut **PAS** être modifié si :

1. `status === 'ACCEPTED'` ET `orderId` est présent (déjà converti)
2. `status === 'ACCEPTED'` (même sans `orderId`)
3. `status === 'CANCELLED'`
4. `status === 'EXPIRED'`

### Action "update"

L'action `update` est actuellement **non implémentée** (retourne 501). La logique de versioning sera ajoutée dans une future version.

## Journal d'audit

Tous les événements sont loggés dans la console avec le format :

```
[AUDIT] Proforma [action]: [proformaNumber] par [email] ([name]) - [détails]
```

Exemples :
- `[AUDIT] Proforma créé: PF-2026-000001 par pdg@lahamarchand.com (PDG) - Statut: SENT`
- `[AUDIT] Proforma envoyé: PF-2026-000001 par pdg@lahamarchand.com (PDG) - Statut: DRAFT → SENT`
- `[AUDIT] Proforma accepté: PF-2026-000001 par client@example.com (Client) - Statut: SENT → ACCEPTED`
- `[AUDIT] Proforma converti: PF-2026-000001 → Commande abc123 par pdg@lahamarchand.com (PDG)`

## Génération PDF

### Endpoint
`GET /api/pdg/proforma/[id]/pdf`

### Comportement

- Génère un PDF professionnel avec toutes les informations légales
- Utilise les données sauvegardées (pas de recalcul depuis les livres)
- Inclut : en-tête LAHA ÉDITIONS, informations client, tableau des items, totaux, mentions légales

### Utilisation

```typescript
// Dans le frontend
const handleDownloadPDF = async (proformaId: string) => {
  window.open(`/api/pdg/proforma/${proformaId}/pdf`, '_blank')
}
```

## Exemples d'utilisation

### Créer un proforma en DRAFT

```typescript
const response = await apiClient.createProforma({
  clientType: 'PARTENAIRE',
  partnerId: 'partner-id',
  country: 'Gabon',
  currency: 'FCFA',
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  items: [
    {
      workId: 'work-id',
      quantity: 10,
      unitPriceHT: 5000,
      discountRate: 0.1, // 10%
      tvaRate: 0.18 // 18%
    }
  ],
  initialStatus: 'DRAFT' // ou 'SENT'
})
```

### Envoyer un proforma

```typescript
await apiClient.updateProforma(proformaId, {
  action: 'send'
})
```

### Marquer comme accepté

```typescript
await apiClient.updateProforma(proformaId, {
  action: 'accept'
})
```

### Convertir en commande

```typescript
await apiClient.updateProforma(proformaId, {
  action: 'convert'
})
```

## TODO / Améliorations futures

- [ ] Envoi d'emails/SMS/WhatsApp au client
- [ ] Enregistrement automatique du PDF après création en SENT
- [ ] Implémentation du versioning pour les modifications
- [ ] Dashboard de suivi des proformas pour les clients
- [ ] Rappels automatiques avant expiration

