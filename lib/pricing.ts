import { prisma } from "./prisma";
import { ClientType } from "@prisma/client";

/**
 * Récupère le prix applicable pour un livre selon le type de client.
 * Si aucun prix spécifique n'est trouvé, retourne le prix par défaut du livre.
 */
export async function getWorkPrice(workId: string, clientType?: ClientType | null): Promise<number> {
    // 1. Si pas de type de client spécifié, on utilise INDIVIDUAL par défaut pour les visiteurs
    const effectiveClientType = clientType || ClientType.particulier;

    // 2. Chercher le prix spécifique dans WorkPrice
    const workPrice = await prisma.workPrice.findUnique({
        where: {
            workId_clientType: {
                workId,
                clientType: effectiveClientType,
            },
        },
    });

    if (workPrice) {
        return workPrice.price;
    }

    // 3. Fallback sur le prix par défaut dans le modèle Work
    const work = await prisma.work.findUnique({
        where: { id: workId },
        select: { price: true },
    });

    return work?.price || 0;
}

/**
 * Récupère tous les prix d'un livre (pour affichage admin/PDG)
 */
export async function getAllWorkPrices(workId: string) {
    const prices = await prisma.workPrice.findMany({
        where: { workId },
    });

    return prices;
}

/**
 * Valide si une commande respecte les minima du type de client
 */
export async function validateOrderMinima(clientType: ClientType, totalQuantity: number, totalAmount: number): Promise<{ valid: boolean; error?: string }> {
    const config = await prisma.clientTypeConfig.findUnique({
        where: { clientType },
    });

    if (!config) return { valid: true };

    if (totalQuantity < config.minimumOrderQuantity) {
        return {
            valid: false,
            error: `La quantité minimale pour votre compte est de ${config.minimumOrderQuantity} livres.`,
        };
    }

    if (totalAmount < config.minimumOrderAmount) {
        return {
            valid: false,
            error: `Le montant minimal pour votre compte est de ${config.minimumOrderAmount.toLocaleString()} F CFA.`,
        };
    }

    return { valid: true };
}
