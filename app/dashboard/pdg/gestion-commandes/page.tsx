"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
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
  Truck,
  ChevronDown,
  Save,
  X
} from "lucide-react"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

// Types pour les commandes
interface Order {
  id: string
  userId: string
  partnerId?: string
  status: 'PENDING' | 'VALIDATED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  paymentType?: 'CASH' | 'DEPOSIT' | 'CREDIT'
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentMethod?: string
  amountPaid?: number
  remainingAmount?: number
  depositAmount?: number
  depositDate?: string
  fullPaymentDate?: string
  deliveryDate?: string
  deliveryStatus?: 'PENDING' | 'PREPARING' | 'READY' | 'IN_TRANSIT' | 'DELIVERED' | 'RECEIVED' | 'FAILED'
  receivedAt?: string
  receivedBy?: string
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
  paymentReference?: string
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
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("all")
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
  const [categories, setCategories] = useState<any[]>([])
  const [disciplines, setDisciplines] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [cartItems, setCartItems] = useState<Array<{ workId: string; title: string; price: number; quantity: number }>>([])
  const [bookSearchTerm, setBookSearchTerm] = useState("")
  const [isBookComboboxOpen, setIsBookComboboxOpen] = useState(false)
  const [newOrderData, setNewOrderData] = useState({
    userId: '',
    selectedCategory: '',
    selectedDiscipline: '',
    selectedClass: '',
    selectedWork: '',
    quantity: 0,
    promoCode: '',
    orderType: 'rentree-scolaire',
    deliveryDate: undefined as Date | undefined,
    deliveryTimeFrom: '07:00',
    deliveryTimeTo: '19:00',
    deliveryAddress: '',
    paymentMethod: '',
    items: [] as Array<{ workId: string; quantity: number; price: number }>
  })

  // Fonction utilitaire pour vérifier si works est un tableau valide
  const getWorks = () => works && Array.isArray(works) ? works : []

  // Mémoriser les dates pour éviter les re-renders inutiles
  const dateFromString = useMemo(() => dateRange.from?.toISOString(), [dateRange.from])
  const dateToString = useMemo(() => dateRange.to?.toISOString(), [dateRange.to])

  // Charger les commandes réelles
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const params: any = {}
        
        if (statusFilter !== "all") {
          params.status = statusFilter.toUpperCase()
        }
        
        if (dateFromString && dateToString) {
          params.startDate = dateFromString
          params.endDate = dateToString
        }
        
        const ordersData = await apiClient.getOrders(params)
        setOrders(ordersData as Order[])
      } catch (error: any) {
        console.error("Error fetching orders:", error)
        toast.error("Erreur lors du chargement des commandes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [statusFilter, dateFromString, dateToString])

  // Charger les utilisateurs et les livres pour le formulaire de création
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [usersData, worksData, categoriesData, disciplinesData, classesData] = await Promise.all([
          apiClient.getUsers(),
          apiClient.getWorks(),
          fetch("/api/pdg/categories").then(r => r.json()).catch(() => []),
          apiClient.getDisciplines(),
          fetch("/api/pdg/classes").then(r => r.json()).catch(() => [])
        ])
        setUsers(usersData || [])
        setWorks(worksData || [])
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        setDisciplines(Array.isArray(disciplinesData) ? disciplinesData : [])
        setClasses(Array.isArray(classesData) ? classesData : [])
      } catch (error) {
        console.error("Error fetching form data:", error)
        setUsers([])
        setWorks([])
        setCategories([])
        setDisciplines([])
        setClasses([])
      }
    }

    fetchFormData()
  }, [])

  // Filtrage des commandes - mémorisé pour éviter les recalculs inutiles
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const clientName = order.user?.name || order.partner?.name || ''
      const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           clientName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter.toUpperCase()
      const matchesPaymentType = paymentTypeFilter === "all" || order.paymentType === paymentTypeFilter
      const matchesPaymentStatus = paymentStatusFilter === "all" || order.paymentStatus === paymentStatusFilter
      const matchesDeliveryStatus = deliveryStatusFilter === "all" || order.deliveryStatus === deliveryStatusFilter
      
      return matchesSearch && matchesStatus && matchesPaymentType && matchesPaymentStatus && matchesDeliveryStatus
    })
  }, [orders, searchTerm, statusFilter, paymentTypeFilter, paymentStatusFilter, deliveryStatusFilter])

  // Actions sur les commandes - mémorisées avec useCallback
  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order)
    setIsDetailsOpen(true)
  }, [])

  const handleUpdateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
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
  }, [])

  const handleDeleteOrder = useCallback(async (orderId: string) => {
    // Vérifier si la commande est livrée
    const order = orders.find(o => o.id === orderId)
    if (order?.status === 'DELIVERED') {
      toast.error("Impossible de supprimer une commande livrée")
      return
    }
    
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
  }, [orders])

  // Filtrer les livres selon les sélections - mémorisé pour éviter les recalculs
  const filteredWorksForSelection = useMemo(() => {
    // La catégorie est obligatoire - si aucune catégorie n'est sélectionnée, aucun livre n'est affiché
    if (!newOrderData.selectedCategory) {
      return []
    }
    
    let filtered = getWorks()
    
    // Filtrer par catégorie (obligatoire)
    const selectedCategoryName = categories.find(cat => (cat.nom || cat.name) === newOrderData.selectedCategory)?.nom || newOrderData.selectedCategory
    filtered = filtered.filter(work => {
      // Le livre doit avoir une catégorie pour être trouvé
      const workCategory = work.category || ''
      if (!workCategory) {
        return false // Exclure les livres sans catégorie
      }
      // Comparer le nom de la catégorie du work avec la catégorie sélectionnée
      return workCategory.toLowerCase() === selectedCategoryName.toLowerCase() || 
             workCategory.toLowerCase().includes(selectedCategoryName.toLowerCase())
    })
    
    // Filtrer par matière (discipline) - optionnel
    if (newOrderData.selectedDiscipline) {
      filtered = filtered.filter(work => work.disciplineId === newOrderData.selectedDiscipline)
    }
    
    // Filtrer par terme de recherche (titre du livre ou ISBN) - optionnel
    if (bookSearchTerm.trim()) {
      const searchLower = bookSearchTerm.toLowerCase().trim()
      filtered = filtered.filter(work => 
        work.title?.toLowerCase().includes(searchLower) ||
        work.isbn?.toLowerCase().includes(searchLower)
      )
    }
    
    // Filtrer les livres sans stock (stock <= 0)
    filtered = filtered.filter(work => {
      const stock = work.stock ?? 0
      return stock > 0
    })
    
    // Note: La classe est optionnelle et ne filtre pas les livres
    // Elle peut être utilisée pour d'autres fins (ex: informations de livraison)
    
    return filtered
  }, [works, categories, newOrderData.selectedCategory, newOrderData.selectedDiscipline, bookSearchTerm])
  
  const getFilteredWorks = useCallback(() => {
    return filteredWorksForSelection
  }, [filteredWorksForSelection])

  // Ajouter un article au panier - mémorisé avec useCallback
  const handleAddToCart = useCallback(() => {
    console.log("🛒 Tentative d'ajout au panier:", {
      selectedWork: newOrderData.selectedWork,
      quantity: newOrderData.quantity,
      cartItemsCount: cartItems.length
    })

    if (!newOrderData.selectedWork) {
      toast.error("Veuillez sélectionner un livre")
      return
    }

    const quantity = newOrderData.quantity > 0 ? newOrderData.quantity : 1 // Par défaut, quantité = 1 si non spécifiée ou 0
    if (quantity <= 0) {
      toast.error("La quantité doit être supérieure à 0")
      return
    }

    const work = getWorks().find(w => w.id === newOrderData.selectedWork)
    if (!work) {
      console.error("❌ Livre introuvable:", newOrderData.selectedWork)
      toast.error("Livre introuvable")
      return
    }

    // Vérifier le stock disponible
    const stock = work.stock ?? 0
    if (stock <= 0) {
      toast.error(`${work.title} n'est plus en stock`)
      return
    }

    console.log("✅ Livre trouvé:", work.title, "Stock disponible:", stock)

    const existingItem = cartItems.find(item => item.workId === newOrderData.selectedWork)
    if (existingItem) {
      // Vérifier que la quantité totale (existante + nouvelle) ne dépasse pas le stock
      const totalQuantity = existingItem.quantity + quantity
      if (totalQuantity > stock) {
        toast.error(`Stock insuffisant pour ${work.title}. Stock disponible: ${stock}, Quantité demandée: ${totalQuantity}`)
        return
      }
      
      console.log("📦 Article existant, mise à jour de la quantité")
      setCartItems(prev => {
        const updated = prev.map(item => 
          item.workId === newOrderData.selectedWork
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        console.log("🛒 Panier mis à jour:", updated)
        return updated
      })
      toast.success(`${work.title} ajouté au panier (quantité: ${quantity})`)
    } else {
      // Vérifier que la quantité demandée ne dépasse pas le stock
      if (quantity > stock) {
        toast.error(`Stock insuffisant pour ${work.title}. Stock disponible: ${stock}, Quantité demandée: ${quantity}`)
        return
      }
      console.log("🆕 Nouvel article, ajout au panier")
      const newItem = {
        workId: work.id,
        title: work.title,
        price: work.price || 0,
        quantity: quantity
      }
      setCartItems(prev => {
        const updated = [...prev, newItem]
        console.log("🛒 Panier mis à jour:", updated)
        return updated
      })
      toast.success(`${work.title} ajouté au panier`)
    }

    // Réinitialiser les sélections
    setNewOrderData(prev => ({
      ...prev,
      selectedWork: '',
      quantity: 0
    }))
  }, [newOrderData.selectedWork, newOrderData.quantity, cartItems, works])

  // Retirer un article du panier - mémorisé avec useCallback
  const handleRemoveFromCart = useCallback((workId: string) => {
    setCartItems(prev => prev.filter(item => item.workId !== workId))
  }, [])

  // Calculer le total - mémorisé pour éviter les recalculs
  const calculateTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }, [cartItems])
  
  const totalAmount = useMemo(() => calculateTotal(), [calculateTotal])

  const handleCreateOrder = useCallback(async () => {
    try {
      if (!newOrderData.userId || cartItems.length === 0) {
        toast.error("Veuillez remplir tous les champs obligatoires et ajouter au moins un article")
        return
      }

      if (!newOrderData.deliveryAddress || !newOrderData.deliveryDate) {
        toast.error("Veuillez remplir les coordonnées de livraison")
        return
      }

      // Vérifier le stock disponible pour tous les articles du panier
      for (const item of cartItems) {
        const work = getWorks().find(w => w.id === item.workId)
        if (!work) {
          toast.error(`Livre introuvable: ${item.title}`)
          return
        }
        const stock = work.stock ?? 0
        if (stock < item.quantity) {
          toast.error(`Stock insuffisant pour ${item.title}. Stock disponible: ${stock}, Quantité demandée: ${item.quantity}`)
          return
        }
      }

      // Convertir les articles du panier en format API
      const itemsWithPrice = cartItems.map(item => ({
        workId: item.workId,
        quantity: item.quantity,
        price: item.price
      }))

      const orderData: any = {
        userId: newOrderData.userId,
        items: itemsWithPrice,
        promoCode: newOrderData.promoCode || undefined
      }

      // Ajouter les coordonnées de livraison
      if (newOrderData.deliveryDate) {
        orderData.deliveryDate = newOrderData.deliveryDate.toISOString()
      }
      if (newOrderData.deliveryAddress) {
        orderData.deliveryAddress = newOrderData.deliveryAddress
      }
      if (newOrderData.deliveryTimeFrom && newOrderData.deliveryTimeTo) {
        orderData.deliveryTimeFrom = newOrderData.deliveryTimeFrom
        orderData.deliveryTimeTo = newOrderData.deliveryTimeTo
      }
      
      // Ajouter le mode de paiement
      if (newOrderData.paymentMethod) {
        orderData.paymentMethod = newOrderData.paymentMethod
      }
      
      // Ajouter le type de commande
      if (newOrderData.orderType) {
        orderData.orderType = newOrderData.orderType
      }

      const newOrder = await apiClient.createOrder(orderData) as Order
      
      // Ajouter à la liste locale
      setOrders(prev => [newOrder, ...prev])
      
      // Réinitialiser le formulaire
      setNewOrderData({
        userId: '',
        selectedCategory: '',
        selectedDiscipline: '',
        selectedClass: '',
        selectedWork: '',
        quantity: 0,
        promoCode: '',
        orderType: 'rentree-scolaire',
        deliveryDate: undefined,
        deliveryTimeFrom: '07:00',
        deliveryTimeTo: '19:00',
        deliveryAddress: '',
        paymentMethod: '',
        items: []
      })
      setCartItems([])
      setBookSearchTerm("")
      setIsCreateOrderOpen(false)
      
      toast.success("Commande créée avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création")
    }
  }, [newOrderData, cartItems])


  // Pagination - mémorisée pour éviter les recalculs
  const totalPages = useMemo(() => Math.ceil(filteredOrders.length / itemsPerPage), [filteredOrders.length, itemsPerPage])
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage])
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage])
  const paginatedOrders = useMemo(() => filteredOrders.slice(startIndex, endIndex), [filteredOrders, startIndex, endIndex])

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

  const getPaymentTypeBadge = (type?: string) => {
    const typeConfig = {
      CASH: { label: 'Comptant', className: 'bg-green-100 text-green-800' },
      DEPOSIT: { label: 'Dépôt', className: 'bg-blue-100 text-blue-800' },
      CREDIT: { label: 'Crédit', className: 'bg-orange-100 text-orange-800' }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.CASH
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getPaymentStatusBadge = (status?: string) => {
    const statusConfig = {
      UNPAID: { label: 'Non payé', className: 'bg-red-100 text-red-800' },
      PARTIAL: { label: 'Partiel', className: 'bg-yellow-100 text-yellow-800' },
      PAID: { label: 'Payé', className: 'bg-green-100 text-green-800' },
      OVERDUE: { label: 'En retard', className: 'bg-red-100 text-red-800' },
      CANCELLED: { label: 'Annulé', className: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UNPAID
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getDeliveryStatusBadge = (status?: string) => {
    const statusConfig = {
      PENDING: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      PREPARING: { label: 'Préparation', className: 'bg-blue-100 text-blue-800' },
      READY: { label: 'Prêt', className: 'bg-purple-100 text-purple-800' },
      IN_TRANSIT: { label: 'En transit', className: 'bg-orange-100 text-orange-800' },
      DELIVERED: { label: 'Livré', className: 'bg-green-100 text-green-800' },
      RECEIVED: { label: 'Réceptionné', className: 'bg-teal-100 text-teal-800' },
      FAILED: { label: 'Échec', className: 'bg-red-100 text-red-800' }
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

  // Extraire l'adresse de livraison depuis paymentReference
  const getDeliveryAddress = (order: Order) => {
    if (!order.paymentReference) {
      return '-'
    }
    
    try {
      const deliveryInfo = JSON.parse(order.paymentReference)
      return deliveryInfo.address || '-'
    } catch {
      // Si ce n'est pas du JSON, retourner la valeur telle quelle
      return order.paymentReference || '-'
    }
  }

  // Callback mémorisé pour la sélection de date
  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    setDateRange({ from: range?.from, to: range?.to })
  }, [])

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1)
    toast.success("Filtres appliqués")
  }, [])

  const handleExportPDF = useCallback(() => {
    toast.success("Export PDF en cours...")
  }, [])

  const handleExportExcel = useCallback(() => {
    toast.success("Export Excel en cours...")
  }, [])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  // Callback mémorisé pour la sélection de date de livraison
  const handleDeliveryDateSelect = useCallback((date: Date | undefined) => {
    setNewOrderData(prev => ({ ...prev, deliveryDate: date }))
  }, [])

  // Fonction pour ouvrir la modale et réinitialiser les données
  const handleOpenCreateOrderModal = useCallback(() => {
    setBookSearchTerm("")
    setIsCreateOrderOpen(true)
  }, [])

  // Fonction pour fermer la modale et réinitialiser les données
  const handleCloseCreateOrderModal = useCallback(() => {
    setBookSearchTerm("")
    setIsCreateOrderOpen(false)
  }, [])

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
              onClick={handleOpenCreateOrderModal}
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
                    onSelect={handleDateRangeSelect}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre type de paiement */}
            <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="CASH">Comptant</SelectItem>
                <SelectItem value="DEPOSIT">Dépôt (Acompte)</SelectItem>
                <SelectItem value="CREDIT">Crédit</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre statut de paiement */}
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="UNPAID">Non payé</SelectItem>
                <SelectItem value="PARTIAL">Partiellement payé</SelectItem>
                <SelectItem value="PAID">Payé</SelectItem>
                <SelectItem value="OVERDUE">En retard</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre statut de livraison */}
            <Select value={deliveryStatusFilter} onValueChange={setDeliveryStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts de livraison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="PREPARING">En préparation</SelectItem>
                <SelectItem value="IN_TRANSIT">En transit</SelectItem>
                <SelectItem value="DELIVERED">Livré</SelectItem>
                <SelectItem value="RECEIVED">Réceptionné</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Troisième ligne de filtres */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtre méthode */}
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les méthodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les méthodes</SelectItem>
                <SelectItem value="Espèces">Espèces</SelectItem>
                <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                <SelectItem value="Virement">Virement bancaire</SelectItem>
                <SelectItem value="Carte">Carte bancaire</SelectItem>
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
                <TableHead className="font-semibold">Lieu de livraison</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold">Livraison</TableHead>
                <TableHead className="font-semibold">État Réception</TableHead>
                <TableHead className="font-semibold">Type Paiement</TableHead>
                <TableHead className="font-semibold">Statut Paiement</TableHead>
                <TableHead className="font-semibold">Méthode</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8">
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
                    <TableCell>
                      {order.deliveryDate ? formatDate(order.deliveryDate) : '-'}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm" title={getDeliveryAddress(order)}>
                        {getDeliveryAddress(order).length > 50 
                          ? getDeliveryAddress(order).substring(0, 50) + '...' 
                          : getDeliveryAddress(order)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {order.items[0]?.work?.discipline?.name || 'Divers'}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {getDeliveryStatusBadge(order.deliveryStatus)}
                    </TableCell>
                    <TableCell>
                      {order.receivedBy ? (
                        <div className="text-xs">
                          <div className="font-medium">Réceptionné</div>
                          <div className="text-gray-500">Par: {order.receivedBy}</div>
                        </div>
                      ) : (
                        <Badge variant="secondary">En attente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {getPaymentTypeBadge(order.paymentType)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        {getPaymentStatusBadge(order.paymentStatus)}
                        {order.paymentType === 'DEPOSIT' && order.depositAmount && (
                          <span className="text-xs text-gray-500">
                            Acompte: {order.depositAmount.toFixed(0)} FCFA
                          </span>
                        )}
                        {order.remainingAmount && order.remainingAmount > 0 && (
                          <span className="text-xs text-red-600">
                            Reste: {order.remainingAmount.toFixed(0)} FCFA
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{order.paymentMethod || 'Non défini'}</span>
                    </TableCell>
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
                        
                        {order.status !== 'DELIVERED' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer la commande"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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

                {/* Informations de paiement */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Informations de paiement</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Type de paiement</p>
                      {getPaymentTypeBadge(selectedOrder.paymentType)}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Statut de paiement</p>
                      {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Méthode</p>
                      <p className="font-medium">{selectedOrder.paymentMethod || 'Non défini'}</p>
                    </div>
                  </div>
                  
                  {selectedOrder.paymentType === 'DEPOSIT' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Acompte versé</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {selectedOrder.depositAmount?.toFixed(2) || '0.00'} FCFA
                          </p>
                          {selectedOrder.depositDate && (
                            <p className="text-xs text-gray-500">Le {formatDate(selectedOrder.depositDate)}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Montant payé</p>
                          <p className="text-lg font-semibold">
                            {selectedOrder.amountPaid?.toFixed(2) || '0.00'} FCFA
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Reste à payer</p>
                          <p className="text-lg font-semibold text-red-600">
                            {selectedOrder.remainingAmount?.toFixed(2) || '0.00'} FCFA
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOrder.paymentStatus === 'PAID' && selectedOrder.fullPaymentDate && (
                    <div className="mt-2 text-sm text-green-600">
                      ✓ Paiement complet effectué le {formatDate(selectedOrder.fullPaymentDate)}
                    </div>
                  )}
                </div>

                {/* Informations de livraison */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Informations de livraison</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Statut de livraison</p>
                      {getDeliveryStatusBadge(selectedOrder.deliveryStatus)}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Date de livraison prévue</p>
                      <p className="font-medium">
                        {selectedOrder.deliveryDate ? formatDate(selectedOrder.deliveryDate) : 'Non définie'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedOrder.receivedBy && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">✓ Commande réceptionnée</p>
                      <p className="text-sm text-gray-600 mt-1">Par: {selectedOrder.receivedBy}</p>
                      {selectedOrder.receivedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Le {formatDate(selectedOrder.receivedAt)}
                        </p>
                      )}
                    </div>
                  )}
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
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <DialogTitle className="text-xl font-semibold">Création de nouvelle commande</DialogTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Total: {totalAmount.toLocaleString()} XOF</span>
                <Button variant="ghost" size="sm" onClick={handleCloseCreateOrderModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Section de sélection des articles */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sélection du client */}
                  <div className="space-y-2">
                    <Label>Sélectionner le client</Label>
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

                  {/* Choix de la catégorie */}
                  <div className="space-y-2">
                    <Label>Choix de la catégorie</Label>
                    <Select 
                      value={newOrderData.selectedCategory} 
                      onValueChange={(value) => {
                        setNewOrderData(prev => ({ ...prev, selectedCategory: value, selectedWork: '' }))
                        setBookSearchTerm("")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.nom || category.name || category.id}>
                            {category.nom || category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Choix de la matière */}
                  <div className="space-y-2">
                    <Label>Choix de la Matière</Label>
                    <Select 
                      value={newOrderData.selectedDiscipline} 
                      onValueChange={(value) => {
                        setNewOrderData(prev => ({ ...prev, selectedDiscipline: value, selectedWork: '' }))
                        setBookSearchTerm("")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une matière" />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplines.map((discipline) => (
                          <SelectItem key={discipline.id} value={discipline.id}>
                            {discipline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Choix de la classe */}
                  <div className="space-y-2">
                    <Label>Choix de la classe</Label>
                    <Select 
                      value={newOrderData.selectedClass} 
                      onValueChange={(value) => setNewOrderData(prev => ({ ...prev, selectedClass: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez la classe" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((classe) => (
                          <SelectItem key={classe.id} value={classe.classe || classe.name || classe.id}>
                            {classe.classe || classe.name} ({classe.section})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Choix du livre */}
                  <div className="space-y-2">
                    <Label>Choix du livre</Label>
                    <Popover 
                      open={isBookComboboxOpen} 
                      onOpenChange={(open) => {
                        setIsBookComboboxOpen(open)
                        if (!open) {
                          setBookSearchTerm("")
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isBookComboboxOpen}
                          className="w-full justify-between"
                        >
                          {newOrderData.selectedWork
                            ? getWorks().find((work) => work.id === newOrderData.selectedWork)?.title || "Sélectionnez un livre"
                            : "Sélectionnez un livre..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false} className="rounded-lg border-none">
                          <CommandInput 
                            placeholder="Rechercher un livre..." 
                            value={bookSearchTerm}
                            onValueChange={(value) => setBookSearchTerm(value)}
                            className="h-9"
                          />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>
                              {bookSearchTerm.trim() ? `Aucun livre trouvé pour "${bookSearchTerm}"` : "Aucun livre disponible"}
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredWorksForSelection.map((work) => (
                                <CommandItem
                                  key={work.id}
                                  value={`${work.title} ${work.isbn || ''}`}
                                  onSelect={() => {
                                    setNewOrderData(prev => ({ ...prev, selectedWork: work.id }))
                                    setBookSearchTerm("")
                                    setIsBookComboboxOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newOrderData.selectedWork === work.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{work.title}</div>
                                    <div className="text-xs text-gray-500">
                                      {(work.price || 0).toLocaleString()} XOF
                                      {work.isbn && ` • ISBN: ${work.isbn}`}
                                      {work.stock !== undefined && (
                                        <span className={cn(
                                          "ml-2",
                                          (work.stock ?? 0) > 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                          • Stock: {work.stock ?? 0}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            {bookSearchTerm.trim() && filteredWorksForSelection.length > 0 && (
                              <div className="p-2 text-xs text-gray-500 text-center border-t">
                                {filteredWorksForSelection.length} livre{filteredWorksForSelection.length > 1 ? 's' : ''} trouvé{filteredWorksForSelection.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Quantité */}
                  <div className="space-y-2">
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newOrderData.quantity || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        setNewOrderData(prev => ({ ...prev, quantity: value }))
                      }}
                      placeholder="1"
                    />
                  </div>

                  {/* Boutons Ajouter et Auto */}
                  <div className="flex items-end gap-2">
                    <Button 
                      onClick={handleAddToCart}
                      className="bg-indigo-600 hover:bg-indigo-700 flex-1"
                    >
                      Ajouter
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                    >
                      Auto
                    </Button>
                  </div>
                </div>

                {/* Tableau récapitulatif */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Livre</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            Aucun article dans le panier
                          </TableCell>
                        </TableRow>
                      ) : (
                        cartItems.map((item) => (
                          <TableRow key={item.workId}>
                            <TableCell>{item.title}</TableCell>
                            <TableCell>{item.price.toLocaleString()} XOF</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{(item.price * item.quantity).toLocaleString()} XOF</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFromCart(item.workId)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Total */}
                <div className="flex justify-end">
                  <div className="text-right">
                    <span className="text-sm font-medium">Total: {totalAmount.toLocaleString()} XOF</span>
                  </div>
                </div>
              </div>

              {/* Section détails de la commande */}
              <div className="space-y-4 border-t pt-4">
                {/* Code promo */}
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Code promo</Label>
                    <Input
                      placeholder="CODE PROMO"
                      value={newOrderData.promoCode}
                      onChange={(e) => setNewOrderData(prev => ({ ...prev, promoCode: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Appliquer
                    </Button>
                  </div>
                </div>

                {/* Type de commande */}
                <div className="space-y-2">
                  <Label>Type de commande</Label>
                  <Select 
                    value={newOrderData.orderType} 
                    onValueChange={(value) => setNewOrderData(prev => ({ ...prev, orderType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le type de commande" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rentree-scolaire">Commande pour la rentrée scolaire</SelectItem>
                      <SelectItem value="cours-vacances">Cours de vacances</SelectItem>
                      <SelectItem value="periode-cours">Période de cours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Coordonnées de Livraison */}
                <div className="space-y-4">
                  <div className="bg-black text-white px-4 py-2 rounded">
                    <Label className="text-white font-semibold">Coordonnées de Livraison</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date de livraison */}
                    <div className="space-y-2">
                      <Label>Date de livraison</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newOrderData.deliveryDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newOrderData.deliveryDate ? (
                              format(newOrderData.deliveryDate, "dd/MM/yyyy", { locale: fr })
                            ) : (
                              <span className="text-muted-foreground">Sélectionnez une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newOrderData.deliveryDate}
                            onSelect={handleDeliveryDateSelect}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Plage horaire */}
                    <div className="space-y-2">
                      <Label>Plage horaire</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600">De</Label>
                          <div className="relative">
                            <Input
                              type="time"
                              value={newOrderData.deliveryTimeFrom}
                              onChange={(e) => setNewOrderData(prev => ({ ...prev, deliveryTimeFrom: e.target.value }))}
                              className="pr-8"
                            />
                            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600">à</Label>
                          <div className="relative">
                            <Input
                              type="time"
                              value={newOrderData.deliveryTimeTo}
                              onChange={(e) => setNewOrderData(prev => ({ ...prev, deliveryTimeTo: e.target.value }))}
                              className="pr-8"
                            />
                            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adresse de livraison */}
                  <div className="space-y-2">
                    <Label>Adresse de livraison</Label>
                    <Textarea
                      placeholder="Adresse de livraison"
                      value={newOrderData.deliveryAddress}
                      onChange={(e) => setNewOrderData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Mode de paiement */}
                <div className="space-y-2">
                  <Label>Sélectionnez Mode de paiement</Label>
                  <Select 
                    value={newOrderData.paymentMethod} 
                    onValueChange={(value) => setNewOrderData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez mode de règlement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">Espèces</SelectItem>
                      <SelectItem value="mobile-money">Mobile Money</SelectItem>
                      <SelectItem value="virement">Virement bancaire</SelectItem>
                      <SelectItem value="carte">Carte bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  onClick={handleCreateOrder}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
                <Button 
                  onClick={handleCloseCreateOrderModal} 
                  variant="destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  )
}