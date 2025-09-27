"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Download,
  Calendar,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  RefreshCw,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface ReportData {
  period: string
  authors: {
    total: number
    active: number
    new: number
  }
  works: {
    total: number
    pending: number
    transmitted: number
    published: number
    rejected: number
  }
  orders: {
    total: number
    pending: number
    completed: number
    totalValue: number
  }
  activities: Array<{
    id: string
    type: 'WORK_SUBMITTED' | 'WORK_TRANSMITTED' | 'WORK_PUBLISHED' | 'ORDER_CREATED' | 'AUTHOR_ADDED'
    description: string
    date: string
    author?: string
    work?: string
    order?: string
  }>
}

export default function RapportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("current-month")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [showCustomDateRange, setShowCustomDateRange] = useState(false)

  // Load data
  useEffect(() => {
    loadReportData()
  }, [selectedPeriod, customStartDate, customEndDate])

  const loadReportData = async () => {
    try {
      setIsLoading(true)
      
      let startDate: string
      let endDate: string
      
      if (selectedPeriod === "custom") {
        if (!customStartDate || !customEndDate) {
          toast.error("Veuillez sélectionner une période personnalisée")
          return
        }
        startDate = customStartDate
        endDate = customEndDate
      } else {
        const now = new Date()
        switch (selectedPeriod) {
          case "current-month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
            break
          case "last-month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
            endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
            break
          case "current-quarter":
            const quarter = Math.floor(now.getMonth() / 3)
            startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0]
            endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0]
            break
          case "current-year":
            startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
            endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
            break
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        }
      }

      const data = await apiClient.getRepresentantReport(startDate, endDate)
      setReportData(data)
    } catch (error: any) {
      toast.error("Erreur lors du chargement du rapport")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportReport = async () => {
    try {
      let startDate: string
      let endDate: string
      
      if (selectedPeriod === "custom") {
        if (!customStartDate || !customEndDate) {
          toast.error("Veuillez sélectionner une période personnalisée")
          return
        }
        startDate = customStartDate
        endDate = customEndDate
      } else {
        const now = new Date()
        switch (selectedPeriod) {
          case "current-month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
            break
          case "last-month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
            endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
            break
          case "current-quarter":
            const quarter = Math.floor(now.getMonth() / 3)
            startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0]
            endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0]
            break
          case "current-year":
            startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
            endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
            break
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        }
      }

      await apiClient.exportRepresentantReport(startDate, endDate)
      
      toast.success("Rapport exporté avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'export du rapport")
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'WORK_SUBMITTED':
        return <BookOpen className="h-4 w-4 text-blue-600" />
      case 'WORK_TRANSMITTED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'WORK_PUBLISHED':
        return <TrendingUp className="h-4 w-4 text-purple-600" />
      case 'ORDER_CREATED':
        return <Package className="h-4 w-4 text-orange-600" />
      case 'AUTHOR_ADDED':
        return <Users className="h-4 w-4 text-indigo-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'WORK_SUBMITTED':
        return 'bg-blue-50 border-blue-200'
      case 'WORK_TRANSMITTED':
        return 'bg-green-50 border-green-200'
      case 'WORK_PUBLISHED':
        return 'bg-purple-50 border-purple-200'
      case 'ORDER_CREATED':
        return 'bg-orange-50 border-orange-200'
      case 'AUTHOR_ADDED':
        return 'bg-indigo-50 border-indigo-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Génération du rapport...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports d'Activité</h1>
          <p className="text-gray-600">Suivez vos performances et générez des rapports</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadReportData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Période d'Analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="period">Période</Label>
              <Select value={selectedPeriod} onValueChange={(value) => {
                setSelectedPeriod(value)
                setShowCustomDateRange(value === "custom")
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Mois en cours</SelectItem>
                  <SelectItem value="last-month">Mois dernier</SelectItem>
                  <SelectItem value="current-quarter">Trimestre en cours</SelectItem>
                  <SelectItem value="current-year">Année en cours</SelectItem>
                  <SelectItem value="custom">Période personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {showCustomDateRange && (
              <>
                <div>
                  <Label htmlFor="start-date">Date de début</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Date de fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auteurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.authors.total}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.authors.active} actifs, {reportData.authors.new} nouveaux
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Œuvres</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.works.total}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.works.published} publiées, {reportData.works.pending} en attente
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.orders.total}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.orders.completed} terminées, {reportData.orders.pending} en attente
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.orders.totalValue.toLocaleString('fr-FR')} F CFA
                </div>
                <p className="text-xs text-muted-foreground">
                  Période: {reportData.period}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Works Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques des Œuvres</CardTitle>
                <CardDescription>Répartition des œuvres par statut</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">En attente</span>
                    </div>
                    <span className="font-medium">{reportData.works.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Transmises au PDG</span>
                    </div>
                    <span className="font-medium">{reportData.works.transmitted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Publiées</span>
                    </div>
                    <span className="font-medium">{reportData.works.published}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Rejetées</span>
                    </div>
                    <span className="font-medium">{reportData.works.rejected}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques des Commandes</CardTitle>
                <CardDescription>Répartition des commandes par statut</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">En attente</span>
                    </div>
                    <span className="font-medium">{reportData.orders.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Terminées</span>
                    </div>
                    <span className="font-medium">{reportData.orders.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Total</span>
                    </div>
                    <span className="font-medium">{reportData.orders.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Valeur totale</span>
                    </div>
                    <span className="font-medium">
                      {reportData.orders.totalValue.toLocaleString('fr-FR')} F CFA
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Activités Récentes</CardTitle>
              <CardDescription>Dernières actions effectuées dans votre zone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <div className="mt-1 text-xs text-gray-600">
                        {activity.author && <span>Auteur: {activity.author}</span>}
                        {activity.work && <span>Œuvre: {activity.work}</span>}
                        {activity.order && <span>Commande: {activity.order}</span>}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(activity.date).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
