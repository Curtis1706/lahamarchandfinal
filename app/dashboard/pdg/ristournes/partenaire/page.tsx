"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter } from "lucide-react"

export default function RistournePartenairePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState("20")

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Ristournes Partenaire</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Ristournes Partenaire
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Versements</h3>
            <div className="text-2xl font-bold text-gray-900">
              0 <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Retraits</h3>
            <div className="text-2xl font-bold text-gray-900">
              0 <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Solde</h3>
            <div className="text-2xl font-bold text-gray-900">
              0 <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded">
                <span className="text-gray-400">↻</span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <span className="text-gray-400">⛶</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <Input type="text" defaultValue="22 août 2025 - 20 sept. 2025" className="flex-1" />
            </div>
            <Select defaultValue="all-status">
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">Tous les statuts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mb-6">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Filter className="w-4 h-4 mr-2" />
              Appliquer
            </Button>
          </div>

          {/* Table Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
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

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Rechercher:</span>
              <Input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">RÉFÉRENCE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">PARTENAIRE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">VERSEMENT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">RETRAIT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">STATUT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">CRÉÉ LE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Aucune donnée disponible dans le tableau
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">Affichage de 0 à 0 sur 0 éléments</p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Premier
              </Button>
              <Button variant="outline" size="sm">
                Précédent
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
    </>
  )
}
