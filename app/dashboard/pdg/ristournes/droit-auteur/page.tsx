"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter, RotateCcw, RefreshCw, Calculator } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface DroitAuteur {
  id: string
  reference: string
  authorId: string
  authorName: string
  versement: number
  retrait: number
  statut: string
  creeLe: string
  createdAt: string
}

interface Stats {
  versements: number
  retraits: number
  solde: number
}

export default function DroitAuteurPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState("20")
  const [droitsAuteur, setDroitsAuteur] = useState<DroitAuteur[]>([])
  const [stats, setStats] = useState<Stats>({ versements: 0, retraits: 0, solde: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [checkResults, setCheckResults] = useState<any>(null)
  const { toast } = useToast()

  // Charger les droits d'auteur
  useEffect(() => {
    loadDroitsAuteur()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateRange.from, dateRange.to])

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDroitsAuteur()
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const loadDroitsAuteur = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()

      if (dateRange.from) {
        params.append("startDate", dateRange.from.toISOString())
      }
      if (dateRange.to) {
        params.append("endDate", dateRange.to.toISOString())
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/pdg/ristournes/droit-auteur?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDroitsAuteur(data.droitsAuteur || [])
        setStats(data.stats || { versements: 0, retraits: 0, solde: 0 })
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les droits d'auteur",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading droits auteur:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des droits d'auteur",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyFilters = () => {
    loadDroitsAuteur()
  }

  const handleResetFilters = () => {
    setDateRange({ from: undefined, to: undefined })
    setStatusFilter("all")
    setSearchTerm("")
    setCurrentPage(1)
  }

  const handleCheckOrders = async () => {
    try {
      setIsChecking(true)
      const response = await fetch("/api/pdg/ristournes/check-orders")

      if (!response.ok) {
        throw new Error("Erreur lors de la vérification")
      }

      const data = await response.json()
      setCheckResults(data)

      if (data.stats.ordersNeedingRoyaltyCalculation > 0) {
        toast({
          title: "Diagnostic",
          description: `${data.stats.ordersNeedingRoyaltyCalculation} commande(s) nécessitent le calcul des droits d'auteur`,
          duration: 5000
        })
      } else if (data.stats.totalItemsWithAuthors === 0) {
        toast({
          title: "Information",
          description: "Aucune commande validée ne contient d'œuvres avec des auteurs associés",
          duration: 5000
        })
      } else {
        toast({
          title: "Vérification terminée",
          description: `Toutes les commandes ont leurs droits d'auteur calculés`,
          duration: 3000
        })
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la vérification",
        variant: "destructive"
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleRecalculateAll = async () => {
    if (!confirm("Voulez-vous actualiser et recalculer les droits d'auteur ?")) {
      return
    }

    try {
      setIsRecalculating(true)
      const response = await fetch("/api/pdg/ristournes/recalculate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors du recalcul")
      }

      const data = await response.json()
      toast({
        title: "Succès",
        description: `Recalcul terminé: ${data.results.authorRoyaltiesCreated} droits d'auteur créés pour ${data.results.ordersProcessed} commandes`,
        duration: 5000
      })

      // Recharger les données et réinitialiser les résultats de vérification
      setCheckResults(null)
      loadDroitsAuteur()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du recalcul",
        variant: "destructive"
      })
    } finally {
      setIsRecalculating(false)
    }
  }

  // Pagination
  const itemsPerPageNum = parseInt(itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPageNum
  const endIndex = startIndex + itemsPerPageNum
  const paginatedDroits = droitsAuteur.slice(startIndex, endIndex)
  const totalPages = Math.ceil(droitsAuteur.length / itemsPerPageNum)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Droits d'auteur</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Droits d'auteur
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Versements</h3>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.versements)} <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Retraits</h3>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.retraits)} <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Solde</h3>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.solde)} <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                className="p-2 hover:bg-gray-100 rounded"
                onClick={loadDroitsAuteur}
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </button>
              <button
                className="p-2 hover:bg-gray-100 rounded"
                onClick={handleResetFilters}
                title="Réinitialiser les filtres"
              >
                <RotateCcw className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRecalculateAll}
                disabled={isRecalculating}
                variant="default"
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
                <span>{isRecalculating ? "Actualisation..." : "Actualiser"}</span>
              </Button>
            </div>
          </div>



          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
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
                    <span>Période de validité</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Payé">Payé</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mb-6">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleApplyFilters}
            >
              <Filter className="w-4 h-4 mr-2" />
              Appliquer
            </Button>
          </div>

          {/* Table Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Afficher</span>
              <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">éléments</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Rechercher:</span>
              <Input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">RÉFÉRENCE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">AUTEUR</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">VERSEMENT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">RETRAIT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">RESTE À PAYER</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">STATUT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">CRÉÉ LE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      Chargement des droits d'auteur...
                    </td>
                  </tr>
                ) : paginatedDroits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      Aucune donnée disponible dans le tableau
                    </td>
                  </tr>
                ) : (
                  paginatedDroits.map((droit) => (
                    <tr key={droit.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{droit.reference}</td>
                      <td className="py-3 px-4">{droit.authorName}</td>
                      <td className="py-3 px-4">{formatCurrency(droit.versement)} XOF</td>
                      <td className="py-3 px-4 text-green-600">{formatCurrency(droit.retrait)} XOF</td>
                      <td className="py-3 px-4 font-bold text-red-600">
                        {formatCurrency(droit.versement - droit.retrait)} XOF
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${droit.statut === "Payé"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                          }`}>
                          {droit.statut}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{droit.creeLe}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {/* Bouton Payer uniquement si reste à payer > 0 */}
                          {(droit.versement - droit.retrait) > 0 && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-8 px-2"
                              onClick={async () => {
                                if (!confirm(`Confirmez-vous le paiement de ${formatCurrency(droit.versement - droit.retrait)} XOF à ${droit.authorName} pour "${droit.reference}" ?`)) {
                                  return;
                                }

                                try {
                                  const response = await fetch('/api/pdg/ristournes/droit-auteur/pay', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      authorId: droit.authorId,
                                      workId: droit.id.split('-')[0] // id format is workId-authorId
                                    })
                                  });

                                  if (response.ok) {
                                    toast({ title: "Paiement effectué", description: "Les droits d'auteur ont été marqués comme payés." });
                                    loadDroitsAuteur(); // Recharger la liste
                                  } else {
                                    throw new Error("Erreur serveur");
                                  }
                                } catch (e) {
                                  toast({ title: "Erreur", description: "Impossible d'effectuer le paiement.", variant: "destructive" });
                                }
                              }}
                            >
                              <span className="text-xs">Payer</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Affichage de {droitsAuteur.length > 0 ? startIndex + 1 : 0} à {Math.min(endIndex, droitsAuteur.length)} sur {droitsAuteur.length} éléments
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
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <Button variant="outline" size="sm" className="bg-indigo-600 text-white">
                {currentPage}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Suivant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Dernier
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
