"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BookOpen,
  AlertTriangle,
  Plus,
  RotateCcw,
  Eye,
  ShoppingBag,
  Activity
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface DashboardData {
  kpis: {
    totalAvailableStock: number
    salesTodayQty: number
    salesMonthQty: number
    salesMonthAmount: number
    returnsMonthQty: number
    ristournesDisponibles: number
    lowStockCount: number
  }
  partner: {
    name: string
    type: string
    status: string
    representant: {
      name: string
      email: string
      phone: string | null
    } | null
    lastSaleDate: string | null
  }
  recentMovements: Array<{
    id: string
    type: string
    quantity: number
    createdAt: string
    work: {
      id: string
      title: string
      isbn: string | null
    }
    reference: string | null
    reason: string | null
  }>
  lowStockItems: Array<{
    id: string
    workId: string
    title: string
    isbn: string | null
    availableQuantity: number
    allocatedQuantity: number
    threshold: number
  }>
  topSales: Array<{
    title: string
    quantity: number
    amount: number
  }>
  totalWorks: number
}

export default function PartenaireDashboard() {
  const { user } = useCurrentUser()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/partenaire/dashboard", { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Erreur lors du chargement")
      }
      const dashboardData = await res.json()
      setData(dashboardData)
    } catch (error: any) {
      console.error('Erreur lors du chargement du dashboard:', error)
      toast.error("Erreur lors du chargement du dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy à HH:mm", { locale: fr })
  }

  const getMovementTypeLabel = (type: string) => {
    const labels: { [key: string]: { label: string; icon: any; color: string } } = {
      'PARTNER_SALE': { label: 'Vente', icon: TrendingUp, color: 'bg-green-100 text-green-800' },
      'PARTNER_RETURN': { label: 'Retour', icon: RotateCcw, color: 'bg-purple-100 text-purple-800' },
      'PARTNER_ALLOCATION': { label: 'Allocation', icon: Package, color: 'bg-blue-100 text-blue-800' }
    }
    return labels[type] || { label: type, icon: Activity, color: 'bg-gray-100 text-gray-800' }
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

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Aucune donnée disponible</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stock disponible */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock disponible</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.totalAvailableStock}</div>
            <p className="text-xs text-muted-foreground">
              {data.totalWorks} référence{data.totalWorks > 1 ? 's' : ''} en stock
            </p>
          </CardContent>
        </Card>

        {/* Ventes du mois */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes du mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.salesMonthQty}</div>
            <p className="text-xs text-muted-foreground">
              {data.kpis.salesMonthAmount.toLocaleString()} FCFA
            </p>
            {data.kpis.salesTodayQty > 0 && (
              <p className="text-xs text-green-600 mt-1">
                {data.kpis.salesTodayQty} aujourd'hui
              </p>
            )}
          </CardContent>
        </Card>

        {/* Retours du mois */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retours du mois</CardTitle>
            <RotateCcw className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.returnsMonthQty}</div>
            <p className="text-xs text-muted-foreground">
              Retours enregistrés
            </p>
          </CardContent>
        </Card>

        {/* Ristournes disponibles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ristournes disponibles</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.ristournesDisponibles.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              Montant retirable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides et Statut du compte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              onClick={() => router.push('/dashboard/partenaire/ventes')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Enregistrer une vente
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/dashboard/partenaire/retours')}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Enregistrer un retour
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/dashboard/partenaire/stock/niveau')}
            >
              <Package className="h-4 w-4 mr-2" />
              Voir stock alloué
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/dashboard/partenaire/catalogue')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir catalogue
            </Button>
          </CardContent>
        </Card>

        {/* Statut du compte */}
        <Card>
          <CardHeader>
            <CardTitle>Statut du compte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statut</span>
                <Badge className={data.partner.status === 'ACTIF' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {data.partner.status === 'ACTIF' ? 'Actif' : data.partner.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Type</span>
                <span className="text-sm text-muted-foreground">{data.partner.type || 'Non défini'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Représentant</span>
                <span className="text-sm text-muted-foreground">
                  {data.partner.representant ? data.partner.representant.name : 'Non assigné'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dernière vente</span>
                <span className="text-sm text-muted-foreground">
                  {data.partner.lastSaleDate ? formatDate(data.partner.lastSaleDate) : 'Aucune'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente et Stock faible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentMovements.length > 0 ? (
              <div className="space-y-3">
                {data.recentMovements.map((movement) => {
                  const typeInfo = getMovementTypeLabel(movement.type)
                  const TypeIcon = typeInfo.icon
                  return (
                    <div key={movement.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded ${typeInfo.color}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{movement.work.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {typeInfo.label} • {movement.quantity} exemplaire{movement.quantity > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(movement.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune activité récente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock faible */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              Stock faible
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {data.lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      {item.isbn && (
                        <p className="text-xs text-muted-foreground">ISBN: {item.isbn}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-600">{item.availableQuantity}</p>
                      <p className="text-xs text-muted-foreground">sur {item.allocatedQuantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun stock faible</p>
              </div>
            )}
            {data.kpis.lowStockCount > data.lowStockItems.length && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard/partenaire/stock/niveau')}
                >
                  Voir tous les stocks faibles ({data.kpis.lowStockCount})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top ventes du mois */}
      {data.topSales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top ventes du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topSales.map((sale, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{sale.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.quantity} exemplaire{sale.quantity > 1 ? 's' : ''} vendu{sale.quantity > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{sale.amount.toLocaleString()} FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
