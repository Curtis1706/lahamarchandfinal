import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/classes - Récupérer les classes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Permettre l'accès aux PDG et aux clients (pour passer des commandes)
    if (session.user.role !== "PDG" && session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Forbidden - PDG or CLIENT role required" }, { status: 403 })
    }

    // Filtrer uniquement les classes actives pour les clients
    const whereClause = session.user.role === "CLIENT" 
      ? { isActive: true }
      : {}

    const classes = await prisma.schoolClass.findMany({
      where: whereClause,
      orderBy: [
        { section: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    const formattedClasses = classes.map((classe) => ({
      id: classe.id,
      classe: classe.name,
      section: classe.section,
      statut: classe.isActive ? "Disponible" : "Indisponible",
      creeLe: classe.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: classe.createdBy,
      modifieLe: classe.updatedAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }))

    return NextResponse.json(formattedClasses)

  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/classes - Créer une classe
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { classe, section, statut } = await request.json()

    console.log("🔍 Données reçues:", { classe, section, statut })

    const newClass = await prisma.schoolClass.create({
      data: {
        name: classe,
        section: section,
        isActive: statut === 'Disponible',
        createdBy: session.user.name || "PDG Administrateur"
      }
    })

    console.log("✅ Classe créée:", newClass)

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email || "",
          userRole: session.user.role,
          action: 'CREATE_CLASS',
          entityType: 'SchoolClass',
          entityId: newClass.id,
          details: `Classe créée: ${newClass.name} (${newClass.section})`
        }
      })
      console.log("✅ Audit log créé")
    } catch (auditError) {
      console.error("⚠️ Erreur lors de la création de l'audit log:", auditError)
      // Ne pas bloquer la création de la classe si l'audit log échoue
    }

    const formattedClass = {
      id: newClass.id,
      classe: newClass.name,
      section: newClass.section,
      statut: newClass.isActive ? "Disponible" : "Indisponible",
      creeLe: newClass.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: newClass.createdBy,
      modifieLe: newClass.updatedAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return NextResponse.json(formattedClass, { status: 201 })

  } catch (error: any) {
    console.error("❌ Error creating class:", error)
    console.error("❌ Error details:", JSON.stringify(error, null, 2))
    
    // Gérer l'erreur de contrainte unique (P2002)
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Cette classe existe déjà dans le système" 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Erreur lors de la création de la classe",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// PUT /api/pdg/classes - Modifier une classe
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { id, classe, section, statut } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID de la classe requis" }, { status: 400 })
    }

    // Vérifier que la classe existe
    const existingClass = await prisma.schoolClass.findUnique({
      where: { id }
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Classe non trouvée" }, { status: 404 })
    }

    // Mettre à jour la classe
    const updatedClass = await prisma.schoolClass.update({
      where: { id },
      data: {
        ...(classe && { name: classe }),
        ...(section && { section }),
        ...(statut !== undefined && { isActive: statut === 'Disponible' }),
        updatedAt: new Date()
      }
    })

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email || "",
          userRole: session.user.role,
          action: 'UPDATE_CLASS',
          entityType: 'SchoolClass',
          entityId: updatedClass.id,
          details: `Classe mise à jour: ${updatedClass.name} (${updatedClass.section})`
        }
      })
    } catch (auditError) {
      console.error("⚠️ Erreur lors de la création de l'audit log:", auditError)
    }

    const formattedClass = {
      id: updatedClass.id,
      classe: updatedClass.name,
      section: updatedClass.section,
      statut: updatedClass.isActive ? "Disponible" : "Indisponible",
      creeLe: updatedClass.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: updatedClass.createdBy,
      modifieLe: updatedClass.updatedAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return NextResponse.json(formattedClass)

  } catch (error: any) {
    console.error("❌ Error updating class:", error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Cette classe existe déjà dans le système" 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Erreur lors de la modification de la classe",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// PATCH /api/pdg/classes - Toggle le statut d'une classe
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID de la classe requis" }, { status: 400 })
    }

    // Vérifier que la classe existe
    const existingClass = await prisma.schoolClass.findUnique({
      where: { id }
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Classe non trouvée" }, { status: 404 })
    }

    // Toggle le statut
    const updatedClass = await prisma.schoolClass.update({
      where: { id },
      data: {
        isActive: !existingClass.isActive,
        updatedAt: new Date()
      }
    })

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email || "",
          userRole: session.user.role,
          action: 'TOGGLE_CLASS_STATUS',
          entityType: 'SchoolClass',
          entityId: updatedClass.id,
          details: `Statut de la classe ${updatedClass.name} changé: ${updatedClass.isActive ? 'Disponible' : 'Indisponible'}`
        }
      })
    } catch (auditError) {
      console.error("⚠️ Erreur lors de la création de l'audit log:", auditError)
    }

    const formattedClass = {
      id: updatedClass.id,
      classe: updatedClass.name,
      section: updatedClass.section,
      statut: updatedClass.isActive ? "Disponible" : "Indisponible",
      creeLe: updatedClass.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: updatedClass.createdBy,
      modifieLe: updatedClass.updatedAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return NextResponse.json(formattedClass)

  } catch (error: any) {
    console.error("❌ Error toggling class status:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la modification du statut",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

