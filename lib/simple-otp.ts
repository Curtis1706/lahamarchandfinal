/**
 * Service OTP - Stockage en mémoire (Map)
 * Parfait pour les petites/moyennes applications
 * Pas besoin de Redis ou autre service externe
 */

interface OTPData {
    code: string;
    email: string;
    createdAt: number;
    expiresAt: number;
    attempts: number;
}

interface RateLimitData {
    timestamp: number;
}

// Stockage en mémoire avec persistance HMR (Hot Module Replacement)
const globalForOTP = global as unknown as {
    otpStore: Map<string, OTPData> | undefined;
    rateLimitStore: Map<string, RateLimitData> | undefined;
}

const otpStore = globalForOTP.otpStore ?? new Map<string, OTPData>();
const rateLimitStore = globalForOTP.rateLimitStore ?? new Map<string, RateLimitData>();

if (process.env.NODE_ENV !== 'production') {
    globalForOTP.otpStore = otpStore;
    globalForOTP.rateLimitStore = rateLimitStore;
}

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
export function createOTP(email: string): string {
    const normalizedEmail = email.toLowerCase().trim();
    const code = generateOTP();
    const now = Date.now();
    const expiresAt = now + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000;

    // Stocker l'OTP
    otpStore.set(normalizedEmail, {
        code,
        email: normalizedEmail,
        createdAt: now,
        expiresAt,
        attempts: 0,
    });

    // Stocker le rate limit
    rateLimitStore.set(normalizedEmail, {
        timestamp: now,
    });

    // Auto-nettoyage après expiration
    setTimeout(() => {
        otpStore.delete(normalizedEmail);
        rateLimitStore.delete(normalizedEmail);
    }, OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000 + 5000);

    // Log en développement uniquement
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔑 OTP créé pour ${normalizedEmail}: ${code}`);
    }

    return code;
}

/**
 * Vérifier un code OTP
 */
export function verifyOTP(
    email: string,
    code: string
): {
    valid: boolean;
    message: string;
} {
    const normalizedEmail = email.toLowerCase().trim();
    const otpData = otpStore.get(normalizedEmail);

    // OTP n'existe pas
    if (!otpData) {
        return {
            valid: false,
            message: 'Code OTP non trouvé ou expiré',
        };
    }

    // OTP expiré
    if (Date.now() > otpData.expiresAt) {
        otpStore.delete(normalizedEmail);
        return {
            valid: false,
            message: 'Code OTP expiré. Demandez un nouveau code.',
        };
    }

    // Trop de tentatives
    if (otpData.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
        otpStore.delete(normalizedEmail);
        return {
            valid: false,
            message: 'Trop de tentatives. Demandez un nouveau code.',
        };
    }

    // Incrémenter le compteur de tentatives
    otpData.attempts += 1;
    otpStore.set(normalizedEmail, otpData);

    // Code incorrect
    if (otpData.code !== code.trim()) {
        const remainingAttempts = OTP_CONFIG.MAX_ATTEMPTS - otpData.attempts;
        return {
            valid: false,
            message: `Code incorrect. ${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}.`,
        };
    }

    // Code valide - supprimer de la mémoire
    otpStore.delete(normalizedEmail);
    rateLimitStore.delete(normalizedEmail);

    if (process.env.NODE_ENV === 'development') {
        console.log(`✅ OTP vérifié avec succès pour ${normalizedEmail}`);
    }

    return {
        valid: true,
        message: 'Email vérifié avec succès !',
    };
}

/**
 * Vérifier si l'utilisateur peut demander un nouveau OTP (rate limiting)
 */
export function canRequestOTP(email: string): {
    allowed: boolean;
    message: string;
    waitSeconds?: number;
} {
    const normalizedEmail = email.toLowerCase().trim();
    const rateLimitData = rateLimitStore.get(normalizedEmail);

    if (!rateLimitData) {
        return { allowed: true, message: 'OK' };
    }

    const elapsedSeconds = Math.floor((Date.now() - rateLimitData.timestamp) / 1000);
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
 * Supprimer un OTP (utile pour le nettoyage manuel)
 */
export function deleteOTP(email: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    otpStore.delete(normalizedEmail);
    rateLimitStore.delete(normalizedEmail);
}

/**
 * Obtenir les statistiques (monitoring)
 */
export function getOTPStats() {
    return {
        activeOTPs: otpStore.size,
        rateLimitedUsers: rateLimitStore.size,
        config: OTP_CONFIG,
    };
}

/**
 * Nettoyage manuel des OTP expirés
 * (Appelé automatiquement mais peut être utilisé manuellement)
 */
export function cleanupExpiredOTPs(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [email, otpData] of otpStore.entries()) {
        if (now > otpData.expiresAt) {
            otpStore.delete(email);
            rateLimitStore.delete(email);
            cleanedCount++;
        }
    }

    if (cleanedCount > 0 && process.env.NODE_ENV === 'development') {
        console.log(`🧹 ${cleanedCount} OTP expiré${cleanedCount > 1 ? 's' : ''} nettoyé${cleanedCount > 1 ? 's' : ''}`);
    }

    return cleanedCount;
}

// Nettoyage automatique toutes les 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        cleanupExpiredOTPs();
    }, 5 * 60 * 1000);
}
