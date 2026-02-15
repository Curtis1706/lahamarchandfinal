"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Filter, Plus, RotateCcw, Calendar, RefreshCw, X } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"

interface VenteRetour {
  id: string
  reference: string
  qty: number
  montant: number
  statut: string
  compte: string
  paiements: string
  methode: string
  creeLe: string
  validePar: string
  modifieLe: string
  type: string
  clientName: string
  partnerName?: string
}

interface SaleItem {
  workId: string
  workTitle: string
  quantity: number
  price: number
}

interface Work {
  id: string
  title: string
  isbn: string
  price: number
  stock: number
  discipline?: { id: string; name: string }
  category?: { id: string; name: string }
  class?: { id: string; name: string }
}

export default function VentesRetoursPage() {
  const { toast } = useToast()
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState("20")
  const [isLoading, setIsLoading] = useState(true)
  const [ventesRetours, setVentesRetours] = useState<VenteRetour[]>([])
  const [stats, setStats] = useState({
    commandes: { count: 0, montant: 0 },
    ventes: { count: 0, montant: 0 },
    retours: { count: 0, montant: 0 },
    enDepots: { count: 0, montant: 0 }
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all-status")
  const [methodFilter, setMethodFilter] = useState("all-methods")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  const [accountFilter, setAccountFilter] = useState("all")
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  // Form states for sale
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedZone, setSelectedZone] = useState("all")
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDiscipline, setSelectedDiscipline] = useState("all")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedWork, setSelectedWork] = useState("")
  const [saleQuantity, setSaleQuantity] = useState("0")
  const [saleObservation, setSaleObservation] = useState("")
  // const [salePaymentMethod, setSalePaymentMethod] = useState("") // Removed
  const [paymentDueDate, setPaymentDueDate] = useState<Date | undefined>(undefined) // Added
  const [works, setWorks] = useState<Work[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [disciplines, setDisciplines] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])

  // Load data
  useEffect(() => {
    loadVentesRetours()
    loadFormData()
  }, [statusFilter, methodFilter, dateRange.from, dateRange.to, accountFilter, currentPage])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadVentesRetours()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadVentesRetours = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()

      if (dateRange.from) params.append("startDate", dateRange.from.toISOString())
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString())
      if (statusFilter !== "all-status") params.append("status", statusFilter)
      if (methodFilter !== "all-methods") params.append("method", methodFilter)
      if (accountFilter !== "all") params.append("account", accountFilter)
      if (searchTerm) params.append("search", searchTerm)
      params.append("page", currentPage.toString())
      params.append("limit", itemsPerPage)

      const response = await fetch(`/api/pdg/ventes-retours?${params}`)
      if (response.ok) {
        const data = await response.json()
        setVentesRetours(data.ventesRetours || [])
        setStats(data.stats || stats)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les dépôts et retours",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading ventes-retours:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadFormData = async () => {
    try {
      const [worksData, clientsResponse, partnersData, categoriesResponse, disciplinesData, classesResponse] = await Promise.all([
        apiClient.getWorks({ status: "ON_SALE" }),
        apiClient.getUsersList("CLIENT"),
        apiClient.getPartners(),
        fetch("/api/pdg/categories").then(r => r.json()).catch(() => []),
        apiClient.getDisciplines(),
        fetch("/api/pdg/classes").then(r => r.json()).catch(() => [])
      ])

      setWorks(worksData || [])
      // Extract users from response (could be array or object with users property)
      const clientsList = Array.isArray(clientsResponse) ? clientsResponse : (clientsResponse?.users || [])
      setClients(clientsList)
      setPartners(partnersData || [])
      // Categories response is an array directly
      const categoriesList = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse?.categories || [])
      setCategories(categoriesList)
      setDisciplines(disciplinesData || [])
      // Classes response is an array directly
      const classesList = Array.isArray(classesResponse) ? classesResponse : (classesResponse?.classes || [])
      setClasses(classesList)
    } catch (error) {
      console.error("Error loading form data:", error)
    }
  }

  const handleAddSaleItem = () => {
    if (!selectedWork || !saleQuantity || parseInt(saleQuantity) <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un livre et une quantité valide",
        variant: "destructive"
      })
      return
    }

    const work = works.find(w => w.id === selectedWork)
    if (!work) return

    if (work.stock < parseInt(saleQuantity)) {
      toast({
        title: "Erreur",
        description: `Stock insuffisant. Disponible: ${work.stock}`,
        variant: "destructive"
      })
      return
    }

    const newItem: SaleItem = {
      workId: work.id,
      workTitle: work.title,
      quantity: parseInt(saleQuantity),
      price: work.price
    }

    setSaleItems([...saleItems, newItem])
    setSelectedWork("")
    setSaleQuantity("0")
  }

  const handleRemoveSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const handleCreateSale = async () => {
    if (saleItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un livre",
        variant: "destructive"
      })
      return
    }

    if (!selectedClient) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un client",
        variant: "destructive"
      })
      return
    }

    if (!paymentDueDate) {
      toast({
        title: "Erreur",
        description: "Veuillez définir une date limite de paiement",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch("/api/pdg/ventes-retours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "vente", // Will be treated as deposit by backend
          items: saleItems,
          clientId: selectedClient,
          paymentDueDate: paymentDueDate.toISOString(),
          observation: saleObservation
        })
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Dépôt enregistré avec succès"
        })
        setShowSaleModal(false)
        resetSaleForm()
        loadVentesRetours()
      } else {
        const error = await response.json()
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de l'enregistrement",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement",
        variant: "destructive"
      })
    }
  }

  const handleCreateReturn = async () => {
    if (saleItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un livre",
        variant: "destructive"
      })
      return
    }

    if (!selectedClient) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un client",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch("/api/pdg/ventes-retours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "retour",
          items: saleItems,
          clientId: selectedClient,
          observation: saleObservation
        })
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Retour enregistré avec succès"
        })
        setShowReturnModal(false)
        resetSaleForm()
        loadVentesRetours()
      } else {
        const error = await response.json()
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de l'enregistrement",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement",
        variant: "destructive"
      })
    }
  }

  const resetSaleForm = () => {
    setSaleItems([])
    setSelectedDepartment("all")
    setSelectedZone("all")
    setSelectedClient("")
    setSelectedCategory("all")
    setSelectedDiscipline("all")
    setSelectedClass("all")
    setSelectedWork("")
    setSaleQuantity("0")
    setSaleObservation("")
    setSalePaymentMethod("")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const totalSaleAmount = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemsPerPageNum = parseInt(itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPageNum
  const endIndex = startIndex + itemsPerPageNum
  const paginatedVentes = ventesRetours.slice(startIndex, endIndex)
  const totalPages = Math.ceil(ventesRetours.length / itemsPerPageNum)

  // Filter works based on selections
  const filteredWorks = works.filter(work => {
    if (selectedCategory !== "all" && work.category?.id !== selectedCategory) return false
    if (selectedDiscipline !== "all" && work.discipline?.id !== selectedDiscipline) return false
    if (selectedClass !== "all" && work.class?.id !== selectedClass) return false
    return true
  })

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Ventes & retours</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Ventes & retours
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Commandes</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.commandes.count}</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(stats.commandes.montant)} <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Ventes</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.ventes.count}</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(stats.ventes.montant)} <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Retours</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.retours.count}</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(stats.retours.montant)} <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">En dépôts</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.enDepots.count}</div>
            <div className="text-sm text-gray-400">--------</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(stats.enDepots.montant)} <span className="text-sm font-normal">XOF</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                className="p-2 hover:bg-gray-100 rounded"
                onClick={loadVentesRetours}
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                <Button variant="outline" className="bg-indigo-600 text-white hover:bg-indigo-700">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtre compte
                </Button>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filtre</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Compte :</Label>
                        <Select value={accountFilter} onValueChange={setAccountFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="partenaire">Partenaire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Département :</Label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les départements" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les départements</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Zone :</Label>
                        <Select value={selectedZone} onValueChange={setSelectedZone}>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes les zones" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les zones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Client :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les clients" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les clients</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => {
                          loadVentesRetours()
                          setShowFilterModal(false)
                        }}
                      >
                        Appliquer ✓
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAccountFilter("all")
                          setSelectedDepartment("all")
                          setSelectedZone("all")
                        }}
                      >
                        Remise à zéro ✗
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showSaleModal} onOpenChange={(open) => {
                setShowSaleModal(open)
                if (!open) resetSaleForm()
              }}>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Vente
                </Button>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Enregistrer une vente</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Form Fields */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Département :</Label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les départements" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les départements</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Zone :</Label>
                        <Select value={selectedZone} onValueChange={setSelectedZone}>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes les zones" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les zones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Client :</Label>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Choix de la catégorie</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes catégories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes catégories</SelectItem>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Choix de la Matière</Label>
                        <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes matières" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes matières</SelectItem>
                            {disciplines.map(discipline => (
                              <SelectItem key={discipline.id} value={discipline.id}>
                                {discipline.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Choix de la classe</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes classes</SelectItem>
                            {classes.map(classe => (
                              <SelectItem key={classe.id} value={classe.id}>
                                {classe.classe || classe.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Choix du livre</Label>
                        <Select value={selectedWork} onValueChange={setSelectedWork}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un livre" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredWorks.map(work => (
                              <SelectItem key={work.id} value={work.id}>
                                {work.title} (Stock: {work.stock})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantité</Label>
                        <Input
                          type="number"
                          value={saleQuantity}
                          onChange={(e) => setSaleQuantity(e.target.value)}
                          min="1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          className="bg-indigo-600 hover:bg-indigo-700 w-full"
                          onClick={handleAddSaleItem}
                        >
                          Ajouter ⌄
                        </Button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-medium">Livre</th>
                            <th className="text-left p-3 font-medium">Prix</th>
                            <th className="text-left p-3 font-medium">Quantité</th>
                            <th className="text-left p-3 font-medium">Montant</th>
                            <th className="text-left p-3 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saleItems.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center p-8 text-gray-500">
                                Aucune donnée disponible dans le tableau
                              </td>
                            </tr>
                          ) : (
                            saleItems.map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-3">{item.workTitle}</td>
                                <td className="p-3">{formatCurrency(item.price)} XOF</td>
                                <td className="p-3">{item.quantity}</td>
                                <td className="p-3">{formatCurrency(item.price * item.quantity)} XOF</td>
                                <td className="p-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSaleItem(index)}
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

                    <div className="text-right">
                      <p className="text-xl font-semibold">Total: {formatCurrency(totalSaleAmount)} XOF</p>
                    </div>

                    <div>
                      <Label>Observation</Label>
                      <Textarea
                        className="mt-1"
                        rows={3}
                        value={saleObservation}
                        onChange={(e) => setSaleObservation(e.target.value)}
                      />
                    </div>

                    {/* Date limite de paiement */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date limite de paiement <span className="text-red-500">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal mt-1",
                                !paymentDueDate && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {paymentDueDate ? (
                                format(paymentDueDate, "dd MMM yyyy", { locale: fr })
                              ) : (
                                <span>Choisir une date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={paymentDueDate}
                              onSelect={setPaymentDueDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleCreateSale}
                      >
                        Enregistrer Dépôt
                      </Button>
                      <Button variant="outline" onClick={() => setShowSaleModal(false)}>
                        Fermer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showReturnModal} onOpenChange={(open) => {
                setShowReturnModal(open)
                if (!open) resetSaleForm()
              }}>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retour produit
                </Button>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Enregistrer un retour de livres</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Same form structure as sale modal */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Département :</Label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les départements" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les départements</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Zone :</Label>
                        <Select value={selectedZone} onValueChange={setSelectedZone}>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes les zones" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les zones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Client :</Label>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Choix de la catégorie</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes catégories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes catégories</SelectItem>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Choix de la Matière</Label>
                        <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes matières" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes matières</SelectItem>
                            {disciplines.map(discipline => (
                              <SelectItem key={discipline.id} value={discipline.id}>
                                {discipline.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Choix de la classe</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes classes</SelectItem>
                            {classes.map(classe => (
                              <SelectItem key={classe.id} value={classe.id}>
                                {classe.classe || classe.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Choix du livre</Label>
                        <Select value={selectedWork} onValueChange={setSelectedWork}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un livre" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredWorks.map(work => (
                              <SelectItem key={work.id} value={work.id}>
                                {work.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantité</Label>
                        <Input
                          type="number"
                          value={saleQuantity}
                          onChange={(e) => setSaleQuantity(e.target.value)}
                          min="1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          className="bg-indigo-600 hover:bg-indigo-700 w-full"
                          onClick={handleAddSaleItem}
                        >
                          Ajouter ⌄
                        </Button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-medium">Livre</th>
                            <th className="text-left p-3 font-medium">Prix</th>
                            <th className="text-left p-3 font-medium">Quantité</th>
                            <th className="text-left p-3 font-medium">Montant</th>
                            <th className="text-left p-3 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saleItems.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center p-8 text-gray-500">
                                Aucune donnée disponible dans le tableau
                              </td>
                            </tr>
                          ) : (
                            saleItems.map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-3">{item.workTitle}</td>
                                <td className="p-3">{formatCurrency(item.price)} XOF</td>
                                <td className="p-3">{item.quantity}</td>
                                <td className="p-3">{formatCurrency(item.price * item.quantity)} XOF</td>
                                <td className="p-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSaleItem(index)}
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

                    <div className="text-right">
                      <p className="text-xl font-semibold">Total: {formatCurrency(totalSaleAmount)} XOF</p>
                    </div>

                    <div>
                      <Label>Observation</Label>
                      <Textarea
                        className="mt-1"
                        rows={3}
                        value={saleObservation}
                        onChange={(e) => setSaleObservation(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleCreateReturn}
                      >
                        Enregistrer
                      </Button>
                      <Button variant="outline" onClick={() => setShowReturnModal(false)}>
                        Fermer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <SelectItem value="all-status">Tous les statuts</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="En traitement">En traitement</SelectItem>
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Validée">Validée</SelectItem>
                <SelectItem value="Annulée">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les méthodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-methods">Toutes les méthodes</SelectItem>
                <SelectItem value="Espèces">Espèces</SelectItem>
                <SelectItem value="Carte">Carte</SelectItem>
                <SelectItem value="Virement">Virement</SelectItem>
                <SelectItem value="Mobile Money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mb-6">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={loadVentesRetours}
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
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">RÉFÉRENCE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">QTÉ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">MONTANT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">STATUT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">COMPTE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">PAIEMENTS</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">MÉTHODE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">CRÉÉ LE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">VALIDÉ PAR</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">MODIFIÉ LE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-gray-500">
                      Chargement des données...
                    </td>
                  </tr>
                ) : paginatedVentes.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-gray-500">
                      Aucune donnée disponible dans le tableau
                    </td>
                  </tr>
                ) : (
                  paginatedVentes.map((vente) => (
                    <tr key={vente.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{vente.reference}</td>
                      <td className="py-3 px-4">{vente.qty}</td>
                      <td className="py-3 px-4">{formatCurrency(vente.montant)} XOF</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${vente.statut === "Validée" ? "bg-green-100 text-green-800" :
                          vente.statut === "En cours" ? "bg-blue-100 text-blue-800" :
                            vente.statut === "En attente" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                          }`}>
                          {vente.statut}
                        </span>
                      </td>
                      <td className="py-3 px-4">{vente.compte}</td>
                      <td className="py-3 px-4">{vente.paiements}</td>
                      <td className="py-3 px-4">{vente.methode}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{vente.creeLe}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{vente.validePar}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{vente.modifieLe}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {/* Actions à implémenter si nécessaire */}
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
              Affichage de {ventesRetours.length > 0 ? startIndex + 1 : 0} à {Math.min(endIndex, ventesRetours.length)} sur {ventesRetours.length} éléments
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
