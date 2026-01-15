import redis from './redis'

export interface CacheOptions {
  ttl?: number // Time to live en secondes (défaut: 300 = 5min)
  namespace?: string // Préfixe pour les clés
}

export interface PaginatedResult<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
}

/**
 * Cache wrapper générique
 * @param key - Clé de cache unique
 * @param fetchFn - Fonction async pour récupérer les données si cache miss
 * @param options - TTL et namespace
 */
export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300, namespace = 'app' } = options
  const cacheKey = `${namespace}:${key}`
  
  try {
    // 1. Essayer de récupérer depuis le cache
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Cache HIT: ${cacheKey}`)
      }
      return JSON.parse(cached) as T
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`❌ Cache MISS: ${cacheKey}`)
    }
    
    // 2. Cache miss → exécuter la fonction
    const data = await fetchFn()
    
    // 3. Mettre en cache avec TTL
    await redis.setex(cacheKey, ttl, JSON.stringify(data))
    
    return data
  } catch (error) {
    console.error(`⚠️  Cache error for ${cacheKey}:`, error)
    // En cas d'erreur Redis, exécuter quand même la fonction (fallback)
    return fetchFn()
  }
}

/**
 * Invalider le cache pour une clé
 */
export async function invalidateCache(
  key: string,
  namespace: string = 'app'
): Promise<void> {
  const cacheKey = `${namespace}:${key}`
  try {
    await redis.del(cacheKey)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️  Cache invalidated: ${cacheKey}`)
    }
  } catch (error) {
    console.error(`⚠️  Error invalidating cache ${cacheKey}:`, error)
  }
}

/**
 * Invalider le cache pour un pattern (ex: tous les rapports)
 */
export async function invalidateCachePattern(
  pattern: string,
  namespace: string = 'app'
): Promise<void> {
  const cachePattern = `${namespace}:${pattern}`
  try {
    const keys = await redis.keys(cachePattern)
    
    if (keys.length > 0) {
      await redis.del(...keys)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️  Cache invalidated: ${keys.length} keys matching ${cachePattern}`)
      }
    }
  } catch (error) {
    console.error(`⚠️  Error invalidating cache pattern ${cachePattern}:`, error)
  }
}

/**
 * Récupérer les stats du cache
 */
export async function getCacheStats() {
  try {
    const info = await redis.info('stats')
    const dbSize = await redis.dbsize()
    
    return {
      totalKeys: dbSize,
      info: info,
    }
  } catch (error) {
    console.error('⚠️  Error getting cache stats:', error)
    return {
      totalKeys: 0,
      info: null,
    }
  }
}

/**
 * Vérifier si Redis est disponible
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch {
    return false
  }
}
