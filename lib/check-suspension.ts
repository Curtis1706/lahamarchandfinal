import { prisma } from "@/lib/prisma"

/**
 * Vérifie si un utilisateur est suspendu
 * @param userId - ID de l'utilisateur
 * @returns true si l'utilisateur est suspendu, false sinon
 */
export async function checkUserSuspension(userId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { status: true }
        })

        return user?.status === 'SUSPENDED'
    } catch (error) {
        console.error('Error checking user suspension:', error)
        return false
    }
}

/**
 * Vérifie si un utilisateur est actif (ni suspendu ni inactif)
 * @param userId - ID de l'utilisateur
 * @returns true si l'utilisateur est actif, false sinon
 */
export async function checkUserActive(userId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { status: true }
        })

        return user?.status === 'ACTIVE'
    } catch (error) {
        console.error('Error checking user active status:', error)
        return false
    }
}
