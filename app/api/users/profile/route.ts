import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/users/profile - Récupérer le profil de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        discipline: { select: { id: true, name: true } }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Retourner le profil sans le mot de passe
    const { password: _, ...userProfile } = user

    return NextResponse.json(userProfile)

  } catch (error: any) {
    logger.error('❌ Erreur lors de la récupération du profil:', error)
    return NextResponse.json({
      error: 'Erreur lors de la récupération du profil: ' + error.message
    }, { status: 500 })
  }
}

// PUT /api/users/profile - Mettre à jour le profil de l'utilisateur connecté
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      phone,
      address,
      bio,
      website,
      linkedin,
      twitter,
      profileImage,
      image,
      ifu,
      establishment,
      director,
      department,
      founded,
      bankName,
      accountNumber,
      accountName,
      iban,
      swiftCode,
      mobileMoneyProvider,
      mobileMoneyNumber
    } = body

    // Préparer les données à mettre à jour
    const updateData: any = {}

    // Champs de base
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone

    // Champs de profil
    if (address !== undefined) updateData.address = address
    if (bio !== undefined) updateData.bio = bio
    if (website !== undefined) updateData.website = website
    if (linkedin !== undefined) updateData.linkedin = linkedin
    if (twitter !== undefined) updateData.twitter = twitter

    // Image (accepte profileImage ou image)
    if (profileImage !== undefined) updateData.image = profileImage
    if (image !== undefined) updateData.image = image

    // Champs institutionnels
    if (ifu !== undefined) updateData.ifu = ifu
    if (establishment !== undefined) updateData.establishment = establishment
    if (director !== undefined) updateData.director = director
    if (department !== undefined) updateData.department = department
    if (founded !== undefined) updateData.founded = founded

    // Champs bancaires
    if (bankName !== undefined) updateData.bankName = bankName
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber
    if (accountName !== undefined) updateData.accountName = accountName
    if (iban !== undefined) updateData.iban = iban
    if (swiftCode !== undefined) updateData.swiftCode = swiftCode
    if (mobileMoneyProvider !== undefined) updateData.mobileMoneyProvider = mobileMoneyProvider
    if (mobileMoneyNumber !== undefined) updateData.mobileMoneyNumber = mobileMoneyNumber

    // Mettre à jour le profil
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      include: {
        discipline: { select: { id: true, name: true } }
      }
    })

    // Retourner le profil sans le mot de passe
    const { password: _, ...userProfile } = updatedUser

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: userProfile
    })

  } catch (error: any) {
    logger.error('❌ Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json({
      error: 'Erreur lors de la mise à jour du profil: ' + error.message
    }, { status: 500 })
  }
}

