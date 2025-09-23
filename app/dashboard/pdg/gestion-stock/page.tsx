'use client'

import { useState, useEffect } from 'react'
import DynamicDashboardLayout from '@/components/dynamic-dashboard-layout'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Package,
  Eye,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Warehouse,
  ShoppingCart,
  AlertCircle,
  Download,
  Plus,
  Minus,
  Edit,
  History
} from "lucide-react"
import { toast } from "sonner"
import { apiClient } from '@/lib/api-client'

// Types
interface Work {
  id: string
  title: string
  isbn: string
  price: number
  stock: number
  minStock: number
  maxStock?: number
  discipline: {
    id: string
    name: string
  }
  status: string
}

interface StockMovement {
  id: string
  workId: string
  work: {
    title: string
    isbn: string
  }
  type: string
  quantity: number
  reason?: string
  reference?: string
  createdAt: string
  performedByUser?: {
    name: string
    email: string
  }
}

interface StockAlert {
  id: string
  work: Work
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXCESS_STOCK'
  message: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface StockStats {
  totalWorks: number
  totalStock: number
  lowStockItems: number
  outOfStockItems: number
  excessStockItems: number
  totalValue: number
  rotationRate: number
  ruptureRate: number
}

interface PendingOperation {
  id: string
  type: 'RESTOCK' | 'TRANSFER' | 'ADJUSTMENT'
  work: Work
  quantity: number
  reason: string
  requestedBy: {
    name: string
    email: string
  }
  requestedAt: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export default function GestionStockPage() {
  // États principaux
  const [works, setWorks] = useState<Work[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [stockStats, setStockStats] = useState<StockStats | null>(null)
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // États des filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all')
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all')
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all')

  // États UI
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<PendingOperation | null>(null)
  const [isValidationOpen, setIsValidationOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'movements' | 'alerts' | 'pending'>('overview')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Charger les données
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setIsLoading(true)
        const [worksData, movementsData, alertsData, statsData, pendingData] = await Promise.all([
          apiClient.getWorksWithStock(),
          apiClient.getStockMovements(),
          apiClient.getStockAlerts(),
          apiClient.getStockStats(),
          apiClient.getPendingStockOperations()
        ])
        
        setWorks(worksData)
        setStockMovements(movementsData)
        setStockAlerts(alertsData)
        setStockStats(statsData)
        setPendingOperations(pendingData)
      } catch (error) {
        console.error("Error fetching stock data:", error)
        toast.error("Erreur lors du chargement des données de stock")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStockData()
  }, [])

  // Fonctions utilitaires
  const getStockStatus = (work: Work) => {
    if (work.stock === 0) return 'OUT_OF_STOCK'
    if (work.stock <= work.minStock) return 'LOW_STOCK'
    if (work.maxStock && work.stock >= work.maxStock) return 'EXCESS_STOCK'
    return 'NORMAL'
  }

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rupture</Badge>
      case 'LOW_STOCK':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Stock faible</Badge>
      case 'EXCESS_STOCK':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Excédent</Badge>
      default:
        return <Badge variant="outline" className="bg-green-100 text-green-800">Normal</Badge>
    }
  }

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'INBOUND':
        return <Badge className="bg-green-100 text-green-800">Entrée</Badge>
      case 'OUTBOUND':
        return <Badge className="bg-red-100 text-red-800">Sortie</Badge>
      case 'ADJUSTMENT':
        return <Badge className="bg-blue-100 text-blue-800">Ajustement</Badge>
      case 'TRANSFER':
        return <Badge className="bg-purple-100 text-purple-800">Transfert</Badge>
      case 'DAMAGED':
        return <Badge className="bg-orange-100 text-orange-800">Endommagé</Badge>
      case 'EXPIRED':
        return <Badge className="bg-gray-100 text-gray-800">Expiré</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge variant="destructive">Élevée</Badge>
      case 'MEDIUM':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Moyenne</Badge>
      default:
        return <Badge variant="outline">Faible</Badge>
    }
  }

  // Actions
  const handleViewDetails = (work: Work) => {
    setSelectedWork(work)
    setIsDetailsOpen(true)
  }

  const handleValidateOperation = async (operationId: string, approved: boolean) => {
    try {
      await apiClient.validateStockOperation(operationId, approved)
      
      // Retirer de la liste des opérations en attente
      setPendingOperations(prev => prev.filter(op => op.id !== operationId))
      
      toast.success(approved ? "Opération approuvée" : "Opération rejetée")
      setIsValidationOpen(false)
      setSelectedOperation(null)
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation")
    }
  }

  const handleExportReport = async (type: 'inventory' | 'movements' | 'alerts') => {
    try {
      await apiClient.exportStockReport(type)
      toast.success("Rapport exporté avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'export")
    }
  }

  // Filtrage des données
  const filteredWorks = works.filter(work => {
    const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         work.isbn.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDiscipline = disciplineFilter === 'all' || work.discipline.id === disciplineFilter
    const matchesStatus = stockStatusFilter === 'all' || getStockStatus(work) === stockStatusFilter
    
    return matchesSearch && matchesDiscipline && matchesStatus
  })

  const filteredMovements = stockMovements.filter(movement => {
    const matchesSearch = movement.work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.work.isbn.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = movementTypeFilter === 'all' || movement.type === movementTypeFilter
    
    return matchesSearch && matchesType
  })

  // Pagination
  const totalPages = Math.ceil(filteredWorks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentWorks = filteredWorks.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <DynamicDashboardLayout title="Gestion de Stock">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des données de stock...</p>
          </div>
        </div>
      </DynamicDashboardLayout>
    )
  }

  return (
    <DynamicDashboardLayout title="Gestion de Stock">
      <div className="bg-white min-h-screen p-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion de Stock</h1>
            <p className="text-gray-600">Supervision globale et contrôle des stocks</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => handleExportReport('inventory')} 
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Onglets de navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
            { id: 'inventory', label: 'Inventaire', icon: Package },
            { id: 'movements', label: 'Mouvements', icon: Activity },
            { id: 'alerts', label: 'Alertes', icon: AlertTriangle },
            { id: 'pending', label: 'En attente', icon: Eye }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.id === 'alerts' && stockAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {stockAlerts.length}
                  </Badge>
                )}
                {tab.id === 'pending' && pendingOperations.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {pendingOperations.length}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        {/* Vue d'ensemble - Tableau de bord */}
        {activeTab === 'overview' && stockStats && (
          <div className="space-y-6">
            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stockStats.totalStock.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stockStats.totalWorks} références
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valeur du Stock</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stockStats.totalValue.toFixed(2)} €</div>
                  <p className="text-xs text-muted-foreground">
                    Valeur totale estimée
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Rupture</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stockStats.ruptureRate * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {stockStats.outOfStockItems} références en rupture
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Rotation</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stockStats.rotationRate.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    Rotation mensuelle moyenne
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Alertes importantes */}
            {stockAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                    Alertes Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stockAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className={`h-4 w-4 ${
                            alert.severity === 'HIGH' ? 'text-red-500' : 
                            alert.severity === 'MEDIUM' ? 'text-orange-500' : 'text-yellow-500'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">{alert.work.title}</p>
                            <p className="text-sm text-gray-600">{alert.message}</p>
                          </div>
                        </div>
                        <Badge variant={alert.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                          {alert.severity === 'HIGH' ? 'Urgent' : alert.severity === 'MEDIUM' ? 'Important' : 'Info'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Inventaire */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Filtres */}
            <Card>
              <CardHeader>
                <CardTitle>Filtres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un livre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les disciplines</SelectItem>
                      <SelectItem value="math">Mathématiques</SelectItem>
                      <SelectItem value="french">Français</SelectItem>
                      <SelectItem value="science">Sciences</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut du stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="OUT_OF_STOCK">Rupture</SelectItem>
                      <SelectItem value="LOW_STOCK">Stock faible</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="EXCESS_STOCK">Excédent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 par page</SelectItem>
                      <SelectItem value="50">50 par page</SelectItem>
                      <SelectItem value="100">100 par page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tableau d'inventaire */}
            <Card>
              <CardHeader>
                <CardTitle>Inventaire ({filteredWorks.length} références)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Livre</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Discipline</TableHead>
                      <TableHead>Stock Actuel</TableHead>
                      <TableHead>Min / Max</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Valeur</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentWorks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-gray-500">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            Aucun livre trouvé
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentWorks.map((work) => (
                        <TableRow key={work.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{work.title}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{work.isbn}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{work.discipline.name}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${
                              work.stock === 0 ? 'text-red-600' :
                              work.stock <= work.minStock ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {work.stock}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {work.minStock} / {work.maxStock || '∞'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getStockStatusBadge(getStockStatus(work))}
                          </TableCell>
                          <TableCell>
                            {(work.stock * work.price).toFixed(2)} €
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewDetails(work)}
                                title="Voir détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Historique des mouvements"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-700">
                      Affichage de {startIndex + 1} à {Math.min(endIndex, filteredWorks.length)} sur {filteredWorks.length} résultats
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Précédent
                      </Button>
                      <span className="flex items-center px-3 py-1 text-sm">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mouvements de stock */}
        {activeTab === 'movements' && (
          <div className="space-y-6">
            {/* Filtres des mouvements */}
            <Card>
              <CardHeader>
                <CardTitle>Filtres des Mouvements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type de mouvement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="INBOUND">Entrées</SelectItem>
                      <SelectItem value="OUTBOUND">Sorties</SelectItem>
                      <SelectItem value="ADJUSTMENT">Ajustements</SelectItem>
                      <SelectItem value="TRANSFER">Transferts</SelectItem>
                      <SelectItem value="DAMAGED">Endommagés</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={() => handleExportReport('movements')} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter l'historique
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tableau des mouvements */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des Mouvements ({filteredMovements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Livre</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Utilisateur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.slice(0, 50).map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{movement.work.title}</div>
                            <div className="text-sm text-gray-500">{movement.work.isbn}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getMovementTypeBadge(movement.type)}
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{movement.reason || '-'}</TableCell>
                        <TableCell>{movement.reference || '-'}</TableCell>
                        <TableCell>
                          {movement.performedByUser ? (
                            <div>
                              <div className="font-medium">{movement.performedByUser.name}</div>
                              <div className="text-sm text-gray-500">{movement.performedByUser.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Système</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alertes */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Alertes de Stock ({stockAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stockAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune alerte</h3>
                    <p className="text-gray-600">Tous les stocks sont dans les seuils normaux.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stockAlerts.map((alert) => (
                      <div key={alert.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <AlertCircle className={`h-5 w-5 mt-0.5 ${
                              alert.severity === 'HIGH' ? 'text-red-500' : 
                              alert.severity === 'MEDIUM' ? 'text-orange-500' : 'text-yellow-500'
                            }`} />
                            <div>
                              <h4 className="font-medium text-gray-900">{alert.work.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>Stock actuel: <strong>{alert.work.stock}</strong></span>
                                <span>Seuil minimum: <strong>{alert.work.minStock}</strong></span>
                                <span>ISBN: {alert.work.isbn}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant={alert.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                              {alert.severity === 'HIGH' ? 'Urgent' : alert.severity === 'MEDIUM' ? 'Important' : 'Info'}
                            </Badge>
                            {getStockStatusBadge(alert.type)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Opérations en attente de validation */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-blue-500" />
                  Opérations en Attente de Validation ({pendingOperations.length})
                </CardTitle>
                <CardDescription>
                  Validez ou rejetez les demandes d'opérations importantes sur le stock
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingOperations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune opération en attente</h3>
                    <p className="text-gray-600">Toutes les demandes ont été traitées.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingOperations.map((operation) => (
                      <div key={operation.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              operation.type === 'RESTOCK' ? 'bg-green-100' :
                              operation.type === 'TRANSFER' ? 'bg-blue-100' : 'bg-orange-100'
                            }`}>
                              {operation.type === 'RESTOCK' ? <Plus className="h-5 w-5 text-green-600" /> :
                               operation.type === 'TRANSFER' ? <Warehouse className="h-5 w-5 text-blue-600" /> :
                               <Edit className="h-5 w-5 text-orange-600" />}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{operation.work.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{operation.reason}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>Quantité: <strong>{operation.quantity}</strong></span>
                                <span>Demandé par: <strong>{operation.requestedBy.name}</strong></span>
                                <span>{new Date(operation.requestedAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getPriorityBadge(operation.priority)}
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => {
                                  setSelectedOperation(operation)
                                  setIsValidationOpen(true)
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleValidateOperation(operation.id, false)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de détails d'un livre */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du Stock - {selectedWork?.title}</DialogTitle>
              <DialogDescription>
                Informations détaillées sur le stock de ce livre
              </DialogDescription>
            </DialogHeader>
            
            {selectedWork && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Titre</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedWork.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">ISBN</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedWork.isbn}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Discipline</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedWork.discipline.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Prix unitaire</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedWork.price.toFixed(2)} €</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Stock actuel</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{selectedWork.stock}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Valeur du stock</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {(selectedWork.stock * selectedWork.price).toFixed(2)} €
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Seuil minimum</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedWork.minStock}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Stock maximum</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedWork.maxStock || 'Non défini'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Statut du stock</label>
                  <div className="mt-2">
                    {getStockStatusBadge(getStockStatus(selectedWork))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de validation d'opération */}
        <Dialog open={isValidationOpen} onOpenChange={setIsValidationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Validation d'Opération</DialogTitle>
              <DialogDescription>
                Confirmez-vous l'approbation de cette opération de stock ?
              </DialogDescription>
            </DialogHeader>
            
            {selectedOperation && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{selectedOperation.work.title}</h4>
                  <p className="text-sm text-gray-600">{selectedOperation.reason}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">
                      {selectedOperation.type === 'RESTOCK' ? 'Réapprovisionnement' :
                       selectedOperation.type === 'TRANSFER' ? 'Transfert' : 'Ajustement'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantité:</span>
                    <span className="ml-2 font-medium">{selectedOperation.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Priorité:</span>
                    <span className="ml-2">{getPriorityBadge(selectedOperation.priority)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Demandé par:</span>
                    <span className="ml-2 font-medium">{selectedOperation.requestedBy.name}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsValidationOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={() => selectedOperation && handleValidateOperation(selectedOperation.id, true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Approuver l'opération
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DynamicDashboardLayout>
  )
}
