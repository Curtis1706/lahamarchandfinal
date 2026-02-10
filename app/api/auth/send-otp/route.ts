import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOTP, canRequestOTP } from '@/lib/simple-otp';
import { sendEmail } from '@/lib/native-email';
import { getOTPEmailHTML, getOTPEmailText } from '@/lib/simple-email-templates';
import fs from 'fs';
import path from 'path';

function logDebug(message: string, data?: any) {
    const logPath = path.join(process.cwd(), 'debug-otp.log');
    const logEntry = `${new Date().toISOString()} - ${message} ${data ? JSON.stringify(data) : ''}\n`;
    fs.appendFileSync(logPath, logEntry);
}

/**
 * POST /api/auth/send-otp
 * Envoyer un code OTP par email pour vérification
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;
        logDebug('Requête reçue dans send-otp', { body });

        // Validation de l'email
        if (!email || typeof email !== 'string') {
            logDebug('Erreur 400: Email absent ou invalide');
            return NextResponse.json({
                success: false,
                error: 'Email requis'
            }, { status: 400 });
        }

        // Validation du format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            logDebug('Erreur 400: Format email invalide', { email });
            return NextResponse.json({
                success: false,
                error: 'Format d\'email invalide'
            }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const type = body.type || "signup"; // "signup", "reset-password", etc.

        // Vérifier le rate limiting
        const rateLimitCheck = await canRequestOTP(normalizedEmail, type);
        if (!rateLimitCheck.allowed) {
            logDebug('Erreur 429: Rate limit atteint', { normalizedEmail, waitSeconds: rateLimitCheck.waitSeconds });
            return NextResponse.json({
                success: false,
                error: rateLimitCheck.message,
                waitSeconds: rateLimitCheck.waitSeconds
            }, { status: 429 });
        }

        // Vérifier si l'email existe déjà (uniquement pour l'inscription)
        if (type === "signup") {
            const existingUser = await prisma.user.findUnique({
                where: { email: normalizedEmail }
            });

            if (existingUser) {
                logDebug('Erreur 400: Compte déjà existant', { normalizedEmail });
                return NextResponse.json({
                    success: false,
                    error: 'Un compte existe déjà avec cet email'
                }, { status: 400 });
            }
        }

        // Générer et stocker l'OTP
        const otpCode = await createOTP(normalizedEmail, type);
        logDebug('OTP généré et stocké', { normalizedEmail, type });

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
