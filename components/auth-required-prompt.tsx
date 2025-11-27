"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface AuthRequiredPromptProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  callbackUrl?: string
}

export function AuthRequiredPrompt({
  open,
  onClose,
  title = "Authentification requise",
  description = "Cette action nécessite un compte. Voulez-vous vous connecter ou créer un compte ?",
  callbackUrl
}: AuthRequiredPromptProps) {
  const router = useRouter()

  const handleLogin = () => {
    const loginUrl = "/auth/login"
    if (callbackUrl) {
      router.push(`${loginUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    } else {
      router.push(loginUrl)
    }
    onClose()
  }

  const handleSignup = () => {
    const signupUrl = "/auth/signup"
    if (callbackUrl) {
      router.push(`${signupUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    } else {
      router.push(signupUrl)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleLogin}
            className="w-full sm:w-auto"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Se connecter
          </Button>
          <Button
            variant="default"
            onClick={handleSignup}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Créer un compte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

