"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import {
  Plus,
  Filter,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
  X,
  Printer,
  Download,
  Search,
} from "lucide-react"

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

interface Work {
  id: string
  title: string
  isbn: string
  price: number
  stock: number
  discipline?: {
    name: string
  }
}

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: string
}

interface OrderItem {
  workId: string
  quantity: number
  price: number
  title: string
}

export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false)
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all") // all, partner, client
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [showAllocateStockDialog, setShowAllocateStockDialog] = useState(false)
  const [selectedOrderForAllocation, setSelectedOrderForAllocation] = useState<Order | null>(null)
  const [isAllocatingStock, setIsAllocatingStock] = useState(false)
  
  // Formulaire de création
  const [selectedUserId, setSelectedUserId] = useState("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedWorkId, setSelectedWorkId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [ordersData, worksData, usersData] = await Promise.all([
        apiClient.getOrders(),
        apiClient.getWorks({ status: 'PUBLISHED' }),
        apiClient.getUsers()
      ])
      
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setWorks(Array.isArray(worksData) ? worksData : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = () => {
    if (!selectedWorkId || !quantity) {
      toast.error("Sélectionnez un livre et saisissez une quantité")
      return
    }

    const work = works.find(w => w.id === selectedWorkId)
    if (!work) return

    const qty = parseInt(quantity)
    if (qty <= 0) {
      toast.error("La quantité doit être supérieure à 0")
      return
    }

    if (work.stock < qty) {
      toast.error(`Stock insuffisant. Disponible: ${work.stock}`)
      return
    }

    const newItem: OrderItem = {
      workId: work.id,
      quantity: qty,
      price: work.price,
      title: work.title
    }

    setOrderItems([...orderItems, newItem])
    setSelectedWorkId("")
    setQuantity("")
  }

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handleCreateOrder = async () => {
    if (!selectedUserId) {
      toast.error("Sélectionnez un client")
      return
    }

    if (orderItems.length === 0) {
      toast.error("Ajoutez au moins un livre à la commande")
      return
    }

    try {
      const items = orderItems.map(item => ({
        workId: item.workId,
        quantity: item.quantity,
        price: item.price
      }))

      await apiClient.createOrder({
        userId: selectedUserId,
        items
      })

      toast.success("Commande créée avec succès")
      setShowCreateOrderModal(false)
      setSelectedUserId("")
      setOrderItems([])
      setPaymentMethod("")
      loadData()
    } catch (error: any) {
      console.error('Erreur lors de la création:', error)
      toast.error(error.message || "Erreur lors de la création de la commande")
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiClient.updateOrder(orderId, { status: newStatus })
      toast.success("Statut mis à jour")
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour")
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      return
    }

    try {
      await apiClient.deleteOrder(orderId)
      toast.success("Commande supprimée")
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING: { label: "En attente", variant: "outline" },
      VALIDATED: { label: "Validée", variant: "default" },
      PROCESSING: { label: "En traitement", variant: "default" },
      SHIPPED: { label: "Expédiée", variant: "default" },
      DELIVERED: { label: "Livrée", variant: "default" },
      CANCELLED: { label: "Annulée", variant: "destructive" }
    }
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const handleAllocateStock = async (order: Order) => {
    if (!order.partnerId || !order.partner) {
      toast.error("Cette commande n'est pas associée à un partenaire")
      return
    }

    setSelectedOrderForAllocation(order)
    setShowAllocateStockDialog(true)
  }

  const confirmAllocateStock = async () => {
    if (!selectedOrderForAllocation) return

    setIsAllocatingStock(true)
    try {
      // Allouer le stock pour chaque item de la commande
      const allocations = selectedOrderForAllocation.items.map(item => ({
        partnerId: selectedOrderForAllocation.partnerId!,
        workId: item.workId,
        quantity: item.quantity,
        reason: `Allocation depuis commande ${selectedOrderForAllocation.id}`
      }))

      for (const allocation of allocations) {
        await apiClient.allocatePartnerStock(allocation)
      }

      toast.success("Stock alloué avec succès au partenaire")
      setShowAllocateStockDialog(false)
      setSelectedOrderForAllocation(null)
      loadData()
    } catch (error: any) {
      console.error('Erreur lors de l\'allocation:', error)
      toast.error(error.message || "Erreur lors de l'allocation du stock")
    } finally {
      setIsAllocatingStock(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesType = typeFilter === "all" || 
      (typeFilter === "partner" && order.partnerId) ||
      (typeFilter === "client" && !order.partnerId)
    const matchesSearch = searchTerm === "" || 
      order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.partner && order.partner.name.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesType && matchesSearch
  })

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)
  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des commandes...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Les commandes</h2>
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
                        <Label>Sélectionner le client *</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un client" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.filter(u => u.role === 'CLIENT' || u.role === 'PARTENAIRE').map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Add Book */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Choix du livre *</Label>
                          <Select value={selectedWorkId} onValueChange={setSelectedWorkId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un livre" />
                            </SelectTrigger>
                            <SelectContent>
                              {works.map(work => (
                                <SelectItem key={work.id} value={work.id}>
                                  {work.title} - Stock: {work.stock} - {work.price} F CFA
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Quantité *</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                          />
                        </div>

                        <div className="flex items-end">
                          <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            onClick={handleAddItem}
                          >
                            Ajouter
                          </Button>
                        </div>
                      </div>

                      {/* Order Items Table */}
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
                              {orderItems.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-gray-500">
                                    Aucune commande ajoutée
                                  </td>
                                </tr>
                              ) : (
                                orderItems.map((item, index) => (
                                  <tr key={index} className="border-t">
                                    <td className="p-3">{item.title}</td>
                                    <td className="p-3">{item.price} F CFA</td>
                                    <td className="p-3">{item.quantity}</td>
                                    <td className="p-3">{item.price * item.quantity} F CFA</td>
                                    <td className="p-3">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveItem(index)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-semibold">Total: {totalAmount} F CFA</p>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <Label>Mode de paiement</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                        <Button 
                          className="bg-indigo-600 hover:bg-indigo-700 flex-1"
                          onClick={handleCreateOrder}
                        >
                          Enregistrer <Package className="w-4 h-4 ml-2" />
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
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

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="VALIDATED">Validée</SelectItem>
                  <SelectItem value="PROCESSING">En traitement</SelectItem>
                  <SelectItem value="SHIPPED">Expédiée</SelectItem>
                  <SelectItem value="DELIVERED">Livrée</SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de commande" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les commandes</SelectItem>
                  <SelectItem value="partner">Commandes partenaires</SelectItem>
                  <SelectItem value="client">Commandes clients</SelectItem>
                </SelectContent>
              </Select>

              <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline"
                onClick={loadData}
              >
                Actualiser
              </Button>
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
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Statut</th>
                  <th className="text-left p-4">Total</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Aucune commande trouvée
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">{order.id.slice(0, 12)}</span>
                        </div>
                      </td>
                      <td className="p-4">{order.bookCount}</td>
                      <td className="p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{order.user.name}</p>
                            {order.partnerId && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Partenaire
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{order.user.email}</p>
                          {order.user.phone && (
                            <p className="text-sm text-gray-500">{order.user.phone}</p>
                          )}
                          {order.partner && (
                            <p className="text-sm text-blue-600 font-medium mt-1">
                              {order.partner.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="p-4 font-semibold">
                        {order.total.toLocaleString()} F CFA
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {order.partnerId && order.status === 'VALIDATED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAllocateStock(order)}
                              title="Allouer le stock au partenaire"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Package className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, order.status === 'PENDING' ? 'VALIDATED' : 'PROCESSING')}
                            disabled={order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
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
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredOrders.length)} sur {filteredOrders.length} éléments
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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
        </div>
      </div>

      {/* Dialog d'allocation de stock */}
      <Dialog open={showAllocateStockDialog} onOpenChange={setShowAllocateStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allouer le stock au partenaire</DialogTitle>
          </DialogHeader>
          {selectedOrderForAllocation && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Partenaire: <span className="font-medium">{selectedOrderForAllocation.partner?.name}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Commande: <span className="font-mono">{selectedOrderForAllocation.id.slice(0, 12)}</span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Articles à allouer:</p>
                <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                  {selectedOrderForAllocation.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{item.work.title}</p>
                        <p className="text-xs text-gray-500">Quantité: {item.quantity}</p>
                      </div>
                      <Badge variant="outline">{item.quantity} unités</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Cette action allouera le stock central au partenaire. Le stock sera déduit du stock central et ajouté au stock du partenaire.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAllocateStockDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={confirmAllocateStock} 
                  disabled={isAllocatingStock}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isAllocatingStock ? "Allocation..." : "Confirmer l'allocation"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
