"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Plus,
  Filter, 
  Search, 
  Calendar as CalendarIcon,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Truck
} from "lucide-react"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

// Types pour les commandes
interface Order {
  id: string
  userId: string
  partnerId?: string
  status: 'PENDING' | 'VALIDATED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
  }
  partner?: {
    id: string
    name: string
    email: string
  }
  items: Array<{
    id: string
    workId: string
    quantity: number
    price: number
    work: {
      id: string
      title: string
      price: number
      discipline?: {
        name: string
      }
    }
  }>
  total: number
  bookCount: number
}

export default function GestionCommandesPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // États des filtres
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  })
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  
  // États UI
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [works, setWorks] = useState<any[]>([])
  const [newOrderData, setNewOrderData] = useState({
    userId: '',
    items: [{ workId: '', quantity: 1, price: 0 }]
  })

  // Fonction utilitaire pour vérifier si works est un tableau valide
  const getWorks = () => works && Array.isArray(works) ? works : []

  // Charger les commandes réelles
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const params: any = {}
        
        if (statusFilter !== "all") {
          params.status = statusFilter.toUpperCase()
        }
        
        if (dateRange.from && dateRange.to) {
          params.startDate = dateRange.from.toISOString()
          params.endDate = dateRange.to.toISOString()
        }
        
        const ordersData = await apiClient.getOrders(params)
        setOrders(ordersData)
      } catch (error: any) {
        console.error("Error fetching orders:", error)
        toast.error("Erreur lors du chargement des commandes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [statusFilter, dateRange.from, dateRange.to])

  // Charger les utilisateurs et les livres pour le formulaire de création
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [usersData, worksData] = await Promise.all([
          apiClient.getUsers(),
          apiClient.getWorks()
        ])
        setUsers(usersData || [])
        setWorks(worksData || [])
      } catch (error) {
        console.error("Error fetching form data:", error)
        setUsers([])
        setWorks([])
      }
    }

    fetchFormData()
  }, [])

  // Filtrage des commandes
  const filteredOrders = orders.filter(order => {
    const clientName = order.user?.name || order.partner?.name || ''
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter.toUpperCase()
    
    return matchesSearch && matchesStatus
  })

  // Actions sur les commandes
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsOpen(true)
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiClient.updateOrder(orderId, { status: newStatus })
      
      // Mettre à jour la liste locale
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any }
          : order
      ))
      
      const statusMessages = {
        'VALIDATED': 'Commande validée avec succès',
        'PROCESSING': 'Commande mise en traitement avec succès',
        'SHIPPED': 'Commande expédiée avec succès',
        'DELIVERED': 'Commande livrée avec succès',
        'CANCELLED': 'Commande annulée avec succès'
      }
      toast.success(statusMessages[newStatus as keyof typeof statusMessages] || `Commande ${newStatus.toLowerCase()}e avec succès`)
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour")
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.")) {
      return
    }
    
    try {
      await apiClient.deleteOrder(orderId)
      
      // Retirer de la liste locale
      setOrders(prev => prev.filter(order => order.id !== orderId))
      
      toast.success("Commande supprimée avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  const handleCreateOrder = async () => {
    try {
      if (!newOrderData.userId || newOrderData.items.some(item => !item.workId || item.quantity <= 0)) {
        toast.error("Veuillez remplir tous les champs obligatoires")
        return
      }

      // Calculer les prix pour chaque item
      const itemsWithPrice = newOrderData.items.map(item => {
        const work = getWorks().find(w => w.id === item.workId)
        return {
          ...item,
          price: work?.price || 0
        }
      })

      const orderData = {
        userId: newOrderData.userId,
        items: itemsWithPrice
      }

      const newOrder = await apiClient.createOrder(orderData)
      
      // Ajouter à la liste locale
      setOrders(prev => [newOrder, ...prev])
      
      // Réinitialiser le formulaire
      setNewOrderData({
        userId: '',
        items: [{ workId: '', quantity: 1, price: 0 }]
      })
      setIsCreateOrderOpen(false)
      
      toast.success("Commande créée avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création")
    }
  }

  const addOrderItem = () => {
    setNewOrderData(prev => ({
      ...prev,
      items: [...prev.items, { workId: '', quantity: 1, price: 0 }]
    }))
  }

  const removeOrderItem = (index: number) => {
    setNewOrderData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateOrderItem = (index: number, field: string, value: any) => {
    setNewOrderData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  // Fonctions utilitaires
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      VALIDATED: { label: 'Validée', className: 'bg-blue-100 text-blue-800' },
      PROCESSING: { label: 'En traitement', className: 'bg-purple-100 text-purple-800' },
      SHIPPED: { label: 'Expédiée', className: 'bg-orange-100 text-orange-800' },
      DELIVERED: { label: 'Livrée', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Annulée', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const generateOrderReference = (orderId: string) => {
    // Génère une référence basée sur l'ID de la commande
    const year = new Date().getFullYear()
    const orderNumber = orderId.slice(-4).toUpperCase()
    return `CMD-${year}-${orderNumber}`
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: fr })
    } catch {
      return dateString
    }
  }

  const handleApplyFilters = () => {
    setCurrentPage(1)
    toast.success("Filtres appliqués")
  }

  const handleExportPDF = () => {
    toast.success("Export PDF en cours...")
  }

  const handleExportExcel = () => {
    toast.success("Export Excel en cours...")
  }

  const handlePrint = () => {
    window.print()
  }

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des commandes...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'PDG') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Accès non autorisé</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
        {/* Barre d'outils supérieure */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Filter className="h-4 w-4 mr-2" />
              Filtre compte
            </Button>
            
            <Button 
              onClick={() => setIsCreateOrderOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Commande
            </Button>
          </div>
        </div>

        {/* Section des filtres */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          {/* Première ligne de filtres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sélecteur de dates */}
            <div className="space-y-2">
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd MMM yyyy", { locale: fr })} -{" "}
                          {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: fr })
                      )
                    ) : (
                      <span>23 juin 2025 - 23 sept. 2025</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filtre statut */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="validated">Validée</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="Livres scolaires">Livres scolaires</SelectItem>
                <SelectItem value="Manuels">Manuels</SelectItem>
                <SelectItem value="Cahiers d'exercices">Cahiers d'exercices</SelectItem>
                <SelectItem value="Guides pédagogiques">Guides pédagogiques</SelectItem>
              </SelectContent>
            </Select>

            {/* Bouton Appliquer */}
            <Button onClick={handleApplyFilters} className="bg-indigo-600 hover:bg-indigo-700">
              <Filter className="h-4 w-4 mr-2" />
              Appliquer
            </Button>
          </div>

          {/* Deuxième ligne de filtres */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtre méthode */}
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les méthodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les méthodes</SelectItem>
                <SelectItem value="Livraison standard">Livraison standard</SelectItem>
                <SelectItem value="Livraison express">Livraison express</SelectItem>
                <SelectItem value="Retrait en magasin">Retrait en magasin</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre catégorie */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vacances et rentrée scolaire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="rentree">Vacances et rentrée scolaire</SelectItem>
                <SelectItem value="cours">Période de cours</SelectItem>
                <SelectItem value="examens">Période d'examens</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Barre d'outils du tableau */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Afficher</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
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
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Rechercher:</span>
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        {/* Tableau des commandes */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Référence</TableHead>
                <TableHead className="font-semibold">Nbr. livre</TableHead>
                <TableHead className="font-semibold">Demandé par</TableHead>
                <TableHead className="font-semibold">Fait le</TableHead>
                <TableHead className="font-semibold">Date livraison</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold">Livraison</TableHead>
                <TableHead className="font-semibold">État Réception</TableHead>
                <TableHead className="font-semibold">Paiement</TableHead>
                <TableHead className="font-semibold">Méthode</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Info className="h-8 w-8 text-gray-400" />
                      <p className="text-gray-500">Aucune donnée disponible dans le tableau</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{generateOrderReference(order.id)}</TableCell>
                    <TableCell>{order.bookCount}</TableCell>
                    <TableCell>{order.user?.name || order.partner?.name || 'Client inconnu'}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{formatDate(order.updatedAt)}</TableCell>
                    <TableCell>
                      {order.items[0]?.work?.discipline?.name || 'Divers'}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>
                        {order.status === 'DELIVERED' ? 'Livré' : 'En cours'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>
                        {order.status === 'DELIVERED' ? 'Reçu' : 'En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status !== 'PENDING' ? 'default' : 'destructive'}>
                        {order.status !== 'PENDING' ? 'Payé' : 'En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell>Livraison standard</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {order.status === 'PENDING' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order.id, 'VALIDATED')}
                            className="text-green-600 hover:text-green-700"
                            title="Valider la commande"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {order.status === 'VALIDATED' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order.id, 'PROCESSING')}
                            className="text-blue-600 hover:text-blue-700"
                            title="Traiter la commande"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {order.status === 'PROCESSING' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order.id, 'SHIPPED')}
                            className="text-orange-600 hover:text-orange-700"
                            title="Expédier la commande"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {order.status === 'SHIPPED' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                            className="text-green-600 hover:text-green-700"
                            title="Marquer comme livré"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                            className="text-red-600 hover:text-red-700"
                            title="Annuler la commande"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Supprimer la commande"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination et informations */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredOrders.length)} sur {filteredOrders.length} éléments
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
              Premier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Dernier
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Boutons d'export */}
        <div className="flex justify-end space-x-2">
          <Button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700">
            PDF
          </Button>
          <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
            EXCEL
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <FileText className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal des détails de commande */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Détails de la commande {selectedOrder && generateOrderReference(selectedOrder.id)}
              </DialogTitle>
              <DialogDescription>
                Informations complètes sur cette commande
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                {/* Informations client */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Client</h3>
                    <p>{selectedOrder.user?.name || selectedOrder.partner?.name}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.user?.email || selectedOrder.partner?.email}</p>
                    {selectedOrder.user?.phone && (
                      <p className="text-sm text-gray-600">{selectedOrder.user.phone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold">Commande</h3>
                    <p>Statut: {getStatusBadge(selectedOrder.status)}</p>
                    <p className="text-sm text-gray-600">Créée le: {formatDate(selectedOrder.createdAt)}</p>
                    <p className="text-sm text-gray-600">Mise à jour: {formatDate(selectedOrder.updatedAt)}</p>
                  </div>
                </div>

                {/* Articles commandés */}
                <div>
                  <h3 className="font-semibold mb-4">Articles commandés</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Livre</TableHead>
                          <TableHead>Discipline</TableHead>
                          <TableHead>Prix unitaire</TableHead>
                          <TableHead>Quantité</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.work.title}</TableCell>
                            <TableCell>{item.work.discipline?.name || 'Non spécifiée'}</TableCell>
                            <TableCell>{item.price.toFixed(2)} FCFA</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{(item.price * item.quantity).toFixed(2)} FCFA</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Total */}
                  <div className="mt-4 text-right">
                    <div className="text-lg font-semibold">
                      Total: {selectedOrder.total.toFixed(2)} FCFA
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedOrder.bookCount} livre{selectedOrder.bookCount > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  {selectedOrder.status === 'PENDING' && (
                    <Button 
                      onClick={() => {
                        handleUpdateOrderStatus(selectedOrder.id, 'VALIDATED')
                        setIsDetailsOpen(false)
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider la commande
                    </Button>
                  )}
                  
                  {selectedOrder.status === 'VALIDATED' && (
                    <Button 
                      onClick={() => {
                        handleUpdateOrderStatus(selectedOrder.id, 'PROCESSING')
                        setIsDetailsOpen(false)
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Traiter
                    </Button>
                  )}
                  
                  {selectedOrder.status === 'PROCESSING' && (
                    <Button 
                      onClick={() => {
                        handleUpdateOrderStatus(selectedOrder.id, 'SHIPPED')
                        setIsDetailsOpen(false)
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Expédier
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrder.id, 'CANCELLED')
                      setIsDetailsOpen(false)
                    }}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de création de commande */}
        <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle Commande</DialogTitle>
              <DialogDescription>
                Créer une nouvelle commande pour un client
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Sélection du client */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Client *</label>
                <Select 
                  value={newOrderData.userId} 
                  onValueChange={(value) => setNewOrderData(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Articles de la commande */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Articles</h3>
                  <Button onClick={addOrderItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un article
                  </Button>
                </div>

                {newOrderData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Livre *</label>
                      <Select 
                        value={item.workId} 
                        onValueChange={(value) => updateOrderItem(index, 'workId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un livre" />
                        </SelectTrigger>
                        <SelectContent>
                          {getWorks().map((work) => (
                            <SelectItem key={work.id} value={work.id}>
                              {work.title} - {work.price?.toFixed(2) || '0.00'} FCFA
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Quantité *</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="flex items-end">
                      {newOrderData.items.length > 1 && (
                        <Button 
                          onClick={() => removeOrderItem(index)} 
                          variant="destructive" 
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total estimé */}
              <div className="border-t pt-4">
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    Total estimé: {
                      newOrderData.items.reduce((total, item) => {
                        const work = getWorks().find(w => w.id === item.workId)
                        return total + ((work?.price || 0) * item.quantity)
                      }, 0).toFixed(2)
                    } FCFA
                  </div>
                  <div className="text-sm text-gray-600">
                    {newOrderData.items.reduce((total, item) => total + item.quantity, 0)} livre(s)
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  onClick={() => setIsCreateOrderOpen(false)} 
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateOrder}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Créer la commande
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  )
}