"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Save, Trash2, Upload, RefreshCw } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export default function ProfilPage() {
  const { user, refreshUser } = useCurrentUser();
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    // Coordonnées bancaires
    bankName: "",
    accountNumber: "",
    accountName: "",
    iban: "",
    swiftCode: "",
    // Informations de paiement mobile money
    mobileMoneyProvider: "",
    mobileMoneyNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      await apiClient.updateUser(user.id, {
        name: profileData.name,
        phone: profileData.phone,
        // Note: email et role ne sont généralement pas modifiables par l'utilisateur
      });
      
      await refreshUser();
      toast.success("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      await apiClient.deleteUser(user.id);
      toast.success("Compte supprimé avec succès");
      // Rediriger vers la page de connexion
      window.location.href = "/auth/signin";
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Erreur lors de la suppression du compte");
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await refreshUser();
      toast.success("Profil actualisé");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    const roles = {
      AUTEUR: "Auteur",
      CONCEPTEUR: "Concepteur",
      CLIENT: "Client",
      PARTENAIRE: "Partenaire",
      REPRESENTANT: "Représentant",
      PDG: "PDG"
    };
    return roles[role as keyof typeof roles] || role;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Aperçu du profil</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-gray-600">{getRoleLabel(user.role)}</p>
            </div>
            
            <div className="space-y-3 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Actif
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Votre nom complet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-gray-100"
                  placeholder="Votre adresse email"
                />
                <p className="text-xs text-gray-500">L'email ne peut pas être modifié</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+241 XX XX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Input
                  id="role"
                  value={getRoleLabel(profileData.role)}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500">Le rôle ne peut pas être modifié</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image de profil</Label>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" disabled>
                  <Upload className="w-4 h-4 mr-2" />
                  Choisir un fichier
                </Button>
                <span className="text-sm text-gray-500">Fonctionnalité à venir</span>
              </div>
            </div>

            {/* Section Coordonnées bancaires */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Coordonnées de paiement</h3>
              <p className="text-sm text-gray-600 mb-6">
                Renseignez vos coordonnées bancaires pour recevoir vos droits d'auteur
              </p>
              
              <div className="space-y-6">
                {/* Informations bancaires */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Compte bancaire</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Nom de la banque</Label>
                      <Input
                        id="bankName"
                        value={profileData.bankName}
                        onChange={(e) => setProfileData({ ...profileData, bankName: e.target.value })}
                        placeholder="Ex: Ecobank Gabon"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Nom du titulaire</Label>
                      <Input
                        id="accountName"
                        value={profileData.accountName}
                        onChange={(e) => setProfileData({ ...profileData, accountName: e.target.value })}
                        placeholder="Nom complet du titulaire"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Numéro de compte</Label>
                      <Input
                        id="accountNumber"
                        value={profileData.accountNumber}
                        onChange={(e) => setProfileData({ ...profileData, accountNumber: e.target.value })}
                        placeholder="Numéro de compte bancaire"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="iban">IBAN (optionnel)</Label>
                      <Input
                        id="iban"
                        value={profileData.iban}
                        onChange={(e) => setProfileData({ ...profileData, iban: e.target.value })}
                        placeholder="Code IBAN international"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Money */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Mobile Money (alternatif)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobileMoneyProvider">Opérateur</Label>
                      <select
                        id="mobileMoneyProvider"
                        value={profileData.mobileMoneyProvider}
                        onChange={(e) => setProfileData({ ...profileData, mobileMoneyProvider: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionnez un opérateur</option>
                        <option value="AIRTEL_MONEY">Airtel Money</option>
                        <option value="MOOV_MONEY">Moov Money</option>
                        <option value="ORANGE_MONEY">Orange Money</option>
                        <option value="MTN_MOMO">MTN Mobile Money</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobileMoneyNumber">Numéro Mobile Money</Label>
                      <Input
                        id="mobileMoneyNumber"
                        value={profileData.mobileMoneyNumber}
                        onChange={(e) => setProfileData({ ...profileData, mobileMoneyNumber: e.target.value })}
                        placeholder="+241 XX XX XX XX"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="text-blue-600 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Sécurité des données</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Vos informations bancaires sont cryptées et sécurisées. Elles ne seront utilisées que pour le versement de vos droits d'auteur.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Votre compte et toutes vos données seront définitivement supprimés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                      Supprimer définitivement
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}