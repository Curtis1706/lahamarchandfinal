"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Eye, EyeOff, Lock, Mail, BookOpen, Users, Briefcase, Phone, ArrowLeft, Timer, CheckCircle2 } from "lucide-react"
import { CountrySelector } from "@/components/country-selector"
import { SuspensionModal } from "@/components/suspension-modal"
import Link from "next/link"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { useDisciplines } from "@/hooks/use-disciplines"
import { useDepartments } from "@/hooks/use-departments"
import { OTPInput } from "@/components/otp-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CLIENT_TYPE_LABELS, CLIENT_TYPES } from "@/lib/constants/labels"

export default function SignupPage() {
  const router = useRouter()
  const { disciplines } = useDisciplines()
  const { departments } = useDepartments()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // OTP States
  const [otpStep, setOtpStep] = useState<'form' | 'otp'>('form')
  const [otpCode, setOtpCode] = useState("")
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [isSendingOTP, setIsSendingOTP] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
    disciplineId: "",
    departmentId: "",
    clientType: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Countdown timer for OTP
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => {
        setOtpCountdown(otpCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [otpCountdown])

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.role || !formData.departmentId) {
      toast.error("Veuillez remplir tous les champs obligatoires (y compris votre département)")
      return false
    }

    if (formData.role === 'CLIENT' && !formData.clientType) {
      toast.error("Veuillez sélectionner votre type de compte client")
      return false
    }

    // La discipline est désormais optionnelle à l'inscription et sera attribuée plus tard par l'admin

    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas")
      return false
    }

    // Validation téléphone (simple check si non vide, le sélecteur aide au format)
    if (!formData.phone || formData.phone.length < 4) {
      toast.error("Veuillez entrer un numéro de téléphone valide")
      return false
    }

    return true
  }

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!validateForm()) return

    setIsSendingOTP(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.name })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi du code")
      }

      toast.success("Code de vérification envoyé à " + formData.email)
      setOtpStep('otp')
      setOtpCountdown(60) // 60 secondes avant de pouvoir renvoyer
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSendingOTP(false)
    }
  }

  const handleSignup = async () => {
    if (otpCode.length !== 6) {
      toast.error("Veuillez entrer le code complet à 6 chiffres")
      return
    }

    setIsLoading(true)
    try {
      await apiClient.signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        disciplineId: formData.disciplineId || null,
        clientType: formData.role === 'CLIENT' ? formData.clientType : null,
        otpCode: otpCode // Ajout du code OTP
      })

      // Le message de succès sera géré par l'API selon le rôle
      toast.success("Compte créé avec succès !")

      // Petit délai pour voir le succès avant redirection
      setTimeout(() => {
        router.push("/auth/login")
      }, 1500)
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création du compte")
    } finally {
      setIsLoading(false)
    }
  }

  // Rendu du formulaire OTP
  const renderOTPForm = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold">Vérifiez votre email</h2>
        <p className="text-sm text-gray-500 mt-2">
          Nous avons envoyé un code de vérification à <br />
          <span className="font-medium text-gray-900">{formData.email}</span>
        </p>
      </div>

      <div className="py-4">
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="Code à 6 chiffres"
          value={otpCode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            setOtpCode(val);
          }}
          className="text-center text-3xl font-bold tracking-[1em] h-16 w-full max-w-[300px] mx-auto bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
        />
      </div>

      <Button
        onClick={handleSignup}
        disabled={isLoading || otpCode.length !== 6}
        className="w-full h-12 text-lg"
      >
        {isLoading ? "Création en cours..." : "Vérifier et Créer mon compte"}
      </Button>

      <div className="flex flex-col items-center gap-4 mt-6">
        <div className="text-sm text-gray-500">
          {otpCountdown > 0 ? (
            <span className="flex items-center gap-1.5">
              <Timer className="w-4 h-4" />
              Renvoyer le code dans {otpCountdown}s
            </span>
          ) : (
            <button
              onClick={() => handleSendOTP()}
              className="text-blue-600 font-medium hover:underline disabled:opacity-50"
              disabled={isSendingOTP}
            >
              Renvoyer le code
            </button>
          )}
        </div>

        <button
          onClick={() => setOtpStep('form')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Modifier mes informations
        </button>
      </div>
    </div>
  )

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
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
          <div className="text-center mb-8">
            <img
              src="/images/laha-logo.png"
              alt="LAHA Marchand"
              className="w-16 h-16 mx-auto mb-4"
            />
            {otpStep === 'form' && (
              <>
                <h1 className="text-2xl font-bold text-gray-800">Rejoindre Laha Marchand</h1>
                <p className="text-gray-600 mt-2">Créez votre compte professionnel</p>
              </>
            )}
          </div>

          {otpStep === 'otp' ? renderOTPForm() : (
            <form onSubmit={handleSendOTP} className="space-y-6">
              {/* Nom complet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Votre nom complet"
                    className="pl-10 h-12 bg-gray-50 border-0 rounded-xl"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email professionnel *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="email"
                    placeholder="votre.email@exemple.com"
                    className="pl-10 h-12 bg-gray-50 border-0 rounded-xl"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone *</label>
                <div className="relative">
                  <CountrySelector
                    value={formData.phone}
                    onChange={(val) => handleInputChange("phone", val)}
                    placeholder="06 03 12 34"
                  />
                </div>
              </div>

              {/* Rôle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Votre rôle *</label>
                <Select onValueChange={(value) => handleInputChange("role", value)} required value={formData.role}>
                  <SelectTrigger className="h-12 bg-gray-50 border-0 rounded-xl">
                    <SelectValue placeholder="Sélectionnez votre rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTEUR">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Auteur</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CONCEPTEUR">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Concepteur</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CLIENT">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Client</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="PARTENAIRE">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4" />
                        <span>Partenaire</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="REPRESENTANT">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Représentant</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Votre compte sera activé immédiatement après vérification de votre email.
                </p>
              </div>

              {/* Type de Client (Affiché uniquement si rôle est CLIENT) */}
              {formData.role === 'CLIENT' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de compte client *</label>
                  <Select
                    onValueChange={(value) => handleInputChange("clientType", value)}
                    required={formData.role === 'CLIENT'}
                    value={formData.clientType}
                  >
                    <SelectTrigger className="h-12 bg-gray-50 border-0 rounded-xl">
                      <SelectValue placeholder="Sélectionnez votre type de compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CLIENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Département / Commune (Géographique) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Votre Département *</label>
                <Select onValueChange={(value) => handleInputChange("departmentId", value)} value={formData.departmentId} required>
                  <SelectTrigger className="h-12 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Où résidez-vous ?" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fin des champs spécifiques, suite avec les mots de passe */}

              {/* Mots de passe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      className="pl-10 pr-10 h-12 bg-gray-50 border-0 rounded-xl"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmer le mot de passe"
                      className="pl-10 pr-10 h-12 bg-gray-50 border-0 rounded-xl"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      autoComplete="new-password"
                      required
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

              {/* Information de validation */}
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Votre compte sera créé et activé immédiatement. Vous pourrez vous connecter dès l'inscription et accéder à vos services.
                </p>
              </div>

              {/* Bouton Créer un compte */}
              <Button
                type="submit"
                disabled={isSendingOTP}
                className="w-full h-14 text-white font-semibold text-lg rounded-2xl border-0"
                style={{
                  background: "linear-gradient(90deg, #00d4ff 0%, #5b9bd5 25%, #8b5fbf 50%, #b83dba 75%, #e91e63 100%)",
                }}
              >
                {isSendingOTP ? "ENVOI DU CODE EN COURS..." : "CONTINUER VERS LA VÉRIFICATION"}
              </Button>

              {/* Se connecter */}
              <div className="text-center">
                <p className="text-gray-600">
                  Vous avez déjà un compte ?{" "}
                  <Link href="/auth/login" className="text-blue-600 font-medium hover:text-blue-800">
                    Se connecter
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
