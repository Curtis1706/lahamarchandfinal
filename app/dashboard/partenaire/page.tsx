"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  Eye,
  Plus
} from "lucide-react"

interface PartnerStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
  availableWorks: number
  revenueGrowth: number
  partner: {
    name: string
    type: string
    status: string
    representant: string | null
    lastActivity: string
  }
  recentOrders: Array<{
    id: string
    reference: string
    quantity: number
    disciplines: string
    status: string
    amount: number
    createdAt: string
  }>
}

export default function PartenaireDashboard() {
  const { user } = useCurrentUser()
  const router = useRouter()
  const [stats, setStats] = useState<PartnerStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    availableWorks: 0,
    revenueGrowth: 0,
    partner: {
      name: '',
      type: '',
      status: '',
      representant: null,
      lastActivity: new Date().toISOString()
    },
    recentOrders: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true)
      
      const data = await apiClient.getPartenaireStats()
      
      setStats({
        totalOrders: data.totalOrders || 0,
        pendingOrders: data.pendingOrders || 0,
        completedOrders: data.completedOrders || 0,
        totalRevenue: data.totalRevenue || 0,
        availableWorks: data.availableWorks || 0,
        revenueGrowth: data.revenueGrowth || 0,
        partner: data.partner || {
          name: '',
          type: '',
          status: '',
          representant: null,
          lastActivity: new Date().toISOString()
        },
        recentOrders: data.recentOrders || []
      })
      
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      // Valeurs par défaut en cas d'erreur
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        availableWorks: 0,
        revenueGrowth: 0,
        partner: {
          name: '',
          type: '',
          status: '',
          representant: null,
          lastActivity: new Date().toISOString()
        },
        recentOrders: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      'DELIVERED': { label: 'Livrée', className: 'bg-green-100 text-green-800' },
      'VALIDATED': { label: 'Validée', className: 'bg-blue-100 text-blue-800' },
      'PROCESSING': { label: 'En cours', className: 'bg-yellow-100 text-yellow-800' },
      'SHIPPED': { label: 'Expédiée', className: 'bg-purple-100 text-purple-800' },
      'PENDING': { label: 'En attente', className: 'bg-gray-100 text-gray-800' },
      'CANCELLED': { label: 'Annulée', className: 'bg-red-100 text-red-800' }
    }
    
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    return statusInfo
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Partenaire</h1>
        <p className="text-gray-600">Bienvenue, {user?.name}</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes complétées</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.completedOrders / stats.totalOrders) * 100)}% de réussite
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              {stats.revenueGrowth !== 0 && (
                <>
                  <TrendingUp className={`inline h-3 w-3 mr-1 ${stats.revenueGrowth < 0 ? 'rotate-180' : ''}`} />
                  {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth}% ce mois
                </>
              )}
              {stats.revenueGrowth === 0 && 'Aucune évolution ce mois'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Œuvres disponibles</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableWorks}</div>
            <p className="text-xs text-muted-foreground">
              Catalogue complet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/dashboard/partenaire/commandes?action=new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle commande
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/dashboard/partenaire/catalogue')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Consulter le catalogue
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/dashboard/partenaire/commandes')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Voir mes commandes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut du compte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statut</span>
                <Badge className={stats.partner.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {stats.partner.status === 'ACTIVE' ? 'Actif' : stats.partner.status === 'PENDING' ? 'En attente' : stats.partner.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Type</span>
                <span className="text-sm text-muted-foreground">{stats.partner.type || 'Non défini'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Représentant</span>
                <span className="text-sm text-muted-foreground">{stats.partner.representant || 'Non assigné'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dernière activité</span>
                <span className="text-sm text-muted-foreground">{formatDate(stats.partner.lastActivity)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commandes récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order) => {
                const statusInfo = getStatusBadge(order.status)
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.reference}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.quantity} livre{order.quantity > 1 ? 's' : ''} - {order.disciplines}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.amount.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune commande récente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}