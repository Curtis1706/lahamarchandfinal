"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Reduction {
  id: string
  client: string
  livre: string
  quantiteMin: number
  reduction: number
  statut: "Actif" | "Inactif"
  creeLe: string
  creePar: string
  description: string
  type: string
  image?: string
}

export default function ReductionsPage() {
  const [reductions, setReductions] = useState<Reduction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [clientFilter, setClientFilter] = useState("Tous les clients")
  const [statusFilter, setStatusFilter] = useState("Tous les statuts")
  const [livreFilter, setLivreFilter] = useState("Tous les livres")
  const [itemsPerPage, setItemsPerPage] = useState("20")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    livre: "Tous les livres",
    typeClient: "",
    quantiteMinimale: "",
    type: "Montant",
    reduction: "",
    statut: "Actif",
    description: "",
  })

  // Charger les réductions depuis l'API
  useEffect(() => {
    loadReductions()
  }, [])

  const loadReductions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pdg/reductions')
      if (response.ok) {
        const data = await response.json()
        setReductions(data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les réductions",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading reductions:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des réductions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadReductions()
  }

  const filteredReductions = reductions.filter((reduction) => {
    const matchesSearch = reduction.livre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "Tous les statuts" || reduction.statut === statusFilter
    const matchesClient = clientFilter === "Tous les clients" || reduction.client === clientFilter
    const matchesLivre = livreFilter === "Tous les livres" || reduction.livre === livreFilter
    return matchesSearch && matchesStatus && matchesClient && matchesLivre
  })

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/pdg/reductions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client: formData.typeClient || "Librairie",
          livre: formData.livre,
          quantiteMin: formData.quantiteMinimale,
          reduction: formData.reduction,
          statut: formData.statut,
          description: formData.description,
          type: formData.type
        }),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Réduction créée avec succès"
        })
        setShowAddModal(false)
        setFormData({
          livre: "Tous les livres",
          typeClient: "",
          quantiteMinimale: "",
          type: "Montant",
          reduction: "",
          statut: "Actif",
          description: "",
        })
        loadReductions()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer la réduction",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating reduction:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la réduction",
        variant: "destructive"
      })
    }
  }

  const handleClose = () => {
    setShowAddModal(false)
    setFormData({
      livre: "Tous les livres",
      typeClient: "",
      quantiteMinimale: "",
      type: "Montant",
      reduction: "",
      statut: "Actif",
      description: "",
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette réduction ?")) {
      return
    }

    try {
      const response = await fetch(`/api/pdg/reductions?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Réduction supprimée avec succès"
        })
        loadReductions()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la réduction",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting reduction:", error)
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
            <h2 className="text-xl font-semibold">Réductions</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Paramètres - Réductions
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label>Client</Label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les clients">Tous les clients</SelectItem>
                    <SelectItem value="Librairie">Librairie</SelectItem>
                    <SelectItem value="Écoles">Écoles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                <Label>Livre</Label>
                <Select value={livreFilter} onValueChange={setLivreFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les livres">Tous les livres</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Rechercher</Label>
                <Input
                  placeholder="Rechercher..."
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
                    <th className="text-left py-3 px-2">CLIENT</th>
                    <th className="text-left py-3 px-2">LIVRE</th>
                    <th className="text-left py-3 px-2">QUANTITÉ MIN</th>
                    <th className="text-left py-3 px-2">TYPE</th>
                    <th className="text-left py-3 px-2">RÉDUCTION</th>
                    <th className="text-left py-3 px-2">STATUT</th>
                    <th className="text-left py-3 px-2">CRÉÉ LE</th>
                    <th className="text-left py-3 px-2">CRÉÉ PAR</th>
                    <th className="text-left py-3 px-2">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">
                        Chargement des réductions...
                      </td>
                    </tr>
                  ) : filteredReductions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">
                        Aucune réduction trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredReductions.map((reduction) => (
                      <tr key={reduction.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">{reduction.client}</td>
                        <td className="py-3 px-2">{reduction.livre}</td>
                        <td className="py-3 px-2">{reduction.quantiteMin}</td>
                        <td className="py-3 px-2">{reduction.type}</td>
                        <td className="py-3 px-2 font-semibold">
                          {reduction.type === "Montant" 
                            ? `${reduction.reduction} F CFA`
                            : `${reduction.reduction}%`
                          }
                        </td>
                        <td className="py-3 px-2">
                          <Badge
                            variant={reduction.statut === "Actif" ? "default" : "secondary"}
                            className={
                              reduction.statut === "Actif"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {reduction.statut}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">{reduction.creeLe}</td>
                        <td className="py-3 px-2 text-sm text-gray-600">{reduction.creePar}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Edit className="w-4 h-4 text-orange-500" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleDelete(reduction.id)}
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
                Affichage de 1 à {filteredReductions.length} sur {reductions.length} éléments
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
            <h3 className="text-xl font-semibold mb-4">Ajouter une réduction</h3>

            <div className="space-y-4">
              <div>
                <Label>Livre</Label>
                <Select value={formData.livre} onValueChange={(value) => setFormData({ ...formData, livre: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les livres">Tous les livres</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de client</Label>
                <Input
                  placeholder="Ex: Librairie, École"
                  value={formData.typeClient}
                  onChange={(e) => setFormData({ ...formData, typeClient: e.target.value })}
                />
              </div>

              <div>
                <Label>Quantité minimale</Label>
                <Input
                  type="number"
                  placeholder="Ex: 10"
                  value={formData.quantiteMinimale}
                  onChange={(e) => setFormData({ ...formData, quantiteMinimale: e.target.value })}
                />
              </div>

              <div>
                <Label>Type de réduction</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Montant">Montant</SelectItem>
                    <SelectItem value="Pourcentage">Pourcentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Réduction</Label>
                <Input
                  type="number"
                  placeholder={formData.type === "Montant" ? "Ex: 100" : "Ex: 10"}
                  value={formData.reduction}
                  onChange={(e) => setFormData({ ...formData, reduction: e.target.value })}
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

              <div>
                <Label>Description (optionnel)</Label>
                <Textarea
                  placeholder="Description de la réduction"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSubmit}
                disabled={!formData.quantiteMinimale || !formData.reduction}
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