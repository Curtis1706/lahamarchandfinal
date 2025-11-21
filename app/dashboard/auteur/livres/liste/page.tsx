"use client";

import { useState, useEffect } from "react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function LivresListePage() {
  const [livres, setLivres] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useCurrentUser()

  // Charger les livres de l'auteur depuis l'API
  useEffect(() => {
    if (user?.id) {
      loadLivres()
    }
  }, [user])

  const loadLivres = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAuthorWorks(user.id)
      setLivres(data)
    } catch (error) {
      console.error('Error loading livres:', error)
      toast.error('Erreur lors du chargement des livres')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DynamicDashboardLayout title="Mes œuvres" breadcrumb="Auteur - Mes œuvres">
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Mes œuvres</h2>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Filtres (lecture seule) */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Select defaultValue="toutes-categories">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes-categories">
                  Toutes les catégories
                </SelectItem>
                <SelectItem value="manuels">Manuels</SelectItem>
                <SelectItem value="exercices">Exercices</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="toutes-classes">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes-classes">
                  Toutes les classes
                </SelectItem>
                <SelectItem value="6eme">6ème</SelectItem>
                <SelectItem value="5eme">5ème</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="toutes-matieres">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes-matieres">
                  Toutes les matières
                </SelectItem>
                <SelectItem value="francais">Français</SelectItem>
                <SelectItem value="anglais">Anglais</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="tous-statuts">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous-statuts">Tous les statuts</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="indisponible">Indisponible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aucune action de création/import pour Auteur */}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="50">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input placeholder="" className="w-64" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Libellé
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Catégorie
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Collection
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Courte
                      <br />
                      description
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Ajouté
                      <br />
                      le
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Classe(s)
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Matière
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Code
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {livres.map((livre) => (
                    <tr key={livre.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <img
                            src={livre.image || "/placeholder.svg"}
                            alt={livre.libelle}
                            className="w-10 h-12 object-cover rounded"
                          />
                          <span className="font-medium text-blue-600">
                            {livre.libelle}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{livre.categorie}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">
                          {livre.statut}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {livre.collection || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm">-</td>
                      <td className="py-3 px-4 text-sm">{livre.ajouteLe}</td>
                      <td className="py-3 px-4 text-sm">{livre.classes}</td>
                      <td className="py-3 px-4 text-sm">{livre.matiere}</td>
                      <td className="py-3 px-4 text-sm font-mono">
                        {livre.code}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Affichage de 1 à 3 sur 3 éléments
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Premier
                </Button>
                <Button variant="outline" size="sm">
                  Précédent
                </Button>
                <Button variant="outline" size="sm">
                  Suivant
                </Button>
                <Button variant="outline" size="sm">
                  Dernier
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DynamicDashboardLayout>
  );
}
