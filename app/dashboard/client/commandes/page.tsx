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
import {
  ShoppingCart,
  Package,
  Calendar,
  Eye,
  Truck,
  CreditCard,
  Search,
  Filter,
  Loader2,
  X,
  CheckCircle,
  Clock,
  AlertCircle
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
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  itemCount: number
  paymentMethod: string
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
  const handleCancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled')
    toast.success("Commande annulée avec succès")
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

  if (userLoading || ordersLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DynamicDashboardLayout>
    )
  }

  if (!user) {
    return (
      <DynamicDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vous devez être connecté pour voir vos commandes.</p>
        </div>
      </DynamicDashboardLayout>
    )
  }

  return (
    <DynamicDashboardLayout>
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