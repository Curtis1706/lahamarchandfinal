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

export default function NiveauStockPage() {
  const [open, setOpen] = useState(false)

  const handleRefresh = () => {
      }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div>
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
                  <SelectValue placeholder="Par quantité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="croissant">Croissant</SelectItem>
                  <SelectItem value="decroissant">Décroissant</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les stocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les stocks</SelectItem>
                  <SelectItem value="en-stock">En stock</SelectItem>
                  <SelectItem value="en-depot">En dépôt</SelectItem>
                </SelectContent>
              </Select>

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
                  <SelectValue placeholder="Tous les livre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les livres</SelectItem>
                  <SelectItem value="livre1">Réussir en Dictée Orthographe CE1-CE2</SelectItem>
                  <SelectItem value="livre2">Coffret Réussir en Français CE2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lecture seule: aucune action d'approvisionnement */}
            <div className="flex justify-end">
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
                    <th className="text-left p-4">RENTRÉE</th>
                    <th className="text-left p-4">VACANCES</th>
                    <th className="text-left p-4">DÉPÔT</th>
                    <th className="text-left p-4">TOTAL</th>
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
                    <td className="p-4">0</td>
                    <td className="p-4">0</td>
                    <td className="p-4 text-gray-400">—</td>
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

      {/* Lecture seule: modale d'approvisionnement retirée */}
    </div>
  )
}
