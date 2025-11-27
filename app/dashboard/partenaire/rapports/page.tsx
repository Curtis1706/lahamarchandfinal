"use client"

import { useState, useEffect } from "react"
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  FileText,
  PieChart,
  Activity,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Rapport {
  id: string
  titre: string
  type: string
  periode: string
  statut: string
  dateCreation: string
  donnees: {
    ventesTotal: number
    commandesTotal: number
    livresVendus: number
    chiffreAffaires: number
    evolution: string
  }
}

interface SummaryData {
  totalVentes: number
  totalCommandes: number
  totalLivres: number
  chiffreAffaires: number
  evolution: string
  meilleurMois: string
  disciplinePopulaire: string
  livrePopulaire: string
}

export default function RapportsPage() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [detailedData, setDetailedData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("tous")
  const [statutFilter, setStatutFilter] = useState("tous")
  const [periodeFilter, setPeriodeFilter] = useState("tous")
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRapport, setSelectedRapport] = useState<any>(null)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [reportType, setReportType] = useState("mensuel")

  useEffect(() => {
    loadReports()
  }, [dateRange])

  const loadReports = async () => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams({
        type: 'summary'
      })

      if (dateRange.from) {
        params.append('startDate', dateRange.from.toISOString())
      }
      if (dateRange.to) {
        params.append('endDate', dateRange.to.toISOString())
      }

      const response = await fetch(`/api/partenaire/rapports?${params}`)
      if (!response.ok) throw new Error("Erreur lors du chargement")

      const data = await response.json()
      setSummaryData(data.summary || null)
      setDetailedData(data)
    } catch (error: any) {
      console.error('Erreur lors du chargement des rapports:', error)
      toast.error(error.message || "Erreur lors du chargement des rapports")
    } finally {
      setIsLoading(false)
    }
  }

  const loadDetailedReport = async () => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams({
        type: 'detailed'
      })

      if (dateRange.from) {
        params.append('startDate', dateRange.from.toISOString())
      }
      if (dateRange.to) {
        params.append('endDate', dateRange.to.toISOString())
      }

      const response = await fetch(`/api/partenaire/rapports?${params}`)
      if (!response.ok) throw new Error("Erreur lors du chargement")

      const data = await response.json()
      setDetailedData(data)
      return data
    } catch (error: any) {
      console.error('Erreur lors du chargement du rapport détaillé:', error)
      toast.error(error.message || "Erreur lors du chargement")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const viewDetails = async (rapport: any) => {
    setSelectedRapport(rapport)
    const detailed = await loadDetailedReport()
    if (detailed) {
      setSelectedRapport({ ...rapport, detailed })
    }
    setShowDetailModal(true)
  }

  const generateRapport = async () => {
    try {
      const startDate = dateRange.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const endDate = dateRange.to || new Date()

      const response = await fetch("/api/partenaire/rapports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la génération")
      }

      toast.success("Rapport généré avec succès")
      setShowGenerateModal(false)
      loadReports()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la génération du rapport")
    }
  }

  const handleExport = () => {
    if (!summaryData) {
      toast.error("Aucune donnée à exporter")
      return
    }

    const csvContent = [
      ["Rapport Partenaire", ""],
      ["Chiffre d'affaires total", `${summaryData.chiffreAffaires} F CFA`],
      ["Total commandes", summaryData.totalCommandes],
      ["Total livres vendus", summaryData.totalLivres],
      ["Évolution", summaryData.evolution],
      ["Discipline populaire", summaryData.disciplinePopulaire],
      ["Livre populaire", summaryData.livrePopulaire],
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rapport_partenaire_${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success("Rapport exporté avec succès")
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "mensuel": return <Calendar className="w-4 h-4" />
      case "trimestriel": return <BarChart3 className="w-4 h-4" />
      case "annuel": return <TrendingUp className="w-4 h-4" />
      case "automatique": return <Activity className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "mensuel": return "bg-blue-100 text-blue-800"
      case "trimestriel": return "bg-green-100 text-green-800"
      case "annuel": return "bg-purple-100 text-purple-800"
      case "automatique": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "généré": return "bg-green-100 text-green-800"
      case "en_cours": return "bg-yellow-100 text-yellow-800"
      case "erreur": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports simplifiés</h1>
          <p className="text-gray-600 mt-1">
            Consultez vos rapports de performance et statistiques
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Générer rapport
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" onClick={loadReports}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats générales */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : summaryData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.chiffreAffaires.toLocaleString()} F CFA</div>
              <p className="text-xs text-muted-foreground">
                <span className={summaryData.evolution.startsWith('+') ? "text-green-600" : "text-red-600"}>
                  {summaryData.evolution}
                </span> vs période précédente
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.totalCommandes}</div>
              <p className="text-xs text-muted-foreground">
                Meilleur mois: {summaryData.meilleurMois}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livres vendus</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.totalLivres}</div>
              <p className="text-xs text-muted-foreground">
                Discipline populaire: {summaryData.disciplinePopulaire}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summaryData.evolution.startsWith('+') ? "text-green-600" : "text-red-600"}`}>
                {summaryData.evolution}
              </div>
              <p className="text-xs text-muted-foreground">
                Livre populaire: {summaryData.livrePopulaire}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full lg:w-[300px] justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM yyyy", { locale: fr })} -{" "}
                      {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM yyyy", { locale: fr })
                  )
                ) : (
                  <span>Sélectionner une période</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange as any}
                onSelect={setDateRange as any}
                numberOfMonths={2}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Statistiques détaillées */}
      {detailedData && detailedData.disciplineStats && detailedData.disciplineStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top disciplines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {detailedData.disciplineStats.slice(0, 5).map((stat: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{stat.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{stat.count} livres</span>
                      <p className="text-xs text-gray-500">{stat.revenue.toLocaleString()} F CFA</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top livres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {detailedData.livreStats && detailedData.livreStats.slice(0, 5).map((stat: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium truncate flex-1">{stat.title}</span>
                    <div className="text-right ml-2">
                      <span className="text-sm font-semibold">{stat.count} ex.</span>
                      <p className="text-xs text-gray-500">{stat.revenue.toLocaleString()} F CFA</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de génération */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer un rapport</DialogTitle>
            <DialogDescription>
              Sélectionnez le type de rapport à générer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type de rapport</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensuel">Mensuel</SelectItem>
                  <SelectItem value="trimestriel">Trimestriel</SelectItem>
                  <SelectItem value="annuel">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Période</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd MMM yyyy", { locale: fr })} -{" "}
                          {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: fr })
                      )
                    ) : (
                      <span>Sélectionner une période</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange as any}
                    onSelect={setDateRange as any}
                    numberOfMonths={2}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              Annuler
            </Button>
            <Button onClick={generateRapport} className="bg-blue-600 hover:bg-blue-700">
              Générer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de détails */}
      {showDetailModal && selectedRapport && detailedData && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du rapport</DialogTitle>
              <DialogDescription>
                Informations détaillées sur vos performances
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {detailedData.orders && detailedData.orders.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Commandes</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {detailedData.orders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{order.reference}</p>
                            <p className="text-sm text-gray-500">{order.date}</p>
                          </div>
                          <Badge>{order.status}</Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm text-gray-600">
                              {item.work} - {item.quantity}x {item.price.toLocaleString()} F CFA
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-sm font-semibold">
                          Total: {order.total.toLocaleString()} F CFA
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Fermer
              </Button>
              <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
