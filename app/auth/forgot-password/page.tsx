"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CountrySelector } from "@/components/country-selector"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [resetMethod, setResetMethod] = useState<"phone" | "email">("phone")
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
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md shadow-2xl">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-8">RÉINITIALISATION</h1>

          <div className="space-y-6">
            {/* Téléphone ou Email */}
            {resetMethod === "phone" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <CountrySelector value={phoneValue} onChange={setPhoneValue} placeholder="Téléphone" />
                <div className="text-right mt-2">
                  <button onClick={() => setResetMethod("email")} className="text-sm text-gray-500 hover:text-gray-700">
                    Utiliser email pour la réinitialisation
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="Email"
                    className="w-full h-12 bg-gray-50 border-0 rounded-xl px-4 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="text-right mt-2">
                  <button onClick={() => setResetMethod("phone")} className="text-sm text-gray-500 hover:text-gray-700">
                    Utiliser téléphone pour la réinitialisation
                  </button>
                </div>
              </div>
            )}

            {/* Bouton Réinitialiser */}
            <Button
              className="w-full h-14 text-white font-semibold text-lg rounded-2xl border-0"
              style={{
                background: "linear-gradient(90deg, #00d4ff 0%, #5b9bd5 25%, #8b5fbf 50%, #b83dba 75%, #e91e63 100%)",
              }}
            >
              RÉINITIALISER
            </Button>

            {/* Se connecter */}
            <div className="text-center">
              <Link href="/auth/login" className="text-gray-600 font-medium hover:text-gray-800">
                SE CONNECTER
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
