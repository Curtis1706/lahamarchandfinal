import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import cloudinary from "@/lib/cloudinary";
import { put } from '@vercel/blob';

// Configuration des types de fichiers autorisés
const ALLOWED_FILE_TYPES = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  documents: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  audio: ['mp3', 'wav', 'ogg', 'm4a'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'flv'],
  archives: ['zip', 'rar', '7z'],
  presentations: ['ppt', 'pptx', 'odp'],
  spreadsheets: ['xls', 'xlsx', 'ods', 'csv']
};

const ALL_ALLOWED_EXTENSIONS = Object.values(ALLOWED_FILE_TYPES).flat();
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Fonction utilitaire pour obtenir l'extension du fichier
function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Fonction utilitaire pour générer un nom de fichier unique
function generateUniqueFilename(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const baseName = originalName.replace(/\.[^/.]+$/, "").substring(0, 50);
  return `${userId}_${timestamp}_${randomString}_${baseName}.${extension}`;
}

// Les dossiers locaux ne sont plus nécessaires avec Cloudinary

// POST /api/upload - Upload de fichiers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur a le droit d'upload
    const allowedRoles = ["CONCEPTEUR", "AUTEUR", "PDG", "CLIENT"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Rôle non autorisé pour l'upload" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const uploadType = formData.get('type') as string; // 'project', 'work', 'temp', 'payment_proof'
    const entityId = formData.get('entityId') as string; // ID du projet ou de l'œuvre

    console.log(`[API Upload] Received ${files.length} files. Type: ${uploadType}, EntityId: ${entityId}`);

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    if (!uploadType || !['project', 'work', 'temp', 'payment_proof'].includes(uploadType)) {
      return NextResponse.json(
        { error: "Type d'upload invalide (project, work, temp, payment_proof)" },
        { status: 400 }
      );
    }

    // Plus besoin d'assurer les dossiers locaux avec Cloudinary

    const uploadedFiles: any[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Vérifications de base
        if (!file.name) {
          errors.push("Nom de fichier manquant");
          continue;
        }

        // Vérifier la taille
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
          continue;
        }

        // Déterminer le type de fichier et le resource_type Cloudinary
        const extension = getFileExtension(file.name);
        let fileType = 'other';
        for (const [type, extensions] of Object.entries(ALLOWED_FILE_TYPES)) {
          if (extensions.includes(extension)) {
            fileType = type;
            break;
          }
        }

        const isDocument = ['documents', 'archives', 'presentations', 'spreadsheets'].includes(fileType);
        const isImage = file.type.startsWith('image/');

        // Générer un nom unique
        const uniqueFilename = generateUniqueFilename(file.name, session.user.id);

        // Convertir le fichier en buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        let uploadResult: {
          url: string;
          public_id?: string;
          resource_type?: string;
          format?: string;
        };

        // Decide storage based on file type
        if (isDocument) {
          // Use Vercel Blob for documents (PDFs, Word, etc.)
          console.log(`[API Upload] Using Vercel Blob for document: ${file.name}`);

          const cloudinaryFolder = uploadType === 'temp' ? 'temp' : uploadType + 's';
          const blobPath = `laha/${cloudinaryFolder}/${uniqueFilename}`;

          const blob = await put(blobPath, buffer, {
            access: 'public',
            contentType: file.type || 'application/octet-stream',
          });

          uploadResult = {
            url: blob.url,
            public_id: uniqueFilename,
            resource_type: 'raw',
            format: extension
          };

          console.log(`[API Upload] Vercel Blob Success:`, {
            url: blob.url,
            pathname: blob.pathname
          });

        } else {
          // Use Cloudinary for images and other media
          console.log(`[API Upload] Using Cloudinary for image: ${file.name}`);

          const cloudinaryFolder = uploadType === 'temp' ? 'temp' : uploadType + 's';
          const resourceType = isImage ? 'image' : 'raw';

          const result: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: `laha/${cloudinaryFolder}`,
                public_id: resourceType === 'raw' ? uniqueFilename : uniqueFilename.split('.')[0],
                resource_type: resourceType,
                access_mode: 'public',
                type: 'upload',
              },
              (error: any, result: any) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(buffer);
          });

          uploadResult = {
            url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
            format: result.format
          };

          console.log(`[API Upload] Cloudinary Success:`, {
            url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
            format: result.format
          });
        }


        const uploadedFile = {
          originalName: file.name,
          filename: uniqueFilename,
          path: uploadResult.url, // URL from either Vercel Blob or Cloudinary
          size: file.size,
          type: fileType,
          extension: extension,
          mimeType: file.type,
          uploadedBy: session.user.id,
          uploadedAt: new Date().toISOString(),
          entityId: entityId || null,
          entityType: uploadType,
          cloudinaryId: uploadResult.public_id
        };

        uploadedFiles.push(uploadedFile);

        logger.debug(`✅ Fichier uploadé: ${file.name} → ${uniqueFilename}`);

      } catch (fileError: any) {
        logger.error(`❌ Erreur upload fichier ${file.name}:`, fileError);
        errors.push(`${file.name}: ${fileError.message}`);
      }
    }

    // Si aucun fichier n'a été uploadé avec succès
    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        {
          error: "Aucun fichier n'a pu être uploadé",
          errors: errors
        },
        { status: 400 }
      );
    }

    logger.debug(`✅ ${uploadedFiles.length} fichier(s) uploadé(s) par ${session.user.name}`);

    return NextResponse.json({
      message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 201 });

  } catch (error: any) {
    console.error("[API Upload] Cloudinary or Internal Error:", error);
    logger.error("❌ Erreur lors de l'upload:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload: " + (error.message || error) },
      { status: 500 }
    );
  }
}

// GET /api/upload - Lister les fichiers uploadés
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const uploadType = searchParams.get('type'); // 'project', 'work', 'temp'
    const entityId = searchParams.get('entityId');

    // Cette route pourrait être étendue pour lister les fichiers depuis une base de données
    // Pour l'instant, on retourne une réponse simple

    return NextResponse.json({
      message: "Liste des fichiers (à implémenter avec base de données)",
      filters: {
        type: uploadType,
        entityId: entityId
      }
    }, { status: 200 });

  } catch (error: any) {
    logger.error("❌ Erreur lors de la récupération des fichiers:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des fichiers: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/upload - Supprimer un fichier uploadé
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cloudinaryId = searchParams.get('cloudinaryId');

    if (!cloudinaryId) {
      return NextResponse.json(
        { error: "ID Cloudinary requis pour la suppression" },
        { status: 400 }
      );
    }

    // Supprimer sur Cloudinary
    const result = await cloudinary.uploader.destroy(cloudinaryId);

    if (result.result !== 'ok') {
      return NextResponse.json(
        { error: "Erreur lors de la suppression sur Cloudinary: " + result.result },
        { status: 500 }
      );
    }

    logger.debug(`✅ Fichier supprimé sur Cloudinary: ${cloudinaryId} par ${session.user.name}`);

    return NextResponse.json({
      message: "Fichier supprimé de Cloudinary avec succès"
    }, { status: 200 });

  } catch (error: any) {
    logger.error("❌ Erreur lors de la suppression du fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du fichier: " + error.message },
      { status: 500 }
    );
  }
}
