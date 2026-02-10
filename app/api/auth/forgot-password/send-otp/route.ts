import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOTP } from "@/lib/simple-otp";
import { sendEmail } from "@/lib/simple-email-service";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email requis" },
                { status: 400 }
            );
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (!existingUser) {
            // Pour des raisons de sécurité, on ne dit pas explicitement que l'email n'existe pas
            // Mais on attend un peu pour simuler le temps de traitement
            await new Promise(resolve => setTimeout(resolve, 1000));
            return NextResponse.json({
                message: "Si un compte existe avec cet email, un code de réinitialisation a été envoyé."
            });
        }

        // Générer et sauvegarder le code OTP (expire dans 10 minutes)
        const code = await createOTP(email, "reset-password");

        // Envoyer l'email
        await sendEmail({
            to: email,
            subject: "Réinitialisation de votre mot de passe - Laha Marchand",
            template: "password-reset",
            data: {
                name: existingUser.name || "Utilisateur",
                code: code,
            },
        });

        return NextResponse.json({
            message: "Code de réinitialisation envoyé avec succès",
        });

    } catch (error: any) {
        console.error("Error sending password reset OTP:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'envoi du code. Veuillez réessayer." },
            { status: 500 }
        );
    }
}
