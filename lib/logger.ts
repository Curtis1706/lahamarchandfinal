import winston from 'winston'

const isProduction = process.env.NODE_ENV === 'production'

// Format personnalisé
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Créer logger
export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: { service: 'laha-marchand' },
  transports: [
    // Fichier pour erreurs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Fichier pour tout
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
})

// Console en développement uniquement
if (!isProduction) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

// Helper pour logger sans données sensibles
export function logUserAction(action: string, userId: string, metadata?: Record<string, any>) {
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

export function logError(error: Error, context?: Record<string, any>) {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  })
}
