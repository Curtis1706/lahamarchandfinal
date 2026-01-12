"use client"

import { useState, useEffect } from "react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Upload, User, Mail, Phone, MapPin, Building, Calendar, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function ProfilPage() {
  const { user, isLoading } = useCurrentUser()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    ifu: "",
    establishment: "",
    director: "",
    department: "",
    founded: ""
  })

  // Initialiser les données du formulaire avec les données utilisateur
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        ifu: user.ifu || "",
        establishment: user.establishment || "",
        director: user.director || "",
        department: user.department || "",
        founded: user.founded || ""
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    try {
      setIsSaving(true)

      // Appeler l'API pour mettre à jour le profil (endpoint dédié pour le profil utilisateur)
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du profil')
      }

      // Recharger la page pour afficher les données mises à jour
      window.location.reload()
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error)
      toast.error(error.message || "Erreur lors de la mise à jour du profil")
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Restaurer les valeurs originales
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        ifu: user.ifu || "",
        establishment: user.establishment || "",
        director: user.director || "",
        department: user.department || "",
        founded: user.founded || ""
      })
    }
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DynamicDashboardLayout>
    )
  }

  if (!user) {
    return (
      <DynamicDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vous devez être connecté pour voir votre profil.</p>
        </div>
      </DynamicDashboardLayout>
    )
  }

  return (
    <DynamicDashboardLayout>
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mon Profil</h1>
              <p className="text-muted-foreground">
                Gérez vos informations personnelles et préférences
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer"
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Modifier le profil
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Informations utilisateur */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Carte principale */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Vos informations de base et coordonnées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled={true}
                      className="mt-1 bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+229 XX XX XX XX"
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifu">N° IFU</Label>
                    <Input
                      id="ifu"
                      value={profileData.ifu}
                      onChange={(e) => setProfileData(prev => ({ ...prev, ifu: e.target.value }))}
                      placeholder="Numéro d'identification fiscale"
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Adresse complète</Label>
                  <textarea
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1 w-full p-3 border rounded-lg resize-none disabled:bg-muted disabled:cursor-not-allowed"
                    rows={3}
                    placeholder="Votre adresse complète"
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Informations de l'établissement
                </CardTitle>
                <CardDescription>
                  Détails sur votre établissement scolaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="establishment">Dénomination</Label>
                    <Input
                      id="establishment"
                      value={profileData.establishment}
                      onChange={(e) => setProfileData(prev => ({ ...prev, establishment: e.target.value }))}
                      placeholder="Nom de l'établissement"
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="director">Directeur</Label>
                    <Input
                      id="director"
                      value={profileData.director}
                      onChange={(e) => setProfileData(prev => ({ ...prev, director: e.target.value }))}
                      placeholder="Nom du directeur"
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Département</Label>
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Département (ex: Atlantique)"
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="founded">Année de création</Label>
                    <Input
                      id="founded"
                      type="number"
                      value={profileData.founded}
                      onChange={(e) => setProfileData(prev => ({ ...prev, founded: e.target.value }))}
                      placeholder="2020"
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statut du compte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rôle</span>
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Statut</span>
                  <Badge className="bg-green-100 text-green-800">
                    {user.status === 'ACTIVE' ? 'Actif' : user.status || 'Actif'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Membre depuis</span>
                  <span className="text-sm text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).getFullYear() : '2025'}
                  </span>
                </div>
                <Separator />
                <div className="text-center">
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Changer mot de passe
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Photo de profil</CardTitle>
                <CardDescription>
                  Ajoutez une photo pour personnaliser votre profil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="Photo de profil" 
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <Button variant="outline" size="sm" disabled={!isEditing}>
                    <Upload className="h-4 w-4 mr-2" />
                    Changer la photo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Gérez vos documents administratifs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Contrat signé</span>
                  <Button variant="outline" size="sm" disabled={!isEditing}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pièce d'identité</span>
                  <Button variant="outline" size="sm" disabled={!isEditing}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DynamicDashboardLayout>
  )
}