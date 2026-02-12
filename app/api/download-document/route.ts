import { NextRequest, NextResponse } from 'next/server'
import cloudinary from "@/lib/cloudinary";

const ALLOWED_DOMAINS = ['res.cloudinary.com', 'cloudinary.com']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const TIMEOUT_MS = 60000 // 60 secondes pour fichiers larges

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        let fileUrl = searchParams.get('url')
        const preferredName = searchParams.get('name')

        console.log('📥 [Download Proxy] Client requested:', fileUrl, 'Preferred Name:', preferredName)

        if (!fileUrl) {
            return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
        }

        // 1. Correction URL pour documents (image -> raw)
        const isDocumentUrl = fileUrl.match(/\.(pdf|docx?|txt|xlsx?|pptx?|zip|rar)(\?|$)/i)
        if (isDocumentUrl && fileUrl.includes('/image/upload/')) {
            fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/')
        }

        // 2. Extraction ID Public et Type
        const urlMatch = fileUrl.match(/\/(?:raw|image|video)\/upload\/(?:v\d+\/)?(.+?)(?:\?.*)?$/)
        if (!urlMatch) {
            console.warn('⚠️ [Download Proxy] Could not parse URL, trying direct fetch')
            // Fallback simple fetch (unsafe but works for public)
        } else {
            const rawPublicId = decodeURIComponent(urlMatch[1])
            const resourceType = fileUrl.includes('/raw/') ? 'raw' :
                fileUrl.includes('/video/') ? 'video' : 'image'

            // Stratégie de récupération "Smart Retry"
            // On essaie de générer des URLs signées pour différents cas (public/authenticated, sans extension...)

            let workingResponse: Response | null = null;

            const strategies = [
                // 1. Essai Standard (type: upload, avec ID nettoyé des extensions pour RAW)
                { type: 'upload', stripExtension: true },
                // 2. Essai Authenticated (type: authenticated, pour anciens fichiers)
                { type: 'authenticated', stripExtension: true },
                // 3. Essai Legacy (type: upload, garder extension dans ID)
                { type: 'upload', stripExtension: false },
            ];

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

            for (const strategy of strategies) {
                try {
                    let publicIdToSign = rawPublicId;
                    let format = undefined;

                    if (resourceType === 'raw' && strategy.stripExtension) {
                        const extMatch = rawPublicId.match(/\.([a-z0-9]+)$/i);
                        if (extMatch) {
                            format = extMatch[1].toLowerCase();
                            publicIdToSign = rawPublicId.replace(/\.[a-z0-9]+$/i, '');
                        }
                    }

                    const signedUrl = cloudinary.url(publicIdToSign, {
                        resource_type: resourceType,
                        type: strategy.type,
                        sign_url: true,
                        secure: true,
                        format: format,
                        // IMPORTANT: Pas de fl_attachment ici pour éviter erreur 400.
                        // On gère le téléchargement via headers de réponse.
                    });

                    console.log(`🔄 [Download Proxy] Trying ${strategy.type} (stripExt: ${strategy.stripExtension}):`, signedUrl)

                    const response = await fetch(signedUrl, {
                        signal: controller.signal,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });

                    if (response.ok) {
                        console.log('✅ [Download Proxy] Success!')
                        workingResponse = response;
                        break;
                    } else {
                        console.warn(`❌ [Download Proxy] Failed: ${response.status}`)
                    }
                } catch (err) {
                    console.error('❌ [Download Proxy] Error in strategy:', err)
                }
            }

            clearTimeout(timeoutId);

            if (workingResponse) {
                // Préparer la réponse proxy
                const contentType = workingResponse.headers.get('content-type') || 'application/octet-stream';

                // Nom du fichier final
                let finalName = preferredName || rawPublicId.split('/').pop() || 'document';
                // S'assurer de l'extension
                if (!finalName.includes('.')) {
                    if (contentType.includes('pdf')) finalName += '.pdf';
                    else if (contentType.includes('word')) finalName += '.docx';
                }

                const blob = await workingResponse.blob();
                const buffer = Buffer.from(await blob.arrayBuffer());

                return new NextResponse(buffer, {
                    headers: {
                        'Content-Type': contentType,
                        'Content-Disposition': `attachment; filename="${encodeURIComponent(finalName)}"`,
                        'Content-Length': buffer.length.toString()
                    }
                });
            }
        }

        return NextResponse.json({ error: 'Impossible de récupérer le fichier (404/401)' }, { status: 404 })

    } catch (error: any) {
        console.error('❌ [Download Proxy] Critical Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
