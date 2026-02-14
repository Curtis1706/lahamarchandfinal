"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Eye, EyeOff, Lock } from "lucide-react"
import { CountrySelector } from "@/components/country-selector"
import { SuspensionModal } from "@/components/suspension-modal"
import Link from "next/link"
import { toast } from "sonner"

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")
  const [showPassword, setShowPassword] = useState(false)
  const [phoneValue, setPhoneValue] = useState("")
  const [emailValue, setEmailValue] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuspensionModal, setShowSuspensionModal] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // ÉTAPE 1: Vérifier le statut du compte AVANT la connexion
      const identifier = loginMethod === "email" ? emailValue : phoneValue

      const checkResponse = await fetch('/api/auth/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier }) // On garde la clé 'email' pour la compatibilité API
      })

      if (checkResponse.ok) {
        const checkData = await checkResponse.json()

        // Si le compte est suspendu, afficher la modale
        if (checkData.status === 'SUSPENDED') {
          setShowSuspensionModal(true)
          setIsLoading(false)
          return
        }

        // Si le compte est inactif
        if (checkData.status === 'INACTIVE') {
          toast.error("Votre compte est désactivé")
          setIsLoading(false)
          return
        }
      }

      // ÉTAPE 2: Procéder avec la connexion normale
      // Récupérer le callbackUrl depuis l'URL si présent
      const searchParams = new URLSearchParams(window.location.search)
      const callbackUrl = searchParams.get("callbackUrl") || null

      const result = await signIn("credentials", {
        email: identifier,
        password: password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Email ou mot de passe incorrect")
        setIsLoading(false)
        return
      }

      // Attendre que la session soit mise à jour (plusieurs tentatives)
      let session = null
      let attempts = 0
      const maxAttempts = 10

      while (!session?.user?.role && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200))
        session = await getSession()
        attempts++
      }

      if (session?.user?.role) {
        const role = session.user.role.toUpperCase()
        const validRoles = ['PDG', 'REPRESENTANT', 'PARTENAIRE', 'CONCEPTEUR', 'AUTEUR', 'CLIENT', 'INVITE']

        if (!validRoles.includes(role)) {
          console.error(`❌ Rôle invalide: ${role}`)
          toast.error("Rôle utilisateur invalide")
          setIsLoading(false)
          return
        }

        // Si un callbackUrl est fourni et valide, l'utiliser
        if (callbackUrl && callbackUrl.startsWith('/dashboard/') && !callbackUrl.startsWith('/dashboard/invite')) {
          toast.success("Connexion réussie !")
          router.replace(callbackUrl)
          return
        }

        // Rediriger vers le dashboard approprié selon le rôle
        const dashboardPath = `/dashboard/${role.toLowerCase()}`

        toast.success("Connexion réussie !")
        router.replace(dashboardPath)
      } else {
        console.error("❌ Impossible de récupérer la session après connexion")
        toast.error("Erreur lors de la récupération de la session. Veuillez rafraîchir la page.")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/auth-background.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-8">CONNEXION</h1>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email ou Téléphone */}
            {loginMethod === "email" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="Email"
                    className="pl-10 h-12 bg-gray-50 border-0 rounded-xl"
                    autoComplete="email"
                  />
                </div>
                <div className="text-right mt-2">
                  <button onClick={() => setLoginMethod("phone")} className="text-sm text-gray-500 hover:text-gray-700">
                    Utiliser téléphone pour la connexion
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <CountrySelector value={phoneValue} onChange={setPhoneValue} placeholder="06 03 12 34" />
                <div className="text-right mt-2">
                  <button onClick={() => setLoginMethod("email")} className="text-sm text-gray-500 hover:text-gray-700">
                    Utiliser email pour la connexion
                  </button>
                </div>
              </div>
            )}

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
                  className="pl-10 pr-10 h-12 bg-gray-50 border-0 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link href="/auth/forgot-password" className="text-sm text-gray-500 hover:text-gray-700">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            {/* Bouton Connexion */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-white font-semibold text-lg rounded-2xl border-0"
              style={{
                background: "linear-gradient(90deg, #00d4ff 0%, #5b9bd5 25%, #8b5fbf 50%, #b83dba 75%, #e91e63 100%)",
              }}
            >
              {isLoading ? "CONNEXION..." : "CONNEXION"}
            </Button>

            {/* Créer un compte */}
            <div className="text-center">
              <Link href="/auth/signup" className="text-gray-600 font-medium hover:text-gray-800">
                CRÉER UN COMPTE
              </Link>
            </div>
          </form>
        </div>

        {/* Politique de confidentialité */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <Link href="/privacy-policy" className="text-white/80 hover:text-white text-sm">
            Politique de confidentialité
          </Link>
        </div>
      </div>

      {/* Modale de suspension */}
      <SuspensionModal
        isOpen={showSuspensionModal}
        onClose={() => setShowSuspensionModal(false)}
      />
    </div>
  )
}
