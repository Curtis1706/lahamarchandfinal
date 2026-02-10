import { NextResponse } from 'next/server';
import { cleanupExpiredOTPs } from '@/lib/simple-otp';

/**
 * GET /api/cron/cleanup-otp
 * Route pour le nettoyage manuel ou via cron des OTP expirés
 */
export async function GET() {
    try {
        const count = await cleanupExpiredOTPs();

        return NextResponse.json({
            success: true,
            deletedCount: count,
            message: `${count} OTP(s) expiré(s) nettoyé(s)`
        });
    } catch (error) {
        console.error('❌ Erreur cron cleanup-otp:', error);
        return NextResponse.json({
            success: false,
            error: 'Erreur lors du nettoyage des OTP'
        }, { status: 500 });
    }
}
