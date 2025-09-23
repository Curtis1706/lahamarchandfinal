"use client"

import { useState, useEffect } from "react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ShoppingCart, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Truck,
  Package,
  TrendingUp,
  Calendar,
  User,
  MapPin
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Types pour les commandes
interface Order {
  id: string
  reference: string
  clientId: string
  client?: {
    id: string
    name: string
    email: string
  }
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  date: string
  deliveryAddress: string
  trackingNumber?: string
  estimatedDelivery?: string
  notes?: string
}

interface OrderItem {
  workId: string
  work?: {
    id: string
    title: string
    price: number
  }
  quantity: number
  price: number
}

export default function GestionCommandesPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [lastOrderCount, setLastOrderCount] = useState(0)

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Charger les vraies commandes des clients depuis localStorage
        const clientOrders = localStorage.getItem("client-orders")
        let realOrders: Order[] = []
        
        if (clientOrders) {
          try {
            const parsedOrders = JSON.parse(clientOrders)
            realOrders = parsedOrders.map((order: any) => ({
              id: order.id,
              reference: order.reference,
              clientId: order.customerInfo?.email || 'client-inconnu',
              client: {
                id: order.customerInfo?.email || 'client-inconnu',
                name: order.customerInfo?.fullName || 'Client',
                email: order.customerInfo?.email || 'email@example.com'
              },
              items: order.items.map((item: any) => ({
                workId: item.id,
                work: {
                  id: item.id,
                  title: item.title,
                  price: item.price
                },
                quantity: item.quantity,
                price: item.price
              })),
              total: order.total,
              status: order.status,
              date: order.date,
              deliveryAddress: order.deliveryAddress || order.customerInfo?.address || 'Adresse non spécifiée',
              trackingNumber: order.trackingNumber,
              estimatedDelivery: order.estimatedDelivery,
              notes: order.notes
            }))
          } catch (error) {
            console.error("Erreur lors du parsing des commandes:", error)
          }
        }
        
        // Ajouter quelques commandes d'exemple si aucune commande réelle
        if (realOrders.length === 0) {
          const sampleOrders: Order[] = [
            {
              id: 'order-1',
              reference: 'CMD-2024-001',
              clientId: 'client-1',
              client: {
                id: 'client-1',
                name: 'École Primaire de Cotonou',
                email: 'contact@ecole-cotonou.bj'
              },
              items: [
                {
                  workId: 'work-1',
                  work: {
                    id: 'work-1',
                    title: 'Mathématiques CE1',
                    price: 2500
                  },
                  quantity: 50,
                  price: 2500
                }
              ],
              total: 209000,
              status: 'pending',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              deliveryAddress: 'École Primaire de Cotonou, Quartier Cadjehoun, Cotonou',
              notes: 'Commande urgente pour la rentrée scolaire'
            }
          ]
          realOrders = sampleOrders
        }
        
        setOrders(realOrders)
        
        // Vérifier s'il y a de nouvelles commandes
        if (realOrders.length > lastOrderCount && lastOrderCount > 0) {
          toast.success(`Nouvelle commande reçue ! ${realOrders.length - lastOrderCount} nouvelle(s) commande(s)`)
        }
        setLastOrderCount(realOrders.length)
        
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    
    // Écouter les changements dans localStorage pour mettre à jour en temps réel
    const handleStorageChange = () => {
      fetchData()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Vérifier les changements toutes les 2 secondes
    const interval = setInterval(fetchData, 2000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Fonctions de gestion
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Mettre à jour l'état local
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus,
                trackingNumber: newStatus === 'shipped' ? `TRK-${Date.now()}` : order.trackingNumber,
                estimatedDelivery: newStatus === 'shipped' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : order.estimatedDelivery
              }
            : order
        )
      )
      
      // Mettre à jour le localStorage des clients
      const clientOrders = localStorage.getItem("client-orders")
      if (clientOrders) {
        try {
          const parsedOrders = JSON.parse(clientOrders)
          const updatedOrders = parsedOrders.map((order: any) => 
            order.id === orderId 
              ? { 
                  ...order, 
                  status: newStatus,
                  trackingNumber: newStatus === 'shipped' ? `TRK-${Date.now()}` : order.trackingNumber,
                  estimatedDelivery: newStatus === 'shipped' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : order.estimatedDelivery
                }
              : order
          )
          localStorage.setItem("client-orders", JSON.stringify(updatedOrders))
        } catch (error) {
          console.error("Erreur lors de la mise à jour du localStorage:", error)
        }
      }
      
      toast.success(`Commande ${newStatus === 'confirmed' ? 'confirmée' : 
                              newStatus === 'shipped' ? 'expédiée' : 
                              newStatus === 'delivered' ? 'livrée' : 
                              'annulée'} avec succès`)
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsOpen(true)
  }

  // Filtrage
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client?.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      case 'confirmed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Confirmée</Badge>
      case 'shipped':
        return <Badge variant="default" className="bg-purple-100 text-purple-800"><Truck className="h-3 w-3 mr-1" />Expédiée</Badge>
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800"><Package className="h-3 w-3 mr-1" />Livrée</Badge>
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Annulée</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            <Button
              onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmer
            </Button>
            <Button
              onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
              variant="destructive"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
        )
      case 'confirmed':
        return (
          <Button
            onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
            className="bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Truck className="h-4 w-4 mr-2" />
            Expédier
          </Button>
        )
      case 'shipped':
        return (
          <Button
            onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Package className="h-4 w-4 mr-2" />
            Marquer livrée
          </Button>
        )
      default:
        return null
    }
  }

  if (userLoading || isLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <ShoppingCart className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des commandes...</p>
          </div>
        </div>
      </DynamicDashboardLayout>
    )
  }

  if (!user || user.role !== 'PDG') {
    return (
      <DynamicDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Accès non autorisé</p>
        </div>
      </DynamicDashboardLayout>
    )
  }

  return (
    <DynamicDashboardLayout title="Gestion des Commandes">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Commandes</h1>
            <p className="text-muted-foreground">
              Gérez et suivez toutes les commandes de la plateforme
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              <ShoppingCart className="h-3 w-3 mr-1" />
              {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
            </Badge>
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="text-sm animate-pulse">
                <Clock className="h-3 w-3 mr-1" />
                {orders.filter(o => o.status === 'pending').length} en attente
              </Badge>
            )}
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {orders.filter(o => o.status === 'confirmed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expédiées</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {orders.filter(o => o.status === 'shipped').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livrées</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'delivered').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence, client..."
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
              <SelectItem value="confirmed">Confirmées</SelectItem>
              <SelectItem value="shipped">Expédiées</SelectItem>
              <SelectItem value="delivered">Livrées</SelectItem>
              <SelectItem value="cancelled">Annulées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des commandes */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune commande trouvée</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== "all"
                  ? "Essayez de modifier vos critères de recherche"
                  : "Aucune commande dans le système"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{order.reference}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{order.client?.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>{order.total.toLocaleString()} F CFA</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Package className="h-4 w-4" />
                            <span>{order.items.length} article{order.items.length > 1 ? 's' : ''}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDistanceToNow(new Date(order.date), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{order.deliveryAddress}</span>
                        </div>
                        
                        {order.trackingNumber && (
                          <div className="flex items-center space-x-1">
                            <Truck className="h-4 w-4" />
                            <span>Suivi: {order.trackingNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      
                      {getStatusActions(order)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog des détails */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la commande {selectedOrder?.reference}</DialogTitle>
              <DialogDescription>
                Informations complètes sur cette commande
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Client</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.client?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.client?.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Statut</h4>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
                
                {/* Adresse de livraison */}
                <div>
                  <h4 className="font-semibold mb-2">Adresse de livraison</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.deliveryAddress}</p>
                </div>
                
                {/* Articles commandés */}
                <div>
                  <h4 className="font-semibold mb-2">Articles commandés</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">{item.work?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantité: {item.quantity} × {item.price.toLocaleString()} F CFA
                          </p>
                        </div>
                        <p className="font-semibold">
                          {(item.quantity * item.price).toLocaleString()} F CFA
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold">Total</h4>
                    <p className="text-xl font-bold">{selectedOrder.total.toLocaleString()} F CFA</p>
                  </div>
                </div>
                
                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DynamicDashboardLayout>
  )
}
