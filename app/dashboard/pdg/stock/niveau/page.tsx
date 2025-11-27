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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Package,
  FileText,
  Users,
  BookOpen,
  Printer,
  RefreshCw,
  Eye,
  AlertTriangle,
  Download,
} from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface StockLevel {
  id: string
  livre: string
  reference: string
  discipline: string
  auteur: string
  stockActuel: number
  stockDepot: number
  totalStock: number
  stockMin: number
  stockMax: number | null
  alertLevel: 'low' | 'normal' | 'high'
  statut: string
  prix: number
  dernierMouvement: string | null
  creeLe: string
  partenaires: Array<{
    nom: string
    quantite: number
  }>
}

interface Stats {
  enStock: number
  enDepot: number
  total: number
}

export default function NiveauStockPage() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [stats, setStats] = useState<Stats>({ enStock: 0, enDepot: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("title")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [disciplineFilter, setDisciplineFilter] = useState("toutes")
  const [statusFilter, setStatusFilter] = useState("tous")
  const [stockLevelFilter, setStockLevelFilter] = useState("all")
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showApprovisionnerModal, setShowApprovisionnerModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedStock, setSelectedStock] = useState<StockLevel | null>(null)
  const [disciplines, setDisciplines] = useState<Array<{ id: string; name: string }>>([])
  const [works, setWorks] = useState<Array<{ id: string; title: string; price: number }>>([])
  const [approvisionnementItems, setApprovisionnementItems] = useState<Array<{
    workId: string
    workTitle: string
    price: number
    quantity: number
  }>>([])
  const [newItem, setNewItem] = useState({
    workId: "",
    quantity: ""
  })

  useEffect(() => {
    loadStockLevels()
    loadDisciplines()
    loadWorks()
  }, [currentPage, itemsPerPage, sortBy, sortOrder, disciplineFilter, statusFilter, stockLevelFilter, searchTerm])

  const loadStockLevels = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder,
      })

      if (disciplineFilter !== "toutes") {
        params.append("disciplineId", disciplineFilter)
      }
      if (statusFilter !== "tous") {
        params.append("status", statusFilter)
      }
      if (stockLevelFilter !== "all") {
        params.append("stockLevel", stockLevelFilter)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/pdg/stock/niveau?${params}`)
      if (!response.ok) throw new Error("Erreur lors du chargement")

      const data = await response.json()
      setStats(data.stats || { enStock: 0, enDepot: 0, total: 0 })
      setStockLevels(data.stockLevels || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalItems(data.pagination?.total || 0)
    } catch (error) {
      console.error("Error loading stock levels:", error)
      toast.error("Erreur lors du chargement des niveaux de stock")
    } finally {
      setIsLoading(false)
    }
  }

  const loadDisciplines = async () => {
    try {
      const data = await apiClient.getDisciplines()
      setDisciplines(data || [])
    } catch (error) {
      console.error("Error loading disciplines:", error)
    }
  }

  const loadWorks = async () => {
    try {
      const data = await apiClient.getWorks()
      setWorks(data || [])
    } catch (error) {
      console.error("Error loading works:", error)
    }
  }

  const handleAddItem = () => {
    if (!newItem.workId || !newItem.quantity || parseInt(newItem.quantity) <= 0) {
      toast.error("Veuillez sélectionner un livre et une quantité valide")
      return
    }

    const work = works.find(w => w.id === newItem.workId)
    if (!work) {
      toast.error("Livre introuvable")
      return
    }

    setApprovisionnementItems([
      ...approvisionnementItems,
      {
        workId: work.id,
        workTitle: work.title,
        price: work.price,
        quantity: parseInt(newItem.quantity)
      }
    ])

    setNewItem({ workId: "", quantity: "" })
  }

  const handleRemoveItem = (index: number) => {
    setApprovisionnementItems(approvisionnementItems.filter((_, i) => i !== index))
  }

  const handleSaveApprovisionnement = async () => {
    try {
      if (approvisionnementItems.length === 0) {
        toast.error("Veuillez ajouter au moins un livre")
        return
      }

      // TODO: Créer une API pour l'approvisionnement
      toast.success("Approvisionnement enregistré avec succès")
      setShowApprovisionnerModal(false)
      setApprovisionnementItems([])
      loadStockLevels()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement")
    }
  }

  const getAlertBadge = (alertLevel: string) => {
    if (alertLevel === 'low') {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Stock faible</Badge>
    } else if (alertLevel === 'high') {
      return <Badge className="bg-blue-100 text-blue-800">Stock élevé</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Normal</Badge>
  }

  const totalAmount = approvisionnementItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Niveau de stock</h2>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={loadStockLevels}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
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
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {stats.enStock.toLocaleString()}
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">En dépôt</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {stats.enDepot.toLocaleString()}
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {stats.total.toLocaleString()}
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(v) => {
                  const [by, order] = v.split('-')
                  setSortBy(by)
                  setSortOrder(order as "asc" | "desc")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Par quantité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title-asc">Titre (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Titre (Z-A)</SelectItem>
                  <SelectItem value="quantity-asc">Quantité (Croissant)</SelectItem>
                  <SelectItem value="quantity-desc">Quantité (Décroissant)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stockLevelFilter} onValueChange={setStockLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les stocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les stocks</SelectItem>
                  <SelectItem value="low">Stock faible</SelectItem>
                  <SelectItem value="normal">Stock normal</SelectItem>
                  <SelectItem value="high">Stock élevé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes catégories</SelectItem>
                  {disciplines.map((discipline) => (
                    <SelectItem key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous statuts</SelectItem>
                  <SelectItem value="ON_SALE">Disponible</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Épuisé</SelectItem>
                  <SelectItem value="DISCONTINUED">Discontinué</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={loadStockLevels}>
                Appliquer
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setShowApprovisionnerModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Approvisionner
              </Button>
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
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(v) => {
                      setItemsPerPage(parseInt(v))
                      setCurrentPage(1)
                    }}
                  >
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
                  <Input
                    placeholder="Titre, ISBN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">LIVRE</th>
                    <th className="text-left p-4 font-medium text-gray-700">STOCK ACTUEL</th>
                    <th className="text-left p-4 font-medium text-gray-700">EN DÉPÔT</th>
                    <th className="text-left p-4 font-medium text-gray-700">TOTAL</th>
                    <th className="text-left p-4 font-medium text-gray-700">ALERTE</th>
                    <th className="text-left p-4 font-medium text-gray-700">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-500">
                        Chargement...
                      </td>
                    </tr>
                  ) : stockLevels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-500">
                        Aucune donnée disponible
                      </td>
                    </tr>
                  ) : (
                    stockLevels.map((stock) => (
                      <tr key={stock.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                              stock.alertLevel === 'low' ? 'bg-red-500' : 
                              stock.alertLevel === 'high' ? 'bg-blue-500' : 
                              'bg-green-500'
                            }`}>
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <span className="text-sm font-medium">{stock.livre}</span>
                              <p className="text-xs text-gray-500">{stock.reference}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <span className="font-medium">{stock.stockActuel.toLocaleString()}</span>
                            <p className="text-xs text-gray-500">
                              Min: {stock.stockMin} {stock.stockMax ? `| Max: ${stock.stockMax}` : ''}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">{stock.stockDepot.toLocaleString()}</td>
                        <td className="p-4 font-medium">{stock.totalStock.toLocaleString()}</td>
                        <td className="p-4">{getAlertBadge(stock.alertLevel)}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedStock(stock)
                                setShowViewModal(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FileText className="w-4 h-4" />
                            </Button>
                            {stock.alertLevel === 'low' && (
                              <Button variant="ghost" size="sm" className="text-red-500">
                                <Package className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-6 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Affichage de {startIndex} à {endIndex} sur {totalItems} éléments
                </p>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    Premier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Dernier
                  </Button>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => toast.info("Export PDF en cours de préparation...")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={() => toast.info("Export Excel en cours de préparation...")}
                >
                  <Download className="w-4 h-4 mr-2" />
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

      {/* Modal Approvisionner */}
      <Dialog open={showApprovisionnerModal} onOpenChange={setShowApprovisionnerModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-medium">Approvisionnement</DialogTitle>
          </DialogHeader>

          {/* Top selects */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2 mb-6">
            <div>
              <Label>Choix de la catégorie</Label>
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
              <Label>Choix de la Matière</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes matières" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes matières</SelectItem>
                  {disciplines.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
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
              <Label>Choix du livre</Label>
              <Select value={newItem.workId} onValueChange={(v) => setNewItem({ ...newItem, workId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un livre" />
                </SelectTrigger>
                <SelectContent>
                  {works.map((work) => (
                    <SelectItem key={work.id} value={work.id}>
                      {work.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3">
              <Label>Quantité</Label>
              <Input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                min="1"
              />
            </div>

            <div className="col-span-2">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleAddItem}>
                Ajouter
              </Button>
            </div>
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
                {approvisionnementItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-sm text-gray-400 text-center">
                      Aucun livre ajouté
                    </td>
                  </tr>
                ) : (
                  approvisionnementItems.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3 text-sm">{item.workTitle}</td>
                      <td className="p-3 text-sm">{item.price.toLocaleString()} XOF</td>
                      <td className="p-3 text-sm">{item.quantity}</td>
                      <td className="p-3 text-sm font-medium">
                        {(item.price * item.quantity).toLocaleString()} XOF
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="absolute right-0 top-0 text-2xl md:text-3xl font-semibold text-gray-700 mt-6 mr-2">
              Total: {totalAmount.toLocaleString()} XOF
            </div>
          </div>

          {/* Stock select and footer buttons */}
          <div className="flex items-center justify-between gap-4">
            <div className="w-1/2">
              <Label>Stock :</Label>
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
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={handleSaveApprovisionnement}>
                Enregistrer
              </Button>
              <Button
                variant="outline"
                className="border border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setShowApprovisionnerModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de visualisation */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails du stock</DialogTitle>
          </DialogHeader>
          {selectedStock && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Livre</Label>
                  <p className="font-medium">{selectedStock.livre}</p>
                </div>
                <div>
                  <Label>Référence (ISBN)</Label>
                  <p>{selectedStock.reference}</p>
                </div>
                <div>
                  <Label>Discipline</Label>
                  <p>{selectedStock.discipline}</p>
                </div>
                <div>
                  <Label>Auteur</Label>
                  <p>{selectedStock.auteur}</p>
                </div>
                <div>
                  <Label>Stock actuel</Label>
                  <p className="font-medium text-lg">{selectedStock.stockActuel.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Stock en dépôt</Label>
                  <p className="font-medium text-lg">{selectedStock.stockDepot.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Total</Label>
                  <p className="font-medium text-lg text-indigo-600">{selectedStock.totalStock.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Niveau d'alerte</Label>
                  <div>{getAlertBadge(selectedStock.alertLevel)}</div>
                </div>
                <div>
                  <Label>Stock minimum</Label>
                  <p>{selectedStock.stockMin}</p>
                </div>
                <div>
                  <Label>Stock maximum</Label>
                  <p>{selectedStock.stockMax || "Non défini"}</p>
                </div>
                <div>
                  <Label>Prix</Label>
                  <p>{selectedStock.prix.toLocaleString()} XOF</p>
                </div>
                <div>
                  <Label>Statut</Label>
                  <p>{selectedStock.statut}</p>
                </div>
              </div>
              {selectedStock.partenaires.length > 0 && (
                <div>
                  <Label>Stock chez les partenaires</Label>
                  <div className="mt-2 border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left">Partenaire</th>
                          <th className="p-2 text-right">Quantité disponible</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStock.partenaires.map((partner, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{partner.nom}</td>
                            <td className="p-2 text-right">{partner.quantite}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
