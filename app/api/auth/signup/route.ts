import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

// POST /api/auth/signup - Inscription publique
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, phone, disciplineId } = body

    console.log("🔍 Inscription publique - Données reçues:", { name, email, role, phone, disciplineId })

    // Validation des champs obligatoires
    if (!name || !email || !password || !role) {
      return NextResponse.json({ 
        error: "Les champs nom, email, mot de passe et rôle sont obligatoires" 
      }, { status: 400 })
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return NextResponse.json({ 
        error: "Le mot de passe doit contenir au moins 6 caractères" 
      }, { status: 400 })
    }

    // Validation du rôle
    const validRoles = ['AUTEUR', 'CONCEPTEUR', 'CLIENT', 'PARTENAIRE', 'REPRESENTANT']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: "Rôle invalide. Rôles autorisés: AUTEUR, CONCEPTEUR, CLIENT, PARTENAIRE, REPRESENTANT" 
      }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: "Un utilisateur avec cet email existe déjà" 
      }, { status: 400 })
    }

    // Vérifier que la discipline existe si fournie
    if (disciplineId) {
      const discipline = await prisma.discipline.findUnique({
        where: { id: disciplineId }
      })
      if (!discipline) {
        return NextResponse.json({ 
          error: "Discipline non trouvée" 
        }, { status: 400 })
      }
    }

    // Hasher le mot de passe
    const bcrypt = await import("bcryptjs")
    const hashedPassword = await bcrypt.hash(password, 12)

    // Déterminer le statut selon le rôle
    // Seuls CONCEPTEUR et REPRESENTANT nécessitent une validation PDG
    const requiresValidation = ['CONCEPTEUR', 'REPRESENTANT'].includes(role)
    const initialStatus = requiresValidation ? 'PENDING' : 'ACTIVE'

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        password: hashedPassword,
        role: role as Role,
        status: initialStatus,
        disciplineId: disciplineId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        disciplineId: true,
        discipline: {
          select: {
            id: true,
            name: true,
          }
        },
        createdAt: true,
      }
    })

    console.log("✅ Utilisateur créé avec succès:", newUser)

    // Créer une notification pour l'administrateur seulement si validation requise
    if (requiresValidation) {
      try {
        // Trouver un utilisateur PDG pour lui envoyer la notification
        const pdgUser = await prisma.user.findFirst({
          where: { role: 'PDG' }
        })

        if (pdgUser) {
          await prisma.notification.create({
            data: {
              userId: pdgUser.id,
              title: "Nouvelle demande d'inscription",
              message: `${newUser.name} (${newUser.email}) demande à rejoindre la plateforme en tant que ${newUser.role}.`,
              type: "USER_REGISTRATION_REQUEST",
              data: JSON.stringify({
                newUserId: newUser.id,
                newUserName: newUser.name,
                newUserEmail: newUser.email,
                newUserRole: newUser.role,
                disciplineName: newUser.discipline?.name || null
              })
            }
          })
          console.log("✅ Notification créée pour le PDG")
        }
      } catch (notificationError) {
        console.error("⚠️ Erreur création notification:", notificationError)
        // Ne pas faire échouer l'inscription pour une erreur de notification
      }
    }

    // Message différent selon le statut
    const successMessage = requiresValidation 
      ? "Inscription réussie ! Votre compte est en attente de validation par l'administrateur."
      : "Inscription réussie ! Votre compte est maintenant actif."

    return NextResponse.json({
      message: successMessage,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error("❌ Erreur inscription:", error)
    
    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Un utilisateur avec cet email existe déjà" 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: "Erreur lors de l'inscription. Veuillez réessayer." 
    }, { status: 500 })
  }
}

