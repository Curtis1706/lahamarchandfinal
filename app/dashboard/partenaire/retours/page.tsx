"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Search,
  Eye,
  BookOpen,
  RotateCcw,
  Loader2,
} from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { calculateAvailableStock } from "@/lib/partner-stock"

type ReturnRow = {
  id: string
  createdAt: string
  work: { id: string; title: string; isbn?: string | null }
  quantity: number
  unitPrice?: number | null
  totalAmount?: number | null
  reference?: string | null
  reason?: string | null
}

type StockItem = {
  id: string
  workId: string
  title: string
  isbn?: string | null
  allocatedQuantity: number
  soldQuantity: number
  returnedQuantity: number
  availableQuantity?: number
}

export default function RetoursPage() {
  const { user } = useCurrentUser()
  const [rows, setRows] = useState<ReturnRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loadingStock, setLoadingStock] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Formulaire
  const [formData, setFormData] = useState({
    workId: "",
    quantity: "",
    reason: "",
    notes: "",
  })

  async function load() {
    try {
      setLoading(true)
      const res = await fetch("/api/partenaire/returns", { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Erreur lors du chargement")
      }
      const data = await res.json()
      setRows(data.returns ?? [])
    } catch (error: any) {
      console.error("Erreur lors du chargement des retours:", error)
      toast.error("Erreur lors du chargement des retours")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  async function loadStock() {
    try {
      setLoadingStock(true)
      const data = await apiClient.getPartenaireStockAllocation({})
      const items = (data.stockItems || data || []).map((item: any) => ({
        id: item.id,
        workId: item.workId,
        title: item.title,
        isbn: item.isbn,
        allocatedQuantity: item.allocatedQuantity || 0,
        soldQuantity: item.soldQuantity || 0,
        returnedQuantity: item.returnedQuantity || 0,
        availableQuantity: item.availableQuantity !== undefined
          ? item.availableQuantity
          : calculateAvailableStock(
              item.allocatedQuantity || 0,
              item.soldQuantity || 0,
              item.returnedQuantity || 0
            ),
      }))
      setStockItems(items)
    } catch (error: any) {
      console.error("Erreur lors du chargement du stock:", error)
      toast.error("Erreur lors du chargement du stock")
      setStockItems([])
    } finally {
      setLoadingStock(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (showReturnModal) {
      loadStock()
    }
  }, [showReturnModal])

  const filtered = useMemo(() => {
    const s = searchTerm.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(r =>
      r.work.title.toLowerCase().includes(s) ||
      (r.work.isbn ?? "").toLowerCase().includes(s) ||
      (r.reference ?? "").toLowerCase().includes(s)
    )
  }, [rows, searchTerm])

  const selectedWork = stockItems.find(item => item.workId === formData.workId)
  const soldQuantity = selectedWork ? selectedWork.soldQuantity : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.workId || !formData.quantity || !formData.reason) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    const qty = Number(formData.quantity)
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error("La quantité doit être un nombre entier positif")
      return
    }

    if (qty > soldQuantity) {
      toast.error(`Vous ne pouvez pas retourner plus que vous n'avez vendu. Vendu: ${soldQuantity}`)
      return
    }

    try {
      setSubmitting(true)
      await apiClient.registerPartenaireReturn({
        workId: formData.workId,
        quantity: qty,
        reason: formData.reason,
        notes: formData.notes || undefined,
      })

      toast.success("Retour enregistré avec succès")
      setShowReturnModal(false)
      setFormData({
        workId: "",
        quantity: "",
        reason: "",
        notes: "",
      })
      load() // Recharger la liste
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement:", error)
      toast.error(error.message || "Erreur lors de l'enregistrement du retour")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Mes retours</h2>
            <p className="text-sm text-slate-300 mt-1">
              Enregistrez vos retours — le stock alloué est réintégré automatiquement.
            </p>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setShowReturnModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Enregistrer un retour
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par livre, ISBN, référence..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Liste des retours ({filtered.length})</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Chargement...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Œuvre</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Aucun retour enregistré
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center flex-shrink-0">
                                <RotateCcw className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{r.work.title}</div>
                                {r.work.isbn && (
                                  <div className="text-xs text-gray-500">ISBN: {r.work.isbn}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{r.quantity}</TableCell>
                          <TableCell className="text-sm">{r.reason ?? "-"}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {r.reference ?? "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                toast.info("Détails du retour à venir")
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Enregistrer un retour */}
      <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enregistrer un retour</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workId">Œuvre *</Label>
                <Select
                  value={formData.workId}
                  onValueChange={(value) => setFormData({ ...formData, workId: value, quantity: "" })}
                  disabled={loadingStock}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une œuvre" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockItems
                      .filter(item => item.soldQuantity > 0)
                      .map((item) => (
                        <SelectItem key={item.workId} value={item.workId}>
                          {item.title} {item.isbn ? `(${item.isbn})` : ""} - Vendu: {item.soldQuantity}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {stockItems.filter(item => item.soldQuantity > 0).length === 0 && !loadingStock && (
                  <p className="text-sm text-gray-500">Aucune œuvre vendue disponible pour retour</p>
                )}
              </div>

              {selectedWork && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Quantité vendue: <span className="font-semibold">{soldQuantity}</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={soldQuantity}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Quantité"
                  required
                />
                {formData.quantity && Number(formData.quantity) > soldQuantity && (
                  <p className="text-sm text-red-500">Quantité supérieure à la quantité vendue</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Raison du retour *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Raison du retour (ex: défaut, retour client, etc.)"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes supplémentaires"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowReturnModal(false)
                  setFormData({
                    workId: "",
                    quantity: "",
                    reason: "",
                    notes: "",
                  })
                }}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting || !formData.workId || !formData.quantity || !formData.reason}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
