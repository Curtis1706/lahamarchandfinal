import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_DOMAINS = ['res.cloudinary.com']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const TIMEOUT_MS = 30000 // 30 secondes

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fileUrl = searchParams.get('url')

        // Validation de l'URL
        if (!fileUrl) {
            return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
        }

        // Sécurité : vérifier que l'URL provient de Cloudinary
        const isAllowed = ALLOWED_DOMAINS.some(domain => fileUrl.includes(domain))
        if (!isAllowed) {
            return NextResponse.json({ error: 'URL non autorisée' }, { status: 403 })
        }

        // Télécharger avec timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

        try {
            const response = await fetch(fileUrl, {
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            // Vérifier la taille du fichier
            const contentLength = response.headers.get('content-length')
            if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: 'Fichier trop volumineux' },
                    { status: 413 }
                )
            }

            const blob = await response.blob()
            const buffer = Buffer.from(await blob.arrayBuffer())

            // Extraire et nettoyer le nom du fichier
            const urlParts = fileUrl.split('/')
            const rawFileName = urlParts[urlParts.length - 1] || 'document.pdf'
            const fileName = decodeURIComponent(rawFileName)

            // Déterminer le Content-Type
            const contentType = response.headers.get('content-type') ||
                (fileName.endsWith('.pdf') ? 'application/pdf' :
                    fileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                        'application/octet-stream')

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                    'Content-Length': buffer.length.toString(),
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
            })
        } catch (fetchError: any) {
            clearTimeout(timeoutId)
            throw fetchError
        }

    } catch (error: any) {
        console.error('❌ Erreur téléchargement:', error)

        if (error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Timeout lors du téléchargement' },
                { status: 504 }
            )
        }

        return NextResponse.json(
            { error: 'Erreur lors du téléchargement du fichier' },
            { status: 500 }
        )
    }
}
