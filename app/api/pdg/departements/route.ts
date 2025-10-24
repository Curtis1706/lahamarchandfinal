import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/departements - Récupérer les départements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    // Départements du Bénin avec quelques données par défaut
    const defaultDepartments = [
      {
        id: "dept-1",
        nom: "ATLANTIQUE",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département de l'Atlantique",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 160
      },
      {
        id: "dept-2",
        nom: "LITTORAL",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département du Littoral (Cotonou)",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 0
      },
      {
        id: "dept-3",
        nom: "OUEME",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département de l'Ouémé",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 0
      },
      {
        id: "dept-4",
        nom: "ZOU",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département du Zou",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 160
      },
      {
        id: "dept-5",
        nom: "MONO",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département du Mono",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 0
      },
      {
        id: "dept-6",
        nom: "COUFFO",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département du Couffo",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 0
      },
      {
        id: "dept-7",
        nom: "COLLINES",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département des Collines",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 0
      },
      {
        id: "dept-8",
        nom: "BORGOU",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département du Borgou",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 0
      },
      {
        id: "dept-9",
        nom: "ALIBORI",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département de l'Alibori",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 0
      },
      {
        id: "dept-10",
        nom: "ATACORA",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département de l'Atacora",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 0
      },
      {
        id: "dept-11",
        nom: "DONGA",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département de la Donga",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 0
      },
      {
        id: "dept-12",
        nom: "PLATEAU",
        responsable: "",
        chef: "",
        statut: "Actif" as const,
        description: "Département du Plateau",
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 0
      }
    ]

    return NextResponse.json(defaultDepartments)

  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/departements - Créer un département
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { nom, responsable, chef, statut, description } = await request.json()

    const newDepartment = {
      id: `dept-${Date.now()}`,
      nom,
      responsable: responsable || "",
      chef: chef || "",
      statut: statut || "Actif",
      description: description || "",
      creeLe: new Date().toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: session.user.name || "PDG Administrateur",
      modifieLe: "-",
      residents: 0
    }

    return NextResponse.json(newDepartment, { status: 201 })

  } catch (error) {
    console.error("Error creating department:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/pdg/departements - Modifier un département
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { id, nom, responsable, chef, statut, description, residents } = await request.json()

    const updatedDepartment = {
      id,
      nom,
      responsable: responsable || "",
      chef: chef || "",
      statut,
      description: description || "",
      residents: residents || 0,
      modifieLe: new Date().toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return NextResponse.json(updatedDepartment)

  } catch (error) {
    console.error("Error updating department:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/pdg/departements - Supprimer un département
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Département supprimé" })

  } catch (error) {
    console.error("Error deleting department:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


