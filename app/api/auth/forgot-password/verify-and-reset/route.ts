import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOTP } from "@/lib/simple-otp";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const { email, code, newPassword } = await request.json();

        if (!email || !code || !newPassword) {
            return NextResponse.json(
                { error: "Tous les champs sont requis" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "Le mot de passe doit contenir au moins 6 caractères" },
                { status: 400 }
            );
        }

        // Vérifier le code OTP
        const isValid = await verifyOTP(email, code);

        if (!isValid) {
            return NextResponse.json(
                { error: "Code invalide ou expiré" },
                { status: 400 }
            );
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour l'utilisateur
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
            },
        });

        // Supprimer l'OTP utilisé (optionnel car verifyOTP peut le faire, mais sécurité supplémentaire)
        // Dans notre implémentation simple-otp, verifyOTP supprime déjà le code si valide.

        return NextResponse.json({
            message: "Mot de passe réinitialisé avec succès",
        });

    } catch (error: any) {
        console.error("Error resetting password:", error);
        return NextResponse.json(
            { error: "Erreur lors de la réinitialisation du mot de passe." },
            { status: 500 }
        );
    }
}
