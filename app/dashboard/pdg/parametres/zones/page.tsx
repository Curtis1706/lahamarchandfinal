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

interface Zone {
  id: string
  zone: string
  departement: string
  livreur: string
  statut: "Actif" | "Inactif"
  creeLe: string
  creePar: string
  modifieLe: string
  residents: number
  couverture: string
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [departementFilter, setDepartementFilter] = useState("Tous les départements")
  const [statusFilter, setStatusFilter] = useState("Tous les statuts")
  const [itemsPerPage, setItemsPerPage] = useState("20")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    zone: "",
    departement: "",
    livreur: "",
    statut: "Actif",
    couverture: "",
  })

  // Départements du Bénin
  const departements = [
    "ATLANTIQUE", "LITTORAL", "OUEME", "MONO", "COUFFO", 
    "ZOU", "COLLINES", "BORGOU", "ALIBORI", "ATACORA", 
    "DONGA", "PLATEAU"
  ]

  useEffect(() => {
    loadZones()
  }, [])

  const loadZones = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pdg/zones')
      if (response.ok) {
        const data = await response.json()
        setZones(data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les zones",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading zones:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des zones",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadZones()
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const filteredZones = zones.filter((zone) => {
    const matchesSearch = zone.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          zone.departement.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "Tous les statuts" || zone.statut === statusFilter
    const matchesDepartement = departementFilter === "Tous les départements" || zone.departement === departementFilter
    return matchesSearch && matchesStatus && matchesDepartement
  })

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/pdg/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Zone créée avec succès"
        })
        setShowAddModal(false)
        setFormData({
          zone: "",
          departement: "",
          livreur: "",
          statut: "Actif",
          couverture: "",
        })
        loadZones()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer la zone",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating zone:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la zone",
        variant: "destructive"
      })
    }
  }

  const handleClose = () => {
    setShowAddModal(false)
    setFormData({
      zone: "",
      departement: "",
      livreur: "",
      statut: "Actif",
      couverture: "",
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette zone ?")) {
      return
    }

    try {
      const response = await fetch(`/api/pdg/zones?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Zone supprimée avec succès"
        })
        loadZones()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la zone",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting zone:", error)
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
            <h2 className="text-xl font-semibold">Zones</h2>
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
              Tableau de bord - Paramètres - Zones
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label>Département</Label>
                <Select value={departementFilter} onValueChange={setDepartementFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les départements">Tous les départements</SelectItem>
                    {departements.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
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
                <Label>Rechercher</Label>
                <Input
                  placeholder="Rechercher une zone..."
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
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">ZONE</th>
                    <th className="text-left py-3 px-2">DÉPARTEMENT</th>
                    <th className="text-left py-3 px-2">LIVREUR</th>
                    <th className="text-left py-3 px-2">RÉSIDENTS</th>
                    <th className="text-left py-3 px-2">COUVERTURE</th>
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
                        Chargement des zones...
                      </td>
                    </tr>
                  ) : filteredZones.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">
                        Aucune zone trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredZones.map((zone) => (
                      <tr key={zone.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">{zone.zone}</td>
                        <td className="py-3 px-2">
                          <Badge variant="outline">{zone.departement}</Badge>
                        </td>
                        <td className="py-3 px-2 text-sm">{zone.livreur || "-"}</td>
                        <td className="py-3 px-2 text-sm">{zone.residents}</td>
                        <td className="py-3 px-2 text-sm max-w-xs truncate">
                          {zone.couverture || "-"}
                        </td>
                        <td className="py-3 px-2">
                          <Badge
                            variant={zone.statut === "Actif" ? "default" : "secondary"}
                            className={
                              zone.statut === "Actif"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {zone.statut}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">{zone.creeLe}</td>
                        <td className="py-3 px-2 text-sm text-gray-600">{zone.modifieLe}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Edit className="w-4 h-4 text-orange-500" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleDelete(zone.id)}
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
                Affichage de 1 à {filteredZones.length} sur {zones.length} éléments
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
            <h3 className="text-xl font-semibold mb-4">Ajouter une zone</h3>

            <div className="space-y-4">
              <div>
                <Label>Nom de la zone</Label>
                <Input
                  placeholder="Ex: ZONE-PRIMAIRE-1"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                />
              </div>

              <div>
                <Label>Département</Label>
                <Select value={formData.departement} onValueChange={(value) => setFormData({ ...formData, departement: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un département" />
                  </SelectTrigger>
                  <SelectContent>
                    {departements.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Livreur (Téléphone)</Label>
                <Input
                  placeholder="Ex: +22940767676"
                  value={formData.livreur}
                  onChange={(e) => setFormData({ ...formData, livreur: e.target.value })}
                />
              </div>

              <div>
                <Label>Couverture</Label>
                <Textarea
                  placeholder="Localités couvertes par cette zone"
                  rows={3}
                  value={formData.couverture}
                  onChange={(e) => setFormData({ ...formData, couverture: e.target.value })}
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
                disabled={!formData.zone || !formData.departement}
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