import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * Route API pour servir les fichiers uploadés.
 * Utile lorsque Next.js a du mal à servir les fichiers statiques 
 * fraîchement uploadés ou lors d'un déploiement sur certaines plateformes.
 */
export async function GET(
    request: Request,
    { params }: { params: { path: string[] } }
) {
    try {
        const filePath = path.join(process.cwd(), 'public', 'uploads', ...params.path)

        if (!fs.existsSync(filePath)) {
            console.error(`[ImageProxy] File not found: ${filePath}`);
            return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 })
        }

        const file = fs.readFileSync(filePath)
        const ext = path.extname(filePath).toLowerCase()

        // Type MIME de base
        const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf'
        }

        return new NextResponse(file, {
            headers: {
                'Content-Type': mimeTypes[ext] || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        })
    } catch (error) {
        console.error(`[ImageProxy] Error serving file:`, error);
        return NextResponse.json({ error: 'Erreur interne lors du service de fichier' }, { status: 500 })
    }
}
