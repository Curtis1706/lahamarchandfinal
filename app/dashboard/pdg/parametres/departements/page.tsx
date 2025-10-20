"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Maximize2, Edit, Trash2 } from "lucide-react"


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

const mockDepartments: Department[] = [
  {
    id: "1",
    nom: "ZOU",
    responsable: "",
    chef: "",
    statut: "Actif",
    description: "",
    creeLe: "jeu. 13 juin 2024 12:15",
    creePar: "",
    modifieLe: "Invalid date",
    residents: 160,
  },
  {
    id: "2",
    nom: "LITTORAL",
    responsable: "",
    chef: "",
    statut: "Actif",
    description: "",
    creeLe: "jeu. 13 juin 2024 12:15",
    creePar: "",
    modifieLe: "Invalid date",
    residents: 0,
  },
  {
    id: "3",
    nom: "ATLANTIQUE",
    responsable: "Responsable De Département (ABIOLA Espédit)",
    chef: "",
    statut: "Actif",
    description: "",
    creeLe: "jeu. 13 juin 2024 12:15",
    creePar: "",
    modifieLe: "Invalid date",
    residents: 0,
  },
  {
    id: "4",
    nom: "MONO",
    responsable: "",
    chef: "",
    statut: "Actif",
    description: "",
    creeLe: "mar. 18 juin 2024 16:34",
    creePar: "",
    modifieLe: "Invalid date",
    residents: 0,
  },
  {
    id: "5",
    nom: "COUFFO",
    responsable: "",
    chef: "",
    statut: "Actif",
    description: "",
    creeLe: "mar. 18 juin 2024 16:35",
    creePar: "",
    modifieLe: "Invalid date",
    residents: 0,
  },
]

export default function DepartementsPage() {
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState("Tous les statuts")
  const [responsableFilter, setResponsableFilter] = useState("Tous les responsables")
  const [chefFilter, setChefFilter] = useState("Tous les chefs")
  const [itemsPerPage, setItemsPerPage] = useState("20")

  const [formData, setFormData] = useState({
    nom: "",
    responsable: "Aucun",
    statut: "Actif",
    description: "",
  })

  const handleRefresh = () => {
    console.log("[v0] Refreshing departments...")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch = dept.nom.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "Tous les statuts" || dept.statut === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSubmit = () => {
    console.log("[v0] Submitting department:", formData)
    setShowAddModal(false)
    setFormData({ nom: "", responsable: "Aucun", statut: "Actif", description: "" })
  }

  const handleClose = () => {
    setShowAddModal(false)
    setFormData({ nom: "", responsable: "Aucun", statut: "Actif", description: "" })
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
            <span className="text-sm text-slate-300">
              Tableau de bord - Départements
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Les départements</h2>
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
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                Département +
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
                  <th className="text-left p-4 font-medium text-gray-700">NOM</th>
                  <th className="text-left p-4 font-medium text-gray-700">RESPONSABLE</th>
                  <th className="text-left p-4 font-medium text-gray-700">CHEF</th>
                  <th className="text-left p-4 font-medium text-gray-700">STATUT</th>
                  <th className="text-left p-4 font-medium text-gray-700">DESCRIPTION</th>
                  <th className="text-left p-4 font-medium text-gray-700">CRÉÉ LE</th>
                  <th className="text-left p-4 font-medium text-gray-700">CRÉÉ PAR</th>
                  <th className="text-left p-4 font-medium text-gray-700">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">{dept.nom}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Modifié le {dept.modifieLe}</div>
                      <div className="text-sm text-gray-500">Résidents {dept.residents}</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {dept.responsable || "-"}
                      {dept.responsable && <div className="text-sm text-gray-500">espeditssey@gmail.com</div>}
                    </td>
                    <td className="p-4 text-gray-600">{dept.chef || "-"}</td>
                    <td className="p-4">
                      <Badge className="bg-green-100 text-green-800 border-green-200">{dept.statut}</Badge>
                    </td>
                    <td className="p-4 text-gray-600">{dept.description || "-"}</td>
                    <td className="p-4 text-gray-600">{dept.creeLe}</td>
                    <td className="p-4 text-gray-600">{dept.creePar || "-"}</td>
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
            <div className="text-sm text-gray-600">Affichage de 1 à 14 sur 14 éléments</div>
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
              <Button variant="outline" size="sm" disabled>
                Suivant
              </Button>
              <Button variant="outline" size="sm" disabled>
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
              <h3 className="text-lg font-semibold">Ajouter un département</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom du département :</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="responsable">Responsable:</Label>
                  <Select
                    value={formData.responsable}
                    onValueChange={(value) => setFormData({ ...formData, responsable: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aucun">Aucun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div></div>
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

              <div>
                <Label htmlFor="description">Description :</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 min-h-[100px]"
                />
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
    </>
  )
}
