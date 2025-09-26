import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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

// Fonction utilitaire pour créer les dossiers si nécessaire
async function ensureUploadDirs() {
  const dirs = [
    path.join(UPLOAD_DIR, 'projects'),
    path.join(UPLOAD_DIR, 'works'),
    path.join(UPLOAD_DIR, 'temp')
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

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
    const allowedRoles = ["CONCEPTEUR", "AUTEUR", "PDG", "ADMIN"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Rôle non autorisé pour l'upload" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const uploadType = formData.get('type') as string; // 'project', 'work', 'temp'
    const entityId = formData.get('entityId') as string; // ID du projet ou de l'œuvre

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    if (!uploadType || !['project', 'work', 'temp'].includes(uploadType)) {
      return NextResponse.json(
        { error: "Type d'upload invalide (project, work, temp)" },
        { status: 400 }
      );
    }

    // Assurer que les dossiers d'upload existent
    await ensureUploadDirs();

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

        // Vérifier l'extension
        const extension = getFileExtension(file.name);
        if (!ALL_ALLOWED_EXTENSIONS.includes(extension)) {
          errors.push(`${file.name}: Type de fichier non autorisé (.${extension})`);
          continue;
        }

        // Générer un nom unique
        const uniqueFilename = generateUniqueFilename(file.name, session.user.id);
        
        // Déterminer le dossier de destination
        const uploadSubDir = uploadType === 'temp' ? 'temp' : uploadType + 's';
        const filePath = path.join(UPLOAD_DIR, uploadSubDir, uniqueFilename);

        // Convertir le fichier en buffer et l'écrire
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Déterminer le type de fichier
        let fileType = 'other';
        for (const [type, extensions] of Object.entries(ALLOWED_FILE_TYPES)) {
          if (extensions.includes(extension)) {
            fileType = type;
            break;
          }
        }

        const uploadedFile = {
          originalName: file.name,
          filename: uniqueFilename,
          path: `/uploads/${uploadSubDir}/${uniqueFilename}`,
          size: file.size,
          type: fileType,
          extension: extension,
          mimeType: file.type,
          uploadedBy: session.user.id,
          uploadedAt: new Date().toISOString(),
          entityId: entityId || null,
          entityType: uploadType
        };

        uploadedFiles.push(uploadedFile);

        console.log(`✅ Fichier uploadé: ${file.name} → ${uniqueFilename}`);

      } catch (fileError: any) {
        console.error(`❌ Erreur upload fichier ${file.name}:`, fileError);
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

    console.log(`✅ ${uploadedFiles.length} fichier(s) uploadé(s) par ${session.user.name}`);

    return NextResponse.json({
      message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Erreur lors de l'upload:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload: " + error.message },
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
    console.error("❌ Erreur lors de la récupération des fichiers:", error);
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
    const filename = searchParams.get('filename');
    const uploadType = searchParams.get('type');

    if (!filename || !uploadType) {
      return NextResponse.json(
        { error: "Nom de fichier et type requis" },
        { status: 400 }
      );
    }

    // Construire le chemin du fichier
    const uploadSubDir = uploadType === 'temp' ? 'temp' : uploadType + 's';
    const filePath = path.join(UPLOAD_DIR, uploadSubDir, filename);

    // Vérifier que le fichier existe
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le fichier
    const fs = require('fs').promises;
    await fs.unlink(filePath);

    console.log(`✅ Fichier supprimé: ${filename} par ${session.user.name}`);

    return NextResponse.json({
      message: "Fichier supprimé avec succès"
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la suppression du fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du fichier: " + error.message },
      { status: 500 }
    );
  }
}
