import * as net from 'net';
import * as tls from 'tls';

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

/**
 * Client SMTP natif sans dépendances externes
 * Utilise directement le protocole SMTP avec Node.js
 */
class NativeSMTPClient {
    private config: SMTPConfig;

    constructor(config: SMTPConfig) {
        this.config = config;
    }

    /**
     * Envoyer un email via SMTP natif
     */
    async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return new Promise((resolve) => {
            let socket: net.Socket | tls.TLSSocket;
            let messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${this.config.host}>`;
            let responseBuffer = '';

            // Fonction pour envoyer une commande et attendre la réponse
            const sendCommand = (command: string, expectedCode: number, callback: () => void) => {
                socket.write(command + '\r\n');

                const checkResponse = () => {
                    const lines = responseBuffer.split('\r\n');
                    const lastLine = lines[lines.length - 2] || '';

                    if (lastLine.startsWith(expectedCode.toString())) {
                        responseBuffer = '';
                        callback();
                    } else if (lastLine.match(/^[4-5]\d\d/)) {
                        socket.end();
                        resolve({ success: false, error: lastLine });
                    }
                };

                // Attendre un peu pour la réponse
                setTimeout(checkResponse, 500);
            };

            // Connexion initiale (non sécurisée)
            const initialSocket = net.createConnection({
                host: this.config.host,
                port: this.config.port,
            });

            initialSocket.on('data', (data) => {
                responseBuffer += data.toString();
            });

            initialSocket.on('connect', () => {
                // Attendre le message de bienvenue (220)
                setTimeout(() => {
                    socket = initialSocket;

                    // EHLO
                    sendCommand(`EHLO ${this.config.host}`, 250, () => {
                        // STARTTLS
                        sendCommand('STARTTLS', 220, () => {
                            // Upgrade vers TLS
                            const tlsSocket = tls.connect({
                                socket: initialSocket,
                                servername: this.config.host,
                                rejectUnauthorized: false,
                            });

                            socket = tlsSocket;
                            responseBuffer = '';

                            tlsSocket.on('data', (data) => {
                                responseBuffer += data.toString();
                            });

                            tlsSocket.on('secureConnect', () => {
                                // EHLO après TLS
                                sendCommand(`EHLO ${this.config.host}`, 250, () => {
                                    // AUTH LOGIN
                                    sendCommand('AUTH LOGIN', 334, () => {
                                        // Username (base64)
                                        const username = Buffer.from(this.config.user).toString('base64');
                                        sendCommand(username, 334, () => {
                                            // Password (base64)
                                            const password = Buffer.from(this.config.pass).toString('base64');
                                            sendCommand(password, 235, () => {
                                                // MAIL FROM
                                                sendCommand(`MAIL FROM:<${this.config.from}>`, 250, () => {
                                                    // RCPT TO
                                                    sendCommand(`RCPT TO:<${options.to}>`, 250, () => {
                                                        // DATA
                                                        sendCommand('DATA', 354, () => {
                                                            // Construire le message
                                                            const emailContent = this.buildEmailContent(options, messageId);

                                                            // Envoyer le contenu
                                                            socket.write(emailContent + '\r\n.\r\n');

                                                            setTimeout(() => {
                                                                // QUIT
                                                                socket.write('QUIT\r\n');
                                                                setTimeout(() => {
                                                                    socket.end();
                                                                    resolve({ success: true, messageId });
                                                                }, 500);
                                                            }, 500);
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });

                            tlsSocket.on('error', (err) => {
                                resolve({ success: false, error: err.message });
                            });
                        });
                    });
                }, 500);
            });

            initialSocket.on('error', (err) => {
                resolve({ success: false, error: err.message });
            });

            // Timeout de sécurité
            initialSocket.setTimeout(30000);
            initialSocket.on('timeout', () => {
                initialSocket.end();
                resolve({ success: false, error: 'Timeout de connexion' });
            });
        });
    }

    /**
     * Construire le contenu de l'email au format MIME
     */
    private buildEmailContent(options: EmailOptions, messageId: string): string {
        const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const date = new Date().toUTCString();

        const headers = [
            `From: ${this.config.fromName} <${this.config.from}>`,
            `To: ${options.to}`,
            `Subject: ${this.encodeSubject(options.subject)}`,
            `Date: ${date}`,
            `Message-ID: ${messageId}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/alternative; boundary="${boundary}"`,
        ].join('\r\n');

        const textPart = options.text || options.html.replace(/<[^>]*>/g, '');

        const body = [
            `--${boundary}`,
            `Content-Type: text/plain; charset=UTF-8`,
            `Content-Transfer-Encoding: quoted-printable`,
            ``,
            this.quotedPrintableEncode(textPart),
            ``,
            `--${boundary}`,
            `Content-Type: text/html; charset=UTF-8`,
            `Content-Transfer-Encoding: quoted-printable`,
            ``,
            this.quotedPrintableEncode(options.html),
            ``,
            `--${boundary}--`,
        ].join('\r\n');

        return headers + '\r\n\r\n' + body;
    }

    /**
     * Encoder le sujet en UTF-8 (RFC 2047)
     */
    private encodeSubject(subject: string): string {
        if (!/[^\x20-\x7E]/.test(subject)) {
            return subject; // ASCII seulement
        }
        return `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
    }

    /**
     * Encoder en Quoted-Printable
     */
    private quotedPrintableEncode(text: string): string {
        return text
            .split('')
            .map((char) => {
                const code = char.charCodeAt(0);
                if (code > 127 || char === '=') {
                    return `=${code.toString(16).toUpperCase().padStart(2, '0')}`;
                }
                return char;
            })
            .join('')
            .replace(/(.{75})/g, '$1=\r\n'); // Limiter à 75 caractères par ligne
    }
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

// Instance unique du client
const smtpClient = new NativeSMTPClient(smtpConfig);

/**
 * Fonction publique pour envoyer un email
 */
export async function sendEmail(options: EmailOptions) {
    try {
        const result = await smtpClient.sendEmail(options);

        if (!result.success) {
            console.error('❌ Erreur envoi email:', result.error);
            return { success: false, error: result.error };
        }

        console.log('✅ Email envoyé:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Exception envoi email:', error);
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
        const testResult = await smtpClient.sendEmail({
            to: smtpConfig.from, // Envoyer à soi-même
            subject: 'Test de connexion SMTP',
            html: '<p>Test de connexion réussi</p>',
            text: 'Test de connexion réussi',
        });

        return testResult.success;
    } catch (error) {
        console.error('❌ Erreur vérification SMTP:', error);
        return false;
    }
}
