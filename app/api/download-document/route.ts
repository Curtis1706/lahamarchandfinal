import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_DOMAINS = ['res.cloudinary.com', 'cloudinary.com']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const TIMEOUT_MS = 30000 // 30 secondes

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fileUrl = searchParams.get('url')

        console.log('📥 [Download Proxy] Client requested:', fileUrl)

        // Validation de l'URL
        if (!fileUrl) {
            console.error('❌ [Download Proxy] Missing URL')
            return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
        }

        // Sécurité : vérifier que l'URL provient de Cloudinary
        const isAllowed = ALLOWED_DOMAINS.some(domain => fileUrl.includes(domain))
        if (!isAllowed) {
            console.error('❌ [Download Proxy] Domain not allowed:', fileUrl)
            return NextResponse.json({ error: 'URL non autorisée' }, { status: 403 })
        }

        // Assurer que le flag fl_attachment est présent pour forcer le téléchargement direct depuis Cloudinary
        let downloadUrl = fileUrl
        if (fileUrl.includes('cloudinary.com') && !fileUrl.includes('fl_attachment')) {
            downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/')
            console.log('🔄 [Download Proxy] Added fl_attachment flag:', downloadUrl)
        }

        // Télécharger avec timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

        try {
            console.log('⏳ [Download Proxy] Fetching from Cloudinary...')
            const response = await fetch(downloadUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            })

            clearTimeout(timeoutId)

            console.log('📊 [Download Proxy] Cloudinary status:', response.status)

            if (!response.ok) {
                console.error('❌ [Download Proxy] Cloudinary error status:', response.status)
                const errorText = await response.text()
                console.error('❌ [Download Proxy] Cloudinary error details:', errorText)
                throw new Error(`Erreur HTTP Cloudinary: ${response.status}`)
            }

            // Vérifier la taille du fichier
            const contentLength = response.headers.get('content-length')
            if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
                console.error('❌ [Download Proxy] File too large:', contentLength)
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
            // Retirer les query params si présents et décoder
            const cleanFileName = decodeURIComponent(rawFileName.split('?')[0])

            console.log('📝 [Download Proxy] Serving file:', cleanFileName, 'size:', buffer.length)

            // Déterminer le Content-Type
            const contentType = response.headers.get('content-type') ||
                (cleanFileName.endsWith('.pdf') ? 'application/pdf' :
                    cleanFileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                        'application/octet-stream')

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="${cleanFileName}"`,
                    'Content-Length': buffer.length.toString(),
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
            })
        } catch (fetchError: any) {
            clearTimeout(timeoutId)
            console.error('❌ [Download Proxy] Fetch error:', fetchError.message)
            throw fetchError
        }

    } catch (error: any) {
        console.error('❌ [Download Proxy] Final catch error:', error)

        if (error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Timeout lors du téléchargement' },
                { status: 504 }
            )
        }

        return NextResponse.json(
            { error: 'Erreur lors du téléchargement du fichier: ' + error.message },
            { status: 500 }
        )
    }
}
