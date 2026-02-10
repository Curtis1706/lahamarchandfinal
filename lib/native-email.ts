import nodemailer from 'nodemailer';

interface SMTPConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    fromName: string;
}

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

// Configuration depuis les variables d'environnement
const smtpConfig: SMTPConfig = {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || '',
    fromName: process.env.SMTP_FROM_NAME || 'Laha Marchand',
};

// Création du transporteur Nodemailer
const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465, // true pour 465, false pour les autres ports
    auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
    },
});

/**
 * Fonction publique pour envoyer un email via Nodemailer
 */
export async function sendEmail(options: EmailOptions) {
    try {
        const mailOptions = {
            from: `"${smtpConfig.fromName}" <${smtpConfig.from}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email envoyé:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        };
    }
}

/**
 * Vérifier la connexion SMTP
 */
export async function verifyEmailConnection(): Promise<boolean> {
    try {
        await transporter.verify();
        console.log('✅ Connexion SMTP vérifiée avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur vérification SMTP:', error);
        return false;
    }
}
