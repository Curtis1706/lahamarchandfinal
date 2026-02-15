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

    const anonymizedPhone = cleanPhone.replace(/(\d{3})\d+(\d{2})/, "$1****$2");
    console.log(`📡 [SMS] Tentative d'envoi à ${anonymizedPhone} (Type: ${displayRole})...`);

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

        const isSuccess = response.ok && (data.status === "success" || data.status === true || data.code === 'SUBMITTED');

        if (isSuccess) {
            console.log(`✅ [SMS] Envoyé avec succès à ${anonymizedPhone} (ID: ${data.messageId || data.message_id || 'N/A'})`);
        } else {
            console.error(`❌ [SMS] Échec de l'envoi à ${anonymizedPhone}. Réponse API:`, data);
        }

        return data;
    } catch (error) {
        console.error(`❌ [SMS] Erreur critique lors de l'envoi à ${anonymizedPhone}:`, error);
        return { status: false, error };
    }
}

/**
 * Envoie un SMS de chaîne de notification (confirmation ou rappel de paiement)
 */
export async function sendNotificationChainSMS(
    phone: string,
    clientName: string,
    amount: number,
    orderId: string,
    dueDate: string,
    notificationType: 'CONFIRMATION' | 'REMINDER'
) {
    const username = process.env.FASTERMESSAGE_USERNAME;
    const apikey = process.env.FASTERMESSAGE_API_KEY;
    const passwordApi = process.env.FASTERMESSAGE_PASSWORD;
    const sender = process.env.FASTERMESSAGE_SENDER || "LAHA";

    if (!username || !apikey || !passwordApi) {
        console.warn("⚠️ Configuration SMS Fastermessage manquante");
        return { status: false, message: "Configuration manquante" };
    }

    // Nettoyer le numéro de téléphone
    let cleanPhone = phone.replace(/[^\d+]/g, '');

    if (!cleanPhone.startsWith('+')) {
        console.warn(`⚠️ Numéro de téléphone sans indicatif (+) détecté : ${cleanPhone}`);
    }

    // Formater la date
    const formattedDate = new Date(dueDate).toLocaleDateString('fr-FR');
    const formattedAmount = amount.toLocaleString('fr-FR');

    // Construire le message selon le type
    let text = '';
    if (notificationType === 'CONFIRMATION') {
        text = `Bonjour ${clientName}, Laha Edition vous confirme la validation de votre commande ${orderId} d'un montant de ${formattedAmount} F CFA. Échéance de paiement : ${formattedDate}. Merci !`;
    } else {
        text = `Bonjour ${clientName}, Laha Edition vous rappelle que l'échéance de paiement des ${formattedAmount} F CFA pour la commande ${orderId} arrive le ${formattedDate}. Merci de bien vouloir régulariser dans les délais.`;
    }

    const anonymizedPhone = cleanPhone.replace(/(\d{3})\d+(\d{2})/, "$1****$2");
    console.log(`📡 [SMS Chaîne] Tentative d'envoi ${notificationType} à ${anonymizedPhone}...`);
    console.log(`💬 [SMS Chaîne] Contenu : "${text}"`);

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

        const isSuccess = response.ok && (data.status === "success" || data.status === true || data.code === 'SUBMITTED');

        if (isSuccess) {
            console.log(`✅ [SMS Chaîne] ${notificationType} envoyé avec succès à ${anonymizedPhone} (ID Message: ${data.messageId || data.message_id || 'N/A'})`);
        } else {
            console.error(`❌ [SMS Chaîne] Échec de l'envoi ${notificationType} à ${anonymizedPhone}. Réponse API:`, JSON.stringify(data));
        }

        return data;
    } catch (error) {
        console.error(`❌ [SMS Chaîne] Erreur critique lors de l'envoi ${notificationType} à ${anonymizedPhone}:`, error);
        return { status: false, error };
    }
}
