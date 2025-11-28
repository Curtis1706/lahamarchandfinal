import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// PUT /api/representant/authors/[id]/validate - NON AUTORISÉ
// Le Représentant ne peut pas valider des auteurs selon le cahier des charges
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ 
    error: 'Accès refusé. Le Représentant ne peut pas valider des auteurs.' 
  }, { status: 403 })
}
