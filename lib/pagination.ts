/**
 * Helpers pour la pagination cursor-based
 * 
 * Utilise un cursor (ID) pour paginer efficacement les résultats
 * Plus performant que offset/limit pour les grandes tables
 */

export interface PaginationParams {
  cursor?: string
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
}

/**
 * Extrait les paramètres de pagination depuis les searchParams
 * 
 * @param searchParams - URLSearchParams de la requête
 * @param defaultLimit - Limite par défaut (défaut: 50)
 * @returns Paramètres de pagination
 */
export function getPaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 50
): PaginationParams {
  const cursor = searchParams.get('cursor') || undefined
  const limitParam = searchParams.get('limit')
  const limit = limitParam 
    ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) // Entre 1 et 100
    : defaultLimit

  return {
    cursor,
    limit
  }
}

/**
 * Pagine une requête Prisma avec cursor-based pagination
 * 
 * @param paginationParams - Paramètres de pagination
 * @param query - Objet de requête Prisma (where, include, select, orderBy, etc.)
 * @param model - Modèle Prisma (ex: prisma.stockMovement)
 * @returns Résultats paginés
 */
export async function paginateQuery<T extends { id: string }>(
  paginationParams: PaginationParams,
  query: any,
  model: any
): Promise<PaginatedResult<T>> {
  const { cursor, limit } = paginationParams
  const take = limit + 1
  
  // Ajouter cursor et take à la requête
  const paginatedQuery = {
    ...query,
    cursor: cursor ? { id: cursor } : undefined,
    take,
    skip: cursor ? 1 : 0
  }
  
  const items = await model.findMany(paginatedQuery)
  
  const hasMore = items.length > limit
  const data = hasMore ? items.slice(0, -1) as T[] : items as T[]
  const nextCursor = hasMore && data.length > 0 
    ? data[data.length - 1].id 
    : undefined
  
  return {
    data,
    nextCursor,
    hasMore
  }
}

