import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/pdg/proforma - Récupérer les proformas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { proformaNumber: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { partner: { name: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { clientSnapshot: { name: { contains: search, mode: 'insensitive' } } },
        { clientSnapshot: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Note: La vérification automatique des proformas expirés est désactivée ici
    // pour éviter de ralentir la requête GET. Utilisez plutôt /api/pdg/proforma/expire
    // via un cron job (ex: toutes les heures) pour marquer automatiquement les proformas expirés.

    const [proformas, total] = await Promise.all([
      prisma.proforma.findMany({
        where,
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true
            }
          },
          clientSnapshot: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              work: {
                select: {
                  id: true,
                  title: true,
                  isbn: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.proforma.count({ where })
    ])

    const formattedProformas = proformas.map(proforma => {
      // Déterminer les informations client (snapshot ou relation)
      const clientInfo = proforma.clientSnapshot || 
        (proforma.partner ? {
          name: proforma.partner.name,
          email: proforma.partner.email || undefined,
          phone: proforma.partner.phone || undefined,
          address: proforma.partner.address || undefined
        } : proforma.user ? {
          name: proforma.user.name,
          email: proforma.user.email || undefined,
          phone: proforma.user.phone || undefined,
          address: undefined
        } : null)

      return {
        id: proforma.id,
        proformaNumber: proforma.proformaNumber || proforma.reference,
        reference: proforma.reference || proforma.proformaNumber,
        country: proforma.country || 'Gabon',
        currency: proforma.currency || 'FCFA',
        clientType: proforma.clientType || null,
        clientId: proforma.clientId || null,
        partner: proforma.partner ? {
          id: proforma.partner.id,
          name: proforma.partner.name,
          email: proforma.partner.email,
          phone: proforma.partner.phone
        } : null,
        client: clientInfo,
        user: proforma.user ? {
          id: proforma.user.id,
          name: proforma.user.name,
          email: proforma.user.email,
          phone: proforma.user.phone,
          role: proforma.user.role
        } : null,
        items: proforma.items.map(item => ({
          id: item.id,
          work: item.work ? {
            id: item.work.id,
            title: item.work.title,
            isbn: item.work.isbn
          } : null,
          reference: item.reference,
          isbn: item.isbn,
          title: item.title,
          authorName: item.authorName,
          quantity: item.quantity,
          unitPriceHT: item.unitPriceHT || item.unitPrice || 0,
          unitPrice: item.unitPrice || item.unitPriceHT || 0, // Compatibilité
          discountRate: item.discountRate || 0,
          tvaRate: item.tvaRate || 0.18,
          lineHT: item.lineHT || 0,
          lineDiscount: item.lineDiscount || item.discount || 0,
          lineTaxable: item.lineTaxable || 0,
          lineTVA: item.lineTVA || 0,
          totalTTC: item.totalTTC || item.total || 0,
          // Compatibilité
          discount: item.discount || item.lineDiscount || 0,
          total: item.total || item.totalTTC || 0
        })),
        // Nouveaux totaux
        subtotalHT: proforma.subtotalHT || proforma.subtotal || 0,
        discountTotal: proforma.discountTotal || proforma.discount || 0,
        taxableBase: proforma.taxableBase || 0,
        tvaTotal: proforma.tvaTotal || proforma.tax || 0,
        totalTTC: proforma.totalTTC || proforma.total || 0,
        // Compatibilité
        subtotal: proforma.subtotal || proforma.subtotalHT || 0,
        discount: proforma.discount || proforma.discountTotal || 0,
        discountPercent: proforma.discountPercent || (proforma.promoDiscountRate ? proforma.promoDiscountRate * 100 : null),
        tax: proforma.tax || proforma.tvaTotal || 0,
        total: proforma.total || proforma.totalTTC || 0,
        // Promo
        promoCode: proforma.promoCode || null,
        promoDiscountRate: proforma.promoDiscountRate || null,
        orderType: proforma.orderType || null,
        status: proforma.status,
        notes: proforma.notes,
        issuedAt: (proforma.issuedAt || proforma.createdAt).toISOString(),
        validUntil: proforma.validUntil ? proforma.validUntil.toISOString() : null,
        acceptedAt: proforma.acceptedAt ? proforma.acceptedAt.toISOString() : null,
        cancelledAt: proforma.cancelledAt ? proforma.cancelledAt.toISOString() : null,
        cancellationReason: proforma.cancellationReason || null,
        sentAt: proforma.sentAt ? proforma.sentAt.toISOString() : null,
        respondedAt: proforma.respondedAt ? proforma.respondedAt.toISOString() : null,
        orderId: proforma.orderId || null,
        invoiceId: proforma.invoiceId || null,
        partnerId: proforma.partnerId || null,
        userId: proforma.userId || null,
        clientSnapshot: proforma.clientSnapshot || null,
        convertedToOrderId: proforma.orderId || null, // Compatibilité
        version: proforma.version || 1,
        createdBy: {
          id: proforma.createdBy.id,
          name: proforma.createdBy.name,
          email: proforma.createdBy.email
        },
        createdAt: proforma.createdAt.toISOString(),
        updatedAt: proforma.updatedAt.toISOString()
      }
    })

    return NextResponse.json({
      proformas: formattedProformas,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Error fetching proformas:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des proformas',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/pdg/proforma - Créer un nouveau proforma
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      clientType, // ECOLE, PARTENAIRE, CLIENT, INVITE
      clientId, // ID du client (si pas INVITE)
      partnerId, // ID du partenaire (si clientType = PARTENAIRE)
      userId, // ID de l'utilisateur (si clientType = CLIENT)
      // Pour INVITE
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      clientCity,
      clientCountry,
      // Items
      items, 
      // Remises
      promoCode,
      promoDiscountRate,
      // Dates
      validUntil, // Date de validité (par défaut +30 jours)
      orderType, // Type de commande
      notes,
      country = "Gabon",
      currency = "FCFA",
      // Statut initial (DRAFT ou SENT)
      initialStatus = "DRAFT" // Par défaut DRAFT, peut être SENT si "Enregistrer & Envoyer"
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Au moins un produit est requis' }, { status: 400 })
    }

    if (!clientType) {
      return NextResponse.json({ error: 'Le type de client est requis' }, { status: 400 })
    }

    // Valider selon le type de client
    if (clientType === 'INVITE' && !clientName) {
      return NextResponse.json({ error: 'Le nom du client invité est requis' }, { status: 400 })
    }

    if (clientType === 'PARTENAIRE' && !partnerId) {
      return NextResponse.json({ error: 'L\'ID du partenaire est requis' }, { status: 400 })
    }

    if ((clientType === 'CLIENT' || clientType === 'ECOLE') && !userId) {
      return NextResponse.json({ error: 'L\'ID du client est requis' }, { status: 400 })
    }

    // Vérifier que les œuvres existent AVANT la transaction (support workId et bookId pour compatibilité)
    const workIds = items
      .filter((item: any) => item.workId || item.bookId)
      .map((item: any) => item.workId || item.bookId)
    
    if (workIds.length === 0) {
      return NextResponse.json({ error: 'Aucun livre valide fourni' }, { status: 400 })
    }

    const works = await prisma.work.findMany({
      where: {
        id: { in: workIds },
        status: 'PUBLISHED'
      },
      include: {
        author: { select: { name: true } }
      }
    })

    if (works.length !== workIds.length) {
      return NextResponse.json({ error: 'Certains livres ne sont pas disponibles' }, { status: 400 })
    }

    // Récupérer les informations du client AVANT la transaction
    let clientSnapshot: any = null
    let finalPartnerId = null
    let finalUserId = null

    if (clientType === 'PARTENAIRE' && partnerId) {
      const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } }
      })
      if (!partner) {
        return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
      }
      finalPartnerId = partnerId
      if (!partner.name || partner.name.trim() === '') {
        return NextResponse.json({ error: 'Le partenaire sélectionné n\'a pas de nom valide' }, { status: 400 })
      }
      clientSnapshot = {
        name: partner.name.trim(),
        email: (partner.email || partner.user?.email)?.trim() || undefined,
        phone: (partner.phone || partner.user?.phone)?.trim() || undefined,
        address: partner.address?.trim() || undefined,
        city: undefined,
        country: country?.trim() || 'Gabon'
      }
    } else if ((clientType === 'CLIENT' || clientType === 'ECOLE') && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true }
      })
      if (!user) {
        return NextResponse.json({ error: clientType === 'ECOLE' ? 'École non trouvée' : 'Client non trouvé' }, { status: 404 })
      }
      finalUserId = userId
      if (!user.name || user.name.trim() === '') {
        return NextResponse.json({ error: 'L\'utilisateur sélectionné n\'a pas de nom valide' }, { status: 400 })
      }
      clientSnapshot = {
        name: user.name.trim(),
        email: user.email?.trim() || undefined,
        phone: user.phone?.trim() || undefined,
        address: undefined,
        city: undefined,
        country: country?.trim() || 'Gabon'
      }
    } else if (clientType === 'INVITE') {
      if (!clientName || clientName.trim() === '') {
        return NextResponse.json({ error: 'Le nom du client invité est requis' }, { status: 400 })
      }
      clientSnapshot = {
        name: clientName.trim(),
        email: clientEmail?.trim() || undefined,
        phone: clientPhone?.trim() || undefined,
        address: clientAddress?.trim() || undefined,
        city: clientCity?.trim() || undefined,
        country: (clientCountry || country)?.trim() || 'Gabon'
      }
    }

    // Validation finale : le clientSnapshot doit avoir un name si on le crée
    if (clientSnapshot && (!clientSnapshot.name || clientSnapshot.name.trim() === '')) {
      return NextResponse.json({ error: 'Le nom du client est requis pour créer le snapshot' }, { status: 400 })
    }

    // Calculer les totaux AVANT la transaction
    let subtotalHT = 0
    let totalDiscount = 0
    let totalTaxableBase = 0
    let totalTVA = 0

    const proformaItems = items.map((item: any) => {
      let work = null
      const workId = item.workId || item.bookId // Support des deux pour compatibilité
      if (workId) {
        work = works.find(w => w.id === workId)
      }

      // Snapshot des informations du livre avec validation
      const unitPriceHT = Math.max(0, Number(item.unitPriceHT || work?.price || item.unitPrice || 0))
      const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)))
      const discountRate = Math.max(0, Math.min(1, Number(item.discountRate || 0))) // 0..1 (déjà divisé par 100 côté frontend)
      const tvaRate = Math.max(0, Math.min(1, Number(item.tvaRate ?? (work?.tva ?? 0.18)))) // 0..1 (déjà divisé par 100 côté frontend)

      // Calculs ligne avec validation pour éviter NaN/Infinity
      const lineHT = unitPriceHT * quantity
      const lineDiscount = lineHT * discountRate
      const lineTaxable = Math.max(0, lineHT - lineDiscount)
      const lineTVA = lineTaxable * tvaRate
      const lineTotalTTC = lineTaxable + lineTVA

      // Validation des calculs
      if (!isFinite(lineHT) || !isFinite(lineDiscount) || !isFinite(lineTaxable) || !isFinite(lineTVA) || !isFinite(lineTotalTTC)) {
        throw new Error(`Calcul invalide pour l'item: ${item.title || work?.title || workId || 'inconnu'}`)
      }

      // Accumuler les totaux
      subtotalHT += lineHT
      totalDiscount += lineDiscount
      totalTaxableBase += lineTaxable
      totalTVA += lineTVA

      // Préparer les données pour Prisma (UNIQUEMENT les champs du schéma)
      const itemTitle = item.title || work?.title || null

      return {
        // Champs requis du schéma
        workId: work?.id || workId || null,
        quantity,
        discountRate,
        tvaRate,
        lineHT,
        lineDiscount,
        lineTaxable,
        lineTVA,
        totalTTC: lineTotalTTC,
        // Champs optionnels
        reference: (item.reference || work?.internalCode)?.trim() || null,
        isbn: (item.isbn || work?.isbn)?.trim() || null,
        title: itemTitle?.trim() || null,
        authorName: (item.authorName || work?.author?.name)?.trim() || null,
        unitPriceHT: unitPriceHT >= 0 ? unitPriceHT : null,
      }
    })

    // Validation des totaux avant remise globale
    if (!isFinite(subtotalHT) || !isFinite(totalDiscount) || !isFinite(totalTaxableBase) || !isFinite(totalTVA)) {
      return NextResponse.json({ error: 'Totaux invalides calculés' }, { status: 400 })
    }

    // Remise globale (code promo) - appliquée sur le subtotalHT
    const promoDiscount = promoDiscountRate ? (subtotalHT * Number(promoDiscountRate)) : 0
    const finalDiscount = totalDiscount + promoDiscount
    
    // Base taxable après remise globale = subtotalHT - remises ligne - remise globale
    const taxableBase = Math.max(0, subtotalHT - finalDiscount)
    
    // Recalculer la TVA proportionnellement sur la nouvelle base taxable
    const ratio = totalTaxableBase > 0 ? taxableBase / totalTaxableBase : 1
    const finalTVA = totalTVA * ratio
    const totalTTC = taxableBase + finalTVA

    // Validation finale des totaux
    if (!isFinite(promoDiscount) || !isFinite(finalDiscount) || !isFinite(taxableBase) || !isFinite(finalTVA) || !isFinite(totalTTC)) {
      return NextResponse.json({ error: 'Totaux finaux invalides calculés' }, { status: 400 })
    }

    // Générer le numéro de proforma AVANT la transaction
    const year = new Date().getFullYear()
    const count = await prisma.proforma.count({
      where: {
        proformaNumber: {
          startsWith: `PF-${year}-`
        }
      }
    })
    const proformaNumber = `PF-${year}-${String(count + 1).padStart(6, '0')}`
    
    if (!proformaNumber || proformaNumber.trim() === '') {
      return NextResponse.json({ error: 'Erreur lors de la génération du numéro de proforma' }, { status: 500 })
    }
    
    const validUntilDate = validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Transaction OPTIMISÉE : uniquement les opérations DB nécessaires (timeout augmenté à 10s)
    const result = await prisma.$transaction(async (tx) => {
      // Créer le proforma (SANS includes lourds pour optimiser)
      const proforma = await tx.proforma.create({
        data: {
          proformaNumber,
          reference: proformaNumber, // Pour compatibilité
          country: country || 'Gabon',
          currency: currency as any || 'FCFA',
          clientType: clientType as any,
          clientId: clientId || null,
          partnerId: finalPartnerId,
          userId: finalUserId,
          createdById: session.user.id,
          status: (initialStatus === 'SENT' ? 'SENT' : 'DRAFT') as any, // DRAFT par défaut, SENT si "Enregistrer & Envoyer"
          issuedAt: new Date(),
          validUntil: validUntilDate,
          subtotalHT,
          discountTotal: finalDiscount,
          taxableBase,
          tvaTotal: finalTVA,
          totalTTC,
          promoCode: promoCode || null,
          promoDiscountRate: promoDiscountRate || null,
          orderType: orderType || null,
          notes: notes || null,
          items: {
            create: proformaItems
          },
          clientSnapshot: clientSnapshot ? {
            create: clientSnapshot
          } : undefined
        },
        select: {
          id: true,
          proformaNumber: true,
          reference: true,
          status: true,
          totalTTC: true,
          createdAt: true
        }
      })

      return proforma
    }, {
      maxWait: 10000, // Temps d'attente max avant le début de la transaction (10s)
      timeout: 15000, // Timeout de la transaction (15s au lieu de 5s par défaut)
    })

    // Si le proforma a été créé en statut SENT, on peut ajouter des actions post-création ici
    // (génération PDF, notification, etc.) mais EN DEHORS de la transaction
    
    // Journal d'audit (log de création)
    console.log(`[AUDIT] Proforma créé: ${result.proformaNumber} par ${session.user.email} (${session.user.name}) - Statut: ${result.status}`)

    return NextResponse.json({
      message: result.status === 'SENT' 
        ? 'Proforma créé et envoyé avec succès' 
        : 'Proforma créé avec succès',
      proforma: {
        id: result.id,
        proformaNumber: result.proformaNumber,
        reference: result.reference || result.proformaNumber,
        totalTTC: result.totalTTC,
        status: result.status,
        createdAt: format(result.createdAt, 'dd MMM yyyy, HH:mm', { locale: fr })
      }
    })

  } catch (error: any) {
    console.error('❌ CREATE PROFORMA ERROR:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      cause: error.cause
    })
    
    // Si c'est une erreur Prisma, afficher les détails du champ qui pose problème
    if (error.code === 'P2002') {
      const field = error.meta?.target?.join(', ') || 'champ unique'
      return NextResponse.json(
        { 
          error: `Erreur de contrainte unique: ${field} existe déjà`,
          message: error.message,
          code: error.code,
          meta: process.env.NODE_ENV === 'development' ? error.meta : undefined
        },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2003') {
      const field = error.meta?.field_name || 'relation'
      return NextResponse.json(
        { 
          error: `Erreur de relation: ${field} n'existe pas`,
          message: error.message,
          code: error.code,
          meta: process.env.NODE_ENV === 'development' ? error.meta : undefined
        },
        { status: 400 }
      )
    }
    
    // Message d'erreur plus détaillé pour le développement
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Erreur lors de la création du proforma: ${error.message}${error.meta ? ` (${JSON.stringify(error.meta)})` : ''}`
      : 'Erreur serveur lors de la création du proforma'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: process.env.NODE_ENV === 'development' ? error.code : undefined,
        meta: process.env.NODE_ENV === 'development' ? error.meta : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// PUT /api/pdg/proforma - Mettre à jour un proforma (envoyer, convertir en commande, etc.)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { id, action, ...updateData } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'ID et action requis' }, { status: 400 })
    }

    const proforma = await prisma.proforma.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            work: true
          }
        },
        partner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        user: true,
        clientSnapshot: true
      }
    })

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma introuvable' }, { status: 404 })
    }

    let updatedProforma

    switch (action) {
      case 'send':
        // Envoyer le proforma au client
        if (proforma.status !== 'DRAFT') {
          return NextResponse.json({ 
            error: 'Seuls les proformas en brouillon peuvent être envoyés' 
          }, { status: 400 })
        }

        updatedProforma = await prisma.proforma.update({
          where: { id },
          data: {
            status: 'SENT'
            // Note: sentAt n'existe pas dans le modèle Proforma, on utilise seulement issuedAt qui est déjà défini
            // Les données sont figées (snapshot) donc pas de risque de modification rétroactive
          },
          select: {
            id: true,
            proformaNumber: true,
            status: true,
            partner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            clientSnapshot: true
          }
        })

        // Journal d'audit (log d'envoi)
        console.log(`[AUDIT] Proforma envoyé: ${updatedProforma.proformaNumber} par ${session.user.email} (${session.user.name}) - Statut: DRAFT → SENT`)

        // Déterminer le destinataire pour la notification
        let recipientId: string | null = null
        let recipientName = 'Client'

        if (updatedProforma.user?.id) {
          recipientId = updatedProforma.user.id
          recipientName = updatedProforma.user.name || 'Client'
        } else if (updatedProforma.partner?.id) {
          // Pour les partenaires, on doit récupérer le userId du partenaire
          try {
            const partner = await prisma.partner.findUnique({
              where: { id: updatedProforma.partner.id },
              select: { userId: true, name: true }
            })
            if (partner?.userId) {
              recipientId = partner.userId
              recipientName = partner.name || updatedProforma.partner.name || 'Partenaire'
            }
          } catch (partnerError: any) {
            console.error('[WARNING] Erreur lors de la récupération du partenaire:', partnerError)
          }
        }

        // Créer une notification pour le destinataire (si userId disponible)
        if (recipientId) {
          try {
            await prisma.notification.create({
              data: {
                userId: recipientId,
                title: 'Nouveau PROFORMA reçu',
                message: `Vous avez reçu un nouveau PROFORMA ${updatedProforma.proformaNumber} de LAHA ÉDITIONS.`,
                type: 'PROFORMA_SENT',
                data: JSON.stringify({
                  proformaId: updatedProforma.id,
                  proformaNumber: updatedProforma.proformaNumber,
                  senderId: session.user.id,
                  senderName: session.user.name
                }),
                read: false
              }
            })
            console.log(`[NOTIFICATION] Notification envoyée à ${recipientName} (${recipientId})`)
          } catch (notifError: any) {
            // Ne pas faire échouer l'envoi si la notification échoue
            console.error('[WARNING] Erreur lors de la création de la notification:', notifError)
          }
        } else {
          console.log(`[INFO] Aucune notification envoyée pour ${updatedProforma.proformaNumber} (destinataire invité ou sans userId)`)
        }

        // TODO: Envoyer un email/SMS/WhatsApp au client (intégration externe)
        // TODO: Générer le PDF officiel et l'enregistrer (déjà disponible via /api/pdg/proforma/[id]/pdf)

        return NextResponse.json({
          message: 'Proforma envoyé avec succès',
          proforma: updatedProforma
        })

      case 'convert':
        // Convertir le proforma en commande (après acceptation)
        if (proforma.status !== 'ACCEPTED') {
          return NextResponse.json({ 
            error: 'Le proforma doit être accepté avant d\'être converti en commande' 
          }, { status: 400 })
        }

        // Vérifier qu'un proforma converti ne peut pas être reconverti
        if (proforma.orderId) {
          return NextResponse.json({ 
            error: 'Ce proforma a déjà été converti en commande' 
          }, { status: 400 })
        }

        // Journal d'audit (log de conversion avant transaction)
        console.log(`[AUDIT] Conversion proforma en commande: ${proforma.proformaNumber} par ${session.user.email} (${session.user.name})`)

        const order = await prisma.$transaction(async (tx) => {
          // Déterminer le userId pour la commande (priorité : userId du proforma > userId du partner > session user)
          let finalUserId = proforma.userId
          
          if (!finalUserId && proforma.partnerId && proforma.partner) {
            // Si le partner est chargé avec sa relation user, utiliser son userId
            if (proforma.partner.user?.id) {
              finalUserId = proforma.partner.user.id
            } else if (proforma.partner.userId) {
              finalUserId = proforma.partner.userId
            }
          }
          
          // Fallback sur le user de la session
          if (!finalUserId) {
            finalUserId = session.user.id
          }
          
          if (!finalUserId) {
            throw new Error('Impossible de déterminer le userId pour la commande')
          }

          // Créer la commande avec les nouveaux champs
          const newOrder = await tx.order.create({
            data: {
              userId: finalUserId,
              partnerId: proforma.partnerId || null,
              status: 'PENDING',
              subtotal: proforma.subtotalHT || proforma.subtotal || 0,
              tax: proforma.tvaTotal || proforma.tax || 0,
              discount: proforma.discountTotal || proforma.discount || 0,
              total: proforma.totalTTC || proforma.total || 0,
              promoCode: proforma.promoCode || null,
              deliveryDate: proforma.validUntil || null,
              items: {
                create: proforma.items
                  .filter(item => item.workId) // Filtrer les items sans workId
                  .map(item => ({
                    workId: item.workId!, // Non-null car filtré
                    quantity: item.quantity,
                    price: item.unitPriceHT || item.unitPrice || 0
                  }))
              }
            }
          })

          // Mettre à jour le proforma (garder ACCEPTED, utiliser orderId pour indiquer la conversion)
          await tx.proforma.update({
            where: { id },
            data: {
              orderId: newOrder.id
              // Note: Le statut reste ACCEPTED, l'orderId indique qu'il a été converti
            }
          })

          return newOrder
        }, {
          maxWait: 10000,
          timeout: 15000
        })

        // Journal d'audit (log de conversion réussie)
        console.log(`[AUDIT] Proforma converti: ${proforma.proformaNumber} → Commande ${order.id} par ${session.user.email} (${session.user.name})`)

        return NextResponse.json({
          message: 'Proforma converti en commande avec succès',
          orderId: order.id,
          order: order
        })

      case 'accept':
        // Marquer le proforma comme accepté
        if (proforma.status !== 'SENT') {
          return NextResponse.json({ 
            error: 'Seuls les proformas envoyés peuvent être acceptés' 
          }, { status: 400 })
        }

        // Vérifier qu'un proforma ACCEPTED ne peut pas être modifié
        if (proforma.status === 'ACCEPTED' && proforma.orderId) {
          return NextResponse.json({ 
            error: 'Impossible de modifier un proforma déjà converti en commande' 
          }, { status: 400 })
        }

        updatedProforma = await prisma.proforma.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date()
          },
          select: {
            id: true,
            proformaNumber: true,
            status: true,
            acceptedAt: true,
            partner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            clientSnapshot: true
          }
        })

        // Journal d'audit (log d'acceptation)
        console.log(`[AUDIT] Proforma accepté: ${updatedProforma.proformaNumber} par ${session.user.email} (${session.user.name}) - Statut: SENT → ACCEPTED`)

        // Notifier le PDG de l'acceptation (créateur du proforma)
        if (proforma.createdById) {
          try {
            await prisma.notification.create({
              data: {
                userId: proforma.createdById,
                title: 'PROFORMA accepté',
                message: `Le PROFORMA ${updatedProforma.proformaNumber} a été accepté par ${session.user.name}.`,
                type: 'PROFORMA_ACCEPTED',
                data: JSON.stringify({
                  proformaId: updatedProforma.id,
                  proformaNumber: updatedProforma.proformaNumber,
                  acceptedBy: session.user.id,
                  acceptedByName: session.user.name
                }),
                read: false
              }
            })
            console.log(`[NOTIFICATION] Notification envoyée au PDG (${proforma.createdById})`)
          } catch (notifError: any) {
            console.error('[WARNING] Erreur lors de la création de la notification:', notifError)
          }
        }

        return NextResponse.json({
          message: 'Proforma accepté avec succès',
          proforma: updatedProforma
        })

      case 'expire':
        // Marquer le proforma comme expiré (automatique ou manuel)
        if (proforma.status === 'CANCELLED' || (proforma.status === 'ACCEPTED' && proforma.orderId)) {
          return NextResponse.json({ 
            error: 'Impossible d\'expirer un proforma annulé ou déjà converti' 
          }, { status: 400 })
        }

        updatedProforma = await prisma.proforma.update({
          where: { id },
          data: {
            status: 'EXPIRED'
          },
          select: {
            id: true,
            proformaNumber: true,
            status: true,
            validUntil: true,
            partner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            clientSnapshot: true
          }
        })

        // Journal d'audit (log d'expiration)
        console.log(`[AUDIT] Proforma expiré: ${updatedProforma.proformaNumber} par ${session.user.email} (${session.user.name}) - Statut: ${proforma.status} → EXPIRED`)

        // TODO: Notifier le destinataire de l'expiration (optionnel)
        return NextResponse.json({
          message: 'Proforma marqué comme expiré',
          proforma: updatedProforma
        })

      case 'update':
        // Mettre à jour le proforma (créer une nouvelle version)
        // Règle : Un proforma ACCEPTED ou converti ne peut pas être modifié
        if (proforma.status === 'ACCEPTED' && proforma.orderId) {
          return NextResponse.json({ 
            error: 'Impossible de modifier un proforma déjà converti en commande' 
          }, { status: 400 })
        }

        if (proforma.status === 'ACCEPTED') {
          return NextResponse.json({ 
            error: 'Impossible de modifier un proforma accepté. Annulez-le et créez-en un nouveau.' 
          }, { status: 400 })
        }

        if (proforma.status === 'CANCELLED' || proforma.status === 'EXPIRED') {
          return NextResponse.json({ 
            error: 'Impossible de modifier un proforma annulé ou expiré' 
          }, { status: 400 })
        }

        // TODO: Implémenter la logique de versioning (créer une nouvelle version du proforma)
        return NextResponse.json({ error: 'Mise à jour non implémentée (versioning à venir)' }, { status: 501 })

      case 'cancel':
        // Annuler le proforma
        if (proforma.status === 'ACCEPTED' && proforma.orderId) {
          return NextResponse.json({ 
            error: 'Impossible d\'annuler un proforma déjà converti en commande' 
          }, { status: 400 })
        }

        if (proforma.status === 'CANCELLED') {
          return NextResponse.json({ 
            error: 'Ce proforma est déjà annulé' 
          }, { status: 400 })
        }

        const cancellationReason = updateData.cancellationReason || updateData.reason || null

        updatedProforma = await prisma.proforma.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: cancellationReason
          },
          select: {
            id: true,
            proformaNumber: true,
            status: true,
            cancellationReason: true,
            cancelledAt: true,
            partner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            clientSnapshot: true
          }
        })

        // Journal d'audit (log d'annulation)
        console.log(`[AUDIT] Proforma annulé: ${updatedProforma.proformaNumber} par ${session.user.email} (${session.user.name}) - Raison: ${cancellationReason || 'Non spécifiée'}`)

        // TODO: Notifier le destinataire de l'annulation
        return NextResponse.json({
          message: 'Proforma annulé avec succès',
          proforma: updatedProforma
        })

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ UPDATE PROFORMA ERROR:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      action: body.action
    })
    
    // Si c'est une erreur Prisma, afficher les détails
    if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          error: 'Proforma introuvable ou déjà supprimé',
          message: error.message,
          code: error.code
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour du proforma',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: process.env.NODE_ENV === 'development' ? error.code : undefined,
        meta: process.env.NODE_ENV === 'development' ? error.meta : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE /api/pdg/proforma - Supprimer un proforma
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const proforma = await prisma.proforma.findUnique({
      where: { id }
    })

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma introuvable' }, { status: 404 })
    }

    if (proforma.status === 'ACCEPTED' && proforma.orderId) {
      return NextResponse.json({ 
        error: 'Impossible de supprimer un proforma converti en commande' 
      }, { status: 400 })
    }

    await prisma.proforma.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Proforma supprimé avec succès' })

  } catch (error: any) {
    console.error('Error deleting proforma:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression du proforma',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

