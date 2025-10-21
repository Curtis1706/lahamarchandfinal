"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import {
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ShoppingCart,
  Package,
  User,
  Calendar,
  DollarSign,
  FileText,
  Download,
  Printer
} from "lucide-react"

interface Order {
  id: string
  reference: string
  status: string
  total: number
  itemCount: number
  client: {
    id: string
    name: string
    email: string
    phone: string
  }
  items: Array<{
    id: string
    work: {
      id: string
      title: string
      isbn: string
      discipline: string
      author: string
    }
    quantity: number
    price: number
  }>
  createdAt: string
  updatedAt: string
}

export default function ConcepteurCommandesPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Array<{id: string, name: string, email: string}>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false)
  const [newOrderData, setNewOrderData] = useState({
    clientId: "",
    items: [] as Array<{ workId: string; quantity: number; price: number }>,
    notes: ""
  })

  // Charger les commandes
  useEffect(() => {
    loadOrders()
  }, [statusFilter, startDate, endDate])

  // Charger les clients quand le modal s'ouvre
  useEffect(() => {
    if (showCreateOrderModal && clients.length === 0) {
      loadClients()
    }
  }, [showCreateOrderModal])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getConcepteurOrders({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })
      setOrders(data)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des commandes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      setIsLoadingClients(true)
      const data = await apiClient.getConcepteurClients()
      setClients(data.map((client: any) => ({
        id: client.id,
        name: client.name,
        email: client.email
      })))
    } catch (error: any) {
      console.error('Erreur chargement clients:', error)
      // Fallback sur les utilisateurs avec rôle CLIENT
      try {
        const users = await apiClient.getUsersList('CLIENT')
        setClients(users.filter((u: any) => u.status === 'ACTIVE').map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email
        })))
      } catch (fallbackError) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les clients",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoadingClients(false)
    }
  }

  const handleCreateOrder = async () => {
    try {
      if (!newOrderData.clientId || newOrderData.items.length === 0) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un client et ajouter des items",
          variant: "destructive"
        })
        return
      }

      const newOrder = await apiClient.createConcepteurOrder(newOrderData)
      toast({
        title: "Succès",
        description: "Commande créée avec succès"
      })
      
      setShowCreateOrderModal(false)
      setNewOrderData({
        clientId: "",
        items: [],
        notes: ""
      })
      loadOrders()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la commande",
        variant: "destructive"
      })
    }
  }

  const handleSearch = () => {
    loadOrders()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case 'VALIDATED':
        return <Badge className="bg-green-100 text-green-800">Validée</Badge>
      case 'PROCESSING':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
      case 'SHIPPED':
        return <Badge className="bg-purple-100 text-purple-800">Expédiée</Badge>
      case 'DELIVERED':
        return <Badge className="bg-green-100 text-green-800">Livrée</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Annulée</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredOrders = orders.filter(order =>
    order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Commandes</h1>
          <p className="text-gray-600">Gérez les commandes de vos œuvres</p>
        </div>
        <Dialog open={showCreateOrderModal} onOpenChange={setShowCreateOrderModal}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Commande
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle commande</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientId">Client *</Label>
                <Select
                  value={newOrderData.clientId}
                  onValueChange={(value) => setNewOrderData({ ...newOrderData, clientId: value })}
                  disabled={isLoadingClients}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingClients ? "Chargement..." : "Sélectionner un client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {isLoadingClients ? "Chargement des clients..." : "Aucun client disponible"}
                      </SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={newOrderData.notes}
                  onChange={(e) => setNewOrderData({ ...newOrderData, notes: e.target.value })}
                  placeholder="Notes sur la commande"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateOrderModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateOrder}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher une commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[150px]"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[150px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="VALIDATED">Validée</SelectItem>
                <SelectItem value="PROCESSING">En cours</SelectItem>
                <SelectItem value="SHIPPED">Expédiée</SelectItem>
                <SelectItem value="DELIVERED">Livrée</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des commandes ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Nb. livres</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-mono text-sm">{order.reference}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{order.client.name}</div>
                          <div className="text-sm text-gray-500">{order.client.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Package className="h-4 w-4 mr-1" />
                        {order.itemCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm font-medium text-green-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {order.total.toLocaleString()} FCFA
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actions en bas */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-600">
          Affichage de 1 à {filteredOrders.length} sur {filteredOrders.length} éléments
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            EXCEL
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>
    </div>
  )
}
