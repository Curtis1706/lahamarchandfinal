"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Edit, Power, X, Save, Calendar as CalendarIcon } from "lucide-react"
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
}

export default function CodePromoPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newPromotion, setNewPromotion] = useState({
    libelle: "",
    code: "",
    periode: "",
    livre: "",
    statut: "Actif",
    taux: "",
    quantiteMinimale: 1
  })
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  })
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const { toast } = useToast()

  // Charger les promotions depuis l'API
  useEffect(() => {
    loadPromotions()
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

  const handleCreatePromotion = async () => {
    try {
      // Préparer les données avec les dates formatées
      const promotionData = {
        ...newPromotion,
        dateDebut: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
        dateFin: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
        periode: dateRange.from && dateRange.to 
          ? `${format(dateRange.from, "dd/MM/yyyy", { locale: fr })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: fr })}`
          : newPromotion.periode
      }
      
      const response = await fetch('/api/pdg/code-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promotionData),
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
          quantiteMinimale: 1
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
                    quantiteMinimale: 1
                  })
                  setDateRange({ from: undefined, to: undefined })
                }
              }}
            >
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Ajouter un code promo
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Libellé :
                    </label>
                    <Input 
                      placeholder="Nom de la promotion" 
                      value={newPromotion.libelle}
                      onChange={(e) => setNewPromotion({ ...newPromotion, libelle: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Code :
                    </label>
                    <Input 
                      placeholder="Code promo" 
                      value={newPromotion.code}
                      onChange={(e) => setNewPromotion({ ...newPromotion, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Période de validité :
                    </label>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
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
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from}
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => {
                            setDateRange({ from: range?.from, to: range?.to })
                            if (range?.from && range?.to) {
                              const periodeStr = `${format(range.from, "dd/MM/yyyy", { locale: fr })} - ${format(range.to, "dd/MM/yyyy", { locale: fr })}`
                              setNewPromotion({ ...newPromotion, periode: periodeStr })
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Livre :
                    </label>
                    <Input 
                      placeholder="Livre concerné" 
                      value={newPromotion.livre}
                      onChange={(e) => setNewPromotion({ ...newPromotion, livre: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Taux :
                    </label>
                    <Input 
                      placeholder="Montant de la réduction" 
                      value={newPromotion.taux}
                      onChange={(e) => setNewPromotion({ ...newPromotion, taux: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Statut :
                    </label>
                    <Select 
                      value={newPromotion.statut}
                      onValueChange={(value) => setNewPromotion({ ...newPromotion, statut: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Inactif">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Fermer
                  </Button>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleCreatePromotion}
                    disabled={!newPromotion.libelle.trim() || !newPromotion.code.trim()}
                  >
                    Enregistrer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">LIBELLÉ</th>
                    <th className="text-left py-3 px-2">CODE</th>
                    <th className="text-left py-3 px-2">PÉRIODE</th>
                    <th className="text-left py-3 px-2">LIVRE</th>
                    <th className="text-left py-3 px-2">STATUT</th>
                    <th className="text-left py-3 px-2">TAUX</th>
                    <th className="text-left py-3 px-2">QUANTITÉ MINIMALE</th>
                    <th className="text-left py-3 px-2">CRÉÉ LE</th>
                    <th className="text-left py-3 px-2">CRÉÉ PAR</th>
                    <th className="text-left py-3 px-2">ACTIONS</th>
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
                      <tr key={promo.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">{promo.libelle}</td>
                        <td className="py-3 px-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {promo.code}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600 whitespace-pre-line">
                          {promo.periode}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">{promo.livre}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            promo.statut === "Actif"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {promo.statut}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">{promo.taux}</td>
                        <td className="py-3 px-2 text-sm text-gray-600">{promo.quantiteMinimale}</td>
                        <td className="py-3 px-2 text-sm text-gray-600">{promo.creeLe}</td>
                        <td className="py-3 px-2 text-sm text-gray-600">{promo.creePar}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleToggleStatus(promo)}
                              title={promo.statut === "Actif" ? "Désactiver" : "Activer"}
                            >
                              <Power className={`w-4 h-4 ${promo.statut === "Actif" ? "text-green-500" : "text-gray-400"}`} />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleDeletePromotion(promo)}
                              title="Supprimer"
                            >
                              <X className="w-4 h-4 text-red-500" />
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
                <Button variant="outline" size="sm">
                  Premier
                </Button>
                <Button variant="outline" size="sm">
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-indigo-600 text-white"
                >
                  1
                </Button>
                <Button variant="outline" size="sm">
                  Suivant
                </Button>
                <Button variant="outline" size="sm">
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