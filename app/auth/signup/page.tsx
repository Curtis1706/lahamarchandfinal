"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Eye, EyeOff, Lock, Mail, BookOpen, Users, Briefcase, Phone } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { useDisciplines } from "@/hooks/use-disciplines"

export default function SignupPage() {
  const router = useRouter()
  const { disciplines } = useDisciplines()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
    disciplineId: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.role) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    // Validation du format du téléphone
    const phoneRegex = /^(\+229|229)?[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      toast.error("Veuillez entrer un numéro de téléphone valide (format: +229 40 76 76 76)")
      return
    }

    setIsLoading(true)
    try {
      await apiClient.createUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        disciplineId: formData.disciplineId || null
      })

      toast.success("Compte créé avec succès ! En attente de validation.")
      router.push("/auth/login")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création du compte")
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
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
          <div className="text-center mb-8">
            <img
              src="/images/laha-logo.png"
              alt="LAHA Marchand"
              className="w-16 h-16 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-800">Rejoindre Laha Marchand</h1>
            <p className="text-gray-600 mt-2">Créez votre compte professionnel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  required
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="tel"
                  placeholder="+229 40 76 76 76"
                  className="pl-10 h-12 bg-gray-50 border-0 rounded-xl"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  pattern="[+]?[0-9\s\-\(\)]+"
                  title="Format: +229 40 76 76 76 ou 22940767676"
                  required
                />
              </div>
            </div>

            {/* Rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Votre rôle *</label>
              <Select onValueChange={(value) => handleInputChange("role", value)} required>
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
                Votre compte sera validé par l'administrateur selon votre rôle
              </p>
            </div>

            {/* Discipline (pour concepteurs) */}
            {formData.role === "CONCEPTEUR" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discipline de spécialisation</label>
                <Select onValueChange={(value) => handleInputChange("disciplineId", value)}>
                  <SelectTrigger className="h-12 bg-gray-50 border-0 rounded-xl">
                    <SelectValue placeholder="Choisissez votre discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplines.map((discipline) => (
                      <SelectItem key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                <strong>Note :</strong> Votre compte sera créé en attente de validation. 
                L'équipe Laha Marchand examinera votre demande selon votre rôle professionnel.
              </p>
            </div>

            {/* Bouton Créer un compte */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-white font-semibold text-lg rounded-2xl border-0"
              style={{
                background: "linear-gradient(90deg, #00d4ff 0%, #5b9bd5 25%, #8b5fbf 50%, #b83dba 75%, #e91e63 100%)",
              }}
            >
              {isLoading ? "CRÉATION EN COURS..." : "CRÉER UN COMPTE"}
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
