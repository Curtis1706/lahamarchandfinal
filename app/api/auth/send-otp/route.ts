import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOTP, canRequestOTP } from '@/lib/simple-otp';
import { sendEmail } from '@/lib/native-email';
import { getOTPEmailHTML, getOTPEmailText } from '@/lib/simple-email-templates';

/**
 * POST /api/auth/send-otp
 * Envoyer un code OTP par email pour vérification
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validation de l'email
        if (!email || typeof email !== 'string') {
            return NextResponse.json({
                success: false,
                error: 'Email requis'
            }, { status: 400 });
        }

        // Validation du format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({
                success: false,
                error: 'Format d\'email invalide'
            }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Vérifier le rate limiting
        const rateLimitCheck = canRequestOTP(normalizedEmail);
        if (!rateLimitCheck.allowed) {
            return NextResponse.json({
                success: false,
                error: rateLimitCheck.message,
                waitSeconds: rateLimitCheck.waitSeconds
            }, { status: 429 });
        }

        // Vérifier si l'email existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return NextResponse.json({
                success: false,
                error: 'Un compte existe déjà avec cet email'
            }, { status: 400 });
        }

        // Générer et stocker l'OTP
        const otpCode = createOTP(normalizedEmail);

        // Envoyer l'email
        const emailResult = await sendEmail({
            to: normalizedEmail,
            subject: 'Code de vérification - Laha Marchand',
            html: getOTPEmailHTML({
                otp: otpCode,
                email: normalizedEmail,
                expiryMinutes: 10
            }),
            text: getOTPEmailText({
                otp: otpCode,
                email: normalizedEmail,
                expiryMinutes: 10
            })
        });

        if (!emailResult.success) {
            console.error('Erreur envoi email OTP:', emailResult.error);
            return NextResponse.json({
                success: false,
                error: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
            }, { status: 500 });
        }

        console.log(`✅ OTP envoyé à ${normalizedEmail}`);

        return NextResponse.json({
            success: true,
            message: 'Code de vérification envoyé par email'
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Erreur send-otp:', error);
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de l\'envoi du code. Veuillez réessayer.'
        }, { status: 500 });
    }
}
