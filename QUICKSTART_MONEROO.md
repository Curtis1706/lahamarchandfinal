# 🚀 Guide de Démarrage Rapide - Moneroo sur LAHAMARCHAND

## Configuration en 5 étapes

### 1️⃣ Obtenir les clés API Moneroo (5 min)

1. Connectez-vous sur https://app.moneroo.io
2. Créez une **Passerelle de paiement**
3. Ajoutez vos **Méthodes de paiement** :
   - ✅ Mobile Money (MTN, Moov, etc.)
   - ✅ Carte Bancaire (Visa, Mastercard)
   - ✅ Virement bancaire (optionnel)
4. Copiez vos clés :
   - `PUBLIC_KEY`
   - `SECRET_KEY`
   - `WEBHOOK_SECRET`

---

### 2️⃣ Configurer les variables d'environnement (2 min)

Ajoutez ces lignes à votre fichier `.env` :

```env
# Mode Sandbox (Test)
MONEROO_PUBLIC_KEY="pk_test_xxxxxxxx"
MONEROO_SECRET_KEY="sk_test_xxxxxxxx"
MONEROO_WEBHOOK_SECRET="whsec_test_xxxxxxxx"
MONEROO_BASE_URL="https://sandbox-api.moneroo.io/v1"

# Mode Production (à changer plus tard)
# MONEROO_PUBLIC_KEY="pk_live_xxxxxxxx"
# MONEROO_SECRET_KEY="sk_live_xxxxxxxx"
# MONEROO_WEBHOOK_SECRET="whsec_xxxxxxxx"
# MONEROO_BASE_URL="https://api.moneroo.io/v1"
```

---

### 3️⃣ Configurer le Webhook (3 min)

1. Dans votre dashboard Moneroo, allez dans **Paramètres** → **Webhooks**
2. Ajoutez une nouvelle URL de webhook :

**URL :** `https://votre-domaine.com/api/moneroo/webhook`

(En local : `https://votre-tunnel-ngrok.ngrok.io/api/moneroo/webhook`)

3. Activez ces événements :
   - ✅ `payment.success`
   - ✅ `payment.failed`
   - ✅ `payment.cancelled`
   - ✅ `payout.success`
   - ✅ `payout.failed`

4. Sauvegardez

---

### 4️⃣ Redémarrer l'application (1 min)

```bash
# Arrêter le serveur (Ctrl+C)

# Redémarrer
npm run dev
# ou
yarn dev
```

---

### 5️⃣ Tester ! (10 min)

#### Test 1 : Paiement Client

1. Ajoutez des livres au panier (en tant qu'invité ou client)
2. Allez au checkout : `/checkout`
3. Remplissez le formulaire
4. Sélectionnez **"Mobile Money (Paiement immédiat)"**
5. Cliquez sur **"Passer la commande"**
6. Vous devriez être redirigé vers la page de paiement Moneroo
7. Utilisez un numéro de test Moneroo pour payer
8. Après paiement, vous serez redirigé vers la confirmation
9. **Vérifiez** :
   - ✅ Commande marquée comme "PAID"
   - ✅ Stock décrémenté
   - ✅ Royalties créées pour l'auteur
   - ✅ Notification envoyée au client

#### Test 2 : Retrait Auteur

1. **En tant qu'auteur** :
   - Allez dans **Dashboard Auteur** → **Retraits**
   - Vérifiez votre solde disponible
   - Cliquez sur **"Demander un retrait"**
   - Entrez un montant (min 5 000 F CFA)
   - Choisissez **"Mobile Money"**
   - Entrez votre numéro (numéro de test Moneroo)
   - Soumettez

2. **En tant que PDG** :
   - Allez dans **Dashboard PDG** → **Retraits Auteurs**
   - Trouvez la demande de retrait
   - Cliquez sur **"Approuver"**
   - Puis cliquez sur **"Payer via Moneroo"**
   - Confirmez le paiement
   - Attendez quelques secondes

3. **Vérifiez** :
   - ✅ Statut du retrait passe à "En cours"
   - ✅ Webhook reçu de Moneroo
   - ✅ Statut passe à "PAID"
   - ✅ Notification envoyée à l'auteur

---

## 🎯 C'est tout !

Votre intégration Moneroo est maintenant **opérationnelle** ! 🎉

---

## 🔍 Vérifications Importantes

### Dashboard Moneroo

Après chaque test, vérifiez dans votre dashboard Moneroo :

1. **Transactions** → Paiements
   - Vous devriez voir les paiements clients
   - Statuts : `success`, `failed`, etc.

2. **Transactions** → Retraits
   - Vous devriez voir les payouts vers auteurs
   - Statuts : `success`, `pending`, etc.

3. **Webhooks** → Logs
   - Vérifiez que les webhooks sont bien reçus
   - Code 200 = succès
   - Autre code = erreur (vérifiez les logs de votre serveur)

---

## 🐛 Dépannage Rapide

### Problème : "Moneroo API credentials not configured"

**Solution :** Vérifiez que :
- Les variables d'environnement sont dans `.env`
- Vous avez redémarré le serveur après ajout des variables
- Les clés ne contiennent pas d'espaces ou de guillemets en trop

---

### Problème : "Invalid webhook signature"

**Solution :**
- Vérifiez que `MONEROO_WEBHOOK_SECRET` est correct
- Copiez-le exactement depuis le dashboard Moneroo
- Redémarrez le serveur

---

### Problème : Webhook non reçu

**Solutions :**
1. **En local** : Utilisez ngrok ou un tunnel similaire
   ```bash
   ngrok http 3000
   ```
   Puis utilisez l'URL ngrok dans la configuration du webhook Moneroo

2. **En production** : Vérifiez que :
   - L'URL du webhook est correcte
   - Le port est ouvert
   - Pas de firewall bloquant

3. **Logs** : Consultez les logs Moneroo pour voir les tentatives d'envoi

---

### Problème : Paiement bloqué sur "En cours"

**Solution :**
- Le webhook n'a probablement pas été reçu
- Vérifiez les logs du webhook dans Moneroo
- Vérifiez les logs de votre serveur
- Testez manuellement le webhook avec un outil comme Postman

---

## 📱 Numéros de Test Moneroo

Consultez la documentation Moneroo pour obtenir les numéros de test :
- https://docs.moneroo.io/testing

Généralement :
- **Mobile Money test** : `+229 XX XX XX XX` (voir docs)
- **Carte test** : `4242 4242 4242 4242` (si supporté)

---

## 🎓 Ressources Utiles

- **Documentation Moneroo** : https://docs.moneroo.io
- **Dashboard Moneroo** : https://app.moneroo.io
- **API Reference** : https://docs.moneroo.io/api-reference
- **Support Moneroo** : support@moneroo.io

- **Doc complète intégration** : `MONEROO_SETUP.md`
- **Rapport d'intégration** : `INTEGRATION_MONEROO_COMPLETE.md`

---

## 🚀 Passer en Production

Quand vous êtes prêt à passer en production :

1. **Obtenez les clés de production** depuis Moneroo
2. **Mettez à jour `.env`** :
   ```env
   MONEROO_PUBLIC_KEY="pk_live_xxxxxxxx"
   MONEROO_SECRET_KEY="sk_live_xxxxxxxx"
   MONEROO_WEBHOOK_SECRET="whsec_xxxxxxxx"
   MONEROO_BASE_URL="https://api.moneroo.io/v1"
   ```
3. **Mettez à jour le webhook** dans le dashboard Moneroo avec l'URL de production
4. **Testez avec un petit montant réel**
5. **Surveillez les premières transactions**

---

## ✅ Checklist Finale

Avant de passer en production, vérifiez :

- [ ] Clés API Moneroo configurées
- [ ] Variables d'environnement correctes
- [ ] Webhook configuré et testé
- [ ] Test paiement client OK
- [ ] Test retrait auteur OK
- [ ] Logs serveur propres (pas d'erreurs)
- [ ] Dashboard Moneroo affiche les transactions
- [ ] Notifications fonctionnent
- [ ] Stock se met à jour correctement
- [ ] Royalties se créent automatiquement

---

**🎉 Félicitations ! Votre intégration Moneroo est prête !**

Si vous avez des questions, consultez la documentation complète ou contactez le support.


