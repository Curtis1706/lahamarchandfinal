"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Power, X, Save } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const promotions = [
  {
    id: 1,
    libelle: "CAMPAGNE PRIMAIRE 2025",
    code: "PRIMAIRE25",
    periode: "Du jeu. 29 mai 2025 00:00\nAu ven. 29 mai 2026 23:59",
    livre: "Tous les livres",
    statut: "Actif",
    taux: "200 F CFA",
    quantiteMinimale: 1,
  },
  {
    id: 2,
    libelle: "COFFRET SIMPLE",
    code: "COFPRIMAIRE25",
    periode: "Du sam. 10 mai 2025 00:00\nAu lun. 1 juin 2026 23:59",
    livre: "Tous les livres",
    statut: "Actif",
    taux: "350 F CFA",
    quantiteMinimale: 1,
  },
  {
    id: 3,
    libelle: "COFFRET ANNALES",
    code: "ANLPRIMAIRE25",
    periode: "Au lun. 1 juin 2026 23:59",
    livre: "Tous les livres",
    statut: "Actif",
    taux: "300 F CFA",
    quantiteMinimale: 1,
  },
]

export default function CodePromoPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleRefresh = () => {
    console.log("[v0] Refreshing promo codes data...")
  }

  const filteredPromotions = promotions.filter(
    (promo) =>
      promo.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      {/* En-tête bleu */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Code Promo</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Code Promo
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-4 lg:p-6">
            {/* Header Actions */}
            <div className="flex justify-start mb-6">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setIsModalOpen(true)}
              >
                Ajouter +
              </Button>
            </div>

            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="20">
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

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input
                  placeholder=""
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Libellé</th>
                    <th className="text-left py-3 px-2">Code</th>
                    <th className="text-left py-3 px-2">Période</th>
                    <th className="text-left py-3 px-2">Livre</th>
                    <th className="text-left py-3 px-2">Statut</th>
                    <th className="text-left py-3 px-2">Taux</th>
                    <th className="text-left py-3 px-2">Quantité minimale</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromotions.map((promo) => (
                    <tr key={promo.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">{promo.libelle}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-sm">{promo.code}</td>
                      <td className="py-3 px-2 text-sm whitespace-pre-line">{promo.periode}</td>
                      <td className="py-3 px-2 text-sm">{promo.livre}</td>
                      <td className="py-3 px-2">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {promo.statut}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm">{promo.taux}</td>
                      <td className="py-3 px-2 text-center">{promo.quantiteMinimale}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Edit className="w-4 h-4 text-orange-500" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Power className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <p className="text-sm text-gray-600">Affichage de 1 à 3 sur 3 éléments</p>

              <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Modale Ajouter */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Enregistrement du code promo
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm mb-1">Libellé du code promo</label>
              <Input placeholder="Nom du code promo" />
            </div>
            <div>
              <label className="block text-sm mb-1">Statut</label>
              <Select defaultValue="Actif">
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
              <label className="block text-sm mb-1">Code promo</label>
              <Input placeholder="CODE PROMO" />
            </div>
            <div>
              <label className="block text-sm mb-1">Quantité minimale</label>
              <Input type="number" defaultValue={1} />
            </div>
            <div>
              <label className="block text-sm mb-1">Type de taux</label>
              <Select defaultValue="Pourcentage">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pourcentage">Pourcentage</SelectItem>
                  <SelectItem value="Montant">Montant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Taux de réduction</label>
              <div className="flex">
                <Input placeholder="Taux de réduction" className="rounded-r-none" />
                <span className="px-3 py-2 border border-l-0 rounded-r-md bg-gray-50">%</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Lié à un livre</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Tous les livres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les livres</SelectItem>
                  <SelectItem value="livre1">Livre 1</SelectItem>
                  <SelectItem value="livre2">Livre 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Fuseau horaire</label>
              <Select defaultValue="gmt+1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmt+1">(GMT +1:00)</SelectItem>
                  <SelectItem value="gmt+0">(GMT +0:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Date d'activation</label>
              <Input type="date" />
            </div>
            <div>
              <label className="block text-sm mb-1">Date d'expiration</label>
              <Input type="date" />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-4 h-4 mr-1" />
              Fermer
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Save className="w-4 h-4 mr-1" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
