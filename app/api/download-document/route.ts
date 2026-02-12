import { NextRequest, NextResponse } from 'next/server'
import cloudinary from "@/lib/cloudinary";

const ALLOWED_DOMAINS = ['res.cloudinary.com', 'cloudinary.com']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const TIMEOUT_MS = 30000 // 30 secondes

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        let fileUrl = searchParams.get('url')
        const preferredName = searchParams.get('name')

        console.log('📥 [Download Proxy] Client requested:', fileUrl, 'Preferred Name:', preferredName)

        // Validation de l'URL
        if (!fileUrl) {
            console.error('❌ [Download Proxy] Missing URL')
            return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
        }

        // ✅ CORRECTION AUTOMATIQUE : image -> raw pour les documents
        const isDocumentUrl = fileUrl.match(/\.(pdf|docx?|txt)(\?|$)/i)
        if (isDocumentUrl && fileUrl.includes('/image/upload/')) {
            fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/')
            console.log('🔧 [Download Proxy] Converted image URL to raw:', fileUrl)
        }

        // Sécurité : vérifier que l'URL provient de Cloudinary
        const isAllowed = ALLOWED_DOMAINS.some(domain => fileUrl.includes(domain))
        if (!isAllowed) {
            console.error('❌ [Download Proxy] Domain not allowed:', fileUrl)
            return NextResponse.json({ error: 'URL non autorisée' }, { status: 403 })
        }

        // Télécharger avec timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

        try {
            console.log('⏳ [Download Proxy] Fetching from Cloudinary...')
            let response = await fetch(fileUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            })

            console.log('📊 [Download Proxy] Cloudinary Initial Status:', response.status)

            // Retry logic with Signed URL if 401/403/404
            if (!response.ok && [401, 403, 404].includes(response.status)) {
                console.warn(`⚠️ [Download Proxy] Request failed with ${response.status}. Attempting with Signed URL...`);

                try {
                    // Extract Public ID from Cloudinary URL
                    const urlMatch = fileUrl.match(/\/(?:raw|image|video)\/upload\/(?:v\d+\/)?(.+?)(?:\?.*)?$/)

                    if (!urlMatch) {
                        throw new Error('Cannot extract public_id from URL')
                    }

                    let rawPublicId = decodeURIComponent(urlMatch[1])

                    // Determine resource type from URL
                    const resourceType = fileUrl.includes('/raw/') ? 'raw' :
                        fileUrl.includes('/video/') ? 'video' : 'image'

                    console.log(`🔧 [Download Proxy] Raw public_id: "${rawPublicId}", Type: ${resourceType}`)

                    // Try BOTH methods - with and without extension
                    const attempts = []

                    // Method 1: With full extension (for files uploaded with extension in public_id)
                    attempts.push({
                        publicId: rawPublicId,
                        method: 'with_extension'
                    })

                    // Method 2: Without extension (for files uploaded without extension in public_id)
                    const withoutExt = rawPublicId.replace(/\.(pdf|docx?|txt|xlsx?|pptx?|zip|rar)$/i, '')
                    if (withoutExt !== rawPublicId) {
                        const ext = rawPublicId.match(/\.(pdf|docx?|txt|xlsx?|pptx?|zip|rar)$/i)?.[1]
                        attempts.push({
                            publicId: withoutExt,
                            method: 'without_extension',
                            format: ext?.toLowerCase()
                        })
                    }

                    // Try each method
                    for (const attempt of attempts) {
                        console.log(`🔄 [Download Proxy] Trying ${attempt.method}: "${attempt.publicId}"`)

                        const urlOptions: any = {
                            resource_type: resourceType,
                            type: 'upload',
                            sign_url: true,
                            secure: true
                        }

                        if (attempt.format) {
                            urlOptions.format = attempt.format
                        }

                        const signedUrl = cloudinary.url(attempt.publicId, urlOptions)
                        console.log(`🔐 [Download Proxy] Signed URL (${attempt.method}):`, signedUrl)

                        const retryResponse = await fetch(signedUrl, {
                            signal: controller.signal,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                            }
                        })

                        if (retryResponse.ok) {
                            response = retryResponse
                            console.log(`✅ [Download Proxy] Success with ${attempt.method}!`)
                            break
                        } else {
                            console.log(`❌ [Download Proxy] Failed with ${attempt.method}: ${retryResponse.status}`)
                        }
                    }

                    if (!response.ok) {
                        console.error('❌ [Download Proxy] All retry methods failed')
                    }
                } catch (retryError: any) {
                    console.error('❌ [Download Proxy] Error generating signed URL:', retryError.message)
                }
            }

            clearTimeout(timeoutId)

            console.log('📊 [Download Proxy] Cloudinary Final Status:', response.status)

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

            // Déterminer le Content-Type
            const contentType = response.headers.get('content-type') || 'application/octet-stream'

            // Extraire et nettoyer le nom du fichier depuis l'URL
            const urlParts = fileUrl.split('/')
            const rawFileNameFromUrl = urlParts[urlParts.length - 1] || 'document'
            const cleanFileNameFromUrl = decodeURIComponent(rawFileNameFromUrl.split('?')[0])

            // Utiliser le nom préféré si fourni, sinon le nom de l'URL
            let finalFileName = preferredName || cleanFileNameFromUrl

            // S'assurer qu'il y a une extension si on peut la déterminer
            if (!finalFileName.includes('.')) {
                if (cleanFileNameFromUrl.includes('.')) {
                    finalFileName += '.' + cleanFileNameFromUrl.split('.').pop()
                } else if (contentType === 'application/pdf' || fileUrl.includes('/raw/upload/')) {
                    if (!finalFileName.toLowerCase().endsWith('.pdf')) {
                        finalFileName += '.pdf'
                    }
                }
            }

            console.log('📝 [Download Proxy] Serving file:', finalFileName, 'size:', buffer.length, 'type:', contentType)

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="${encodeURIComponent(finalFileName)}"`,
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
