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

        // Vercel Blob direct download
        if (fileUrl.includes('blob.vercel-storage.com')) {
            console.log('📦 [Download Proxy] Vercel Blob URL detected, fetching directly...');
            const response = await fetch(fileUrl);
            if (!response.ok) {
                console.error('❌ [Download Proxy] Vercel Blob fetch failed:', response.status);
                return NextResponse.json({ error: 'Erreur lors du téléchargement Vercel Blob' }, { status: response.status });
            }

            const contentType = response.headers.get('content-type') || 'application/octet-stream';
            const buffer = await response.arrayBuffer();
            const fileName = preferredName || fileUrl.split('/').pop() || 'document.pdf';

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
                }
            });
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

            let workingResponse: Response | null = null;

            // 2b. Tentative d'accès DIRECT (Optimisation pour fichiers publics)
            try {
                console.log('🔄 [Download Proxy] Trying direct fetch of original URL...')
                const fastResponse = await fetch(fileUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                if (fastResponse.ok) {
                    console.log('✅ [Download Proxy] Direct fetch success!')
                    workingResponse = fastResponse;
                }
            } catch (e) {
                console.log('⚠️ [Download Proxy] Direct fetch failed, trying signed URLs...')
            }

            if (!workingResponse) {
                // Stratégie de récupération "Smart Retry"
                // On essaie de générer des URLs signées pour différents cas (public/authenticated, sans extension...)
                const strategies = [
                    // 1. Essai Standard (type: upload, avec ID nettoyé)
                    { type: 'upload', stripExtension: true },
                    // 2. Essai Authenticated (type: authenticated, pour anciens fichiers)
                    { type: 'authenticated', stripExtension: true },
                    // 3. Essai Legacy (type: upload, garder extension)
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
            }

            // 3. Admin API Fallback - Query Cloudinary for resource details
            if (!workingResponse) {
                try {
                    console.log('🔍 [Download Proxy] All signed URLs failed. Querying Admin API for resource details...');
                    console.log('🔍 [Download Proxy] Raw Public ID:', rawPublicId, 'Resource Type:', resourceType);

                    // IMPORTANT: For 'raw' resources, the public_id INCLUDES the extension
                    // This matches how files are uploaded (see upload/route.ts line 128)
                    // For other resource types, we would strip the extension
                    const publicIdForAdmin = rawPublicId; // Keep extension for raw files

                    const adminResource = await cloudinary.api.resource(publicIdForAdmin, {
                        resource_type: resourceType,
                        type: 'upload', // Try 'upload' first as it's most common
                    });

                    console.log('✅ [Download Proxy] Admin API success!');
                    console.log('🔍 [Download Proxy] Resource details:', {
                        access_mode: adminResource.access_mode,
                        type: adminResource.type,
                        format: adminResource.format,
                        public_id: adminResource.public_id
                    });


                    // Direct download via Admin API content endpoint
                    // Bypass all URL generation since every URL approach returns 401/404
                    // Use authenticated fetch directly to Cloudinary's Admin API
                    console.log('🔄 [Download Proxy] Downloading via Admin API content endpoint...');

                    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
                    const apiSecret = process.env.CLOUDINARY_API_SECRET;

                    // Build Admin API content URL
                    // Format: https://api.cloudinary.com/v1_1/:cloud_name/resources/:resource_type/:type/:public_id
                    const publicIdEncoded = encodeURIComponent(adminResource.public_id);
                    const adminContentUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/${adminResource.type}/${publicIdEncoded}`;

                    console.log('🔗 [Download Proxy] Admin content URL constructed');
                    console.log('🔄 [Download Proxy] Fetching with API credentials...');

                    // Use Basic Auth with API key and secret
                    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
                    const adminResponse = await fetch(adminContentUrl, {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                        }
                    });

                    if (adminResponse.ok) {
                        const resourceData = await adminResponse.json();
                        console.log('✅ [Download Proxy] Got resource data from Admin API');

                        // Try to fetch the secure_url from the Admin response
                        if (resourceData.secure_url) {
                            console.log('🔄 [Download Proxy] Fetching secure_url from Admin response...');
                            const fileResponse = await fetch(resourceData.secure_url);

                            if (fileResponse.ok) {
                                console.log('✅ [Download Proxy] Admin API secure_url fetch success!');
                                workingResponse = fileResponse;
                            } else {
                                console.error('❌ [Download Proxy] secure_url fetch failed:', fileResponse.status);
                            }
                        }
                    } else {
                        console.error('❌ [Download Proxy] Admin content endpoint failed:', adminResponse.status);
                        const errorText = await adminResponse.text();
                        console.error('💡 [Download Proxy] Error response:', errorText);
                    }
                } catch (adminError: any) {
                    console.error('🕵️ [Download Proxy] Admin API Error:', adminError.message || adminError);

                    // Try alternative delivery type if first attempt failed
                    if (adminError.error?.http_code === 404) {
                        try {
                            console.log('🔄 [Download Proxy] Retrying with type: authenticated...');
                            // Keep the extension for raw files
                            const publicIdForAdmin = rawPublicId;

                            const adminResource = await cloudinary.api.resource(publicIdForAdmin, {
                                resource_type: resourceType,
                                type: 'authenticated',
                            });

                            if (adminResource.secure_url) {
                                const adminResponse = await fetch(adminResource.secure_url);
                                if (adminResponse.ok) {
                                    console.log('✅ [Download Proxy] Admin API authenticated fetch success!');
                                    workingResponse = adminResponse;
                                }
                            }
                        } catch (retryError) {
                            console.error('🕵️ [Download Proxy] Admin API retry also failed:', retryError);
                        }
                    }
                }
            }

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

                console.log(`📦 [Download Proxy] Streaming response: ${finalName} (${contentType})`);

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
