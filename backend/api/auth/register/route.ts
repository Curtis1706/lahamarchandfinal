import { NextRequest, NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, discipline } = body

    console.log("📝 Inscription request:", { name, email, role, discipline })

    // Validation des données
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      )
    }

    // Validation spécifique pour les concepteurs
    if (role.toUpperCase() === "CONCEPTEUR" && !discipline) {
      return NextResponse.json(
        { error: "La discipline est requise pour les concepteurs" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 409 }
      )
    }

    // Valider le rôle
    if (!Object.values(Role).includes(role.toUpperCase() as Role)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      )
    }

    // Empêcher la création de comptes PDG via l'inscription publique
    if (role.toUpperCase() === "PDG") {
      return NextResponse.json(
        { error: "Ce rôle ne peut pas être créé via l'inscription publique" },
        { status: 403 }
      )
    }

    // Hacher le mot de passe
    const hashedPassword = await bcryptjs.hash(password, 10)

    let disciplineId = null

    // Si c'est un concepteur, trouver ou créer la discipline
    if (role.toUpperCase() === "CONCEPTEUR" && discipline) {
      // Chercher la discipline existante (insensible à la casse)
      let existingDiscipline = await prisma.discipline.findFirst({
        where: {
          name: {
            equals: discipline,
            mode: 'insensitive'
          }
        }
      })

      // Si la discipline n'existe pas, la créer
      if (!existingDiscipline) {
        existingDiscipline = await prisma.discipline.create({
          data: {
            name: discipline.charAt(0).toUpperCase() + discipline.slice(1).toLowerCase()
          }
        })
        console.log("✅ Nouvelle discipline créée:", existingDiscipline.name)
      }

      disciplineId = existingDiscipline.id
    }

    // Données pour la création de l'utilisateur
    const userData: any = {
      name,
      email,
      password: hashedPassword,
      role: role.toUpperCase() as Role,
      // Les clients sont automatiquement vérifiés, les autres attendent validation
      emailVerified: role.toUpperCase() === "CLIENT" ? new Date() : null
    }

    // Ajouter disciplineId seulement si c'est défini (pour éviter les erreurs de schéma)
    if (disciplineId) {
      userData.disciplineId = disciplineId
    }

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        disciplineId: true,
        createdAt: true
      }
    })

    console.log("✅ Utilisateur créé:", user.name, user.role, disciplineId ? `(discipline: ${disciplineId})` : "")

    return NextResponse.json(
      { 
        message: "Utilisateur créé avec succès",
        user,
        needsValidation: role.toUpperCase() !== "CLIENT"
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
