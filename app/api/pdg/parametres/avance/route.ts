import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/pdg/parametres/avance - Récupérer les paramètres avancés
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construire les conditions de filtre
    const where: any = {
      category: 'partner_discount' // Filtrer par catégorie pour les paramètres avancés
    }

    if (status && status !== 'tous') {
      // Le modèle Setting n'a pas de champ status, on peut utiliser une valeur dans value ou créer un champ
      // Pour l'instant, on ignore ce filtre ou on l'implémente différemment
    }

    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [settings, total] = await Promise.all([
      prisma.setting.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.setting.count({ where })
    ])

    // Si aucun paramètre n'existe, créer les paramètres par défaut
    if (settings.length === 0 && page === 1) {
      const defaultSettings = [
        { key: 'partner_discount_primary_promotion_amount', description: 'Ristourne des partenaires sur les livres du primaire en promotion (Montant).', value: '200', type: 'number' },
        { key: 'partner_discount_primary_promotion_percent', description: 'Ristourne des partenaires sur les livres du primaire en promotion (%).', value: '0', type: 'number' },
        { key: 'partner_discount_primary_normal_amount', description: 'Ristourne des partenaires sur les livres du primaire hors promotion (Montant).', value: '0', type: 'number' },
        { key: 'partner_discount_primary_normal_percent', description: 'Ristourne des partenaires sur les livres du primaire hors promotion (%).', value: '0', type: 'number' },
        { key: 'partner_discount_secondary_promotion_amount', description: 'Ristourne des partenaires sur les livres du secondaire en promotion (Montant).', value: '0', type: 'number' },
        { key: 'partner_discount_secondary_promotion_percent', description: 'Ristourne des partenaires sur les livres du secondaire en promotion (%).', value: '0', type: 'number' },
        { key: 'partner_discount_secondary_normal_amount', description: 'Ristourne des partenaires sur les livres du secondaire hors promotion (Montant).', value: '0', type: 'number' },
        { key: 'partner_discount_secondary_normal_percent', description: 'Ristourne des partenaires sur les livres du secondaire hors promotion (%).', value: '0', type: 'number' },
      ]

      await Promise.all(
        defaultSettings.map(setting =>
          prisma.setting.upsert({
            where: { category_key: { category: 'partner_discount', key: setting.key } },
            update: {},
            create: {
              category: 'partner_discount',
              key: setting.key,
              value: setting.value,
              type: setting.type,
              updatedBy: session.user.id
            }
          })
        )
      )

      // Recharger les settings après création
      const reloadedSettings = await prisma.setting.findMany({
        where: { category: 'partner_discount' },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: skip
      })

      return NextResponse.json({
        settings: reloadedSettings.map(s => ({
          id: s.id,
          description: getDescriptionFromKey(s.key),
          valeur: s.value,
          statut: 'Actif', // Par défaut actif
          modifieLe: s.updatedAt ? format(s.updatedAt, 'EEE d MMM yyyy HH:mm', { locale: fr }) : '-',
          key: s.key,
          category: s.category,
          type: s.type
        })),
        pagination: {
          total: reloadedSettings.length,
          page,
          limit,
          totalPages: Math.ceil(reloadedSettings.length / limit)
        }
      })
    }

    return NextResponse.json({
      settings: settings.map(s => ({
        id: s.id,
        description: getDescriptionFromKey(s.key),
        valeur: s.value,
        statut: 'Actif',
        modifieLe: s.updatedAt ? format(s.updatedAt, 'EEE d MMM yyyy HH:mm', { locale: fr }) : '-',
        key: s.key,
        category: s.category,
        type: s.type
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    logger.error('Error fetching advanced settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres avancés' },
      { status: 500 }
    )
  }
}

// PUT /api/pdg/parametres/avance - Mettre à jour un paramètre
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { id, key, category, value, description } = body

    if (!id || !key || !category || value === undefined) {
      return NextResponse.json({ error: 'ID, clé, catégorie et valeur requis' }, { status: 400 })
    }

    const updated = await prisma.setting.update({
      where: { id },
      data: {
        value: value.toString(),
        updatedBy: session.user.id
      }
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_ADVANCED_SETTING',
        performedBy: session.user.id,
        details: JSON.stringify({
          settingId: id,
          key,
          oldValue: 'N/A',
          newValue: value
        })
      }
    })

    return NextResponse.json({
      message: 'Paramètre mis à jour avec succès',
      setting: {
        id: updated.id,
        key: updated.key,
        value: updated.value,
        updatedAt: format(updated.updatedAt, 'EEE d MMM yyyy HH:mm', { locale: fr })
      }
    })
  } catch (error: any) {
    logger.error('Error updating advanced setting:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du paramètre' },
      { status: 500 }
    )
  }
}

// POST /api/pdg/parametres/avance - Créer un nouveau paramètre
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { key, category, value, type, description } = body

    if (!key || !category || value === undefined) {
      return NextResponse.json({ error: 'Clé, catégorie et valeur requis' }, { status: 400 })
    }

    const created = await prisma.setting.create({
      data: {
        category,
        key,
        value: value.toString(),
        type: type || 'string',
        updatedBy: session.user.id
      }
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_ADVANCED_SETTING',
        performedBy: session.user.id,
        details: JSON.stringify({
          settingId: created.id,
          key,
          value
        })
      }
    })

    return NextResponse.json({
      message: 'Paramètre créé avec succès',
      setting: {
        id: created.id,
        key: created.key,
        value: created.value
      }
    })
  } catch (error: any) {
    logger.error('Error creating advanced setting:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Un paramètre avec cette clé existe déjà' }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du paramètre' },
      { status: 500 }
    )
  }
}

// DELETE /api/pdg/parametres/avance - Supprimer un paramètre
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

    await prisma.setting.delete({
      where: { id }
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_ADVANCED_SETTING',
        performedBy: session.user.id,
        details: JSON.stringify({ settingId: id })
      }
    })

    return NextResponse.json({
      message: 'Paramètre supprimé avec succès'
    })
  } catch (error: any) {
    logger.error('Error deleting advanced setting:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du paramètre' },
      { status: 500 }
    )
  }
}

// Fonction helper pour obtenir la description depuis la clé
function getDescriptionFromKey(key: string): string {
  const descriptions: Record<string, string> = {
    'partner_discount_primary_promotion_amount': 'Ristourne des partenaires sur les livres du primaire en promotion (Montant).',
    'partner_discount_primary_promotion_percent': 'Ristourne des partenaires sur les livres du primaire en promotion (%).',
    'partner_discount_primary_normal_amount': 'Ristourne des partenaires sur les livres du primaire hors promotion (Montant).',
    'partner_discount_primary_normal_percent': 'Ristourne des partenaires sur les livres du primaire hors promotion (%).',
    'partner_discount_secondary_promotion_amount': 'Ristourne des partenaires sur les livres du secondaire en promotion (Montant).',
    'partner_discount_secondary_promotion_percent': 'Ristourne des partenaires sur les livres du secondaire en promotion (%).',
    'partner_discount_secondary_normal_amount': 'Ristourne des partenaires sur les livres du secondaire hors promotion (Montant).',
    'partner_discount_secondary_normal_percent': 'Ristourne des partenaires sur les livres du secondaire hors promotion (%).',
  }
  return descriptions[key] || key
}

