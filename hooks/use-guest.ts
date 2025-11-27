"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { GUEST_ROLE, isGuestRole } from "@/lib/guest"

export interface GuestState {
  isGuest: boolean
  isAuthenticated: boolean
  role: string | null
  userId: string | null
}

/**
 * Hook pour gérer l'état du mode invité
 */
export function useGuest() {
  const { data: session, status } = useSession()
  const [guestState, setGuestState] = useState<GuestState>({
    isGuest: true,
    isAuthenticated: false,
    role: null,
    userId: null
  })

  useEffect(() => {
    if (status === "loading") {
      return
    }

    if (session?.user) {
      setGuestState({
        isGuest: false,
        isAuthenticated: true,
        role: session.user.role || null,
        userId: session.user.id || null
      })
    } else {
      // Pas de session = mode invité
      setGuestState({
        isGuest: true,
        isAuthenticated: false,
        role: GUEST_ROLE,
        userId: null
      })
    }
  }, [session, status])

  return guestState
}

/**
 * Hook pour activer le mode invité
 */
export function useGuestMode() {
  const router = useRouter()
  const { isGuest } = useGuest()

  const enableGuestMode = () => {
    // Le mode invité est activé automatiquement si pas de session
    // On peut juste rediriger vers la page d'accueil
    router.push("/")
  }

  const requireAuth = (callbackUrl?: string) => {
    const loginUrl = "/auth/login"
    if (callbackUrl) {
      router.push(`${loginUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    } else {
      router.push(loginUrl)
    }
  }

  return {
    isGuest,
    enableGuestMode,
    requireAuth
  }
}

