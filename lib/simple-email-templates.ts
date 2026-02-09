/**
 * Templates d'emails pour l'OTP
 * Design simple, professionnel et responsive
 */

interface OTPEmailParams {
    otp: string;
    email: string;
    expiryMinutes?: number;
}

/**
 * Template email OTP - Version finale et optimisée
 */
export function getOTPEmailHTML(params: OTPEmailParams): string {
    const { otp, email, expiryMinutes = 10 } = params;

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de vérification - Laha Marchand</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        
        <!-- Conteneur principal -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- En-tête avec dégradé -->
          <tr>
            <td align="center" style="padding:40px 30px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:bold;">🔐</h1>
              <h2 style="margin:10px 0 0;color:#ffffff;font-size:24px;font-weight:600;">Laha Marchand</h2>
            </td>
          </tr>
          
          <!-- Contenu -->
          <tr>
            <td style="padding:40px 30px;">
              
              <h3 style="margin:0 0 20px;color:#333;font-size:22px;font-weight:600;">Code de vérification</h3>
              
              <p style="margin:0 0 30px;color:#666;font-size:16px;line-height:1.6;">
                Bonjour,<br><br>
                Voici votre code de vérification pour créer votre compte Laha Marchand :
              </p>
              
              <!-- Code OTP -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:30px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;padding:30px 40px;">
                      <tr>
                        <td align="center">
                          <p style="margin:0 0 10px;color:#ffffff;font-size:14px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
                            VOTRE CODE
                          </p>
                          <p style="margin:0;color:#ffffff;font-size:42px;font-weight:bold;letter-spacing:10px;font-family:Courier,monospace;">
                            ${otp}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Instructions -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa;border-left:4px solid #667eea;border-radius:6px;margin:30px 0;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;color:#333;font-size:14px;font-weight:600;">⏱️ Informations importantes :</p>
                    <ul style="margin:0;padding-left:20px;color:#666;font-size:14px;line-height:1.8;">
                      <li>Ce code expire dans <strong>${expiryMinutes} minutes</strong></li>
                      <li>Ne partagez jamais ce code</li>
                      <li>Si vous n'avez pas demandé ce code, ignorez cet email</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <!-- Note de sécurité -->
              <p style="margin:20px 0 0;color:#999;font-size:13px;line-height:1.5;">
                Cet email a été envoyé à <strong>${email}</strong>. Si vous n'avez pas initié cette demande, veuillez ignorer ce message.
              </p>
              
            </td>
          </tr>
          
          <!-- Pied de page -->
          <tr>
            <td align="center" style="padding:30px;background-color:#f8f9fa;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 10px;color:#666;font-size:14px;font-weight:600;">Laha Marchand</p>
              <p style="margin:0 0 15px;color:#999;font-size:12px;">© ${new Date().getFullYear()} Tous droits réservés</p>
              <p style="margin:0;color:#999;font-size:12px;">
                <a href="mailto:hello@lahagabon.com" style="color:#667eea;text-decoration:none;">hello@lahagabon.com</a>
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Version texte brut de l'email OTP (fallback)
 */
export function getOTPEmailText(params: OTPEmailParams): string {
    const { otp, email, expiryMinutes = 10 } = params;

    return `LAHA MARCHAND - Code de vérification

Bonjour,

Voici votre code de vérification pour créer votre compte :

${otp}

IMPORTANT :
- Ce code expire dans ${expiryMinutes} minutes
- Ne partagez jamais ce code avec personne
- Si vous n'avez pas demandé ce code, ignorez cet email

Cet email a été envoyé à ${email}.

---
Laha Marchand © ${new Date().getFullYear()}
hello@lahagabon.com`;
}

/**
 * Template email de bienvenue (après vérification OTP)
 */
export function getWelcomeEmailHTML(userName: string, email: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue - Laha Marchand</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- En-tête -->
          <tr>
            <td align="center" style="padding:40px 30px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:48px;">🎉</h1>
              <h2 style="margin:15px 0 0;color:#ffffff;font-size:26px;font-weight:600;">Bienvenue sur Laha Marchand !</h2>
            </td>
          </tr>
          
          <!-- Contenu -->
          <tr>
            <td style="padding:40px 30px;">
              
              <p style="margin:0 0 20px;color:#333;font-size:18px;">
                Bonjour <strong>${userName}</strong> ! 👋
              </p>
              
              <p style="margin:0 0 30px;color:#666;font-size:16px;line-height:1.6;">
                Votre compte a été créé avec succès. Nous sommes ravis de vous compter parmi nous !
              </p>
              
              <p style="margin:0 0 10px;color:#666;font-size:15px;line-height:1.6;">
                Votre email de connexion : <strong>${email}</strong>
              </p>
              
              <!-- Bouton CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                      Accéder à mon compte
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin:30px 0 0;color:#999;font-size:13px;text-align:center;">
                Des questions ? Contactez-nous à hello@lahagabon.com
              </p>
              
            </td>
          </tr>
          
          <!-- Pied de page -->
          <tr>
            <td align="center" style="padding:30px;background-color:#f8f9fa;border-radius:0 0 12px 12px;">
              <p style="margin:0;color:#999;font-size:12px;">© ${new Date().getFullYear()} Laha Marchand - Tous droits réservés</p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Version texte de l'email de bienvenue
 */
export function getWelcomeEmailText(userName: string, email: string): string {
    return `LAHA MARCHAND - Bienvenue !

Bonjour ${userName} !

Votre compte a été créé avec succès. Nous sommes ravis de vous compter parmi nous !

Votre email de connexion : ${email}

Connectez-vous sur : ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin

Des questions ? Contactez-nous à hello@lahagabon.com

---
Laha Marchand © ${new Date().getFullYear()}`;
}
