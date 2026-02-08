// Simple logger compatible avec Vercel (pas de système de fichiers)
// Utilise uniquement console.log pour éviter les problèmes de permissions

const isProduction = process.env.NODE_ENV === 'production'

// Logger simple basé sur console
export const logger = {
  debug: (...args: unknown[]) => {
    if (!isProduction) {
    }
  },

  info: (...args: unknown[]) => {
  },

  warn: (...args: unknown[]) => {
  },

  error: (...args: unknown[]) => {
    console.error('[ERROR]', new Date().toISOString(), ...args)
  }
}

// Helper pour logger sans données sensibles
export function logUserAction(action: string, userId: string, metadata?: Record<string, unknown>) {
  logger.info(action, {
    userId, // OK - ID seulement
    ...metadata,
    // Ne JAMAIS logger: email, password, phone, name
  })
}

export function logApiRequest(method: string, path: string, userId?: string) {
  logger.debug('API Request', {
    method,
    path,
    userId,
    timestamp: new Date().toISOString(),
  })
}

export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  })
}
