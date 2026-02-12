import { NextRequest, NextResponse } from 'next/server'
import cloudinary from "@/lib/cloudinary";

const ALLOWED_DOMAINS = ['res.cloudinary.com', 'cloudinary.com']

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        let fileUrl = searchParams.get('url')
        const preferredName = searchParams.get('name')

        console.log('📥 [Download Route] Client requested:', fileUrl, 'Preferred Name:', preferredName)

        if (!fileUrl) {
            return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
        }

        // 1. Correction URL pour documents (image -> raw)
        const isDocumentUrl = fileUrl.match(/\.(pdf|docx?|txt|xlsx?|pptx?|zip|rar)(\?|$)/i)
        if (isDocumentUrl && fileUrl.includes('/image/upload/')) {
            fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/')
        }

        // 2. Extraction ID Public
        const urlMatch = fileUrl.match(/\/(?:raw|image|video)\/upload\/(?:v\d+\/)?(.+?)(?:\?.*)?$/)
        if (!urlMatch) {
            // Fallback: Redirect unchanged if pattern fails
            console.warn('⚠️ [Download Route] Could not parse URL, redirecting as-is')
            return NextResponse.redirect(fileUrl)
        }

        let publicId = decodeURIComponent(urlMatch[1])
        const resourceType = fileUrl.includes('/raw/') ? 'raw' :
            fileUrl.includes('/video/') ? 'video' : 'image'

        // 3. Gestion Extension pour RAW (Cloudinary Specific)
        // Les fichiers raw 'authenticated' nécessitent d'enlever l'extension du public_id pour la signature

        let format = undefined;
        if (resourceType === 'raw') {
            // Remove extension from publicId for signing
            const extMatch = publicId.match(/\.([a-z0-9]+)$/i);
            if (extMatch) {
                format = extMatch[1].toLowerCase();
                publicId = publicId.replace(/\.[a-z0-9]+$/i, '');
            }
        }

        console.log(`🔧 [Download Route] Signing ID: "${publicId}", Type: ${resourceType}, Format: ${format || 'none'}`)

        // 4. Génération URL Signée
        const signedUrl = cloudinary.url(publicId, {
            resource_type: resourceType,
            type: 'upload',
            sign_url: true,
            secure: true,
            format: format, // Ajoute l'extension à l'URL finale générée
            // Force download handling using attachment flag
            flags: `attachment:${encodeURIComponent(preferredName || publicId)}`
        });

        console.log('🔐 [Download Route] Redirecting to:', signedUrl)

        // 5. Redirection
        return NextResponse.redirect(signedUrl)

    } catch (error: any) {
        console.error('❌ [Download Route] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
