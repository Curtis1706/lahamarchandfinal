import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/representant/clients/[id] - Supprimer un client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un représentant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "REPRESENTANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const clientId = params.id

    // Vérifier que le client appartient au représentant
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 })
    }

    if (client.representantId !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Supprimer le client
    await prisma.client.delete({
      where: { id: clientId }
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error: any) {
    console.error("❌ Error deleting client:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du client" },
      { status: 500 }
    )
  }
}

