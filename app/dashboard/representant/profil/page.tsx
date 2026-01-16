"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, Maximize2, Trash2 } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "sonner"

export default function ProfilPage() {
  const { user, refreshUser } = useCurrentUser();
  const [profileData, setProfileData] = useState({
    nom: "",
    prenoms: "",
    email: "",
    telephone: "",
    role: "REPRESENTANT",
    imageProfile: "",
  })

  useEffect(() => {
    if (user) {
      const nameParts = (user.name || "").split(" ");
      setProfileData({
        nom: nameParts[0] || "",
        prenoms: nameParts.slice(1).join(" ") || "",
        email: user.email || "",
        telephone: user.phone || "",
        role: user.role || "REPRESENTANT",
        imageProfile: user.image || "",
      });
    }
  }, [user]);

  const handleRefresh = async () => {
    try {
      await refreshUser();
      toast.success("Profil actualisé");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
    }
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleSaveProfile = () => {
    console.log("[v0] Profile saved:", profileData)
  }

  const handleDeleteAccount = () => {
    console.log("[v0] Delete account requested")
    // Add confirmation dialog logic here
  }

  return (
    <div>
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Profil</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">Tableau de bord - Mon profil</span>
            <div className="flex items-center space-x-2">
              <button onClick={handleRefresh} className="p-2 hover:bg-slate-600 rounded-lg" title="Actualiser">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button onClick={handleFullscreen} className="p-2 hover:bg-slate-600 rounded-lg" title="Plein écran">
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header Section */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mes informations</h3>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg" title="Réduire">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button onClick={handleRefresh} className="p-2 hover:bg-gray-100 rounded-lg" title="Actualiser">
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button onClick={handleFullscreen} className="p-2 hover:bg-gray-100 rounded-lg" title="Plein écran">
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Suppression de compte non autorisée pour Représentant */}
          </div>

          {/* Profile Form */}
          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={profileData.nom}
                    onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenoms">Prénoms</Label>
                  <Input
                    id="prenoms"
                    value={profileData.prenoms}
                    onChange={(e) => setProfileData({ ...profileData, prenoms: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                      <img src="/benin-flag.jpg" alt="Bénin" className="w-6 h-4" />
                    </div>
                    <Input
                      id="telephone"
                      value={profileData.telephone}
                      onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Input
                    id="role"
                    value={profileData.role}
                    onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image de profil</Label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm">
                      Choisir un fichier
                    </Button>
                    <span className="text-sm text-gray-500">Aucun fichier choisi</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <Button
                  onClick={handleSaveProfile}
                  className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3.293 7.707A1 1 0 014 7h12a1 1 0 01.707.293l2 2a1 1 0 010 1.414l-2 2A1 1 0 0116 13H4a1 1 0 01-.707-.293l-2-2a1 1 0 010-1.414l2-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
