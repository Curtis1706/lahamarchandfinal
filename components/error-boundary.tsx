'use client'

import { Component, ReactNode, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

/**
 * Error Boundary pour capturer et afficher les erreurs React
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Logger l'erreur
    console.error('Error caught by boundary:', error)
    console.error('Error info:', errorInfo)

    // En production, envoyer vers un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      // TODO: Intégrer avec Sentry, LogRocket, etc.
      // Sentry.captureException(error, { extra: errorInfo })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      // Si un fallback personnalisé est fourni, l'utiliser
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Sinon, afficher l'UI d'erreur par défaut
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Une erreur est survenue
              </h2>
              <p className="text-gray-600 mb-4">
                Nous sommes désolés, quelque chose s'est mal passé.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                <p className="text-sm font-mono text-red-800 mb-2">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs text-red-600 overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleReset}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
              >
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook pour error boundary avec reset
 */
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null)

  const showError = (error: Error) => {
    setError(error)
  }

  const clearError = () => {
    setError(null)
  }

  return { error, showError, clearError }
}

