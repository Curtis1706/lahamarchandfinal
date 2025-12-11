/**
 * Logger centralisé pour l'application
 * Remplace les console.log par un système de logging structuré
 * 
 * Usage:
 * import { logger } from '@/lib/logger'
 * logger.info('User logged in', { userId: '123' })
 * logger.error('Failed to create order', { error, orderId })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
  context?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  /**
   * Log un message de debug (uniquement en développement)
   */
  debug(message: string, data?: any, context?: string) {
    if (this.isDevelopment) {
      this.log('debug', message, data, context)
    }
  }

  /**
   * Log un message informatif
   */
  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context)
  }

  /**
   * Log un avertissement
   */
  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context)
  }

  /**
   * Log une erreur
   */
  error(message: string, error?: any, context?: string) {
    const errorData = error instanceof Error 
      ? { 
          message: error.message, 
          stack: error.stack,
          name: error.name
        }
      : error

    this.log('error', message, errorData, context)

    // En production, envoyer vers un service de monitoring
    if (this.isProduction) {
      this.sendToMonitoring('error', message, errorData, context)
    }
  }

  /**
   * Méthode interne de logging
   */
  private log(level: LogLevel, message: string, data?: any, context?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context
    }

    // En développement, utiliser console avec couleurs
    if (this.isDevelopment) {
      const color = this.getColor(level)
      const prefix = `[${level.toUpperCase()}]${context ? ` [${context}]` : ''}`
      
      console.log(color, prefix, message)
      if (data) {
        console.log(color, 'Data:', data)
      }
    }

    // En production, logger en JSON pour parsing facile
    if (this.isProduction) {
      console.log(JSON.stringify(entry))
    }
  }

  /**
   * Obtenir la couleur pour le niveau de log
   */
  private getColor(level: LogLevel): string {
    const colors = {
      debug: '\x1b[36m',   // Cyan
      info: '\x1b[32m',    // Green
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m'    // Red
    }
    return colors[level] + '%s\x1b[0m'
  }

  /**
   * Envoyer vers un service de monitoring (Sentry, LogRocket, etc.)
   */
  private sendToMonitoring(
    level: LogLevel, 
    message: string, 
    data?: any, 
    context?: string
  ) {
    // TODO: Implémenter l'intégration avec Sentry ou autre
    // Exemple avec Sentry:
    // if (level === 'error') {
    //   Sentry.captureException(new Error(message), {
    //     extra: { data, context }
    //   })
    // }
  }

  /**
   * Logger une requête API
   */
  apiRequest(method: string, path: string, userId?: string, duration?: number) {
    this.info(`API ${method} ${path}`, {
      method,
      path,
      userId,
      duration: duration ? `${duration}ms` : undefined
    }, 'API')
  }

  /**
   * Logger une réponse API avec erreur
   */
  apiError(method: string, path: string, error: any, userId?: string) {
    this.error(`API ${method} ${path} failed`, {
      method,
      path,
      userId,
      error
    }, 'API')
  }

  /**
   * Logger une action utilisateur
   */
  userAction(action: string, userId: string, data?: any) {
    this.info(`User action: ${action}`, {
      action,
      userId,
      ...data
    }, 'USER')
  }

  /**
   * Logger une opération de base de données
   */
  dbQuery(operation: string, model: string, duration?: number) {
    this.debug(`DB ${operation} on ${model}`, {
      operation,
      model,
      duration: duration ? `${duration}ms` : undefined
    }, 'DB')
  }
}

// Export singleton
export const logger = new Logger()

// Export des helpers pour migration facile
export const logInfo = (message: string, data?: any) => logger.info(message, data)
export const logError = (message: string, error?: any) => logger.error(message, error)
export const logWarn = (message: string, data?: any) => logger.warn(message, data)
export const logDebug = (message: string, data?: any) => logger.debug(message, data)
