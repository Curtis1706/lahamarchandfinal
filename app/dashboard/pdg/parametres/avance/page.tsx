"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Maximize2, Edit, Trash2, Plus, X, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface AdvancedSetting {
  id: string
  description: string
  valeur: string
  statut: string
  modifieLe: string
  key: string
  category: string
  type: string
}

export default function AvanceePage() {
  const [settings, setSettings] = useState<AdvancedSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("tous")
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSetting, setEditingSetting] = useState<AdvancedSetting | null>(null)
  const [formData, setFormData] = useState({
    key: "",
    category: "partner_discount",
    value: "",
    type: "number",
    description: ""
  })

  useEffect(() => {
    loadSettings()
  }, [currentPage, itemsPerPage, statusFilter, searchTerm])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })

      if (statusFilter !== "tous") {
        params.append("status", statusFilter)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/pdg/parametres/avance?${params}`)
      if (!response.ok) throw new Error("Erreur lors du chargement")

      const data = await response.json()
      setSettings(data.settings || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalItems(data.pagination?.total || 0)
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("Erreur lors du chargement des paramètres")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (setting: AdvancedSetting) => {
    setEditingSetting(setting)
    setFormData({
      key: setting.key,
      category: setting.category,
      value: setting.valeur,
      type: setting.type,
      description: setting.description
    })
    setShowEditModal(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.value) {
        toast.error("La valeur est requise")
        return
      }

      const url = editingSetting
        ? `/api/pdg/parametres/avance`
        : `/api/pdg/parametres/avance`

      const method = editingSetting ? "PUT" : "POST"
      const body = editingSetting
        ? { id: editingSetting.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de l'enregistrement")
      }

      toast.success(editingSetting ? "Paramètre mis à jour avec succès" : "Paramètre créé avec succès")
      setShowEditModal(false)
      setShowCreateModal(false)
      resetForm()
      loadSettings()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce paramètre ?")) {
      return
    }

    try {
      const response = await fetch(`/api/pdg/parametres/avance?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      toast.success("Paramètre supprimé avec succès")
      loadSettings()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  const resetForm = () => {
    setFormData({
      key: "",
      category: "partner_discount",
      value: "",
      type: "number",
      description: ""
    })
    setEditingSetting(null)
  }

  const handleRefresh = () => {
    loadSettings()
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const filteredSettings = settings.filter(setting => {
    if (statusFilter !== "tous" && setting.statut.toLowerCase() !== statusFilter.toLowerCase()) {
      return false
    }
    if (searchTerm && !setting.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !setting.valeur.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Avancé</h2>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <span className="text-sm text-slate-300">
              Tableau de bord - Avancé
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-3 sm:p-4 border-b flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 truncate">Paramètres avancés</h2>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { resetForm(); setShowCreateModal(true); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRefresh} title="Actualiser">
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleFullscreen} title="Agrandir">
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>

          <div className="p-3 sm:p-4 lg:p-6">
            {/* Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les statuts</SelectItem>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Afficher</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(v) => {
                      setItemsPerPage(parseInt(v))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-16 sm:w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600 whitespace-nowrap">éléments</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full lg:w-auto">
                <span className="text-sm text-gray-600 whitespace-nowrap">Rechercher:</span>
                <Input
                  className="flex-1 lg:w-64"
                  placeholder="Description, valeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[300px] sm:min-w-[400px]">
                          DESCRIPTION
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[80px]">
                          VALEUR
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[80px]">
                          STATUT
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[150px]">
                          MODIFIÉ LE
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[100px]">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="px-3 sm:px-4 py-12 text-center text-gray-500">
                            Chargement...
                          </td>
                        </tr>
                      ) : filteredSettings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 sm:px-4 py-12 text-center text-gray-500">
                            Aucun paramètre trouvé
                          </td>
                        </tr>
                      ) : (
                        filteredSettings.map((setting) => (
                          <tr key={setting.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 break-words">
                              {setting.description}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 font-medium">
                              {setting.valeur}
                            </td>
                            <td className="px-3 sm:px-4 py-3">
                              <Badge className="bg-green-100 text-green-800">
                                {setting.statut}
                              </Badge>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                              {setting.modifieLe}
                            </td>
                            <td className="px-3 sm:px-4 py-3">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(setting)}
                                  className="p-1 hover:bg-yellow-100"
                                  title="Modifier"
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(setting.id)}
                                  className="p-1 hover:bg-red-100"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 sm:mt-6 gap-3 sm:gap-0">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Affichage de {startIndex} à {endIndex} sur {totalItems} éléments
              </div>
              <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Premier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={currentPage === 1 ? "bg-blue-600 text-white" : ""}
                >
                  {currentPage}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Dernier
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      <Dialog open={showEditModal} onOpenChange={(open) => { setShowEditModal(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le paramètre</DialogTitle>
            <DialogDescription>
              Modifiez la valeur du paramètre avancé
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <p className="text-sm text-gray-600 mt-1">{editingSetting?.description}</p>
            </div>
            <div>
              <Label>Valeur</Label>
              <Input
                type={editingSetting?.type === "number" ? "number" : "text"}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Entrez la valeur"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de création */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau paramètre</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau paramètre avancé
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Clé (unique)</Label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="ex: partner_discount_custom"
              />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partner_discount">Ristourne partenaire</SelectItem>
                  <SelectItem value="royalty">Droits d'auteur</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="pricing">Prix</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du paramètre"
                rows={3}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">Texte</SelectItem>
                  <SelectItem value="number">Nombre</SelectItem>
                  <SelectItem value="boolean">Booléen</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valeur</Label>
              <Input
                type={formData.type === "number" ? "number" : "text"}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Entrez la valeur"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-2" />
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
