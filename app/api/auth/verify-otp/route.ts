import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/simple-otp';

/**
 * POST /api/auth/verify-otp
 * Vérifier un code OTP
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, code } = body;

        // Validation des champs
        if (!email || typeof email !== 'string') {
            return NextResponse.json({
                success: false,
                error: 'Email requis'
            }, { status: 400 });
        }

        if (!code || typeof code !== 'string') {
            return NextResponse.json({
                success: false,
                error: 'Code OTP requis'
            }, { status: 400 });
        }

        // Validation du format du code (6 chiffres)
        if (!/^\d{6}$/.test(code.trim())) {
            return NextResponse.json({
                success: false,
                error: 'Le code doit contenir 6 chiffres'
            }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Vérifier le code OTP
        const result = verifyOTP(normalizedEmail, code);

        if (!result.valid) {
            return NextResponse.json({
                success: false,
                error: result.message
            }, { status: 400 });
        }

        console.log(`✅ OTP vérifié avec succès pour ${normalizedEmail}`);

        return NextResponse.json({
            success: true,
            message: result.message
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Erreur verify-otp:', error);
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la vérification du code. Veuillez réessayer.'
        }, { status: 500 });
    }
}
