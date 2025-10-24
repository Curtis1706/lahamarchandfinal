"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Maximize2, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Department {
  id: string
  nom: string
  responsable: string
  chef: string
  statut: "Actif" | "Inactif"
  description: string
  creeLe: string
  creePar: string
  modifieLe: string
  residents: number
}

export default function DepartementsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState("Tous les statuts")
  const [itemsPerPage, setItemsPerPage] = useState("20")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nom: "",
    responsable: "",
    chef: "",
    statut: "Actif",
    description: "",
  })

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pdg/departements')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les départements",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading departments:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des départements",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadDepartments()
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch = dept.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dept.responsable.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "Tous les statuts" || dept.statut === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/pdg/departements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Département créé avec succès"
        })
        setShowAddModal(false)
        setFormData({
          nom: "",
          responsable: "",
          chef: "",
          statut: "Actif",
          description: "",
        })
        loadDepartments()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer le département",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating department:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du département",
        variant: "destructive"
      })
    }
  }

  const handleClose = () => {
    setShowAddModal(false)
    setFormData({
      nom: "",
      responsable: "",
      chef: "",
      statut: "Actif",
      description: "",
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce département ?")) {
      return
    }

    try {
      const response = await fetch(`/api/pdg/departements?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Département supprimé avec succès"
        })
        loadDepartments()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le département",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting department:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      })
    }
  }

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Départements</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-600 rounded"
              title="Actualiser"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleFullscreen}
              className="p-2 hover:bg-slate-600 rounded"
              title="Plein écran"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-300">
              Tableau de bord - Paramètres - Départements
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-4 lg:p-6">
            {/* Header Actions */}
            <div className="flex justify-end mb-6">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setShowAddModal(true)}
              >
                Ajouter +
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label>Statut</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les statuts">Tous les statuts</SelectItem>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Rechercher</Label>
                <Input
                  placeholder="Rechercher un département..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Table Controls */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-gray-600">Afficher</span>
              <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">éléments</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">NOM</th>
                    <th className="text-left py-3 px-2">RESPONSABLE</th>
                    <th className="text-left py-3 px-2">CHEF</th>
                    <th className="text-left py-3 px-2">RÉSIDENTS</th>
                    <th className="text-left py-3 px-2">DESCRIPTION</th>
                    <th className="text-left py-3 px-2">STATUT</th>
                    <th className="text-left py-3 px-2">CRÉÉ LE</th>
                    <th className="text-left py-3 px-2">MODIFIÉ LE</th>
                    <th className="text-left py-3 px-2">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">
                        Chargement des départements...
                      </td>
                    </tr>
                  ) : filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">
                        Aucun département trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((dept) => (
                      <tr key={dept.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">{dept.nom}</td>
                        <td className="py-3 px-2 text-sm">{dept.responsable || "-"}</td>
                        <td className="py-3 px-2 text-sm">{dept.chef || "-"}</td>
                        <td className="py-3 px-2 text-sm">{dept.residents}</td>
                        <td className="py-3 px-2 text-sm max-w-xs truncate">
                          {dept.description || "-"}
                        </td>
                        <td className="py-3 px-2">
                          <Badge
                            variant={dept.statut === "Actif" ? "default" : "secondary"}
                            className={
                              dept.statut === "Actif"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {dept.statut}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">{dept.creeLe}</td>
                        <td className="py-3 px-2 text-sm text-gray-600">{dept.modifieLe}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Edit className="w-4 h-4 text-orange-500" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleDelete(dept.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-600">
                Affichage de 1 à {filteredDepartments.length} sur {departments.length} éléments
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Premier</Button>
                <Button variant="outline" size="sm">Précédent</Button>
                <Button variant="outline" size="sm" className="bg-indigo-600 text-white">1</Button>
                <Button variant="outline" size="sm">Suivant</Button>
                <Button variant="outline" size="sm">Dernier</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ajouter */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Ajouter un département</h3>

            <div className="space-y-4">
              <div>
                <Label>Nom du département</Label>
                <Input
                  placeholder="Ex: ATLANTIQUE"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>

              <div>
                <Label>Responsable</Label>
                <Input
                  placeholder="Nom du responsable"
                  value={formData.responsable}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                />
              </div>

              <div>
                <Label>Chef de département</Label>
                <Input
                  placeholder="Nom du chef"
                  value={formData.chef}
                  onChange={(e) => setFormData({ ...formData, chef: e.target.value })}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Description du département"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label>Statut</Label>
                <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSubmit}
                disabled={!formData.nom}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}