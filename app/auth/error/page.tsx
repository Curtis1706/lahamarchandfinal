"use client"

import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home, ArrowLeft } from "lucide-react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return {
          title: "Erreur de configuration",
          message: "Il y a un problème avec la configuration du serveur. Veuillez contacter l'administrateur.",
        }
      case "AccessDenied":
        return {
          title: "Accès refusé",
          message: "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
        }
      case "Verification":
        return {
          title: "Erreur de vérification",
          message: "Le lien de vérification a expiré ou n'est plus valide. Veuillez réessayer.",
        }
      case "Default":
      default:
        return {
          title: "Erreur d'authentification",
          message: "Une erreur est survenue lors de l'authentification. Veuillez réessayer.",
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Error Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-4">
              {errorInfo.title}
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 text-center mb-8 leading-relaxed">
              {errorInfo.message}
            </p>

            {/* Error Code (if available) */}
            {error && (
              <div className="bg-gray-100 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-500 text-center">
                  Code d'erreur: <span className="font-mono font-semibold">{error}</span>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full h-12 text-white font-semibold rounded-xl border-0"
                style={{
                  background: "linear-gradient(90deg, #00d4ff 0%, #5b9bd5 25%, #8b5fbf 50%, #b83dba 75%, #e91e63 100%)",
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full h-12 font-semibold rounded-xl border-2 border-gray-300 hover:border-gray-400"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Si le problème persiste, veuillez{" "}
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                  créer un compte
                </Link>
                {" "}ou contacter le support.
              </p>
            </div>
          </div>

          {/* Privacy Policy Link */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <Link href="/privacy-policy" className="text-white/80 hover:text-white text-sm">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}>
        <div className="text-white text-xl">Chargement...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}

