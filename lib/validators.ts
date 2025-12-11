/**
 * Validateurs centralisés pour les entrées utilisateur
 * Assure la sécurité et la cohérence des données
 */

import { OrderStatus, PaymentType, PaymentStatus, DeliveryStatus } from "@prisma/client"

// ============================================
// VALIDATION DE PAGINATION
// ============================================

export interface PaginationParams {
  limit: number
  offset: number
  page?: number
}

export function validatePagination(params: URLSearchParams): PaginationParams {
  const rawLimit = params.get('limit')
  const rawOffset = params.get('offset')
  const rawPage = params.get('page')

  // Limiter entre 1 et 100
  const limit = Math.min(100, Math.max(1, parseInt(rawLimit || '10') || 10))
  
  // Offset ne peut pas être négatif
  const offset = Math.max(0, parseInt(rawOffset || '0') || 0)
  
  // Page commence à 1
  const page = rawPage ? Math.max(1, parseInt(rawPage)) : undefined

  return { limit, offset, page }
}

// ============================================
// VALIDATION DES STATUTS
// ============================================

const VALID_ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'VALIDATED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
]

const VALID_PAYMENT_TYPES: PaymentType[] = [
  'CASH',
  'DEPOSIT',
  'CREDIT'
]

const VALID_PAYMENT_STATUSES: PaymentStatus[] = [
  'UNPAID',
  'PARTIAL',
  'PAID',
  'OVERDUE',
  'CANCELLED'
]

const VALID_DELIVERY_STATUSES: DeliveryStatus[] = [
  'PENDING',
  'PREPARING',
  'READY',
  'IN_TRANSIT',
  'DELIVERED',
  'RECEIVED',
  'FAILED'
]

export function validateOrderStatus(status: string): OrderStatus | null {
  const upperStatus = status.toUpperCase()
  return VALID_ORDER_STATUSES.includes(upperStatus as OrderStatus)
    ? (upperStatus as OrderStatus)
    : null
}

export function validatePaymentType(type: string): PaymentType | null {
  const upperType = type.toUpperCase()
  return VALID_PAYMENT_TYPES.includes(upperType as PaymentType)
    ? (upperType as PaymentType)
    : null
}

export function validatePaymentStatus(status: string): PaymentStatus | null {
  const upperStatus = status.toUpperCase()
  return VALID_PAYMENT_STATUSES.includes(upperStatus as PaymentStatus)
    ? (upperStatus as PaymentStatus)
    : null
}

export function validateDeliveryStatus(status: string): DeliveryStatus | null {
  const upperStatus = status.toUpperCase()
  return VALID_DELIVERY_STATUSES.includes(upperStatus as DeliveryStatus)
    ? (upperStatus as DeliveryStatus)
    : null
}

// ============================================
// VALIDATION DES MONTANTS
// ============================================

export function validateAmount(amount: any): number | null {
  const parsed = parseFloat(amount)
  if (isNaN(parsed) || parsed < 0) {
    return null
  }
  return parsed
}

export function validatePositiveInteger(value: any): number | null {
  const parsed = parseInt(value)
  if (isNaN(parsed) || parsed < 0) {
    return null
  }
  return parsed
}

// ============================================
// VALIDATION DES DATES
// ============================================

export function validateDate(dateString: string): Date | null {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return null
    }
    return date
  } catch {
    return null
  }
}

export function validateDateRange(startDate: string, endDate: string): { start: Date, end: Date } | null {
  const start = validateDate(startDate)
  const end = validateDate(endDate)
  
  if (!start || !end) {
    return null
  }
  
  if (start > end) {
    return null
  }
  
  return { start, end }
}

// ============================================
// VALIDATION DES EMAILS
// ============================================

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ============================================
// VALIDATION DES TÉLÉPHONES
// ============================================

export function validatePhone(phone: string): boolean {
  // Format accepté: +xxx xxx xxx xxx ou xxx xxx xxx xxx
  const phoneRegex = /^\+?[0-9\s]{8,20}$/
  return phoneRegex.test(phone.trim())
}

// ============================================
// VALIDATION DES ISBN
// ============================================

export function validateISBN(isbn: string): boolean {
  // ISBN-10 ou ISBN-13
  const cleanISBN = isbn.replace(/[-\s]/g, '')
  return cleanISBN.length === 10 || cleanISBN.length === 13
}

// ============================================
// SANITIZATION
// ============================================

export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength)
}

export function sanitizeSearchTerm(term: string): string {
  // Enlever les caractères spéciaux SQL dangereux
  return term.trim().replace(/[;'"\\]/g, '')
}

// ============================================
// VALIDATION COMPLÈTE D'UNE COMMANDE
// ============================================

export interface OrderValidation {
  valid: boolean
  errors: string[]
}

export function validateOrderData(data: {
  userId?: string
  items?: any[]
  total?: number
  paymentType?: string
}): OrderValidation {
  const errors: string[] = []

  if (!data.userId || data.userId.trim().length === 0) {
    errors.push("ID utilisateur requis")
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push("Au moins un article est requis")
  }

  if (data.items) {
    data.items.forEach((item, index) => {
      if (!item.workId) {
        errors.push(`Article ${index + 1}: ID œuvre manquant`)
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Article ${index + 1}: Quantité invalide`)
      }
    })
  }

  if (data.total !== undefined && (isNaN(data.total) || data.total < 0)) {
    errors.push("Montant total invalide")
  }

  if (data.paymentType && !validatePaymentType(data.paymentType)) {
    errors.push("Type de paiement invalide")
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================
// UTILITAIRES
// ============================================

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function isValidId(id: string): boolean {
  // Vérifier format CUID (commence généralement par 'c')
  return id.length >= 20 && id.length <= 30
}

