"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Maximize2 } from "lucide-react"


export default function EffectifsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState("20")

  const [formData, setFormData] = useState({
    departement: "",
    zone: "",
    ecole: "",
    classe: "",
    effectif: "0",
  })

  const handleRefresh = () => {
    console.log("[v0] Refreshing effectifs...")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleSubmit = () => {
    console.log("[v0] Submitting effectif:", formData)
    setShowAddModal(false)
    setFormData({ departement: "", zone: "", ecole: "", classe: "", effectif: "0" })
  }

  const handleClose = () => {
    setShowAddModal(false)
    setFormData({ departement: "", zone: "", ecole: "", classe: "", effectif: "0" })
  }

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Effectifs</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Effectifs
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Les effectifs</h2>
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
              <Button
                variant="outline"
                className="bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
              >
                Filtre
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                  />
                </svg>
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                Effectif +
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
                  <th className="text-left p-4 font-medium text-gray-700">CLASSE</th>
                  <th className="text-left p-4 font-medium text-gray-700">EFFECTIF</th>
                  <th className="text-left p-4 font-medium text-gray-700">ÉCOLE</th>
                  <th className="text-left p-4 font-medium text-gray-700">DÉPARTEMENT</th>
                  <th className="text-left p-4 font-medium text-gray-700">ZONE</th>
                  <th className="text-left p-4 font-medium text-gray-700">CRÉÉ LE</th>
                  <th className="text-left p-4 font-medium text-gray-700">CRÉÉ PAR</th>
                  <th className="text-left p-4 font-medium text-gray-700">MODIFIÉ LE</th>
                  <th className="text-left p-4 font-medium text-gray-700">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    Aucune donnée disponible dans le tableau
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">Affichage de 0 à 0 sur 0 éléments</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Premier
              </Button>
              <Button variant="outline" size="sm" disabled>
                Précédent
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
              <h3 className="text-lg font-semibold">Ajouter un effectif</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departement">Département:</Label>
                  <Select
                    value={formData.departement}
                    onValueChange={(value) => setFormData({ ...formData, departement: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATLANTIQUE">ATLANTIQUE</SelectItem>
                      <SelectItem value="LITTORAL">LITTORAL</SelectItem>
                      <SelectItem value="ZOU">ZOU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zone">Zone:</Label>
                  <Select value={formData.zone} onValueChange={(value) => setFormData({ ...formData, zone: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner une zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZONE-PRIMAIRE-1">ZONE-PRIMAIRE-1</SelectItem>
                      <SelectItem value="ZONE-PRIMAIRE-2">ZONE-PRIMAIRE-2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="ecole">École:</Label>
                <Select value={formData.ecole} onValueChange={(value) => setFormData({ ...formData, ecole: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une écoles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="École Primaire A">École Primaire A</SelectItem>
                    <SelectItem value="École Primaire B">École Primaire B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="classe">Classe:</Label>
                  <Select
                    value={formData.classe}
                    onValueChange={(value) => setFormData({ ...formData, classe: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CP1">CP1</SelectItem>
                      <SelectItem value="CP2">CP2</SelectItem>
                      <SelectItem value="CE1">CE1</SelectItem>
                      <SelectItem value="CE2">CE2</SelectItem>
                      <SelectItem value="CM1">CM1</SelectItem>
                      <SelectItem value="CM2">CM2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="effectif">Effectif :</Label>
                  <Input
                    id="effectif"
                    type="number"
                    value={formData.effectif}
                    onChange={(e) => setFormData({ ...formData, effectif: e.target.value })}
                    className="mt-1"
                  />
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
    </>
  )
}
