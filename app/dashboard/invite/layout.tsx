"use client"

import { ReactNode } from "react"
import { useGuest } from "@/hooks/use-guest"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

export default function InviteLayout({ children }: { children: ReactNode }) {
  const { isGuest } = useGuest()
  const { user } = useCurrentUser()
  const router = useRouter()
  const redirectDone = useRef(false)

  useEffect(() => {
    // Ne rediriger qu'une seule fois
    if (redirectDone.current) return
    
    // Si l'utilisateur est connecté avec un rôle INVITE, le laisser accéder
    if (user && user.role === 'INVITE') {
      redirectDone.current = true
      return // Laisser l'utilisateur INVITE accéder à son dashboard
    }
    
    // Si l'utilisateur est connecté avec un autre rôle, rediriger vers son dashboard
    if (!isGuest && user && user.role !== 'INVITE') {
      redirectDone.current = true
      const role = user.role.toLowerCase()
      setTimeout(() => {
        router.replace(`/dashboard/${role}`)
      }, 100)
    }
  }, [isGuest, user, router])

  // Si l'utilisateur s'est connecté avec un autre rôle, afficher un loader pendant la redirection
  if (!isGuest && user && user.role !== 'INVITE' && redirectDone.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-gray-500">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  // Afficher le contenu pour les invités (non authentifiés) et les utilisateurs avec rôle INVITE
  return <>{children}</>
}

