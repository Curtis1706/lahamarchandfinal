"use client"

import { useState, useEffect } from "react"
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
}

export default function PartenaireDashboard() {
  const { user } = useCurrentUser()
  const [stats, setStats] = useState<PartnerStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    availableWorks: 0
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
        totalOrders: data.totalOrders,
        pendingOrders: data.pendingOrders,
        completedOrders: data.completedOrders,
        totalRevenue: data.totalRevenue,
        availableWorks: data.availableWorks
      })
      
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      // Valeurs par défaut en cas d'erreur
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        availableWorks: 0
      })
    } finally {
      setIsLoading(false)
    }
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
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% ce mois
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
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle commande
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Consulter le catalogue
            </Button>
            <Button className="w-full justify-start" variant="outline">
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
                <Badge className="bg-green-100 text-green-800">Actif</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Type</span>
                <span className="text-sm text-muted-foreground">Librairie</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Représentant</span>
                <span className="text-sm text-muted-foreground">Thomas Représentant</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dernière activité</span>
                <span className="text-sm text-muted-foreground">Aujourd'hui</span>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Commande #2025COM001</p>
                <p className="text-sm text-muted-foreground">15 livres - Mathématiques CE1</p>
              </div>
              <div className="text-right">
                <Badge className="bg-green-100 text-green-800">Livrée</Badge>
                <p className="text-sm text-muted-foreground">45,000 FCFA</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Commande #2025COM002</p>
                <p className="text-sm text-muted-foreground">8 livres - Français CM2</p>
              </div>
              <div className="text-right">
                <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>
                <p className="text-sm text-muted-foreground">32,000 FCFA</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Commande #2025COM003</p>
                <p className="text-sm text-muted-foreground">12 livres - Sciences CE2</p>
              </div>
              <div className="text-right">
                <Badge className="bg-blue-100 text-blue-800">En attente</Badge>
                <p className="text-sm text-muted-foreground">48,000 FCFA</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}