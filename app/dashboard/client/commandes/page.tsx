"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useOrders } from "@/hooks/use-orders"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  ShoppingCart,
  Package,
  Eye,
  Truck,
  CreditCard,
  Search,
  Filter,
  Loader2,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  ChevronDown,
  Save,
  Trash2,
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Types pour les commandes (importés du hook)
interface OrderItem {
  id: string
  title: string
  isbn: string
  price: number
  quantity: number
  image: string
}

interface Order {
  id: string
  reference: string
  date: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  itemCount: number
  paymentMethod: string
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED'
  deliveryAddress: string
  items: OrderItem[]
  trackingNumber?: string
  estimatedDelivery?: string
  notes?: string
  customerInfo: {
    fullName: string
    email: string
    phone: string
    address: string
    city: string
  }
}

function ClientCommandePageContent() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const { orders, updateOrderStatus, isLoading: ordersLoading, refreshOrders } = useOrders()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // États pour le modal de création de commande
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [works, setWorks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [disciplines, setDisciplines] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [cartItems, setCartItems] = useState<Array<{ workId: string; title: string; price: number; quantity: number }>>([])
  const [bookSearchTerm, setBookSearchTerm] = useState("")
  const [isBookComboboxOpen, setIsBookComboboxOpen] = useState(false)
  const [newOrderData, setNewOrderData] = useState({
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
  })



  // Charger les données pour le formulaire de création
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [worksData, categoriesResponse, disciplinesData, classesResponse] = await Promise.all([
          apiClient.getWorks({ status: 'PUBLISHED' }),
          fetch("/api/pdg/categories").then(r => {
            if (!r.ok) {
              console.error("❌ Erreur lors du chargement des catégories:", r.status, r.statusText)
              return []
            }
            return r.json()
          }).catch((err) => {
            console.error("❌ Erreur lors du chargement des catégories:", err)
            return []
          }),
          apiClient.getDisciplines(),
          fetch("/api/pdg/classes").then(r => {
            if (!r.ok) {
              console.error("❌ Erreur lors du chargement des classes:", r.status, r.statusText)
              return []
            }
            return r.json()
          }).catch((err) => {
            console.error("❌ Erreur lors du chargement des classes:", err)
            return []
          })
        ])

        // S'assurer que worksData est un tableau
        const worksArray = Array.isArray(worksData) ? worksData : []
        // Filtrer uniquement les livres PUBLISHED (sécurité supplémentaire)
        const publishedWorks = worksArray.filter((work: any) => work.status === 'PUBLISHED' || !work.status)

        // Traiter les catégories
        const categoriesArray = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse?.error ? [] : categoriesResponse || [])

        // Traiter les classes
        const classesArray = Array.isArray(classesResponse) ? classesResponse : (classesResponse?.error ? [] : classesResponse || [])


        setWorks(publishedWorks)
        setCategories(categoriesArray)
        setDisciplines(disciplinesData || [])
        setClasses(classesArray)

        if (categoriesArray.length === 0) {
        }
        if (classesArray.length === 0) {
        }
      } catch (error) {
        console.error("❌ Error fetching form data:", error)
        setWorks([])
        setCategories([])
        setDisciplines([])
        setClasses([])
        toast.error("Erreur lors du chargement des données")
      }
    }

    fetchFormData()
  }, [])

  // Rafraîchissement automatique des commandes toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders()
    }, 30000) // 30 secondes

    return () => clearInterval(interval)
  }, [refreshOrders])

  // Détecter les nouvelles commandes et ouvrir automatiquement les détails
  useEffect(() => {
    const newOrderId = searchParams.get('newOrder')
    if (newOrderId && !ordersLoading && orders.length > 0) {
      const orderExists = orders.find(order => order.id === newOrderId)
      if (orderExists) {
        setOpenOrderId(newOrderId)
        // Nettoyer l'URL après avoir ouvert les détails
        setTimeout(() => {
          window.history.replaceState({}, '', '/dashboard/client/commandes')
        }, 2000)
      }
    }
  }, [searchParams, orders, ordersLoading])

  // Fonction pour actualiser les commandes
  const handleRefresh = async () => {
    try {
      await refreshOrders()
      toast.success("Commandes actualisées")
    } catch (error) {
      console.error("Erreur lors de l'actualisation:", error)
    }
  }

  const getStatusBadge = (status: Order['status']) => {
    const variants = {
      pending: { variant: "secondary" as const, label: "En attente", color: "bg-yellow-100 text-yellow-800" },
      confirmed: { variant: "default" as const, label: "Validée", color: "bg-blue-100 text-blue-800" },
      processing: { variant: "default" as const, label: "En traitement", color: "bg-orange-100 text-orange-800" },
      shipped: { variant: "default" as const, label: "Expédiée", color: "bg-purple-100 text-purple-800" },
      delivered: { variant: "default" as const, label: "Livrée", color: "bg-green-100 text-green-800" },
      cancelled: { variant: "destructive" as const, label: "Annulée", color: "bg-red-100 text-red-800" }
    }

    const config = variants[status] || variants.pending // Fallback vers "pending" si statut non reconnu
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Fonctions pour gérer les actions
  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'cancelled')
      // Recharger les commandes pour mettre à jour les statistiques
      await refreshOrders()
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error)
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <X className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Fonctions pour le modal de création de commande
  const getWorks = () => works && Array.isArray(works) ? works : []

  const getFilteredWorks = () => {
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
      const matches = workCategory.toLowerCase() === selectedCategoryName.toLowerCase() ||
        workCategory.toLowerCase().includes(selectedCategoryName.toLowerCase())
      return matches
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
  }

  const handleAddToCart = () => {

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


    const existingItem = cartItems.find(item => item.workId === newOrderData.selectedWork)
    if (existingItem) {
      // Vérifier que la quantité totale (existante + nouvelle) ne dépasse pas le stock
      const totalQuantity = existingItem.quantity + quantity
      if (totalQuantity > stock) {
        toast.error(`Stock insuffisant pour ${work.title}. Stock disponible: ${stock}, Quantité demandée: ${totalQuantity}`)
        return
      }

      setCartItems(prev => {
        const updated = prev.map(item =>
          item.workId === newOrderData.selectedWork
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        return updated
      })
      toast.success(`${work.title} ajouté au panier (quantité: ${quantity})`)
    } else {
      // Vérifier que la quantité demandée ne dépasse pas le stock
      if (quantity > stock) {
        toast.error(`Stock insuffisant pour ${work.title}. Stock disponible: ${stock}, Quantité demandée: ${quantity}`)
        return
      }
      const newItem = {
        workId: work.id,
        title: work.title,
        price: work.price || 0,
        quantity: quantity
      }
      setCartItems(prev => {
        const updated = [...prev, newItem]
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
  }

  const handleRemoveFromCart = (workId: string) => {
    setCartItems(prev => prev.filter(item => item.workId !== workId))
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleCreateOrder = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour passer une commande")
      return
    }

    if (cartItems.length === 0) {
      toast.error("Veuillez ajouter au moins un article au panier")
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

    try {
      const itemsWithPrice = cartItems.map(item => ({
        workId: item.workId,
        quantity: item.quantity,
        price: item.price
      }))

      const orderData: any = {
        userId: user.id,
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

      await apiClient.createOrder(orderData)

      // Réinitialiser le formulaire
      setNewOrderData({
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
      })
      setCartItems([])
      setBookSearchTerm("")
      setIsCreateOrderOpen(false)

      // Rafraîchir les commandes pour mettre à jour la liste et les statistiques
      await refreshOrders()

      toast.success("Commande créée avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la commande")
    }
  }

  if (userLoading || ordersLoading) {
    return (
      <DynamicDashboardLayout title="Mes Commandes">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DynamicDashboardLayout>
    )
  }

  if (!user) {
    return (
      <DynamicDashboardLayout title="Mes Commandes">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vous devez être connecté pour voir vos commandes.</p>
        </div>
      </DynamicDashboardLayout>
    )
  }

  return (
    <DynamicDashboardLayout title="Mes Commandes">
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mes Commandes</h1>
              <p className="text-muted-foreground">
                Suivez l'état de vos commandes de livres scolaires
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={ordersLoading}
                title="Actualiser les commandes"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Link href="/dashboard/client/commande/nouvelle">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Commande +
                </Button>
              </Link>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par référence ou adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter(o => ['pending', 'confirmed', 'shipped'].includes(o.status)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livrées</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === 'delivered').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total dépensé</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0).toLocaleString()} F CFA
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des commandes */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune commande trouvée</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Essayez de modifier vos critères de recherche"
                  : "Vous n'avez pas encore passé de commande"
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Link href="/dashboard/client/catalogue">
                  <Button className="mt-4">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Explorer le catalogue
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className={openOrderId === order.id ? "ring-2 ring-blue-500" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{order.reference}</span>
                        {openOrderId === order.id && (
                          <Badge className="bg-blue-100 text-blue-800 animate-pulse">
                            Nouvelle commande
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Commandé le {new Date(order.date).toLocaleDateString('fr-FR')}
                      </CardDescription>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Articles</p>
                      <p className="text-lg font-semibold">{order.itemCount} livre{order.itemCount > 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">{order.total.toLocaleString()} F CFA</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Paiement</p>
                      <p className="text-sm">{order.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">Adresse de livraison</p>
                    <p className="text-sm">{order.deliveryAddress}</p>
                  </div>
                  <div className="flex items-center justify-end mt-4 space-x-2">
                    <Dialog open={openOrderId === order.id} onOpenChange={(open) => {
                      if (open) {
                        setOpenOrderId(order.id)
                      } else {
                        setOpenOrderId(null)
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenOrderId(order.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <span>Détails de la commande {order.reference}</span>
                          </DialogTitle>
                          <DialogDescription>
                            Informations complètes sur votre commande
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Informations générales */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Informations de commande</h4>
                              <div className="space-y-2 text-sm">
                                <p><span className="font-medium">Référence:</span> {order.reference}</p>
                                <p><span className="font-medium">Date:</span> {new Date(order.date).toLocaleDateString('fr-FR')}</p>
                                <p><span className="font-medium">Statut:</span> {getStatusBadge(order.status)}</p>
                                <p><span className="font-medium">Paiement:</span> {order.paymentMethod}</p>
                                {order.trackingNumber && (
                                  <p><span className="font-medium">N° de suivi:</span> {order.trackingNumber}</p>
                                )}
                                {order.estimatedDelivery && (
                                  <p><span className="font-medium">Livraison estimée:</span> {new Date(order.estimatedDelivery).toLocaleDateString('fr-FR')}</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Adresse de livraison</h4>
                              <p className="text-sm">{order.deliveryAddress}</p>
                              {order.notes && (
                                <div className="mt-2">
                                  <h5 className="font-medium text-sm">Notes:</h5>
                                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <Separator />

                          {/* Articles commandés */}
                          <div>
                            <h4 className="font-semibold mb-4">Articles commandés</h4>
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                                  <div className="relative w-16 h-20 bg-gray-100 rounded">
                                    <Image
                                      src={item.image}
                                      alt={item.title}
                                      fill
                                      className="object-cover rounded"
                                      sizes="64px"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm">{item.title}</h5>
                                    <p className="text-xs text-muted-foreground">ISBN: {item.isbn}</p>
                                    <p className="text-sm font-semibold text-blue-600">
                                      {item.price.toLocaleString()} F CFA
                                    </p>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Quantité:</span> {item.quantity}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          {/* Total */}
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Total de la commande:</span>
                            <span className="text-xl font-bold text-blue-600">
                              {order.total.toLocaleString()} F CFA
                            </span>
                          </div>

                          {/* Bouton de Paiement si Validée et Non Payée */}
                          {(order.status === 'confirmed' && order.paymentStatus !== 'PAID') && (
                            <div className="mt-6">
                              <Link href={`/orders/${order.id}/checkout`}>
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg">
                                  <CreditCard className="mr-2 h-5 w-5" />
                                  Procéder au paiement
                                </Button>
                              </Link>
                              <p className="text-xs text-center text-muted-foreground mt-2">
                                Votre commande a été validée. Vous pouvez maintenant procéder au paiement sécurisé.
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {order.status === 'pending' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            Annuler
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Annuler la commande</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir annuler la commande {order.reference} ?
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Non, garder la commande</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelOrder(order.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Oui, annuler la commande
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de création de commande */}
        <Dialog
          open={isCreateOrderOpen}
          onOpenChange={(open) => {
            setIsCreateOrderOpen(open)
            if (!open) {
              setBookSearchTerm("")
            }
          }}
        >
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <DialogTitle className="text-xl font-semibold">Création de nouvelle commande</DialogTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Total: {calculateTotal().toLocaleString()} XOF</span>
                <Button variant="ghost" size="sm" onClick={() => {
                  setBookSearchTerm("")
                  setIsCreateOrderOpen(false)
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Section de sélection des articles */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.nom || category.name || category.id}>
                              {category.nom || category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500 text-center">Aucune catégorie disponible</div>
                        )}
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
                        {classes.length > 0 ? (
                          classes.map((classe) => (
                            <SelectItem key={classe.id} value={classe.classe || classe.name || classe.id}>
                              {classe.classe || classe.name} ({classe.section})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500 text-center">Aucune classe disponible</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                              {getFilteredWorks().map((work) => (
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
                            {bookSearchTerm.trim() && getFilteredWorks().length > 0 && (
                              <div className="p-2 text-xs text-gray-500 text-center border-t">
                                {getFilteredWorks().length} livre{getFilteredWorks().length > 1 ? 's' : ''} trouvé{getFilteredWorks().length > 1 ? 's' : ''}
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
                    <span className="text-sm font-medium">Total: {calculateTotal().toLocaleString()} XOF</span>
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
                            onSelect={(date) => setNewOrderData(prev => ({ ...prev, deliveryDate: date }))}
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
                  onClick={() => {
                    setBookSearchTerm("")
                    setIsCreateOrderOpen(false)
                  }}
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
    </DynamicDashboardLayout>
  )
}

export default function ClientCommandePage() {
  return (
    <Suspense fallback={
      <DynamicDashboardLayout title="Mes Commandes">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        </div>
      </DynamicDashboardLayout>
    }>
      <ClientCommandePageContent />
    </Suspense>
  )
}