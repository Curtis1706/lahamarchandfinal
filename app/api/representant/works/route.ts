import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// GET /api/representant/works - NON AUTORISÉ
// Le Représentant n'a pas accès aux modules Œuvres selon le cahier des charges
// (Sauf catalogue public en lecture seule si nécessaire pour la promotion)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Accès refusé. Le Représentant n\'a pas accès aux modules Œuvres internes.' 
  }, { status: 403 })
}
