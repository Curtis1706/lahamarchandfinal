import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log("👑 PDG Users API - GET request")
    
    // Vérifier l'authentification avec NextAuth
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development"
    })
    
    console.log("👑 Token:", token)
    
    if (!token?.sub) {
      console.log("❌ No token or token.sub found")
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }
    
    // Récupérer l'utilisateur depuis la base de données
    const currentUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })
    
    console.log("👑 Current user:", currentUser?.name, currentUser?.role)
    
    if (!currentUser) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }
    
    if (currentUser.role !== "PDG") {
      console.log("❌ User is not PDG:", currentUser.role)
      return NextResponse.json({ error: "Accès refusé - Rôle PDG requis" }, { status: 403 })
    }

    // Récupérer tous les utilisateurs avec leurs relations complètes
    const users = await prisma.user.findMany({
      include: {
        discipline: true, // Relation complète avec la discipline
        _count: {
          select: {
            conceivedProjects: true,
            conceivedWorks: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    console.log("✅ Users retrieved:", users.length)

    // Enrichir les utilisateurs avec des données formatées
    const enrichedUsers = users.map(user => ({
      ...user,
      _count: {
        projects: user._count.conceivedProjects,
        works: user._count.conceivedWorks
      }
    }))

    // Calculer les statistiques
    const stats = {
      total: users.length,
      concepteurs: users.filter(u => u.role === "CONCEPTEUR").length,
      concepteursEnAttente: users.filter(u => u.role === "CONCEPTEUR" && u.emailVerified === null).length,
      actifs: users.filter(u => u.emailVerified !== null).length,
      suspendus: users.filter(u => u.emailVerified === null).length
    }

    console.log("✅ Users data loaded:", stats)

    return NextResponse.json({
      users: enrichedUsers,
      stats
    })

  } catch (error) {
    console.error("❌ PDG Users API error:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des utilisateurs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("👑 PDG Users API - POST request")
    
    // Vérifier l'authentification avec NextAuth
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development"
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }
    
    // Récupérer l'utilisateur depuis la base de données
    const currentUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })
    
    if (!currentUser || currentUser.role !== "PDG") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const { action, userId, data } = body

    console.log("👑 Action:", action, "User ID:", userId)

    switch (action) {
      case "validate_concepteur":
        return await validateConcepteur(userId, data)
      
      case "suspend_user":
        return await suspendUser(userId, data.reason)
      
      case "activate_user":
        return await activateUser(userId)
      
      case "delete_user":
        return await deleteUser(userId, data.reason)
      
      case "change_role":
        return await changeUserRole(userId, data.newRole, data.reason)
      
      default:
        return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
    }

  } catch (error) {
    console.error("❌ PDG Users API POST error:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de l'action sur l'utilisateur" },
      { status: 500 }
    )
  }
}

async function validateConcepteur(userId: string, data: { disciplineId: string, reason?: string }) {
  try {
    console.log("👑 Validating concepteur:", userId, "Discipline:", data.disciplineId)
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    if (user.role !== "CONCEPTEUR") {
      return NextResponse.json({ error: "L'utilisateur n'est pas un concepteur" }, { status: 400 })
    }

    // Valider le concepteur (sans discipline pour l'instant)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date()
      }
    })

    console.log("✅ Concepteur validated:", updatedUser.name)

    return NextResponse.json({
      message: "Concepteur validé avec succès",
      user: updatedUser
    })

  } catch (error) {
    console.error("❌ Error validating concepteur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la validation du concepteur" },
      { status: 500 }
    )
  }
}

async function suspendUser(userId: string, reason: string) {
  try {
    console.log("👑 Suspending user:", userId, "Reason:", reason)
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: null // Suspendre = retirer la vérification
      }
    })

    console.log("✅ User suspended:", updatedUser.name)

    return NextResponse.json({
      message: "Utilisateur suspendu avec succès",
      user: updatedUser
    })

  } catch (error) {
    console.error("❌ Error suspending user:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suspension de l'utilisateur" },
      { status: 500 }
    )
  }
}

async function activateUser(userId: string) {
  try {
    console.log("👑 Activating user:", userId)
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date()
      }
    })

    console.log("✅ User activated:", updatedUser.name)

    return NextResponse.json({
      message: "Utilisateur activé avec succès",
      user: updatedUser
    })

  } catch (error) {
    console.error("❌ Error activating user:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'activation de l'utilisateur" },
      { status: 500 }
    )
  }
}

async function deleteUser(userId: string, reason: string) {
  try {
    console.log("👑 Deleting user:", userId, "Reason:", reason)
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: userId }
    })

    console.log("✅ User deleted:", user.name)

    return NextResponse.json({
      message: "Utilisateur supprimé avec succès"
    })

  } catch (error) {
    console.error("❌ Error deleting user:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    )
  }
}

async function changeUserRole(userId: string, newRole: string, reason: string) {
  try {
    console.log("👑 Changing user role:", userId, "New role:", newRole, "Reason:", reason)
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const oldRole = user.role

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole as any
      }
    })

    console.log("✅ User role changed:", updatedUser.name, oldRole, "→", newRole)

    return NextResponse.json({
      message: "Rôle utilisateur modifié avec succès",
      user: updatedUser
    })

  } catch (error) {
    console.error("❌ Error changing user role:", error)
    return NextResponse.json(
      { error: "Erreur lors de la modification du rôle" },
      { status: 500 }
    )
  }
}