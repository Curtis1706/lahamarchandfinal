"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Eye, EyeOff, Lock } from "lucide-react"
import { CountrySelector } from "@/components/country-selector"
import Link from "next/link"

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")
  const [showPassword, setShowPassword] = useState(false)
  const [phoneValue, setPhoneValue] = useState("")
  const [emailValue, setEmailValue] = useState("")

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

          <div className="space-y-6">
            {/* Email ou Téléphone */}
            {loginMethod === "email" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="Email"
                    className="pl-10 h-12 bg-gray-50 border-0 rounded-xl"
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
              className="w-full h-14 text-white font-semibold text-lg rounded-2xl border-0"
              style={{
                background: "linear-gradient(90deg, #00d4ff 0%, #5b9bd5 25%, #8b5fbf 50%, #b83dba 75%, #e91e63 100%)",
              }}
            >
              CONNEXION
            </Button>

            {/* Créer un compte */}
            <div className="text-center">
              <Link href="/auth/signup" className="text-gray-600 font-medium hover:text-gray-800">
                CRÉER UN COMPTE
              </Link>
            </div>
          </div>
        </div>

        {/* Politique de confidentialité */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <Link href="/privacy-policy" className="text-white/80 hover:text-white text-sm">
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </div>
  )
}
