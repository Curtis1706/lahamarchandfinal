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
  Loader2,
} from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { calculateAvailableStock } from "@/lib/partner-stock"

type SaleRow = {
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

export default function VentesPage() {
  const { user } = useCurrentUser()
  const [rows, setRows] = useState<SaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loadingStock, setLoadingStock] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedSale, setSelectedSale] = useState<SaleRow | null>(null)
  const [showSaleDetailModal, setShowSaleDetailModal] = useState(false)

  // Formulaire
  const [formData, setFormData] = useState({
    workId: "",
    quantity: "",
    clientName: "",
    clientPhone: "",
    notes: "",
  })

  async function load() {
    try {
      setLoading(true)
      const res = await fetch("/api/partenaire/sales", { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Erreur lors du chargement")
      }
      const data = await res.json()
      setRows(data.sales ?? [])
    } catch (error: any) {
      console.error("Erreur lors du chargement des ventes:", error)
      toast.error("Erreur lors du chargement des ventes")
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
    if (showSaleModal) {
      loadStock()
    }
  }, [showSaleModal])

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
  const availableQuantity = selectedWork
    ? selectedWork.availableQuantity ?? calculateAvailableStock(
        selectedWork.allocatedQuantity,
        selectedWork.soldQuantity,
        selectedWork.returnedQuantity
      )
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.workId || !formData.quantity) {
      toast.error("Veuillez sélectionner une œuvre et indiquer une quantité")
      return
    }

    const qty = Number(formData.quantity)
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error("La quantité doit être un nombre entier positif")
      return
    }

    if (qty > availableQuantity) {
      toast.error(`Stock insuffisant. Disponible: ${availableQuantity}`)
      return
    }

    try {
      setSubmitting(true)
      await apiClient.registerPartenaireSale({
        workId: formData.workId,
        quantity: qty,
        clientName: formData.clientName || undefined,
        clientPhone: formData.clientPhone || undefined,
        notes: formData.notes || undefined,
      })

      toast.success("Vente enregistrée avec succès")
      setShowSaleModal(false)
      setFormData({
        workId: "",
        quantity: "",
        clientName: "",
        clientPhone: "",
        notes: "",
      })
      load() // Recharger la liste
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement:", error)
      toast.error(error.message || "Erreur lors de l'enregistrement de la vente")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Mes ventes</h2>
            <p className="text-sm text-slate-300 mt-1">
              Enregistrez vos ventes — le stock alloué est déduit automatiquement.
            </p>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setShowSaleModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Enregistrer une vente
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
              <h3 className="text-lg font-semibold">Liste des ventes ({filtered.length})</h3>
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
                      <TableHead>Montant</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Aucune vente enregistrée
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
                              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-4 h-4 text-white" />
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
                          <TableCell>
                            {r.totalAmount
                              ? `${Number(r.totalAmount).toLocaleString("fr-FR")} FCFA`
                              : r.unitPrice && r.unitPrice > 0
                              ? `${Number(r.unitPrice * r.quantity).toLocaleString("fr-FR")} FCFA`
                              : r.work.price && r.work.price > 0
                              ? `${Number(r.work.price * r.quantity).toLocaleString("fr-FR")} FCFA`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {r.reference ?? "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSale(r)
                                setShowSaleDetailModal(true)
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

      {/* Modal Enregistrer une vente */}
      <Dialog open={showSaleModal} onOpenChange={setShowSaleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enregistrer une vente</DialogTitle>
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
                      .filter(item => (item.availableQuantity ?? 0) > 0)
                      .map((item) => (
                        <SelectItem key={item.workId} value={item.workId}>
                          {item.title} {item.isbn ? `(${item.isbn})` : ""} - Disponible: {item.availableQuantity ?? 0}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {stockItems.filter(item => (item.availableQuantity ?? 0) > 0).length === 0 && !loadingStock && (
                  <p className="text-sm text-gray-500">Aucune œuvre disponible dans votre stock alloué</p>
                )}
              </div>

              {selectedWork && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Stock disponible: <span className="font-semibold">{availableQuantity}</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={availableQuantity}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Quantité"
                  required
                />
                {formData.quantity && Number(formData.quantity) > availableQuantity && (
                  <p className="text-sm text-red-500">Quantité supérieure au stock disponible</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nom du client (optionnel)</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Nom du client"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Téléphone du client (optionnel)</Label>
                  <Input
                    id="clientPhone"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="Téléphone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes supplémentaires"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSaleModal(false)
                  setFormData({
                    workId: "",
                    quantity: "",
                    clientName: "",
                    clientPhone: "",
                    notes: "",
                  })
                }}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting || !formData.workId || !formData.quantity}>
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
