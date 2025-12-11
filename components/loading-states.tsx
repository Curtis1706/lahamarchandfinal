/**
 * Composants de loading states réutilisables
 * Améliore la perception de performance
 */

import { cn } from '@/lib/utils'

/**
 * Skeleton pour tableau
 */
export function TableSkeleton({ 
  rows = 5, 
  cols = 6,
  className 
}: { 
  rows?: number
  cols?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex space-x-4 pb-2 border-b">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-4 bg-gray-300 rounded flex-1 animate-pulse" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-8 bg-gray-200 rounded flex-1 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton pour carte statistique
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-white rounded-lg p-6 shadow", className)}>
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-10 bg-gray-300 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  )
}

/**
 * Skeleton pour liste
 */
export function ListSkeleton({ items = 5, className }: { items?: number, className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center space-x-4 p-4 bg-white rounded-lg">
          <div className="w-12 h-12 bg-gray-300 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton pour formulaire
 */
export function FormSkeleton({ fields = 4, className }: { fields?: number, className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-300 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * Spinner générique
 */
export function Spinner({ 
  size = 'md',
  className 
}: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn(
      "animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600",
      sizeClasses[size],
      className
    )} />
  )
}

/**
 * Loading state pour page complète
 */
export function PageLoader({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

/**
 * Loading state pour bouton
 */
export function ButtonLoader({ 
  text = "Chargement...",
  className 
}: { 
  text?: string
  className?: string 
}) {
  return (
    <span className={cn("flex items-center", className)}>
      <Spinner size="sm" className="mr-2" />
      {text}
    </span>
  )
}

