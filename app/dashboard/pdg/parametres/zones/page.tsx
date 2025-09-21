"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Maximize2, Edit, Trash2 } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

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

const mockZones: Zone[] = [
  {
    id: "1",
    zone: "ZONE-PRIMAIRE-1",
    departement: "ATLANTIQUE",
    livreur: "+22940767676",
    statut: "Actif",
    creeLe: "jeu. 18 juil. 2024 14:40",
    creePar: "billfass2010@gmail.com",
    modifieLe: "mer. 21 août 2024 15:09",
    residents: 79,
    couverture: "GODOMEY- DEKOUNGBE-COCOTOMEY-COCOCODJI-ATTROKPOCODJI-GBODJI-SEDEGBE-LOBOZOUNKPA ET ENVIRONS",
  },
  {
    id: "2",
    zone: "ZONE-PRIMAIRE-1",
    departement: "LITTORAL",
    livreur: "",
    statut: "Actif",
    creeLe: "jeu. 18 juil. 2024 17:00",
    creePar: "billfass2010@gmail.com",
    modifieLe: "",
    residents: 0,
    couverture: "",
  },
  {
    id: "3",
    zone: "ZONE-PRIMAIRE-2",
    departement: "ATLANTIQUE",
    livreur: "",
    statut: "Actif",
    creeLe: "mar. 13 août 2024 18:02",
    creePar: "support@lahamarchand.com",
    modifieLe: "",
    residents: 0,
    couverture: "",
  },
  {
    id: "4",
    zone: "ZONE-PRIMAIRE-3",
    departement: "ATLANTIQUE",
    livreur: "",
    statut: "Actif",
    creeLe: "mar. 13 août 2024 18:03",
    creePar: "support@lahamarchand.com",
    modifieLe: "",
    residents: 0,
    couverture: "",
  },
  {
    id: "5",
    zone: "ZONE-PRIMAIRE-4",
    departement: "ATLANTIQUE",
    livreur: "",
    statut: "Actif",
    creeLe: "mar. 13 août 2024 18:04",
    creePar: "support@lahamarchand.com",
    modifieLe: "",
    residents: 0,
    couverture: "",
  },
]

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>(mockZones)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState("Tous les statuts")
  const [departementFilter, setDepartementFilter] = useState("Tous les départements")
  const [itemsPerPage, setItemsPerPage] = useState("20")

  const [formData, setFormData] = useState({
    departement: "",
    zone: "",
    couverture: "",
    livreur: "Aucun",
    statut: "Actif",
  })

  const handleRefresh = () => {
    console.log("[v0] Refreshing zones...")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const filteredZones = zones.filter((zone) => {
    const matchesSearch = zone.zone.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "Tous les statuts" || zone.statut === statusFilter
    const matchesDepartement = departementFilter === "Tous les départements" || zone.departement === departementFilter
    return matchesSearch && matchesStatus && matchesDepartement
  })

  const handleSubmit = () => {
    console.log("[v0] Submitting zone:", formData)
    setShowAddModal(false)
    setFormData({ departement: "", zone: "", couverture: "", livreur: "Aucun", statut: "Actif" })
  }

  const handleClose = () => {
    setShowAddModal(false)
    setFormData({ departement: "", zone: "", couverture: "", livreur: "Aucun", statut: "Actif" })
  }

  return (
    <DashboardLayout title="Les zones" breadcrumb="Tableau de bord - Départements" >
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Les zones</h2>
            <div className="flex items-center space-x-2">
              <button onClick={handleRefresh} className="p-2 hover:bg-gray-100 rounded-lg" title="Actualiser">
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={handleFullscreen} className="p-2 hover:bg-gray-100 rounded-lg" title="Agrandir">
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les statuts">Tous les statuts</SelectItem>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departementFilter} onValueChange={setDepartementFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les départements">Tous les départements</SelectItem>
                    <SelectItem value="ATLANTIQUE">ATLANTIQUE</SelectItem>
                    <SelectItem value="LITTORAL">LITTORAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                Zone +
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input
                  placeholder=""
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">ZONE</th>
                  <th className="text-left p-4 font-medium text-gray-700">DÉPARTEMENT</th>
                  <th className="text-left p-4 font-medium text-gray-700">LIVREUR</th>
                  <th className="text-left p-4 font-medium text-gray-700">STATUT</th>
                  <th className="text-left p-4 font-medium text-gray-700">CRÉÉ LE</th>
                  <th className="text-left p-4 font-medium text-gray-700">CRÉÉ PAR</th>
                  <th className="text-left p-4 font-medium text-gray-700">MODIFIÉ LE</th>
                  <th className="text-left p-4 font-medium text-gray-700">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredZones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">{zone.zone}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Modifié le {zone.modifieLe || "Invalid date"}</div>
                      <div className="text-sm text-gray-500">Résidents {zone.residents}</div>
                      {zone.couverture && (
                        <div className="text-sm text-gray-500 mt-1">Couverture {zone.couverture}</div>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">{zone.departement}</td>
                    <td className="p-4 text-gray-600">{zone.livreur || "-"}</td>
                    <td className="p-4">
                      <Badge className="bg-green-100 text-green-800 border-green-200">{zone.statut}</Badge>
                    </td>
                    <td className="p-4 text-gray-600">{zone.creeLe}</td>
                    <td className="p-4 text-gray-600">{zone.creePar}</td>
                    <td className="p-4 text-gray-600">{zone.modifieLe || "-"}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-orange-500 hover:bg-orange-50 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">Affichage de 1 à 20 sur 58 éléments</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Premier
              </Button>
              <Button variant="outline" size="sm" disabled>
                Précédent
              </Button>
              <Button variant="outline" size="sm" className="bg-indigo-600 text-white">
                1
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Ajouter une zone</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departement">Département :</Label>
                  <Select
                    value={formData.departement}
                    onValueChange={(value) => setFormData({ ...formData, departement: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez le département" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATLANTIQUE">ATLANTIQUE</SelectItem>
                      <SelectItem value="LITTORAL">LITTORAL</SelectItem>
                      <SelectItem value="ZOU">ZOU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zone">Zone :</Label>
                  <Input
                    id="zone"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="couverture">Couverture :</Label>
                <Textarea
                  id="couverture"
                  placeholder="Localités couvertes"
                  value={formData.couverture}
                  onChange={(e) => setFormData({ ...formData, couverture: e.target.value })}
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="livreur">Livreur :</Label>
                  <Select
                    value={formData.livreur}
                    onValueChange={(value) => setFormData({ ...formData, livreur: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aucun">Aucun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statut">Statut:</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                Enregistrer
                <div className="w-4 h-4 border border-white rounded-sm"></div>
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
              >
                Fermer ×
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
