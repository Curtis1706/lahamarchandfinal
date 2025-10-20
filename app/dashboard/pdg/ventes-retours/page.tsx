"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Filter, Plus, RotateCcw, Calendar } from "lucide-react"

export default function VentesRetoursPage() {
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState("20")

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Ventes & retours</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Ventes & retours
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Commandes</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
              0 <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Ventes</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
              0 <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Retours</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
              0 <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">En dépôts</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-indigo-600 text-white hover:bg-indigo-700">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtre compte
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filtre</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Compte :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="partenaire">Partenaire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Département :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les départements" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les départements</SelectItem>
                            <SelectItem value="atlantique">Atlantique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Zone :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes les zones" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les zones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Client :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les clients" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les clients</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button className="bg-indigo-600 hover:bg-indigo-700">Appliquer ✓</Button>
                      <Button variant="outline">Remise à zéro ✗</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showSaleModal} onOpenChange={setShowSaleModal}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Vente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Enregistrer une vente</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Form Fields */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Département :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les départements" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les départements</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Zone :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes les zones" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les zones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Client :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client1">Client 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Choix de la catégorie</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes catégories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes catégories</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Choix de la Matière</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes matières" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes matières</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Choix de la classe</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes classes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Choix du livre</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un livre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="livre1">Livre 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantité</Label>
                        <Input type="number" defaultValue="0" />
                      </div>
                      <div className="flex items-end">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 w-full">Ajouter ⌄</Button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-medium">Livre</th>
                            <th className="text-left p-3 font-medium">Prix</th>
                            <th className="text-left p-3 font-medium">Quantité</th>
                            <th className="text-left p-3 font-medium">Montant</th>
                            <th className="text-left p-3 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={5} className="text-center p-8 text-gray-500">
                              Aucune donnée disponible dans le tableau
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-semibold">Total: - XOF</p>
                    </div>

                    <div>
                      <Label>Observation</Label>
                      <Textarea className="mt-1" rows={3} />
                    </div>

                    <div>
                      <Label>Mode de paiement</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une méthode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Espèces</SelectItem>
                          <SelectItem value="card">Carte</SelectItem>
                          <SelectItem value="transfer">Virement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button className="bg-indigo-600 hover:bg-indigo-700">Enregistrer</Button>
                      <Button variant="outline" onClick={() => setShowSaleModal(false)}>
                        Fermer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retour produit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Enregistrer un retour de livres</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Same form structure as sale modal but for returns */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Département :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les départements" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les départements</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Zone :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes les zones" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les zones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Client :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client1">Client 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Choix de la catégorie</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes catégories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes catégories</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Choix de la Matière</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes matières" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes matières</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Choix de la classe</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes classes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Choix du livre</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un livre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="livre1">Livre 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantité</Label>
                        <Input type="number" defaultValue="0" />
                      </div>
                      <div className="flex items-end">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 w-full">Ajouter ⌄</Button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-medium">Livre</th>
                            <th className="text-left p-3 font-medium">Prix</th>
                            <th className="text-left p-3 font-medium">Quantité</th>
                            <th className="text-left p-3 font-medium">Montant</th>
                            <th className="text-left p-3 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={5} className="text-center p-8 text-gray-500">
                              Aucune donnée disponible dans le tableau
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-semibold">Total: - XOF</p>
                    </div>

                    <div>
                      <Label>Observation</Label>
                      <Textarea className="mt-1" rows={3} />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button className="bg-indigo-600 hover:bg-indigo-700">Enregistrer</Button>
                      <Button variant="outline" onClick={() => setShowReturnModal(false)}>
                        Fermer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <Select defaultValue="all-methods">
              <SelectTrigger>
                <SelectValue placeholder="Toutes les méthodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-methods">Toutes les méthodes</SelectItem>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-900">QTÉ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">MONTANT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">STATUT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">COMPTE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">PAIEMENTS</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">MÉTHODE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">CRÉÉ LE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">VALIDÉ PAR</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">MODIFIÉ LE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
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
