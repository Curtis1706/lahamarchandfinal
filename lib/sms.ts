/**
 * Génère un mot de passe aléatoire sécurisé (alphanumérique)
 */
export function generateRandomPassword(length: number = 8): string {
    const charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Caractères lisibles (sans l, 1, 0, O)
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

/**
 * Envoie les identifiants par SMS via l'API Fastermessage
 */
export async function sendCredentialsSMS(phone: string, password: string, role: string, clientType?: string) {
    const username = process.env.FASTERMESSAGE_USERNAME;
    const apikey = process.env.FASTERMESSAGE_API_KEY;
    const passwordApi = process.env.FASTERMESSAGE_PASSWORD;
    const sender = process.env.FASTERMESSAGE_SENDER || "LAHA";

    if (!username || !apikey || !passwordApi) {
        console.warn("⚠️ Configuration SMS Fastermessage manquante");
        return { status: false, message: "Configuration manquante" };
    }

    // Nettoyer le numéro de téléphone (enlever les espaces et caractères non numériques sauf +)
    let cleanPhone = phone.replace(/[^\d+]/g, '');

    // Sécurité: si le numéro ne commence pas par +, on suppose un numéro local 
    // ou un numéro où l'indicatif a été mal saisi (cas rare avec le nouveau sélecteur)
    if (!cleanPhone.startsWith('+')) {
        // Optionnel: On pourrait injecter l'indicatif par défaut ici si besoin
        // Mais avec le sélecteur corrigé, cleanPhone devrait déjà être "+229XXX"
        console.warn(`⚠️ Numéro de téléphone sans indicatif (+) détecté : ${cleanPhone}`);
    }

    // Construction du rôle à afficher
    let displayRole = role.toLowerCase();
    if (role === 'CLIENT' && clientType) {
        // Formater le type de client pour l'affichage (ex: "ecole_contractuelle" -> "école contractuelle")
        const formattedType = clientType.replace(/_/g, ' ').replace('ecole', 'école');
        displayRole = `client (${formattedType})`;
    }

    const text = `Bienvenue ! Vous avez été ajouté en tant que ${displayRole} sur LAHA Marchand Gabon.\n\nVos identifiants :\nNuméro : ${cleanPhone}\nMot de passe : ${password}`;

    if (process.env.NODE_ENV === 'development') {
        const anonymizedPhone = cleanPhone.replace(/(\d{3})\d+(\d{2})/, "$1****$2");
        console.log(`📡 Tentative d'envoi SMS à ${anonymizedPhone} via Fastermessage...`);
    }

    try {
        const response = await fetch("https://api.fastermessage.com/v1/sms/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                apikey,
                password: passwordApi,
                from: sender,
                to: cleanPhone,
                text: text,
            }),
        });

        const data = await response.json();

        if (process.env.NODE_ENV === 'development') {
            console.log("📨 Résultat envoi SMS Fastermessage:", data);
        }

        return data;
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi du SMS Fastermessage:", error);
        return { status: false, error };
    }
}
