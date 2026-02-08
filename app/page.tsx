"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Attendre que le statut soit déterminé
    if (status === "loading") {
      return
    }
    
    // Par défaut, rediriger vers la page de connexion si pas authentifié
    // Ne rediriger vers le dashboard QUE si on est certain que l'utilisateur est authentifié
    if (status === "unauthenticated") {
            router.replace("/auth/login")
      return
    }
    
    // Vérifier strictement l'authentification
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

  // Toujours afficher un loader pendant la vérification et la redirection
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-gray-500">Redirection en cours...</p>
      </div>
    </div>
  )
}
