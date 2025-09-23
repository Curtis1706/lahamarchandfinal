"use client"

import { useState, useEffect } from "react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  BookOpen,
  ShoppingCart,
  PieChart,
  BarChart3,
  Calendar,
  Download,
  Eye
} from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Types pour les données financières
interface FinancialData {
  totalRevenue: number
  totalOrders: number
  totalBooksSold: number
  averageOrderValue: number
  revenueByMonth: Array<{ month: string; revenue: number; orders: number }>
  revenueByDiscipline: Array<{ discipline: string; revenue: number; percentage: number }>
  revenueByAuthor: Array<{ author: string; revenue: number; books: number }>
  paymentStatus: {
    paid: number
    pending: number
    overdue: number
  }
}

export default function GestionFinancierePage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [periodFilter, setPeriodFilter] = useState("6months")

  // Charger les données financières
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setIsLoading(true)
        
        // Simuler des données financières
        const mockData: FinancialData = {
          totalRevenue: 2500000,
          totalOrders: 156,
          totalBooksSold: 2840,
          averageOrderValue: 16025,
          revenueByMonth: [
            { month: "Jan", revenue: 180000, orders: 12 },
            { month: "Fév", revenue: 220000, orders: 15 },
            { month: "Mar", revenue: 195000, orders: 13 },
            { month: "Avr", revenue: 280000, orders: 18 },
            { month: "Mai", revenue: 320000, orders: 22 },
            { month: "Jun", revenue: 350000, orders: 24 },
            { month: "Jul", revenue: 290000, orders: 19 },
            { month: "Aoû", revenue: 410000, orders: 28 },
            { month: "Sep", revenue: 380000, orders: 25 },
            { month: "Oct", revenue: 320000, orders: 21 },
            { month: "Nov", revenue: 280000, orders: 18 },
            { month: "Déc", revenue: 350000, orders: 23 }
          ],
          revenueByDiscipline: [
            { discipline: "Mathématiques", revenue: 850000, percentage: 34 },
            { discipline: "Français", revenue: 720000, percentage: 29 },
            { discipline: "Sciences", revenue: 480000, percentage: 19 },
            { discipline: "Histoire", revenue: 250000, percentage: 10 },
            { discipline: "Géographie", revenue: 200000, percentage: 8 }
          ],
          revenueByAuthor: [
            { author: "Dr. Marie Koffi", revenue: 450000, books: 850 },
            { author: "Prof. Jean Adou", revenue: 380000, books: 720 },
            { author: "Dr. Fatou Traoré", revenue: 320000, books: 680 },
            { author: "Prof. Koffi Mensah", revenue: 280000, books: 590 }
          ],
          paymentStatus: {
            paid: 1200000,
            pending: 800000,
            overdue: 500000
          }
        }
        
        setFinancialData(mockData)
      } catch (error) {
        console.error("Error fetching financial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFinancialData()
  }, [periodFilter])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  if (userLoading || isLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <DollarSign className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des données financières...</p>
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

  if (!financialData) {
    return (
      <DynamicDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune donnée financière disponible</p>
        </div>
      </DynamicDashboardLayout>
    )
  }

  return (
    <DynamicDashboardLayout title="Gestion Financière">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion Financière</h1>
            <p className="text-muted-foreground">
              Suivez les revenus, paiements et performances financières
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 derniers mois</SelectItem>
                <SelectItem value="6months">6 derniers mois</SelectItem>
                <SelectItem value="1year">1 an</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {financialData.totalRevenue.toLocaleString()} F CFA
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12.5% vs mois dernier
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {financialData.totalOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +8.2% vs mois dernier
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livres Vendus</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {financialData.totalBooksSold.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +15.3% vs mois dernier
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {financialData.averageOrderValue.toLocaleString()} F CFA
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +5.1% vs mois dernier
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des revenus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Évolution des Revenus
              </CardTitle>
              <CardDescription>
                Revenus mensuels sur les 12 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialData.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} F CFA`, 'Revenus']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition par discipline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Revenus par Discipline
              </CardTitle>
              <CardDescription>
                Répartition des revenus par discipline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={financialData.revenueByDiscipline}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="revenue"
                  >
                    {financialData.revenueByDiscipline.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} F CFA`, 'Revenus']}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tableaux détaillés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top auteurs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Top Auteurs
              </CardTitle>
              <CardDescription>
                Auteurs avec les meilleures performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData.revenueByAuthor.map((author, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{author.author}</p>
                        <p className="text-sm text-muted-foreground">
                          {author.books} livres vendus
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {author.revenue.toLocaleString()} F CFA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statut des paiements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Statut des Paiements
              </CardTitle>
              <CardDescription>
                Répartition des paiements par statut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Payés</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {financialData.paymentStatus.paid.toLocaleString()} F CFA
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">En attente</span>
                  </div>
                  <span className="font-semibold text-yellow-600">
                    {financialData.paymentStatus.pending.toLocaleString()} F CFA
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium">En retard</span>
                  </div>
                  <span className="font-semibold text-red-600">
                    {financialData.paymentStatus.overdue.toLocaleString()} F CFA
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>
              Outils de gestion financière
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Eye className="h-6 w-6 mb-2" />
                <span>Rapport Détaillé</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Download className="h-6 w-6 mb-2" />
                <span>Exporter Excel</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Calendar className="h-6 w-6 mb-2" />
                <span>Planifier Rapport</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DynamicDashboardLayout>
  )
}
