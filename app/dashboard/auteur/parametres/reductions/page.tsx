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

const mockReductions: Reduction[] = [
  {
    id: "1",
    client: "Librairie",
    livre: "Tous les livres",
    quantiteMin: 10,
    reduction: 100,
    statut: "Actif",
    creeLe: "ven. 3 janv. 2025 11:03",
    creePar: "billfass2010@gmail.com",
    description: "",
    type: "Montant",
    image: "/communication-book.jpg",
  },
  {
    id: "2",
    client: "Librairie",
    livre: "Tous les livres",
    quantiteMin: 30,
    reduction: 200,
    statut: "Actif",
    creeLe: "ven. 3 janv. 2025 11:03",
    creePar: "billfass2010@gmail.com",
    description: "",
    type: "Montant",
    image: "/communication-book.jpg",
  },
  {
    id: "3",
    client: "Librairie",
    livre: "Tous les livres",
    quantiteMin: 50,
    reduction: 300,
    statut: "Actif",
    creeLe: "ven. 3 janv. 2025 11:03",
    creePar: "billfass2010@gmail.com",
    description: "",
    type: "Montant",
    image: "/communication-book.jpg",
  },
  {
    id: "4",
    client: "Librairie",
    livre: "Communication Écrite 4/3ème",
    quantiteMin: 10,
    reduction: 50,
    statut: "Actif",
    creeLe: "ven. 3 janv. 2025 11:03",
    creePar: "billfass2010@gmail.com",
    description: "",
    type: "Montant",
    image: "/communication-book.jpg",
  },
  {
    id: "5",
    client: "Librairie",
    livre: "Communication Écrite 4/3ème",
    quantiteMin: 30,
    reduction: 150,
    statut: "Actif",
    creeLe: "ven. 3 janv. 2025 11:03",
    creePar: "billfass2010@gmail.com",
    description: "",
    type: "Montant",
    image: "/communication-book.jpg",
  },
]

export default function ReductionsPage() {
  const [reductions, setReductions] = useState<Reduction[]>(mockReductions)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [clientFilter, setClientFilter] = useState("Tous les clients")
  const [statusFilter, setStatusFilter] = useState("Tous les statuts")
  const [livreFilter, setLivreFilter] = useState("Tous les livres")
  const [itemsPerPage, setItemsPerPage] = useState("20")

  const [formData, setFormData] = useState({
    livre: "Tous les livres",
    typeClient: "",
    quantiteMinimale: "",
    type: "Pourcentage",
    reduction: "",
    statut: "Actif",
    description: "",
  })

  const handleRefresh = () => {
    console.log("[v0] Refreshing reductions...")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const filteredReductions = reductions.filter((reduction) => {
    const matchesSearch = reduction.livre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "Tous les statuts" || reduction.statut === statusFilter
    const matchesClient = clientFilter === "Tous les clients" || reduction.client === clientFilter
    const matchesLivre = livreFilter === "Tous les livres" || reduction.livre === livreFilter
    return matchesSearch && matchesStatus && matchesClient && matchesLivre
  })

  const handleSubmit = () => {
    console.log("[v0] Submitting reduction:", formData)
    setShowAddModal(false)
    setFormData({
      livre: "Tous les livres",
      typeClient: "",
      quantiteMinimale: "",
      type: "Pourcentage",
      reduction: "",
      statut: "Actif",
      description: "",
    })
  }

  const handleClose = () => {
    setShowAddModal(false)
    setFormData({
      livre: "Tous les livres",
      typeClient: "",
      quantiteMinimale: "",
      type: "Pourcentage",
      reduction: "",
      statut: "Actif",
      description: "",
    })
  }

  return (
    <DashboardLayout title="Les réductions" breadcrumb="Tableau de bord - Clients" >
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Les réductions</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">Tableau de bord - Clients</span>
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
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" className="bg-indigo-600 text-white hover:bg-indigo-700">
                  Importer ↑
                </Button>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                Réduction +
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous les clients">Tous les clients</SelectItem>
                  <SelectItem value="Librairie">Librairie</SelectItem>
                </SelectContent>
              </Select>
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
              <Select value={livreFilter} onValueChange={setLivreFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous les livres">Tous les livres</SelectItem>
                  <SelectItem value="Communication Écrite 4/3ème">Communication Écrite 4/3ème</SelectItem>
                </SelectContent>
              </Select>
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
                  <th className="text-left p-4 font-medium text-gray-700">CLIENT</th>
                  <th className="text-left p-4 font-medium text-gray-700">LIVRE(S)</th>
                  <th className="text-left p-4 font-medium text-gray-700">QUANTITÉ (MIN)</th>
                  <th className="text-left p-4 font-medium text-gray-700">RÉDUCTION</th>
                  <th className="text-left p-4 font-medium text-gray-700">STATUT</th>
                  <th className="text-left p-4 font-medium text-gray-700">CRÉÉ LE</th>
                  <th className="text-left p-4 font-medium text-gray-700">CRÉÉ PAR</th>
                  <th className="text-left p-4 font-medium text-gray-700">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReductions.map((reduction) => (
                  <tr key={reduction.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">{reduction.client}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Modifié le Invalid date</div>
                      <div className="text-sm text-gray-500">Description</div>
                      <div className="text-sm text-gray-500">Type {reduction.type}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={reduction.image || "/placeholder.svg"}
                          alt={reduction.livre}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <span className="text-blue-600 font-medium">{reduction.livre}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{reduction.quantiteMin}</td>
                    <td className="p-4 text-gray-600">{reduction.reduction} F CFA</td>
                    <td className="p-4">
                      <Badge className="bg-green-100 text-green-800 border-green-200">{reduction.statut}</Badge>
                    </td>
                    <td className="p-4 text-gray-600">{reduction.creeLe}</td>
                    <td className="p-4 text-gray-600">{reduction.creePar}</td>
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
            <div className="text-sm text-gray-600">Affichage de 1 à 20 sur 95 éléments</div>
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
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                4
              </Button>
              <Button variant="outline" size="sm">
                5
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
              <h3 className="text-lg font-semibold">Ajouter une réduction</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="livre">Livre :</Label>
                <Select value={formData.livre} onValueChange={(value) => setFormData({ ...formData, livre: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les livres">Tous les livres</SelectItem>
                    <SelectItem value="Communication Écrite 4/3ème">Communication Écrite 4/3ème</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="typeClient">Type de client :</Label>
                  <Select
                    value={formData.typeClient}
                    onValueChange={(value) => setFormData({ ...formData, typeClient: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choisissez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Librairie">Librairie</SelectItem>
                      <SelectItem value="École">École</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantiteMinimale">Quantité minimale :</Label>
                  <Input
                    id="quantiteMinimale"
                    type="number"
                    value={formData.quantiteMinimale}
                    onChange={(e) => setFormData({ ...formData, quantiteMinimale: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">Type :</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pourcentage">Pourcentage</SelectItem>
                      <SelectItem value="Montant">Montant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reduction">Réduction :</Label>
                  <div className="relative mt-1">
                    <Input
                      id="reduction"
                      type="number"
                      value={formData.reduction}
                      onChange={(e) => setFormData({ ...formData, reduction: e.target.value })}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="statut">Statut :</Label>
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
    </DashboardLayout>
  )
}
