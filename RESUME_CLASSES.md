# Résumé des Classes et Attributs

Ce document présente un résumé de toutes les classes (modèles Prisma) et leurs attributs dans le système LahaMarchand.

## 1. User (Utilisateur)

**Attributs principaux :**
- `id` : String (ID unique)
- `name` : String (Nom)
- `email` : String (Email, unique)
- `phone` : String? (Téléphone, optionnel)
- `emailVerified` : DateTime? (Date de vérification email)
- `image` : String? (Photo de profil)
- `password` : String (Mot de passe)
- `role` : Role (Rôle : PDG, REPRESENTANT, CONCEPTEUR, AUTEUR, PARTENAIRE, CLIENT, INVITE)
- `status` : UserStatus (Statut : PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE, SUSPENDED)
- `disciplineId` : String? (ID de la discipline)
- `representantId` : String? (ID du représentant assigné)
- `lastLoginAt` : DateTime? (Dernière connexion)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** Account[], Message[], Notification[], Order[], Partner, Project[], Royalty[], Session[], etc.

---

## 2. Account (Compte)

**Attributs principaux :**
- `id` : String (ID unique)
- `userId` : String (ID de l'utilisateur)
- `type` : String (Type de compte)
- `provider` : String (Fournisseur OAuth)
- `providerAccountId` : String (ID du compte fournisseur)
- `refresh_token` : String? (Token de rafraîchissement)
- `access_token` : String? (Token d'accès)
- `expires_at` : Int? (Date d'expiration)
- `token_type` : String? (Type de token)
- `scope` : String? (Portée)
- `id_token` : String? (Token ID)
- `session_state` : String? (État de session)

**Relations :** User

---

## 3. Session (Session)

**Attributs principaux :**
- `id` : String (ID unique)
- `sessionToken` : String (Token de session, unique)
- `userId` : String (ID de l'utilisateur)
- `expires` : DateTime (Date d'expiration)

**Relations :** User

---

## 4. Project (Projet)

**Attributs principaux :**
- `id` : String (ID unique)
- `title` : String (Titre)
- `description` : String? (Description)
- `objectives` : String? (Objectifs)
- `expectedDeliverables` : String? (Livrables attendus)
- `requiredResources` : String? (Ressources requises)
- `timeline` : String? (Calendrier)
- `rejectionReason` : String? (Raison de rejet)
- `disciplineId` : String (ID de la discipline)
- `status` : ProjectStatus (Statut : DRAFT, SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED)
- `submittedAt` : DateTime? (Date de soumission)
- `reviewedAt` : DateTime? (Date de révision)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)
- `concepteurId` : String (ID du concepteur)
- `reviewerId` : String? (ID du réviseur)

**Relations :** User (concepteur, reviewer), Discipline, Work[]

---

## 5. Work (Œuvre/Livre)

**Attributs principaux :**
- `id` : String (ID unique)
- `title` : String (Titre)
- `description` : String? (Description)
- `isbn` : String (ISBN, unique)
- `internalCode` : String? (Code interne)
- `price` : Float (Prix, défaut: 0)
- `tva` : Float (TVA, défaut: 0.18)
- `discountRate` : Float? (Taux de remise)
- `stock` : Int (Stock, défaut: 0)
- `minStock` : Int (Stock minimum, défaut: 10)
- `maxStock` : Int? (Stock maximum)
- `physicalStock` : Int (Stock physique, défaut: 0)
- `category` : String? (Catégorie)
- `targetAudience` : String? (Public cible)
- `educationalObjectives` : String? (Objectifs pédagogiques)
- `contentType` : String? (Type de contenu)
- `keywords` : String? (Mots-clés)
- `files` : String? (Fichiers)
- `validationComment` : String? (Commentaire de validation)
- `rejectionReason` : String? (Raison de rejet)
- `disciplineId` : String (ID de la discipline)
- `status` : WorkStatus (Statut : DRAFT, PENDING, PUBLISHED, REJECTED, ON_SALE, OUT_OF_STOCK, DISCONTINUED, SUSPENDED)
- `publishedAt` : DateTime? (Date de publication)
- `publicationDate` : DateTime? (Date de publication prévue)
- `version` : String? (Version)
- `submittedAt` : DateTime? (Date de soumission)
- `reviewedAt` : DateTime? (Date de révision)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)
- `authorId` : String (ID de l'auteur)
- `reviewerId` : String? (ID du réviseur)
- `concepteurId` : String? (ID du concepteur)
- `projectId` : String? (ID du projet)

**Relations :** User (author, reviewer, concepteur), Discipline, Project, OrderItem[], PartnerStock[], ProformaItem[], Royalty[], Sale[], StockAlert[], StockMovement[], etc.

---

## 6. StockMovement (Mouvement de Stock)

**Attributs principaux :**
- `id` : String (ID unique)
- `workId` : String (ID de l'œuvre)
- `type` : StockMovementType (Type : INBOUND, OUTBOUND, ADJUSTMENT, TRANSFER, DAMAGED, EXPIRED, PARTNER_ALLOCATION, PARTNER_SALE, PARTNER_RETURN, DIRECT_SALE, CORRECTION, INVENTORY)
- `quantity` : Int (Quantité)
- `reason` : String? (Raison)
- `reference` : String? (Référence)
- `performedBy` : String? (ID de l'utilisateur qui a effectué)
- `partnerId` : String? (ID du partenaire)
- `source` : String? (Source)
- `destination` : String? (Destination)
- `unitPrice` : Float? (Prix unitaire)
- `totalAmount` : Float? (Montant total)
- `isCorrection` : Boolean (Est une correction, défaut: false)
- `correctionReason` : String? (Raison de correction)
- `createdAt` : DateTime (Date de création)

**Relations :** Work, Partner?, User? (performedByUser)

---

## 7. Discipline (Discipline)

**Attributs principaux :**
- `id` : String (ID unique)
- `name` : String (Nom, unique)
- `description` : String? (Description)
- `isActive` : Boolean (Actif, défaut: true)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** Project[], User[], Work[]

---

## 8. Sale (Vente)

**Attributs principaux :**
- `id` : String (ID unique)
- `workId` : String (ID de l'œuvre)
- `quantity` : Int (Quantité)
- `amount` : Float (Montant)
- `createdAt` : DateTime (Date de création)

**Relations :** Work

---

## 9. Partner (Partenaire)

**Attributs principaux :**
- `id` : String (ID unique)
- `name` : String (Nom)
- `type` : String (Type)
- `address` : String? (Adresse)
- `phone` : String? (Téléphone)
- `email` : String? (Email)
- `contact` : String? (Contact)
- `website` : String? (Site web)
- `description` : String? (Description)
- `representantId` : String? (ID du représentant)
- `userId` : String (ID utilisateur, unique)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** User (representant, user), Order[], PartnerStock[], StockMovement[], Proforma[], PartnerRebate[], RebateRate[]

---

## 10. PartnerStock (Stock Partenaire)

**Attributs principaux :**
- `id` : String (ID unique)
- `partnerId` : String (ID du partenaire)
- `workId` : String (ID de l'œuvre)
- `allocatedQuantity` : Int (Quantité allouée)
- `soldQuantity` : Int (Quantité vendue, défaut: 0)
- `returnedQuantity` : Int (Quantité retournée, défaut: 0)
- `availableQuantity` : Int (Quantité disponible)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** Partner, Work

---

## 11. Order (Commande)

**Attributs principaux :**
- `id` : String (ID unique)
- `userId` : String (ID de l'utilisateur)
- `partnerId` : String? (ID du partenaire)
- `paymentMethod` : String? (Méthode de paiement)
- `paymentReference` : String? (Référence de paiement)
- `paymentType` : PaymentType (Type : CASH, DEPOSIT, CREDIT, défaut: CASH)
- `amountPaid` : Float (Montant payé, défaut: 0)
- `remainingAmount` : Float (Reste à payer, défaut: 0)
- `depositAmount` : Float? (Montant du dépôt)
- `depositDate` : DateTime? (Date du dépôt)
- `fullPaymentDate` : DateTime? (Date du paiement complet)
- `paymentStatus` : PaymentStatus (Statut : UNPAID, PARTIAL, PAID, OVERDUE, CANCELLED, défaut: UNPAID)
- `deliveryDate` : DateTime? (Date de livraison)
- `deliveryStatus` : DeliveryStatus (Statut : PENDING, PREPARING, READY, IN_TRANSIT, DELIVERED, RECEIVED, FAILED, défaut: PENDING)
- `receivedAt` : DateTime? (Date de réception)
- `receivedBy` : String? (Personne ayant réceptionné)
- `subtotal` : Float (Sous-total, défaut: 0)
- `tax` : Float (Taxe, défaut: 0)
- `discount` : Float (Remise, défaut: 0)
- `promoCode` : String? (Code promo)
- `total` : Float (Total, défaut: 0)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)
- `status` : OrderStatus (Statut : PENDING, VALIDATED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, défaut: PENDING)

**Relations :** Partner?, User, OrderItem[], DeliveryNote?, StockRequest[], NotificationChain[], Proforma?, Royalty[], PartnerRebate[], Payment[]

---

## 12. OrderItem (Article de Commande)

**Attributs principaux :**
- `id` : String (ID unique)
- `orderId` : String (ID de la commande)
- `workId` : String (ID de l'œuvre)
- `quantity` : Int (Quantité)
- `price` : Float (Prix)

**Relations :** Order, Work

---

## 13. Payment (Paiement)

**Attributs principaux :**
- `id` : String (ID unique)
- `orderId` : String (ID de la commande)
- `amount` : Float (Montant)
- `paymentMethod` : String (Méthode de paiement)
- `paymentReference` : String? (Référence de transaction)
- `paymentDate` : DateTime (Date de paiement, défaut: now())
- `notes` : String? (Notes)
- `recordedById` : String (ID de l'utilisateur qui a enregistré)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** Order, User (recordedBy)

---

## 14. DeliveryNote (Bon de Sortie)

**Attributs principaux :**
- `id` : String (ID unique)
- `reference` : String (Référence unique)
- `orderId` : String (ID de la commande, unique)
- `generatedById` : String (ID du générateur)
- `validatedById` : String? (ID du validateur)
- `validatedAt` : DateTime? (Date de validation)
- `controlledById` : String? (ID du contrôleur)
- `controlledAt` : DateTime? (Date de contrôle)
- `status` : DeliveryNoteStatus (Statut : PENDING, VALIDATED, CONTROLLED, COMPLETED, CANCELLED, défaut: PENDING)
- `period` : String? (Période)
- `notes` : String? (Notes)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** Order, User (generatedBy, validatedBy, controlledBy)

---

## 15. Proforma (Proforma)

**Attributs principaux :**
- `id` : String (ID unique)
- `reference` : String (Référence unique)
- `partnerId` : String? (ID du partenaire)
- `userId` : String? (ID du client)
- `createdById` : String (ID du créateur)
- `subtotal` : Float (Sous-total, défaut: 0)
- `discount` : Float (Remise, défaut: 0)
- `discountPercent` : Float? (Pourcentage de remise)
- `tax` : Float (Taxe, défaut: 0)
- `total` : Float (Total, défaut: 0)
- `status` : ProformaStatus (Statut : PENDING, SENT, AWAITING_RESPONSE, ACCEPTED, REJECTED, CONVERTED, CANCELLED, défaut: PENDING)
- `notes` : String? (Notes)
- `deliveryZone` : String? (Zone de livraison)
- `sentAt` : DateTime? (Date d'envoi)
- `respondedAt` : DateTime? (Date de réponse)
- `convertedToOrderId` : String? (ID de la commande convertie, unique)
- `version` : Int (Version, défaut: 1)
- `parentProformaId` : String? (ID du proforma parent)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** Partner?, User (user, createdBy), Order? (convertedToOrder), Proforma (parentProforma, versions), ProformaItem[]

---

## 16. ProformaItem (Article Proforma)

**Attributs principaux :**
- `id` : String (ID unique)
- `proformaId` : String (ID du proforma)
- `workId` : String (ID de l'œuvre)
- `quantity` : Int (Quantité)
- `unitPrice` : Float (Prix unitaire)
- `discount` : Float (Remise, défaut: 0)
- `total` : Float (Total)

**Relations :** Proforma, Work

---

## 17. StockRequest (Demande de Stock)

**Attributs principaux :**
- `id` : String (ID unique)
- `reference` : String (Référence unique)
- `requestedById` : String (ID du demandeur)
- `approvedById` : String? (ID de l'approbateur)
- `approvedAt` : DateTime? (Date d'approbation)
- `status` : StockRequestStatus (Statut : PENDING, APPROVED, REJECTED, PROCESSING, DELIVERED, CANCELLED, défaut: PENDING)
- `type` : StockRequestType (Type : COMMANDE, PRECOMMANDE, DEPOT, REAPPROVISIONNEMENT)
- `method` : String? (Méthode)
- `period` : String? (Période)
- `deliveryDate` : DateTime? (Date de livraison)
- `departmentId` : String? (ID du département)
- `zoneId` : String? (ID de la zone)
- `orderId` : String? (ID de la commande)
- `notes` : String? (Notes)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** User (requestedBy, approvedBy), Order?, StockRequestItem[]

---

## 18. StockRequestItem (Article de Demande de Stock)

**Attributs principaux :**
- `id` : String (ID unique)
- `requestId` : String (ID de la demande)
- `workId` : String (ID de l'œuvre)
- `quantity` : Int (Quantité)
- `approvedQuantity` : Int? (Quantité approuvée)
- `createdAt` : DateTime (Date de création)

**Relations :** StockRequest, Work

---

## 19. Royalty (Droits d'Auteur)

**Attributs principaux :**
- `id` : String (ID unique)
- `workId` : String (ID de l'œuvre)
- `userId` : String (ID de l'utilisateur/auteur)
- `amount` : Float (Montant)
- `approved` : Boolean (Approuvé, défaut: false)
- `approvedAt` : DateTime? (Date d'approbation)
- `paid` : Boolean (Payé, défaut: false)
- `paidAt` : DateTime? (Date de paiement)
- `orderId` : String? (ID de la commande)
- `saleId` : String? (ID de la vente)
- `rate` : Float? (Taux utilisé en %)
- `createdAt` : DateTime (Date de création)

**Relations :** Work, User, Order?

---

## 20. Withdrawal (Retrait Auteur)

**Attributs principaux :**
- `id` : String (ID unique)
- `userId` : String (ID de l'auteur)
- `amount` : Float (Montant demandé)
- `method` : WithdrawalMethod (Méthode : MOMO, BANK, CASH)
- `momoNumber` : String? (Numéro Mobile Money)
- `bankName` : String? (Nom de la banque)
- `bankAccount` : String? (Numéro de compte)
- `bankAccountName` : String? (Nom du titulaire)
- `status` : WithdrawalStatus (Statut : PENDING, APPROVED, REJECTED, PAID, CANCELLED, défaut: PENDING)
- `requestedAt` : DateTime (Date de demande, défaut: now())
- `validatedById` : String? (ID du validateur)
- `validatedAt` : DateTime? (Date de validation)
- `paidAt` : DateTime? (Date de paiement)
- `rejectionReason` : String? (Raison de rejet)
- `notes` : String? (Notes internes)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** User (user, validatedBy)

---

## 21. RepresentantWithdrawal (Retrait Représentant)

**Attributs principaux :**
- Identiques à Withdrawal mais pour les représentants

**Relations :** User (user, validatedBy)

---

## 22. PartnerRebate (Ristourne Partenaire)

**Attributs principaux :**
- `id` : String (ID unique)
- `partnerId` : String (ID du partenaire)
- `orderId` : String? (ID de la commande)
- `saleId` : String? (ID de la vente)
- `workId` : String? (ID de l'œuvre)
- `amount` : Float (Montant de la ristourne)
- `rate` : Float (Taux utilisé en %)
- `status` : RebateStatus (Statut : PENDING, VALIDATED, PAID, CANCELLED, défaut: PENDING)
- `validatedById` : String? (ID du validateur)
- `validatedAt` : DateTime? (Date de validation)
- `paidAt` : DateTime? (Date de paiement)
- `notes` : String? (Notes)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** Partner, Order?, Work?

---

## 23. RebateRate (Taux de Ristourne)

**Attributs principaux :**
- `id` : String (ID unique)
- `type` : RebateRateType (Type : GLOBAL, PARTNER, AUTHOR, WORK)
- `partnerId` : String? (ID du partenaire si type = PARTNER)
- `userId` : String? (ID de l'utilisateur si type = AUTHOR)
- `workId` : String? (ID de l'œuvre si type = WORK)
- `rate` : Float (Taux en pourcentage)
- `isActive` : Boolean (Actif, défaut: true)
- `startDate` : DateTime? (Date de début)
- `endDate` : DateTime? (Date de fin)
- `createdById` : String (ID du créateur)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** User (createdBy), Partner?, User? (user), Work?

---

## 24. Message (Message)

**Attributs principaux :**
- `id` : String (ID unique)
- `subject` : String (Sujet)
- `content` : String (Contenu)
- `type` : String (Type, défaut: "MESSAGE")
- `read` : Boolean (Lu, défaut: false)
- `readAt` : DateTime? (Date de lecture)
- `senderId` : String (ID de l'expéditeur)
- `recipientId` : String (ID du destinataire)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** User (recipient, sender)

---

## 25. Notification (Notification)

**Attributs principaux :**
- `id` : String (ID unique)
- `userId` : String (ID de l'utilisateur)
- `title` : String (Titre)
- `message` : String (Message)
- `type` : String (Type)
- `data` : String? (Données supplémentaires)
- `read` : Boolean (Lu, défaut: false)
- `readAt` : DateTime? (Date de lecture)
- `createdAt` : DateTime (Date de création)

**Relations :** User

---

## 26. NotificationTemplate (Modèle de Notification)

**Attributs principaux :**
- `id` : String (ID unique)
- `code` : String (Code, unique)
- `titre` : String (Titre)
- `texte` : String (Texte)
- `statut` : String (Statut, défaut: "Actif")
- `createdById` : String (ID du créateur)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)
- `updatedById` : String? (ID du modificateur)

**Relations :** User (createdBy, updatedBy)

---

## 27. NotificationChain (Chaîne de Notification)

**Attributs principaux :**
- `id` : String (ID unique)
- `title` : String (Titre)
- `clientId` : String? (ID du client)
- `scheduledDate` : DateTime (Date programmée)
- `sendSMS` : Boolean (Envoyer SMS, défaut: true)
- `sendEmail` : Boolean (Envoyer Email, défaut: true)
- `daysBefore` : Int (Jours avant, défaut: 1)
- `status` : String (Statut, défaut: "Actif")
- `message` : String (Message)
- `orderId` : String? (ID de la commande)
- `createdById` : String (ID du créateur)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** User (client, createdBy), Order?

---

## 28. AuditLog (Journal d'Audit)

**Attributs principaux :**
- `id` : String (ID unique)
- `action` : String (Action)
- `userId` : String? (ID de l'utilisateur)
- `performedBy` : String (Effectué par)
- `details` : String (Détails)
- `metadata` : String? (Métadonnées)
- `createdAt` : DateTime (Date de création)

---

## 29. AdvancedSetting (Paramètre Avancé)

**Attributs principaux :**
- `id` : String (ID unique)
- `key` : String (Clé, unique)
- `description` : String (Description)
- `value` : String (Valeur)
- `type` : String (Type, défaut: "string")
- `category` : String? (Catégorie)
- `status` : String (Statut, défaut: "Actif")
- `updatedById` : String? (ID du modificateur)
- `updatedAt` : DateTime (Date de mise à jour)
- `createdAt` : DateTime (Date de création)

**Relations :** User? (updatedBy)

---

## 30. WorkVersion (Version d'Œuvre)

**Attributs principaux :**
- `id` : String (ID unique)
- `workId` : String (ID de l'œuvre)
- `version` : String (Version)
- `title` : String (Titre)
- `description` : String? (Description)
- `isActive` : Boolean (Actif, défaut: true)
- `publishedAt` : DateTime? (Date de publication)
- `archivedAt` : DateTime? (Date d'archivage)
- `createdBy` : String (ID du créateur)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** Work, User (createdByUser)

---

## 31. WorkSale (Vente d'Œuvre)

**Attributs principaux :**
- `id` : String (ID unique)
- `workId` : String (ID de l'œuvre)
- `quantity` : Int (Quantité)
- `amount` : Float (Montant)
- `saleType` : SaleType (Type : DIRECT, ONLINE, PARTNER, SCHOOL, BULK, défaut: DIRECT)
- `customerId` : String? (ID du client)
- `orderId` : String? (ID de la commande)
- `saleDate` : DateTime (Date de vente, défaut: now())
- `createdAt` : DateTime (Date de création)

**Relations :** Work, User? (customer)

---

## 32. WorkDistribution (Distribution d'Œuvre)

**Attributs principaux :**
- `id` : String (ID unique)
- `workId` : String (ID de l'œuvre)
- `quantity` : Int (Quantité)
- `distributionType` : DistributionType (Type : SCHOOL, LIBRARY, PARTNER, PROMOTION, SAMPLE, défaut: SCHOOL)
- `recipientId` : String? (ID du destinataire)
- `recipientName` : String? (Nom du destinataire)
- `distributionDate` : DateTime (Date de distribution, défaut: now())
- `notes` : String? (Notes)
- `createdAt` : DateTime (Date de création)

**Relations :** Work

---

## 33. WorkView (Vue d'Œuvre)

**Attributs principaux :**
- `id` : String (ID unique)
- `workId` : String (ID de l'œuvre)
- `viewerId` : String? (ID du visualiseur)
- `ipAddress` : String? (Adresse IP)
- `userAgent` : String? (User Agent)
- `viewedAt` : DateTime (Date de visualisation, défaut: now())

**Relations :** Work, User? (viewer)

---

## 34. StockAlertRule (Règle d'Alerte de Stock)

**Attributs principaux :**
- `id` : String (ID unique)
- `name` : String (Nom)
- `description` : String? (Description)
- `type` : AlertRuleType (Type : STOCK_LOW, STOCK_OUT, SALES_THRESHOLD, PRICE_CHANGE, EXPIRY_WARNING, CUSTOM)
- `conditions` : String (Conditions)
- `actions` : String (Actions)
- `isActive` : Boolean (Actif, défaut: true)
- `priority` : AlertPriority (Priorité : LOW, MEDIUM, HIGH, CRITICAL, défaut: MEDIUM)
- `createdBy` : String (ID du créateur)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** User (createdByUser), StockAlert[]

---

## 35. StockAlert (Alerte de Stock)

**Attributs principaux :**
- `id` : String (ID unique)
- `ruleId` : String? (ID de la règle)
- `workId` : String? (ID de l'œuvre)
- `type` : AlertType (Type : STOCK_LOW, STOCK_OUT, SALES_SPIKE, PRICE_CHANGE, EXPIRY_WARNING, INTEGRATION_ERROR, REPORT_FAILED, CUSTOM)
- `severity` : AlertSeverity (Sévérité : INFO, WARNING, ERROR, CRITICAL)
- `title` : String (Titre)
- `message` : String (Message)
- `data` : String? (Données)
- `isRead` : Boolean (Lu, défaut: false)
- `isResolved` : Boolean (Résolu, défaut: false)
- `resolvedBy` : String? (ID du résolveur)
- `resolvedAt` : DateTime? (Date de résolution)
- `createdAt` : DateTime (Date de création)

**Relations :** StockAlertRule?, Work?, User? (resolvedByUser)

---

## 36. StockReport (Rapport de Stock)

**Attributs principaux :**
- `id` : String (ID unique)
- `name` : String (Nom)
- `type` : ReportType (Type : INVENTORY_SUMMARY, SALES_ANALYSIS, STOCK_MOVEMENTS, ALERTS_SUMMARY, CUSTOM)
- `parameters` : String (Paramètres)
- `schedule` : String? (Planification)
- `isActive` : Boolean (Actif, défaut: true)
- `lastRun` : DateTime? (Dernière exécution)
- `nextRun` : DateTime? (Prochaine exécution)
- `createdBy` : String (ID du créateur)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** User (createdByUser), ReportExecution[]

---

## 37. ReportExecution (Exécution de Rapport)

**Attributs principaux :**
- `id` : String (ID unique)
- `reportId` : String (ID du rapport)
- `status` : ExecutionStatus (Statut : PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
- `startedAt` : DateTime (Date de début, défaut: now())
- `completedAt` : DateTime? (Date de fin)
- `result` : String? (Résultat)
- `error` : String? (Erreur)
- `filePath` : String? (Chemin du fichier)

**Relations :** StockReport

---

## 38. StockIntegration (Intégration de Stock)

**Attributs principaux :**
- `id` : String (ID unique)
- `name` : String (Nom)
- `type` : IntegrationType (Type : ORDER_SYSTEM, ACCOUNTING_SYSTEM, WAREHOUSE_SYSTEM, ECOMMERCE_PLATFORM, CUSTOM)
- `config` : String (Configuration)
- `isActive` : Boolean (Actif, défaut: true)
- `lastSync` : DateTime? (Dernière synchronisation)
- `syncStatus` : SyncStatus (Statut : PENDING, SYNCING, SUCCESS, FAILED, DISABLED, défaut: PENDING)
- `errorCount` : Int (Nombre d'erreurs, défaut: 0)
- `lastError` : String? (Dernière erreur)
- `createdBy` : String (ID du créateur)
- `createdAt` : DateTime (Date de création)
- `updatedAt` : DateTime (Date de mise à jour)

**Relations :** User (createdByUser)

---

## 39. Promotion (Promotion)

**Attributs principaux :**
- `id` : String (ID unique)
- `libelle` : String (Libellé/Nom)
- `code` : String (Code promo, unique)
- `periode` : String (Période de validité)
- `startDate` : DateTime? (Date de début)
- `endDate` : DateTime? (Date de fin)
- `livre` : String (Livres concernés)
- `statut` : PromotionStatus (Statut : ACTIF, INACTIF, EXPIRE, défaut: ACTIF)
- `taux` : String (Taux de réduction)
- `quantiteMinimale` : Int (Quantité minimale, défaut: 1)
- `description` : String? (Description)
- `createdBy` : String (Créé par)
- `createdAt` : DateTime (Date de création, défaut: now())
- `updatedAt` : DateTime (Date de mise à jour)

---

## 40. Category (Catégorie)

**Attributs principaux :**
- `id` : String (ID unique)
- `name` : String (Nom, unique)
- `description` : String? (Description)
- `isActive` : Boolean (Actif, défaut: true)
- `createdBy` : String (Créé par)
- `createdAt` : DateTime (Date de création, défaut: now())
- `updatedAt` : DateTime (Date de mise à jour)

---

## 41. SchoolClass (Classe Scolaire)

**Attributs principaux :**
- `id` : String (ID unique)
- `name` : String (Nom, unique, ex: "CI", "CP", "CE1")
- `section` : String (Section : "Primaire" ou "Secondaire")
- `isActive` : Boolean (Actif, défaut: true)
- `createdBy` : String (Créé par)
- `createdAt` : DateTime (Date de création, défaut: now())
- `updatedAt` : DateTime (Date de mise à jour)

---

## 42. Discount (Réduction)

**Attributs principaux :**
- `id` : String (ID unique)
- `client` : String (Type de client : Librairie, École, etc.)
- `livre` : String (Livres concernés)
- `quantiteMin` : Int (Quantité minimale, défaut: 1)
- `reduction` : Float (Montant de la réduction)
- `statut` : DiscountStatus (Statut : ACTIF, INACTIF, défaut: ACTIF)
- `description` : String? (Description)
- `type` : String (Type, défaut: "Montant" : "Montant" ou "Pourcentage")
- `image` : String? (Image)
- `createdBy` : String (Créé par)
- `createdAt` : DateTime (Date de création, défaut: now())
- `updatedAt` : DateTime (Date de mise à jour)

---

## 43. Client (Client)

**Attributs principaux :**
- `id` : String (ID unique)
- `nom` : String (Nom)
- `telephone` : String? (Téléphone)
- `email` : String? (Email)
- `type` : String (Type : Concepteur, École, Librairie, Auteur, etc.)
- `departement` : String? (Département)
- `address` : String? (Adresse)
- `city` : String? (Ville)
- `contact` : String? (Personne de contact)
- `statut` : ClientStatus (Statut : EN_ATTENTE, ACTIF, INACTIF, SUSPENDU, défaut: EN_ATTENTE)
- `dette` : Float (Dette, défaut: 0)
- `notes` : String? (Notes)
- `representantId` : String? (ID du représentant assigné)
- `totalOrders` : Int (Total des commandes, défaut: 0)
- `totalSpent` : Float (Total dépensé, défaut: 0)
- `lastOrder` : DateTime? (Dernière commande)
- `createdBy` : String? (Créé par)
- `createdAt` : DateTime (Date de création, défaut: now())
- `updatedAt` : DateTime (Date de mise à jour)

---

## 44. Communication (Communication)

**Attributs principaux :**
- `id` : String (ID unique)
- `title` : String (Titre)
- `message` : String (Message)
- `type` : CommunicationType (Type : ANNOUNCEMENT, NOTIFICATION, PROMOTION, POLICY, défaut: ANNOUNCEMENT)
- `targetAudience` : String (Public cible, JSON array des rôles)
- `status` : CommunicationStatus (Statut : DRAFT, SCHEDULED, SENT, CANCELLED, défaut: DRAFT)
- `scheduledFor` : DateTime? (Date programmée)
- `sentAt` : DateTime? (Date d'envoi)
- `recipients` : Int (Nombre de destinataires, défaut: 0)
- `readCount` : Int (Nombre de lectures, défaut: 0)
- `createdBy` : String (Créé par)
- `createdAt` : DateTime (Date de création, défaut: now())
- `updatedAt` : DateTime (Date de mise à jour)

---

## 45. Setting (Paramètre)

**Attributs principaux :**
- `id` : String (ID unique)
- `category` : String (Catégorie : platform, business, stock, pricing, notifications, security, audit)
- `key` : String (Clé du paramètre)
- `value` : String (Valeur, JSON ou texte)
- `type` : String (Type : string, number, boolean, json, défaut: "string")
- `updatedBy` : String? (Modifié par)
- `createdAt` : DateTime (Date de création, défaut: now())
- `updatedAt` : DateTime (Date de mise à jour)

---

## Enums (Énumérations)

### Role
- PDG, REPRESENTANT, CONCEPTEUR, AUTEUR, PARTENAIRE, CLIENT, INVITE

### UserStatus
- PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE, SUSPENDED

### ProjectStatus
- DRAFT, SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED

### WorkStatus
- DRAFT, PENDING, PUBLISHED, REJECTED, ON_SALE, OUT_OF_STOCK, DISCONTINUED, SUSPENDED

### OrderStatus
- PENDING, VALIDATED, PROCESSING, SHIPPED, DELIVERED, CANCELLED

### PaymentType
- CASH (Comptant), DEPOSIT (Dépôt), CREDIT (Crédit)

### PaymentStatus
- UNPAID, PARTIAL, PAID, OVERDUE, CANCELLED

### DeliveryStatus
- PENDING, PREPARING, READY, IN_TRANSIT, DELIVERED, RECEIVED, FAILED

### DeliveryNoteStatus
- PENDING, VALIDATED, CONTROLLED, COMPLETED, CANCELLED

### ProformaStatus
- PENDING, SENT, AWAITING_RESPONSE, ACCEPTED, REJECTED, CONVERTED, CANCELLED

### StockRequestStatus
- PENDING, APPROVED, REJECTED, PROCESSING, DELIVERED, CANCELLED

### StockRequestType
- COMMANDE, PRECOMMANDE, DEPOT, REAPPROVISIONNEMENT

### StockMovementType
- INBOUND, OUTBOUND, ADJUSTMENT, TRANSFER, DAMAGED, EXPIRED, PARTNER_ALLOCATION, PARTNER_SALE, PARTNER_RETURN, DIRECT_SALE, CORRECTION, INVENTORY

### SaleType
- DIRECT, ONLINE, PARTNER, SCHOOL, BULK

### DistributionType
- SCHOOL, LIBRARY, PARTNER, PROMOTION, SAMPLE

### WithdrawalMethod
- MOMO (Mobile Money), BANK (Virement bancaire), CASH (Espèces)

### WithdrawalStatus
- PENDING, APPROVED, REJECTED, PAID, CANCELLED

### RebateStatus
- PENDING, VALIDATED, PAID, CANCELLED

### RebateRateType
- GLOBAL, PARTNER, AUTHOR, WORK

### AlertRuleType
- STOCK_LOW, STOCK_OUT, SALES_THRESHOLD, PRICE_CHANGE, EXPIRY_WARNING, CUSTOM

### AlertPriority
- LOW, MEDIUM, HIGH, CRITICAL

### AlertType
- STOCK_LOW, STOCK_OUT, SALES_SPIKE, PRICE_CHANGE, EXPIRY_WARNING, INTEGRATION_ERROR, REPORT_FAILED, CUSTOM

### AlertSeverity
- INFO, WARNING, ERROR, CRITICAL

### ReportType
- INVENTORY_SUMMARY, SALES_ANALYSIS, STOCK_MOVEMENTS, ALERTS_SUMMARY, CUSTOM

### ExecutionStatus
- PENDING, RUNNING, COMPLETED, FAILED, CANCELLED

### IntegrationType
- ORDER_SYSTEM, ACCOUNTING_SYSTEM, WAREHOUSE_SYSTEM, ECOMMERCE_PLATFORM, CUSTOM

### SyncStatus
- PENDING, SYNCING, SUCCESS, FAILED, DISABLED

### PromotionStatus
- ACTIF, INACTIF, EXPIRE

### DiscountStatus
- ACTIF, INACTIF

### ClientStatus
- EN_ATTENTE, ACTIF, INACTIF, SUSPENDU

### CommunicationType
- ANNOUNCEMENT, NOTIFICATION, PROMOTION, POLICY

### CommunicationStatus
- DRAFT, SCHEDULED, SENT, CANCELLED

---

**Note :** Ce document résume toutes les classes (modèles Prisma) du système. Les attributs marqués avec `?` sont optionnels, et ceux avec `@default()` ont une valeur par défaut.







