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
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("Tous les statuts")
  const [itemsPerPage, setItemsPerPage] = useState("20")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nom: "",
    responsable: "none",
    chef: "",
    statut: "Actif",
    description: "",
  })

  useEffect(() => {
    loadDepartments()
    loadUsers()
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
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users/list')
      if (response.ok) {
        const data = await response.json()
        // L'API renvoie { users: [], usersByRole: {}, total: 0 }
        if (data && Array.isArray(data.users)) {
          setUsers(data.users)
        } else if (Array.isArray(data)) {
          setUsers(data)
        }
      }
    } catch (error) {
      console.error("Error loading users:", error)
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
    const isAllResponsibles = searchTerm === "all" || searchTerm === ""
    const matchesSearch = isAllResponsibles || 
                          dept.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dept.responsable.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "Tous les statuts" || dept.statut === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSubmit = async () => {
    try {
      const url = '/api/pdg/departements'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing ? { id: currentId, ...formData } : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: isEditing ? "Département modifié avec succès" : "Département créé avec succès"
        })
        setShowModal(false)
        resetForm()
        loadDepartments()
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error submitting department:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      responsable: "none",
      chef: "",
      statut: "Actif",
      description: "",
    })
    setIsEditing(false)
    setCurrentId(null)
  }

  const handleEdit = (dept: Department) => {
    setFormData({
      nom: dept.nom,
      responsable: dept.responsable === "-" ? "none" : dept.responsable,
      chef: dept.chef,
      statut: dept.statut,
      description: dept.description,
    })
    setIsEditing(true)
    setCurrentId(dept.id)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    resetForm()
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
                className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 rounded-lg flex items-center gap-2"
                onClick={() => {
                  resetForm()
                  setShowModal(true)
                }}
              >
                Département <span className="text-xl">+</span>
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Responsable :</Label>
                <Select value={searchTerm} onValueChange={setSearchTerm}>
                  <SelectTrigger className="h-11 bg-white border-gray-200">
                    <SelectValue placeholder="Tous les responsables" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les responsables</SelectItem>
                    {Array.isArray(users) && users.map(user => (
                      <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Statut :</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les statuts">Tous les statuts</SelectItem>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Rechercher :</Label>
                <div className="relative">
                  <Input
                    placeholder="Filtrer..."
                    className="h-11 bg-white border-gray-200 pl-4"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Table Controls */}
            <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
              <span>Afficher</span>
              <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                <SelectTrigger className="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>éléments</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-medium">
                    <th className="text-left py-4 px-2 uppercase tracking-wider">NOM</th>
                    <th className="text-left py-4 px-2 uppercase tracking-wider">RESPONSABLE</th>
                    <th className="text-left py-4 px-2 uppercase tracking-wider">CHEF</th>
                    <th className="text-left py-4 px-2 uppercase tracking-wider">STATUT</th>
                    <th className="text-left py-4 px-2 uppercase tracking-wider">DESCRIPTION</th>
                    <th className="text-left py-4 px-2 uppercase tracking-wider">CRÉÉ LE</th>
                    <th className="text-left py-4 px-2 uppercase tracking-wider">CRÉÉ PAR</th>
                    <th className="text-left py-4 px-2 uppercase tracking-wider">MODIFIÉ LE</th>
                    <th className="text-left py-4 px-2 uppercase tracking-wider">RÉSIDENTS</th>
                    <th className="text-left py-4 px-2 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-gray-400">
                        Chargement des départements...
                      </td>
                    </tr>
                  ) : filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-gray-400">
                        Aucun département trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((dept) => (
                      <tr key={dept.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-2 font-medium text-gray-700">{dept.nom}</td>
                        <td className="py-4 px-2 text-gray-600">
                          {dept.responsable !== "-" ? (
                            <div className="flex flex-col">
                              <span>{dept.responsable}</span>
                              <span className="text-xs text-gray-400 italic">Identifié</span>
                            </div>
                          ) : "-"}
                        </td>
                        <td className="py-4 px-2 text-gray-600">{dept.chef || "-"}</td>
                        <td className="py-4 px-2">
                          <Badge
                            className={
                              dept.statut === "Actif"
                                ? "bg-green-100 text-green-700 hover:bg-green-100 shadow-none font-normal"
                                : "bg-red-100 text-red-700 hover:bg-red-100 shadow-none font-normal"
                            }
                          >
                            {dept.statut}
                          </Badge>
                        </td>
                        <td className="py-4 px-2 text-gray-500 max-w-xs truncate">
                          {dept.description || "-"}
                        </td>
                        <td className="py-4 px-2 text-gray-500">{dept.creeLe}</td>
                        <td className="py-4 px-2 text-gray-500">{dept.creePar || "-"}</td>
                        <td className="py-4 px-2 text-gray-500">{dept.modifieLe}</td>
                        <td className="py-4 px-2 text-gray-500">{dept.residents}</td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleEdit(dept)}
                              className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors group"
                            >
                              <Edit className="w-4 h-4 text-orange-400 group-hover:text-orange-500" />
                            </button>
                            <button 
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                              onClick={() => handleDelete(dept.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-500" />
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
            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
              <p className="text-sm text-gray-500">
                Affichage de 1 à {filteredDepartments.length} sur {departments.length} éléments
              </p>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" className="text-gray-400" size="sm">Premier</Button>
                <Button variant="ghost" className="text-gray-400" size="sm">Précédent</Button>
                <Button variant="outline" size="sm" className="bg-white border-gray-200 text-gray-700 min-w-[32px]">1</Button>
                <Button variant="ghost" className="text-gray-400" size="sm">Suivant</Button>
                <Button variant="ghost" className="text-gray-400" size="sm">Dernier</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Département Refondue */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100">
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Nom du département :</Label>
                  <Input
                    placeholder="Ex: ZOU"
                    className="h-12 bg-white border-gray-200 focus:ring-indigo-500 text-base"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Responsable :</Label>
                  <Select 
                    value={formData.responsable} 
                    onValueChange={(value) => setFormData({ ...formData, responsable: value })}
                  >
                    <SelectTrigger className="h-12 bg-white border-gray-200 text-base">
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {Array.isArray(users) && users.map(user => (
                        <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Statut :</Label>
                  <Select 
                    value={formData.statut} 
                    onValueChange={(value) => setFormData({ ...formData, statut: value as any })}
                  >
                    <SelectTrigger className="h-12 bg-white border-gray-200 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <Label className="text-sm font-semibold text-gray-700">Description :</Label>
                <Textarea
                  placeholder="Notes ou détails supplémentaires..."
                  className="min-h-[140px] bg-white border-gray-200 focus:ring-indigo-500 text-base p-4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <Button 
                  className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 font-medium"
                  onClick={handleSubmit}
                  disabled={!formData.nom}
                >
                  <span className="bg-white/20 p-1 rounded">
                    <Edit className="w-4 h-4" />
                  </span>
                  Enregistrer
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 px-10 border-red-500 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2 font-medium"
                  onClick={handleClose}
                >
                  Fermer
                  <span className="text-lg">×</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}