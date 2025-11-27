"use client"

import { useGuest } from "@/hooks/use-guest"
import { Button } from "@/components/ui/button"
import { X, LogIn, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function GuestBanner() {
  const { isGuest } = useGuest()
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  if (!isGuest || dismissed) {
    return null
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Vous naviguez en mode invité</span>
              {" - "}
              <span className="text-blue-700">
                Fonctionnalités limitées. Créez un compte pour accéder à toutes les fonctionnalités.
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/auth/login")}
            className="bg-white hover:bg-blue-50"
          >
            <LogIn className="w-4 h-4 mr-1" />
            Se connecter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/auth/signup")}
            className="bg-white hover:bg-blue-50"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Créer un compte
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-blue-700 hover:text-blue-900"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

