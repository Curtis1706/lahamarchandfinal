"use client"

import { useState, useEffect } from "react"
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
  Package,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Printer,
  Eye,
  AlertTriangle,
  Loader2,
  Activity,
} from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { calculateAvailableStock } from "@/lib/partner-stock"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

export default function NiveauStockPage() {
  const { user } = useCurrentUser()
  const [stockData, setStockData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("toutes")
  const [selectedDiscipline, setSelectedDiscipline] = useState("toutes")
  const [selectedClass, setSelectedClass] = useState("toutes")
  const [selectedStatus, setSelectedStatus] = useState("tous")
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null)
  const [historyData, setHistoryData] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Charger le stock au montage et quand les filtres changent
  useEffect(() => {
    const loadStock = async () => {
      try {
        setIsLoading(true)
        
        const data = await apiClient.getPartenaireStockAllocation({ 
          discipline: selectedDiscipline === 'toutes' ? undefined : selectedDiscipline
        })
        
        setStockData(data.stockItems || data || [])
        
      } catch (error: any) {
        console.error('Erreur lors du chargement du stock:', error)
        toast.error('Erreur lors du chargement du stock')
        setStockData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadStock()
  }, [selectedDiscipline, selectedStatus])

  // Calculer les statistiques (KPI)
  const totalAllocated = stockData.reduce((sum, item) => sum + Number(item.allocatedQuantity ?? 0), 0)
  const totalSold = stockData.reduce((sum, item) => sum + Number(item.soldQuantity ?? 0), 0)
  const totalReturned = stockData.reduce((sum, item) => sum + Number(item.returnedQuantity ?? 0), 0)
  const totalAvailable = stockData.reduce((sum, item) => {
    const available = item.availableQuantity !== undefined 
      ? item.availableQuantity 
      : calculateAvailableStock(
          Number(item.allocatedQuantity ?? 0),
          Number(item.soldQuantity ?? 0),
          Number(item.returnedQuantity ?? 0)
        )
    return sum + Number(available ?? 0)
  }, 0)
  
  const stockFaibleCount = stockData.filter(item => {
    const available = item.availableQuantity !== undefined 
      ? item.availableQuantity 
      : calculateAvailableStock(
          Number(item.allocatedQuantity ?? 0),
          Number(item.soldQuantity ?? 0),
          Number(item.returnedQuantity ?? 0)
        )
    return Number(available ?? 0) <= 5 && Number(available ?? 0) > 0
  }).length

  // Filtrer les données
  useEffect(() => {
    let filtered = stockData

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== "toutes") {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    if (selectedDiscipline !== "toutes") {
      filtered = filtered.filter(item => item.discipline === selectedDiscipline)
    }

    if (selectedClass !== "toutes") {
      filtered = filtered.filter(item => item.class === selectedClass)
    }

    if (selectedStatus === "stock-faible") {
      filtered = filtered.filter(item => {
        const available = item.availableQuantity !== undefined 
          ? item.availableQuantity 
          : calculateAvailableStock(
              Number(item.allocatedQuantity ?? 0),
              Number(item.soldQuantity ?? 0),
              Number(item.returnedQuantity ?? 0)
            )
        return Number(available ?? 0) <= 5 && Number(available ?? 0) > 0
      })
    } else if (selectedStatus === "disponible") {
      filtered = filtered.filter(item => {
        const available = item.availableQuantity !== undefined 
          ? item.availableQuantity 
          : calculateAvailableStock(
              Number(item.allocatedQuantity ?? 0),
              Number(item.soldQuantity ?? 0),
              Number(item.returnedQuantity ?? 0)
            )
        return Number(available ?? 0) > 0
      })
    }

    setFilteredData(filtered)
  }, [searchTerm, selectedCategory, selectedDiscipline, selectedClass, selectedStatus, stockData])

  // Fonction pour calculer le statut
  const getStatus = (available: number) => {
    if (available === 0) return { label: "Rupture", color: "bg-red-100 text-red-800" }
    if (available <= 5) return { label: "Faible stock", color: "bg-yellow-100 text-yellow-800" }
    return { label: "Disponible", color: "bg-green-100 text-green-800" }
  }

  const handleShowHistory = async (workId: string) => {
    setSelectedWorkId(workId)
    setShowHistoryModal(true)
    setLoadingHistory(true)
    
    try {
      const res = await fetch(`/api/partenaire/stock/history?workId=${workId}`, { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Erreur lors du chargement")
      }
      const data = await res.json()
      setHistoryData(data)
    } catch (error: any) {
      console.error("Erreur lors du chargement de l'historique:", error)
      toast.error("Erreur lors du chargement de l'historique")
      setHistoryData(null)
    } finally {
      setLoadingHistory(false)
    }
  }

  const getMovementTypeBadge = (type: string) => {
    const configs: { [key: string]: { label: string; color: string } } = {
      'PARTNER_ALLOCATION': { label: 'Allocation', color: 'bg-blue-100 text-blue-800' },
      'PARTNER_SALE': { label: 'Vente', color: 'bg-green-100 text-green-800' },
      'PARTNER_RETURN': { label: 'Retour', color: 'bg-purple-100 text-purple-800' }
    }
    return configs[type] || { label: type, color: 'bg-gray-100 text-gray-800' }
  }

  return (
    <div>
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Stock alloué - {user?.name}</h2>
            <p className="text-sm text-slate-300 mt-1">Consultation en lecture seule</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Articles attribués uniquement
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total alloué</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">{totalAllocated}</div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total vendu</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">{totalSold}</div>
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total retourné</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">{totalReturned}</div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total disponible</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">{totalAvailable}</div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Alerte stock faible */}
          {stockFaibleCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">
                  {stockFaibleCount} article{stockFaibleCount > 1 ? 's' : ''} en stock faible
                </span>
              </div>
            </div>
          )}

          {/* Filters and Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Filtres de consultation</h3>
              <p className="text-sm text-gray-600">Filtrez votre stock alloué selon vos besoins</p>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes catégories</SelectItem>
                  <SelectItem value="Primaire">Primaire</SelectItem>
                  <SelectItem value="Secondaire">Secondaire</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes disciplines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes disciplines</SelectItem>
                  <SelectItem value="Français">Français</SelectItem>
                  <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes classes</SelectItem>
                  <SelectItem value="CE1">CE1</SelectItem>
                  <SelectItem value="CE2">CE2</SelectItem>
                  <SelectItem value="CE1-CE2">CE1-CE2</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous statuts</SelectItem>
                  <SelectItem value="stock-faible">Stock faible</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center">
                <Input 
                  placeholder="Rechercher..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Stock alloué par produit</h3>
              <p className="text-sm text-gray-600 mt-1">Articles attribués à votre organisation</p>
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
                  <span className="text-sm text-gray-600">Résultats: {filteredData.length}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4">LIVRE</th>
                    <th className="text-left p-4">DISCIPLINE</th>
                    <th className="text-left p-4">CLASSE</th>
                    <th className="text-left p-4">ALLOUÉ</th>
                    <th className="text-left p-4">VENDU</th>
                    <th className="text-left p-4">RETOURNÉ</th>
                    <th className="text-left p-4">DISPONIBLE</th>
                    <th className="text-left p-4">PRIX PUBLIC</th>
                    <th className="text-left p-4">PRIX PARTENAIRE</th>
                    <th className="text-left p-4">STATUT</th>
                    <th className="text-left p-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-500">
                        {isLoading ? "Chargement..." : "Aucun article trouvé"}
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => {
                      const available = item.availableQuantity !== undefined 
                        ? item.availableQuantity 
                        : calculateAvailableStock(
                            Number(item.allocatedQuantity ?? 0),
                            Number(item.soldQuantity ?? 0),
                            Number(item.returnedQuantity ?? 0)
                          )
                      const status = getStatus(Number(available ?? 0))
                      const prixPublic = Number(item.price ?? 0)
                      const prixPartenaire = Number(item.price ?? 0) // Prix public utilisé (pas de prix partenaire spécifique dans le modèle)
                      
                      return (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{item.title || 'N/A'}</div>
                                <div className="text-xs text-gray-500">ISBN: {item.isbn || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm">{item.discipline || 'N/A'}</td>
                          <td className="p-4 text-sm">{item.class || 'N/A'}</td>
                          <td className="p-4 text-sm font-medium">{Number(item.allocatedQuantity ?? 0)}</td>
                          <td className="p-4 text-sm">{Number(item.soldQuantity ?? 0)}</td>
                          <td className="p-4 text-sm">{Number(item.returnedQuantity ?? 0)}</td>
                          <td className="p-4 text-sm font-medium text-blue-600">{Number(available ?? 0)}</td>
                          <td className="p-4 text-sm">{prixPublic.toLocaleString("fr-FR")} F CFA</td>
                          <td className="p-4 text-sm text-green-600 font-medium">{prixPartenaire.toLocaleString("fr-FR")} F CFA</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label === "Faible stock" && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {status.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <button 
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Voir l'historique"
                                onClick={() => handleShowHistory(item.workId)}
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-6 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Affichage de 1 à {filteredData.length} sur {filteredData.length} éléments
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
            </div>

            {/* Export Buttons */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end space-x-2">
                <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                  <Printer className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
                  EXCEL
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Historique */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique des mouvements de stock</DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : historyData ? (
            <div className="space-y-6">
              {/* Informations du produit */}
              {historyData.work && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{historyData.work.title}</h3>
                  {historyData.work.isbn && (
                    <p className="text-sm text-gray-600">ISBN: {historyData.work.isbn}</p>
                  )}
                  {historyData.stockInfo && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Alloué</p>
                        <p className="font-semibold">{historyData.stockInfo.allocatedQuantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Vendu</p>
                        <p className="font-semibold">{historyData.stockInfo.soldQuantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Retourné</p>
                        <p className="font-semibold">{historyData.stockInfo.returnedQuantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Disponible</p>
                        <p className="font-semibold text-blue-600">{historyData.stockInfo.availableQuantity}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Liste des mouvements */}
              <div>
                <h3 className="font-semibold mb-4">Mouvements ({historyData.history?.length || 0})</h3>
                {historyData.history && historyData.history.length > 0 ? (
                  <div className="space-y-3">
                    {historyData.history.map((movement: any) => {
                      const typeConfig = getMovementTypeBadge(movement.type)
                      return (
                        <div key={movement.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                                <span className={`text-sm font-semibold ${movement.isNegative ? 'text-red-600' : 'text-green-600'}`}>
                                  {movement.isNegative ? '-' : '+'}{movement.quantity}
                                </span>
                              </div>
                              {movement.reason && (
                                <p className="text-sm text-gray-600 mb-1">{movement.reason}</p>
                              )}
                              {movement.reference && (
                                <p className="text-xs text-gray-500">Réf: {movement.reference}</p>
                              )}
                              {movement.totalAmount && (
                                <p className="text-sm font-semibold mt-2">
                                  {movement.totalAmount.toLocaleString("fr-FR")} FCFA
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {format(new Date(movement.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                              </p>
                              {movement.performedBy && (
                                <p className="text-xs text-gray-500 mt-1">{movement.performedBy.name}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun mouvement enregistré</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune donnée disponible</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
