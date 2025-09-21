"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Filter,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Package,
  User,
  LogOut,
  Bell,
  ChevronDown,
  X,
  Printer,
} from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"

export default function CommandesPage() {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

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
    <DashboardLayout title=''>
       <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Les commandes</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">Tableau de bord - Les commandes</span>

          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Toolbar */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtre compte
                </Button>

                <Dialog open={showCreateOrderModal} onOpenChange={setShowCreateOrderModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Commande
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Création de nouvelle commande</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Client Selection */}
                      <div>
                        <Label>Sélectionner le client</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client1">ECOLE CONTRACTUELLE</SelectItem>
                            <SelectItem value="client2">EPP AZALO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Form Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Choix de la catégorie</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="primaire">Primaire</SelectItem>
                              <SelectItem value="secondaire">Secondaire</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Choix de la Matière</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez une matière" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="francais">Français</SelectItem>
                              <SelectItem value="mathematiques">Mathématiques</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Choix de la classe</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez la classe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ce1">CE1</SelectItem>
                              <SelectItem value="ce2">CE2</SelectItem>
                              <SelectItem value="cm1">CM1</SelectItem>
                              <SelectItem value="cm2">CM2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Choix du livre</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un livre" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="livre1">Réussir en Dictée Orthographe CE1-CE2</SelectItem>
                              <SelectItem value="livre2">Coffret Réussir en Français CE2</SelectItem>
                              <SelectItem value="livre3">Réussir en Mathématiques CE1</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Quantité</Label>
                          <Input type="number" placeholder="0" />
                        </div>

                        <div className="flex items-end">
                          <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                            Ajouter <ChevronDown className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>

                      <Button variant="outline" className="bg-indigo-600 text-white hover:bg-indigo-700">
                        Auto
                      </Button>

                      {/* Order Table */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left p-3">Livre</th>
                                <th className="text-left p-3">Prix</th>
                                <th className="text-left p-3">Quantité</th>
                                <th className="text-left p-3">Montant</th>
                                <th className="text-left p-3">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                  Aucune commande ajoutée
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-semibold">Total: 0 XOF</p>
                      </div>

                      {/* Bottom Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Code promo</Label>
                          <div className="flex gap-2">
                            <Input placeholder="CODE PROMO" className="flex-1" />
                            <Button className="bg-indigo-600 hover:bg-indigo-700">Appliquer</Button>
                          </div>
                        </div>

                        <div>
                          <Label>Type de commande</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Commande pour la rentrée scolaire" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="commande">Commande</SelectItem>
                              <SelectItem value="precommande">Précommande</SelectItem>
                              <SelectItem value="depot">Dépôt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Delivery coordination section */}
                      <div className="bg-black text-white p-4 rounded-lg">
                        <h3 className="font-semibold text-center">Coordonnées de Livraison</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Date de livraison</Label>
                          <Input type="date" defaultValue="2025-09-20" />
                        </div>
                        <div>
                          <Label>Plage horaire</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">De</span>
                            <Input type="time" defaultValue="07:00" className="flex-1" />
                            <span className="text-sm">à</span>
                            <Input type="time" defaultValue="19:00" className="flex-1" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Adresse de livraison</Label>
                        <textarea
                          className="w-full p-3 border rounded-lg resize-none"
                          rows={3}
                          placeholder="Adresse de livraison"
                        />
                      </div>

                      <div>
                        <Label>Sélectionnez Mode de paiement</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez mode de règlement" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mtn-benin">MTN Benin (Mobile Money)</SelectItem>
                            <SelectItem value="autre-reseau">Autre réseau (Moov, Celtiis, ...)</SelectItem>
                            <SelectItem value="depot-stock">Dépôt de stock</SelectItem>
                            <SelectItem value="momopay">MomoPay (Paiement comptant)</SelectItem>
                            <SelectItem value="carte-bancaire">Carte bancaire</SelectItem>
                            <SelectItem value="cheque-virement">Chèque/Virement</SelectItem>
                            <SelectItem value="reapprovisionnement">Réapprovisionnement</SelectItem>
                            <SelectItem value="proform">Proform</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-4 pt-4">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1">
                          Enregistrer <Package className="w-4 h-4 ml-2" />
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => setShowCreateOrderModal(false)}
                        >
                          Fermer <X className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>


            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 w-full"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">20 juin 2025 - 20 sept. 2025</span>
              </button>
            </div>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="commande">Commande</SelectItem>
                <SelectItem value="precommande">Précommande</SelectItem>
                <SelectItem value="depot">Dépôt</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="commande">Commande</SelectItem>
                <SelectItem value="precommande">Précommande</SelectItem>
                <SelectItem value="depot">Dépôt</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les méthodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les méthodes</SelectItem>
                <SelectItem value="mtn-benin">MTN Benin (Mobile Money)</SelectItem>
                <SelectItem value="autre-reseau">Autre réseau (Moov, Celtis, ...)</SelectItem>
                <SelectItem value="depot-stock">Dépôt de stock</SelectItem>
                <SelectItem value="momopay">MomoPay (Paiement comptant)</SelectItem>
                <SelectItem value="carte-bancaire">Carte bancaire</SelectItem>
                <SelectItem value="cheque-virement">Chèque/Virement</SelectItem>
                <SelectItem value="reapprovisionnement">Réapprovisionnement</SelectItem>
                <SelectItem value="proform">Proform</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Vacances et rentrée scolaire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cours-vacances">Cours de vacances</SelectItem>
                <SelectItem value="rentree-scolaire">Rentrée scolaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Filter className="w-4 h-4 mr-2" />
              Appliquer
            </Button>
          </div>
        </div>

        {/* Table Controls */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Afficher</span>
              <Select defaultValue="25">
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
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
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Référence</th>
                <th className="text-left p-4">Nbr. livre</th>
                <th className="text-left p-4">Demandé par</th>
                <th className="text-left p-4">Date livraison</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Livraison</th>
                <th className="text-left p-4">État Réception</th>
                <th className="text-left p-4">Paiement</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>2025COM28</span>
                  </div>
                </td>
                <td className="p-4">5</td>
                <td className="p-4">
                  <div>
                    <p>ECOLE CONTRACTUELLE (</p>
                    <p className="text-sm text-gray-500">+22994551975)</p>
                  </div>
                </td>
                <td className="p-4">22/08/2025</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-sm">Commande</span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Validée</span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Livraison partielle</span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Aucune réception</span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Enregistrée</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr className="border-b">
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>2025COM27</span>
                  </div>
                </td>
                <td className="p-4">5</td>
                <td className="p-4">
                  <div>
                    <p>EPP AZALO (</p>
                    <p className="text-sm text-gray-500">+22997648441)</p>
                  </div>
                </td>
                <td className="p-4">25/07/2025</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-sm">Commande</span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Validée</span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">en attente de validation</span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Aucune réception</span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Enregistrée</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreHorizontal className="w-4 h-4" />
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
            <p className="text-sm text-gray-600">Affichage de 1 à 2 sur 2 éléments</p>

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
    </DashboardLayout>
  )
}
