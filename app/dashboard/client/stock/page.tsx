"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Package,
  FileText,
  Users,
  BookOpen,
  Printer,
  X,
} from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function NiveauStockPage() {
  const [open, setOpen] = useState(false)

  const handleRefresh = () => {
    console.log("[v0] Refreshing table data...")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <DashboardLayout title="">
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Niveau de stock</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Niveau de stock
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">En stock</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">0</div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">En dépôt</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">0</div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">0</div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes catégories</SelectItem>
                  <SelectItem value="primaire">Primaire</SelectItem>
                  <SelectItem value="secondaire">Secondaire</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes classes</SelectItem>
                  <SelectItem value="ce1">CE1</SelectItem>
                  <SelectItem value="ce2">CE2</SelectItem>
                  <SelectItem value="cm1">CM1</SelectItem>
                  <SelectItem value="cm2">CM2</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes matières" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes matières</SelectItem>
                  <SelectItem value="francais">Français</SelectItem>
                  <SelectItem value="mathematiques">Mathématiques</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous statuts</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="epuise">Épuisé</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les livres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les livres</SelectItem>
                  <SelectItem value="livre1">Réussir en Dictée Orthographe CE1-CE2</SelectItem>
                  <SelectItem value="livre2">Coffret Réussir en Français CE2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center">

              <Button className="bg-indigo-600 hover:bg-indigo-700">Appliquer</Button>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Stock par produit</h3>
            </div>

            {/* Table Controls */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Afficher</span>
                  <Select defaultValue="20">
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

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Rechercher:</span>
                  <Input placeholder="Rechercher..." className="w-64" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4">LIVRE</th>
                    <th className="text-left p-4">DÉPÔT</th>
                    <th className="text-left p-4">MONTANT</th>
                    <th className="text-left p-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm">Philosophie Tle Bac Facile TOME 2</span>
                      </div>
                    </td>
                    <td className="p-4">0</td>
                    <td className="p-4">0</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded text-red-500">
                          <Package className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-6 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Affichage de 1 à 1 sur 1 éléments</p>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Premier
                  </Button>
                  <Button variant="outline" size="sm">
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

            {/* Export Buttons */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end space-x-2">
                <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                  PDF
                </Button>
                <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                  EXCEL
                </Button>
                <Button variant="outline">
                  <Printer className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modale Approvisionner (strictement la modale, page inchangée) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="flex items-start justify-between p-0">
            <DialogTitle className="text-2xl font-medium py-4">Approvisionnement</DialogTitle>
            
          </DialogHeader>

          {/* Top selects with labels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Choix de la catégorie</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes catégories</SelectItem>
                  <SelectItem value="primaire">Primaire</SelectItem>
                  <SelectItem value="secondaire">Secondaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Choix de la Matière</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes matières" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="francais">Français</SelectItem>
                  <SelectItem value="mathematiques">Mathématiques</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Choix de la classe</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes classes</SelectItem>
                  <SelectItem value="ce1">CE1</SelectItem>
                  <SelectItem value="ce2">CE2</SelectItem>
                  <SelectItem value="cm1">CM1</SelectItem>
                  <SelectItem value="cm2">CM2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Choix du livre / Quantité / Ajouter */}
          <div className="grid grid-cols-12 gap-4 items-end mb-4">
            <div className="col-span-7">
              <label className="block text-sm font-medium text-gray-700 mb-2">Choix du livre</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un livre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="livre1">Réussir en Dictée Orthographe CE1-CE2</SelectItem>
                  <SelectItem value="livre2">Coffret Réussir en Français CE2</SelectItem>
                  <SelectItem value="livre3">Coffret Réussir en Mathématiques CE1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
              <Input type="number" defaultValue={0} />
            </div>

            <div className="col-span-2">
              <div className="w-full">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Ajouter ▾</Button>
              </div>
            </div>
          </div>

          {/* Auto button under left area */}
          <div className="mb-4">
            <Button className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2">Auto</Button>
          </div>

          <hr className="my-4 border-t border-gray-200" />

          {/* Table + Total */}
          <div className="relative mb-6">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="p-3">Livre</th>
                  <th className="p-3">Prix</th>
                  <th className="p-3">Quantité</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 text-sm text-gray-400">Aucun livre ajouté</td>
                  <td className="p-3">-</td>
                  <td className="p-3">-</td>
                  <td className="p-3">-</td>
                  <td className="p-3">-</td>
                </tr>
              </tbody>
            </table>

            {/* Total on the right, matching the screenshot size/placement */}
            <div className="absolute right-0 top-0 text-2xl md:text-3xl font-semibold text-gray-700 mt-6 mr-2">
              Total: 0 XOF
            </div>
          </div>

          {/* Stock select and footer buttons */}
          <div className="flex items-center justify-between gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock :</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Rentrée scolaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rentree">Rentrée scolaire</SelectItem>
                  <SelectItem value="vacances">Vacances</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-3">
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700">Enregistrer</Button>
              <Button
                variant="outline"
                className="border border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setOpen(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
