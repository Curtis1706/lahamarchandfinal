"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Edit, Power, X, Save, Calendar as CalendarIcon, Check, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { apiClient } from "@/lib/api-client"

interface Promotion {
  id: string
  libelle: string
  code: string
  periode: string
  livre: string
  statut: string
  taux: string
  quantiteMinimale: number
  creeLe: string
  creePar: string
  // Nouveaux champs
  rateType?: "PERCENTAGE" | "AMOUNT"
  rateValue?: number
  timeZone?: string
  applyToAll?: boolean
  works?: Work[]
}

interface Work {
  id: string
  title: string
}

export default function CodePromoPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newPromotion, setNewPromotion] = useState({
    libelle: "",
    code: "",
    periode: "",
    livre: "",
    statut: "Actif",
    taux: "",
    quantiteMinimale: 1,
    // Nouveaux champs
    rateType: "PERCENTAGE",
    rateValue: "",
    timeZone: "UTC",
    applyToAll: false,
    selectedWorks: [] as string[]
  })
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const { toast } = useToast()

  // Charger les promotions et les livres depuis l'API
  useEffect(() => {
    loadPromotions()
    loadWorks()
  }, [])

  const loadPromotions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pdg/code-promo')
      if (response.ok) {
        const data = await response.json()
        setPromotions(data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les codes promo",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading promotions:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des codes promo",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadWorks = async () => {
    try {
      // On suppose qu'il y a une API pour récupérer les livres
      const worksData = await apiClient.getWorks()
      if (Array.isArray(worksData)) {
        setWorks(worksData)
      }
    } catch (error) {
      console.error("Error loading works:", error)
    }
  }

  const handleCreatePromotion = async () => {
    try {
      // Préparer les données avec les dates formatées
      const promotionData = {
        ...newPromotion,
        dateDebut: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
        dateFin: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
        periode: dateRange.from && dateRange.to
          ? `${format(dateRange.from, "dd/MM/yyyy", { locale: fr })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: fr })}`
          : newPromotion.periode,
        // Conversion de rateValue en nombre pour l'API si nécessaire, mais l'API le fait aussi
        rateValue: parseFloat(newPromotion.rateValue)
      }

      const url = editingId ? '/api/pdg/code-promo' : '/api/pdg/code-promo'
      const method = editingId ? 'PUT' : 'POST'

      const payload: any = { ...promotionData }
      if (editingId) {
        payload.id = editingId
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Code promo créé avec succès"
        })
        setNewPromotion({
          libelle: "",
          code: "",
          periode: "",
          livre: "",
          statut: "Actif",
          taux: "",
          quantiteMinimale: 1,
          rateType: "PERCENTAGE",
          rateValue: "",
          timeZone: "UTC",
          applyToAll: false,
          selectedWorks: []
        })
        setDateRange({ from: undefined, to: undefined })
        setIsModalOpen(false)
        loadPromotions()
      } else {
        const errorData = await response.json()
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de créer le code promo",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating promotion:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du code promo",
        variant: "destructive"
      })
    }
  }

  const handleRefresh = () => {
    loadPromotions()
  }

  const handleToggleStatus = async (promo: Promotion) => {
    try {
      const newStatus = promo.statut === "Actif" ? "Inactif" : "Actif"
      const response = await fetch('/api/pdg/code-promo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: promo.id,
          statut: newStatus
        }),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: `Code promo ${newStatus === "Actif" ? "activé" : "désactivé"} avec succès`
        })
        loadPromotions()
      } else {
        const errorData = await response.json()
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de modifier le statut",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error toggling status:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du statut",
        variant: "destructive"
      })
    }
  }

  const handleDeletePromotion = async (promo: Promotion) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le code promo "${promo.code}" ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/pdg/code-promo?id=${promo.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Code promo supprimé avec succès"
        })
        loadPromotions()
      } else {
        const errorData = await response.json()
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de supprimer le code promo",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting promotion:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      })
    }
  }

  const [editingId, setEditingId] = useState<string | null>(null)

  const handleEditClick = (promo: Promotion) => {
    setEditingId(promo.id)
    setNewPromotion({
      libelle: promo.libelle,
      code: promo.code,
      periode: promo.periode,
      livre: "", // On reset car géré par works/applyToAll
      statut: promo.statut === 'Actif' ? 'Actif' : 'Inactif',
      taux: "", // Sera géré par rateValue
      quantiteMinimale: promo.quantiteMinimale,
      rateType: promo.rateType || "PERCENTAGE",
      rateValue: promo.rateValue?.toString() || "",
      timeZone: promo.timeZone || "UTC",
      applyToAll: promo.applyToAll || false,
      selectedWorks: promo.works?.map(w => w.id) || []
    })

    // Parsing de la période pour extraire les dates si possible (format "dd/MM/yyyy - dd/MM/yyyy")
    if (promo.periode && promo.periode.includes(" - ")) {
      const [startStr, endStr] = promo.periode.split(" - ")
      const parseDate = (str: string) => {
        const [day, month, year] = str.split("/")
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }
      setDateRange({
        from: parseDate(startStr),
        to: parseDate(endStr)
      })
    } else {
      setDateRange({ from: undefined, to: undefined })
    }

    setIsModalOpen(true)
  }

  const toggleWorkSelection = (workId: string) => {
    setNewPromotion(prev => {
      const currentSelection = prev.selectedWorks || []
      const newSelection = currentSelection.includes(workId)
        ? currentSelection.filter(id => id !== workId)
        : [...currentSelection, workId]
      return { ...prev, selectedWorks: newSelection }
    })
  }

  const filteredPromotions = promotions.filter(
    (promo) =>
      promo.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      {/* En-tête bleu */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Code Promo</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Code Promo
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-4 lg:p-6">
            {/* Header Actions */}
            <div className="flex justify-start mb-6">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setIsModalOpen(true)}
              >
                Ajouter +
              </Button>
            </div>

            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="20">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input
                  placeholder=""
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>

            {/* --- MODALE --- */}
            <Dialog
              open={isModalOpen}
              onOpenChange={(open) => {
                setIsModalOpen(open)
                if (!open) {
                  // Réinitialiser le formulaire quand le dialogue se ferme
                  setNewPromotion({
                    libelle: "",
                    code: "",
                    periode: "",
                    livre: "",
                    statut: "Actif",
                    taux: "",
                    quantiteMinimale: 1,
                    rateType: "PERCENTAGE",
                    rateValue: "",
                    timeZone: "UTC",
                    applyToAll: false,
                    selectedWorks: []
                  })
                  setDateRange({ from: undefined, to: undefined })
                  setEditingId(null)
                }
              }}
            >
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Enregistrement du code promo
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Ligne 1: Libellé */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Libellé du code promo
                    </label>
                    <Input
                      placeholder="Nom du code promo"
                      value={newPromotion.libelle}
                      onChange={(e) => setNewPromotion({ ...newPromotion, libelle: e.target.value })}
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>

                  {/* Ligne 2: Code & Statut */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Code promo
                      </label>
                      <Input
                        placeholder="CODE PROMO"
                        value={newPromotion.code}
                        onChange={(e) => setNewPromotion({ ...newPromotion, code: e.target.value.toUpperCase() })}
                        className="bg-slate-50 border-slate-200 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Statut
                      </label>
                      <Select
                        value={newPromotion.statut}
                        onValueChange={(value) => setNewPromotion({ ...newPromotion, statut: value })}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Actif">Actif</SelectItem>
                          <SelectItem value="Inactif">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Ligne 3: Type taux, Taux, Quantité min */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Type de taux
                      </label>
                      <Select
                        value={newPromotion.rateType}
                        onValueChange={(value) => setNewPromotion({ ...newPromotion, rateType: value as any })}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Pourcentage</SelectItem>
                          <SelectItem value="AMOUNT">Valeur monétaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Taux de réduction
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="Taux de réduction"
                          value={newPromotion.rateValue}
                          type="number"
                          onChange={(e) => setNewPromotion({ ...newPromotion, rateValue: e.target.value })}
                          className="bg-slate-50 border-slate-200 pr-12"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 bg-gray-100 border-l px-2 rounded-r h-9 my-auto top-0.5 bottom-0.5">
                          {newPromotion.rateType === 'PERCENTAGE' ? '%' : 'F CFA'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Quantité minimale
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={newPromotion.quantiteMinimale}
                        onChange={(e) => setNewPromotion({ ...newPromotion, quantiteMinimale: parseInt(e.target.value) || 1 })}
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                  </div>

                  {/* Ligne 4: Lié à un livre */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Lié à un livre
                    </label>
                    <Select
                      value={newPromotion.applyToAll ? "all" : (newPromotion.selectedWorks.length > 0 ? "partial" : "")}
                      onValueChange={(value) => {
                        if (value === "all") {
                          setNewPromotion({ ...newPromotion, applyToAll: true, selectedWorks: [] })
                        } else {
                          setNewPromotion({ ...newPromotion, applyToAll: false })
                        }
                      }}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 w-full">
                        <SelectValue placeholder="Sélectionner les livres" >
                          {newPromotion.applyToAll
                            ? "Tous les livres"
                            : (newPromotion.selectedWorks.length > 0
                              ? `${newPromotion.selectedWorks.length} livre(s) sélectionné(s)`
                              : "Sélectionner les livres")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les livres</SelectItem>
                        <SelectItem value="partial">Sélectionner des livres...</SelectItem>

                        <div className="p-2 border-t max-h-60 overflow-y-auto">
                          <p className="text-xs text-muted-foreground mb-2 px-2">Ou cochez individuellement :</p>
                          {works.map((work) => (
                            <div
                              key={work.id}
                              className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setNewPromotion(prev => ({ ...prev, applyToAll: false }))
                                toggleWorkSelection(work.id)
                              }}
                            >
                              <div className={cn(
                                "w-4 h-4 border rounded flex items-center justify-center",
                                newPromotion.selectedWorks.includes(work.id) ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                              )}>
                                {newPromotion.selectedWorks.includes(work.id) && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <span className="text-sm truncate">{work.title}</span>
                            </div>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ligne 5: Fuseau horaire, dates */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Fuseau horaire
                      </label>
                      <Select
                        value={newPromotion.timeZone}
                        onValueChange={(value) => setNewPromotion({ ...newPromotion, timeZone: value })}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC (Temps Universel)</SelectItem>
                          <SelectItem value="GMT">GMT (Greenwich)</SelectItem>
                          <SelectItem value="Europe/Paris">Europe/Paris (UTC+1/+2)</SelectItem>
                          <SelectItem value="Africa/Abidjan">Africa/Abidjan (GMT)</SelectItem>
                          <SelectItem value="Africa/Dakar">Africa/Dakar (GMT)</SelectItem>
                          <SelectItem value="Africa/Douala">Africa/Douala (UTC+1)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">(GMT +1:00)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Date d'activation
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-slate-50 border-slate-200",
                              !dateRange.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: fr }) : "jj/mm/aaaa"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Date d'expiration
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-slate-50 border-slate-200",
                              !dateRange.to && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: fr }) : "jj/mm/aaaa"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex justify-end gap-2 mt-8 pt-4 border-t">
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 w-32"
                    onClick={handleCreatePromotion}
                    disabled={!newPromotion.libelle.trim() || !newPromotion.code.trim()}
                  >
                    Enregistrer <Save className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                  >
                    Fermer <X className="ml-2 h-4 w-4" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">LIBELLÉ</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">CODE</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">PÉRIODE</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">LIVRE</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">STATUT</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">TAUX</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">QUANTITÉ MINIMALE</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">CRÉÉ LE</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">CRÉÉ PAR</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-500">
                        Chargement des codes promo...
                      </td>
                    </tr>
                  ) : filteredPromotions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-500">
                        Aucun code promo trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredPromotions.map((promo) => (
                      <tr key={promo.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium text-gray-900">{promo.libelle}</td>
                        <td className="py-3 px-2">
                          <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {promo.code}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600 whitespace-pre-line">
                          {promo.periode}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600 max-w-[150px] truncate" title={promo.livre}>
                          {promo.livre}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${promo.statut === "Actif"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                            }`}>
                            {promo.statut}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm font-medium text-gray-900">{promo.taux}</td>
                        <td className="py-3 px-2 text-center text-sm text-gray-600">{promo.quantiteMinimale}</td>
                        <td className="py-3 px-2 text-sm text-gray-500">{promo.creeLe}</td>
                        <td className="py-3 px-2 text-sm text-gray-500">{promo.creePar}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 mr-2" title={promo.statut === "Actif" ? "Désactiver" : "Activer"}>
                              <Switch
                                checked={promo.statut === "Actif"}
                                onCheckedChange={() => handleToggleStatus(promo)}
                                className={`${promo.statut === "Actif" ? "data-[state=checked]:bg-green-600" : "data-[state=unchecked]:bg-gray-200"}`}
                              />
                            </div>
                            <button
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"
                              onClick={() => handleEditClick(promo)}
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                              onClick={() => handleDeletePromotion(promo)}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <p className="text-sm text-gray-600">
                Affichage de 1 à {filteredPromotions.length} sur {promotions.length} éléments
              </p>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Premier
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white"
                >
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Suivant
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Dernier
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}