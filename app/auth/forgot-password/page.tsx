"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "otp" | "password">("email")
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Étape 1 : Envoyer OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error("Veuillez entrer votre email")
    
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success("Code envoyé avec succès !")
        setStep("otp")
      } else {
        toast.error(data.error || "Erreur lors de l'envoi")
      }
    } catch (err) {
      toast.error("Erreur réseau")
    } finally {
      setIsLoading(false)
    }
  }

  // Étape 2 : Vérifier et Changer Mot de Passe (Tout en un appel final ou séparé si l'API le permet)
  // Ici nous avons fait une API "verify-and-reset" qui prend tout d'un coup.
  // Donc à l'étape OTP, on vérifie juste visuellement que c'est rempli, puis on passe au mot de passe.
  // Ou on peut vérifier le code avant. Pour simplifier/sécuriser, on demande le code ET le mot de passe à la fin.
  // Mais pour une meilleur UX, validons le passage à l'étape 3.
  const handleValidateCode = () => {
    if (otpCode.length !== 6) return toast.error("Le code doit faire 6 chiffres")
    setStep("password")
  }

  // Étape 3 : Réinitialiser
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) return toast.error("Les mots de passe ne correspondent pas")
    if (newPassword.length < 6) return toast.error("Le mot de passe est trop court")

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password/verify-and-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode, newPassword }) // On envoie l'email gardé en mémoire
      })
      const data = await res.json()

      if (res.ok) {
        toast.success("Mot de passe modifié avec succès !")
        setTimeout(() => router.push("/auth/login"), 2000)
      } else {
        toast.error(data.error || "Erreur lors de la réinitialisation")
        if (data.error?.includes("Code")) setStep("otp") // Retour au code si invalide
      }
    } catch (err) {
      toast.error("Erreur réseau")
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
      }}
    >
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 w-full max-w-md shadow-2xl transition-all duration-300">
          
          <div className="flex justify-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              step === "password" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
            }`}>
              {step === "email" && <Lock className="w-8 h-8" />}
              {step === "otp" && <ArrowLeft className="w-8 h-8" />}
              {step === "password" && <CheckCircle2 className="w-8 h-8" />}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
            {step === "email" && "Mot de passe oublié ?"}
            {step === "otp" && "Vérification"}
            {step === "password" && "Nouveau mot de passe"}
          </h1>
          
          <p className="text-center text-gray-500 mb-8 text-sm">
            {step === "email" && "Entrez votre email pour recevoir un code de réinitialisation."}
            {step === "otp" && `Un code a été envoyé à ${email}`}
            {step === "password" && "Choisissez votre nouveau mot de passe sécurisé."}
          </p>

          {/* ÉTAPE 1 : EMAIL */}
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="h-14 text-lg bg-gray-50 border-gray-200 rounded-xl"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-white font-semibold text-lg rounded-2xl border-0"
                style={{ background: "linear-gradient(90deg, #00d4ff 0%, #007cf0 100%)" }}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "ENVOYER LE CODE"}
              </Button>
            </form>
          )}

          {/* ÉTAPE 2 : OTP */}
          {step === "otp" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-3xl font-bold tracking-[1em] h-20 w-full bg-white border-2 border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all"
                autoFocus
              />
              <Button
                onClick={handleValidateCode}
                className="w-full h-14 text-white font-semibold text-lg rounded-2xl border-0"
                style={{ background: "linear-gradient(90deg, #00d4ff 0%, #007cf0 100%)" }}
              >
                VALIDER LE CODE
              </Button>
              <button 
                onClick={() => setStep("email")}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600"
              >
                Mauvais email ? Retour
              </button>
            </div>
          )}

          {/* ÉTAPE 3 : NOUVEAU MOT DE PASSE */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-14 pr-10 bg-gray-50 border-gray-200 rounded-xl"
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-4 text-gray-400">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <Input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-14 bg-gray-50 border-gray-200 rounded-xl"
                required
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-white font-semibold text-lg rounded-2xl border-0 shadow-lg shadow-green-500/30"
                style={{ background: "linear-gradient(90deg, #10b981 0%, #059669 100%)" }}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "CHANGER LE MOT DE PASSE"}
              </Button>
            </form>
          )}

          {step === "email" && (
            <div className="text-center mt-8">
              <Link href="/auth/login" className="text-gray-500 font-medium hover:text-gray-900 inline-flex items-center gap-2 transition-colors">
                <ArrowLeft size={16} /> Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
