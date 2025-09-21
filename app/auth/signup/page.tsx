"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Eye, EyeOff, Lock } from "lucide-react"
import { CountrySelector } from "@/components/country-selector"
import Link from "next/link"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 w-full max-w-lg lg:max-w-xl shadow-2xl">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-8">Créer un compte</h1>

          <div className="space-y-6">
            {/* Nom complet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input placeholder="Nom complet" className="pl-10 h-12 bg-gray-50 border-0 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="40 74 74 74"
                    className="pl-10 h-12 bg-gray-50 border-0 rounded-xl w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <CountrySelector value={phoneValue} onChange={setPhoneValue} placeholder="06 03 12 34" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type client</label>
                <Select>
                  <SelectTrigger className="h-12 bg-gray-50 border-0 rounded-xl w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particulier">Particulier</SelectItem>
                    <SelectItem value="entreprise">Entreprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                <Select>
                  <SelectTrigger className="h-12 bg-gray-50 border-0 rounded-xl w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="libreville">Libreville</SelectItem>
                    <SelectItem value="port-gentil">Port-Gentil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••"
                    className="pl-10 pr-10 h-12 bg-gray-50 border-0 rounded-xl w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmation de mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmation de mot de passe"
                    className="pl-10 pr-10 h-12 bg-gray-50 border-0 rounded-xl text-gray-400 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bouton Créer un compte */}
            <Button
              className="w-full h-14 text-white font-semibold text-lg rounded-2xl border-0"
              style={{
                background: "linear-gradient(90deg, #00d4ff 0%, #5b9bd5 25%, #8b5fbf 50%, #b83dba 75%, #e91e63 100%)",
              }}
            >
              CRÉER UN COMPTE
            </Button>

            {/* Se connecter */}
            <div className="text-center">
              <Link href="/auth/login" className="text-gray-600 font-medium hover:text-gray-800">
                SE CONNECTER
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2">
          <Link href="/privacy-policy" className="text-white/80 hover:text-white text-sm">
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </div>
  )
}
