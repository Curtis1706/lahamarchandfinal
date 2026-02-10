import nodemailer from 'nodemailer';
import { getOTPEmailHTML, getOTPEmailText, getWelcomeEmailHTML, getWelcomeEmailText } from './simple-email-templates';

// Configuration du transporteur (SMTP)
// En dev, on peut utiliser ethereal.email ou simplement logger
const getTransporter = () => {
    if (process.env.EMAIL_SERVER_HOST) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT) || 587,
            auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
            },
            secure: process.env.EMAIL_SERVER_SECURE === 'true',
        });
    }

    // Fallback pour le développement local si pas de SMTP
    return {
        sendMail: async (mailOptions: any) => {
            console.log("📨 [DEV - Simulation Email] 📨");
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log("--- Content ---");
            // console.log(mailOptions.html || mailOptions.text); 
            console.log("(Content hidden to avoid spamming console)");
            console.log("📨 ------------------------- 📨");
            return { messageId: "dev-mock-id" };
        }
    };
};

interface SendEmailParams {
    to: string;
    subject: string;
    template: 'otp' | 'welcome' | 'password-reset';
    data: any;
}

/**
 * Fonction générique d'envoi d'email
 */
export async function sendEmail({ to, subject, template, data }: SendEmailParams) {
    const transporter = getTransporter();

    let html = '';
    let text = '';

    // Sélection du template
    switch (template) {
        case 'otp':
        case 'password-reset': // On utilise le même template pour l'instant
            html = getOTPEmailHTML({ otp: data.code, email: to });
            text = getOTPEmailText({ otp: data.code, email: to });
            break;
        case 'welcome':
            html = getWelcomeEmailHTML(data.name, to);
            text = getWelcomeEmailText(data.name, to);
            break;
    }

    // Envoi
    try {
        await (transporter as any).sendMail({
            from: process.env.EMAIL_FROM || '"Laha Marchand" <noreply@lahamarchand.com>',
            to,
            subject,
            text,
            html,
        });
        return { success: true };
    } catch (error) {
        console.error("❌ Erreur d'envoi d'email:", error);
        throw new Error("Impossible d'envoyer l'email");
    }
}

// Re-export des templates pour compatibilité
export * from './simple-email-templates';
