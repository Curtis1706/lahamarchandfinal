import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// GET /api/representant/authors - NON AUTORISÉ
// Le Représentant n'a pas accès aux modules Auteurs selon le cahier des charges
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Accès refusé. Le Représentant n\'a pas accès aux modules Auteurs.' 
  }, { status: 403 })
}

// POST /api/representant/authors - NON AUTORISÉ
// Le Représentant ne peut pas créer ou gérer des auteurs
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Accès refusé. Le Représentant ne peut pas créer ou gérer des auteurs.' 
  }, { status: 403 })
}
