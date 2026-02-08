"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Attendre que le statut soit déterminé
    if (status === "loading") {
      return
    }

    // Si l'utilisateur n'est pas connecté, rediriger immédiatement vers la page de connexion
    if (status === "unauthenticated") {
            router.replace("/auth/login")
      return
    }

    // Vérifier strictement l'authentification et le rôle
    if (status === "authenticated" && session?.user?.role) {
      const validRoles = ['PDG', 'REPRESENTANT', 'PARTENAIRE', 'CONCEPTEUR', 'AUTEUR', 'CLIENT', 'INVITE']
      if (validRoles.includes(session.user.role)) {
        const role = session.user.role.toLowerCase()
                router.replace(`/dashboard/${role}`)
        return
      }
    }

    // Si on arrive ici, rediriger vers login par sécurité
        router.replace("/auth/login")
  }, [status, session, router])

  // Afficher un loader pendant la vérification
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-gray-500">Redirection en cours...</p>
      </div>
    </div>
  )
}

