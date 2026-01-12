"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import {
  Filter,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  Package,
  User,
  Calendar,
  DollarSign,
  Building2,
  FileText,
  Download,
  Printer,
  Plus
} from "lucide-react"
import { useRouter } from "next/navigation"

interface PartnerOrder {
  id: string
  status: string
  total: number
  itemCount: number
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

export default function RepresentantCommandesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<PartnerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Charger les commandes créées par le représentant
  useEffect(() => {
    loadOrders()
  }, [statusFilter, startDate, endDate])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/representant/orders')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      
      const data = await response.json()
      setOrders(data.orders || [])
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

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase()
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.items.some(item => 
        item.work.title.toLowerCase().includes(searchLower) ||
        item.work.isbn.toLowerCase().includes(searchLower)
      )
    )
  }).filter(order => {
    if (statusFilter !== 'all') {
      return order.status === statusFilter
    }
    return true
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Commandes</h1>
          <p className="text-gray-600">Gérez les commandes que vous avez créées pour vos clients</p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/representant/commandes/creer')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer une commande
        </Button>
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
                  <TableHead>Nb. livres</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-mono text-sm">{order.id.slice(0, 8)}</span>
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
                        <div className="text-sm font-medium text-green-600">
                          {order.total.toLocaleString("fr-FR")} FCFA
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" title="Voir les détails">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Télécharger">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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