"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Filter, Plus, RotateCcw, Calendar, Eye, TrendingUp, Package, AlertCircle } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"

// Mock data pour les ventes réalisées par le partenaire
const mockSales = [
  {
    id: "V2025001",
    reference: "2025COM28",
    clientName: "ECOLE CONTRACTUELLE",
    clientPhone: "+22994551975",
    qty: 5,
    montant: 125000,
    statut: "Validée",
    compte: "Partenaire",
    paiements: "Payé",
    methode: "Mobile Money",
    creeLe: "2025-01-15",
    validePar: "PDG",
    modifieLe: "2025-01-16",
    items: [
      { livre: "Réussir en Dictée CE1-CE2", quantite: 3, prix: 2500 },
      { livre: "Coffret Français CE2", quantite: 2, prix: 3500 }
    ],
    observation: "Livraison effectuée avec succès",
    type: "vente"
  },
  {
    id: "V2025002", 
    reference: "2025COM27",
    clientName: "EPP AZALO",
    clientPhone: "+22997648441",
    qty: 5,
    montant: 150000,
    statut: "En cours",
    compte: "Partenaire",
    paiements: "En attente",
    methode: "Virement",
    creeLe: "2025-01-10",
    validePar: "PDG",
    modifieLe: "2025-01-12",
    items: [
      { livre: "Réussir en Mathématiques CE1", quantite: 5, prix: 2800 }
    ],
    observation: "Livraison partielle",
    type: "vente"
  },
  {
    id: "R2025001",
    reference: "2025COM28",
    clientName: "ECOLE CONTRACTUELLE", 
    clientPhone: "+22994551975",
    qty: 2,
    montant: -5000,
    statut: "Traité",
    compte: "Partenaire",
    paiements: "Remboursé",
    methode: "Mobile Money",
    creeLe: "2025-01-20",
    validePar: "PDG",
    modifieLe: "2025-01-21",
    items: [
      { livre: "Réussir en Dictée CE1-CE2", quantite: 2, prix: 2500 }
    ],
    observation: "Retour pour défaut d'impression",
    type: "retour"
  }
]

export default function VentesRetoursPage() {
  const { user } = useCurrentUser()
  const [sales, setSales] = useState([])
  const [filteredSales, setFilteredSales] = useState([])
  const [stats, setStats] = useState({
    totalVentes: 0,
    totalRetours: 0,
    montantNet: 0,
    performance: 0
  })
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("tous")
  const [selectedType, setSelectedType] = useState("tous")
  const [selectedMethod, setSelectedMethod] = useState("tous")
  const [itemsPerPage, setItemsPerPage] = useState("20")

  // Charger les ventes
  useEffect(() => {
    loadSales()
  }, [selectedStatus, selectedType, selectedMethod])

  const loadSales = async () => {
    try {
      setIsLoading(true)
      
      const data = await apiClient.getPartenaireSales({ 
        status: selectedStatus === 'tous' ? undefined : selectedStatus,
        type: selectedType === 'tous' ? undefined : selectedType,
        method: selectedMethod === 'tous' ? undefined : selectedMethod
      })
      
      setSales(data.sales)
      setStats(data.stats)
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des ventes:', error)
      setSales([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrer les ventes
  useEffect(() => {
    let filtered = sales

    if (searchTerm) {
      filtered = filtered.filter(sale => 
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.reference.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedStatus !== "tous") {
      filtered = filtered.filter(sale => sale.statut.toLowerCase().includes(selectedStatus.toLowerCase()))
    }

    if (selectedType !== "tous") {
      filtered = filtered.filter(sale => sale.type === selectedType)
    }

    if (selectedMethod !== "tous") {
      filtered = filtered.filter(sale => sale.methode.toLowerCase().includes(selectedMethod.toLowerCase()))
    }

    setFilteredSales(filtered)
  }, [searchTerm, selectedStatus, selectedType, selectedMethod, sales])

  return (
    <div>
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Suivi des ventes réalisées - {user?.name}</h2>
            <p className="text-sm text-slate-300 mt-1">Consultation en lecture seule des ventes liées à vos dépôts</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Rapports simplifiés par période
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total ventes</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalVentes}</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.montantNet.toLocaleString()} <span className="text-sm font-normal">F CFA</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total retours</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalRetours}</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
              0 <span className="text-sm font-normal">F CFA</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Montant net</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{filteredSales.length}</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.montantNet.toLocaleString()} <span className="text-sm font-normal">F CFA</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Performance</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.performance}%</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
              <TrendingUp className="w-5 h-5 inline text-green-600" />
              <span className="text-sm font-normal ml-1">Croissance</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Historique des ventes et retours</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Données en lecture seule</span>
            </div>
          </div>

          {/* Action Buttons - Lecture seule */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-indigo-600 text-white hover:bg-indigo-700">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres avancés
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filtres de consultation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Période :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Cette semaine" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semaine">Cette semaine</SelectItem>
                            <SelectItem value="mois">Ce mois</SelectItem>
                            <SelectItem value="trimestre">Ce trimestre</SelectItem>
                            <SelectItem value="annee">Cette année</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Type d'opération :</Label>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tous">Tous les types</SelectItem>
                            <SelectItem value="vente">Ventes uniquement</SelectItem>
                            <SelectItem value="retour">Retours uniquement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Statut :</Label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les statuts" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tous">Tous les statuts</SelectItem>
                            <SelectItem value="validée">Validées</SelectItem>
                            <SelectItem value="en cours">En cours</SelectItem>
                            <SelectItem value="traité">Traitées</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Méthode de paiement :</Label>
                        <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes les méthodes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tous">Toutes les méthodes</SelectItem>
                            <SelectItem value="mobile">Mobile Money</SelectItem>
                            <SelectItem value="virement">Virement</SelectItem>
                            <SelectItem value="especes">Espèces</SelectItem>
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
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Filtres de consultation</h3>
              <p className="text-sm text-gray-600">Filtrez vos ventes selon vos besoins</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input type="text" defaultValue="22 août 2025 - 20 sept. 2025" className="flex-1" />
              </div>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="validée">Validées</SelectItem>
                  <SelectItem value="en cours">En cours</SelectItem>
                  <SelectItem value="traité">Traitées</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les types</SelectItem>
                  <SelectItem value="vente">Ventes uniquement</SelectItem>
                  <SelectItem value="retour">Retours uniquement</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center">
                <Input 
                  placeholder="Rechercher par référence ou client..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Filter className="w-4 h-4 mr-2" />
                Appliquer filtres
              </Button>
            </div>
          </div>

          {/* Table Controls */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
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
                <span className="text-sm text-gray-600">Résultats: {filteredSales.length}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">RÉFÉRENCE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">CLIENT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">QTÉ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">MONTANT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">TYPE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">STATUT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">PAIEMENTS</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">MÉTHODE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">CRÉÉ LE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">VALIDÉ PAR</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-gray-500">
                      Aucune vente trouvée
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            sale.type === "vente" ? "bg-green-500" : "bg-red-500"
                          }`}></div>
                          <span className="font-medium">{sale.id}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Ref: {sale.reference}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{sale.clientName}</p>
                          <p className="text-sm text-gray-500">{sale.clientPhone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{sale.qty}</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          sale.montant < 0 ? "text-red-600" : "text-green-600"
                        }`}>
                          {sale.montant.toLocaleString()} F CFA
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          sale.type === "vente" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {sale.type === "vente" ? "Vente" : "Retour"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          sale.statut === "Validée" ? "bg-green-100 text-green-800" :
                          sale.statut === "En cours" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {sale.statut}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          sale.paiements === "Payé" ? "bg-green-100 text-green-800" :
                          sale.paiements === "En attente" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {sale.paiements}
                        </span>
                      </td>
                      <td className="py-3 px-4">{sale.methode}</td>
                      <td className="py-3 px-4">{sale.creeLe}</td>
                      <td className="py-3 px-4">{sale.validePar}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 p-6 border-t">
            <p className="text-sm text-gray-600">
              Affichage de 1 à {filteredSales.length} sur {filteredSales.length} éléments
            </p>
            <div className="flex items-center space-x-2">
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

          {/* Export Buttons */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-end space-x-2">
              <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                <Package className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
                EXCEL
              </Button>
              <Button variant="outline">
                <Package className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
