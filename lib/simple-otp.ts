import { prisma } from './prisma';

/**
 * Service OTP - Stockage en base de données via Prisma
 * Indispensable pour les environnements de production stateless (Vercel)
 */

// Configuration
const OTP_CONFIG = {
    LENGTH: 6,
    EXPIRY_MINUTES: 10,
    MAX_ATTEMPTS: 3,
    RATE_LIMIT_SECONDS: 60, // 1 minute entre deux demandes
} as const;

/**
 * Générer un code OTP aléatoire de 6 chiffres
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Créer et stocker un OTP pour un email
 */
export async function createOTP(email: string, type: string = "signup"): Promise<string> {
    const normalizedEmail = email.toLowerCase().trim();
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

    // Supprimer l'ancien OTP s'il existe (pour ce mail et ce type)
    await prisma.otpCode.deleteMany({
        where: { email: normalizedEmail, type }
    });

    // Stocker le nouvel OTP
    await prisma.otpCode.create({
        data: {
            email: normalizedEmail,
            code,
            type,
            expiresAt,
        }
    });

    // Log en développement uniquement
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔑 OTP créé pour ${normalizedEmail} (type: ${type}): ${code}`);
    }

    return code;
}

/**
 * Vérifier un code OTP
 */
export async function verifyOTP(
    email: string,
    code: string,
    type: string = "signup"
): Promise<{
    valid: boolean;
    message: string;
}> {
    const normalizedEmail = email.toLowerCase().trim();

    // Récupérer l'OTP depuis la base de données
    const otpData = await prisma.otpCode.findFirst({
        where: {
            email: normalizedEmail,
            type,
        }
    });

    // OTP n'existe pas
    if (!otpData) {
        return {
            valid: false,
            message: 'Code de vérification non trouvé. Veuillez en demander un nouveau.',
        };
    }

    // OTP expiré
    if (new Date() > otpData.expiresAt) {
        await prisma.otpCode.delete({ where: { id: otpData.id } });
        return {
            valid: false,
            message: 'Code de vérification expiré. Veuillez en demander un nouveau.',
        };
    }

    // Code incorrect
    if (otpData.code !== code.trim()) {
        // Optionnel: On pourrait incrémenter un compteur de tentatives ici si on ajoute un champ 'attempts' au modèle
        return {
            valid: false,
            message: 'Code de vérification incorrect.',
        };
    }

    // Code valide - supprimer de la base de données (usage unique)
    await prisma.otpCode.delete({ where: { id: otpData.id } });

    if (process.env.NODE_ENV === 'development') {
        console.log(`✅ OTP vérifié avec succès pour ${normalizedEmail} (type: ${type})`);
    }

    return {
        valid: true,
        message: 'Email vérifié avec succès !',
    };
}

/**
 * Vérifier si l'utilisateur peut demander un nouveau OTP (rate limiting)
 */
export async function canRequestOTP(email: string, type: string = "signup"): Promise<{
    allowed: boolean;
    message: string;
    waitSeconds?: number;
}> {
    const normalizedEmail = email.toLowerCase().trim();

    // On regarde le dernier OTP créé pour cet email et ce type
    const lastOtp = await prisma.otpCode.findFirst({
        where: { email: normalizedEmail, type },
        orderBy: { createdAt: 'desc' }
    });

    if (!lastOtp) {
        return { allowed: true, message: 'OK' };
    }

    const elapsedSeconds = Math.floor((Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000);
    const waitSeconds = OTP_CONFIG.RATE_LIMIT_SECONDS - elapsedSeconds;

    if (waitSeconds > 0) {
        return {
            allowed: false,
            message: `Veuillez attendre ${waitSeconds} seconde${waitSeconds > 1 ? 's' : ''} avant de demander un nouveau code.`,
            waitSeconds,
        };
    }

    return { allowed: true, message: 'OK' };
}

/**
 * Nettoyage des OTP expirés
 */
export async function cleanupExpiredOTPs(): Promise<number> {
    const result = await prisma.otpCode.deleteMany({
        where: {
            expiresAt: { lt: new Date() }
        }
    });

    if (result.count > 0 && process.env.NODE_ENV === 'development') {
        console.log(`🧹 ${result.count} OTP expiré(s) supprimé(s) de la base de données.`);
    }

    return result.count;
}
