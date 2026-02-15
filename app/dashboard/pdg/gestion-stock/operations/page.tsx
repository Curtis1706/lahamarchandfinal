"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useCurrentUser } from "@/hooks/use-current-user"
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
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  Truck,
  XCircle,
  RotateCcw,
  Loader2,
  Edit,
  Trash2,
  RefreshCw
} from "lucide-react"

interface Work {
  id: string
  title: string
  isbn: string
  internalCode?: string
  stock: number
  price: number
  discipline: string
  author: string
}

interface Partner {
  id: string
  name: string
  type: string
}

interface StockOperation {
  id: string
  type: string
  quantity: number
  reason: string
  reference: string
  totalAmount: number
  createdAt: string
  work: {
    id: string
    title: string
    isbn: string
  }
  performedByUser: {
    name: string
  }
  partner?: {
    name: string
  }
}

export default function StockOperationsPage() {
  const { user } = useCurrentUser()
  const { toast } = useToast()

  const [works, setWorks] = useState<Work[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [operations, setOperations] = useState<StockOperation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showOperationDialog, setShowOperationDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingMovement, setEditingMovement] = useState<StockOperation | null>(null)
  const [deletingMovement, setDeletingMovement] = useState<StockOperation | null>(null)
  const [selectedOperation, setSelectedOperation] = useState<string>('')
  const [selectedSubType, setSelectedSubType] = useState<string>('')

  // État du formulaire
  const [formData, setFormData] = useState({
    workId: '',
    quantity: '',
    source: '',
    destination: '',
    partnerId: '',
    reason: '',
    notes: '',
    unitPrice: '',
    transferDestinationId: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)

      const [worksData, partnersData, operationsData]: [any, any, any] = await Promise.all([
        apiClient.getPDGWorks({ status: 'PUBLISHED' }),
        apiClient.getPartners(),
        apiClient.getPDGStockMovements({})
      ])


      setWorks(worksData.works || [])
      setPartners(Array.isArray(partnersData) ? partnersData : (partnersData.partners || []))
      setOperations(operationsData.movements || [])


    } catch (error: any) {
      console.error('❌ Erreur lors du chargement:', error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du chargement des données",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExecuteOperation = async () => {

    try {
      if (!selectedOperation || !selectedSubType) {
        toast({
          title: "Erreur",
          description: "Sélectionnez un type d'opération et un sous-type",
          variant: "destructive"
        })
        return
      }

      if (!formData.workId || !formData.quantity) {
        toast({
          title: "Erreur",
          description: "Sélectionnez une œuvre et saisissez une quantité",
          variant: "destructive"
        })
        return
      }

      const qty = parseInt(formData.quantity)
      if (isNaN(qty) || qty <= 0) {
        toast({
          title: "Erreur",
          description: "La quantité doit être un nombre positif",
          variant: "destructive"
        })
        return
      }

      // Vérifier le stock disponible pour les sorties
      if (selectedOperation === 'EXIT') {
        const selectedWork = works.find(w => w.id === formData.workId)
        if (selectedWork && selectedWork.stock < qty) {
          toast({
            title: "Erreur",
            description: `Stock insuffisant. Disponible: ${selectedWork.stock}, Demandé: ${qty}`,
            variant: "destructive"
          })
          return
        }
      }


      // Mettre à jour l'état d'exécution
      setIsExecuting(true)

      const operationData: any = {
        operationType: selectedOperation as 'ENTRY' | 'EXIT',
        subType: selectedSubType as any,
        workId: formData.workId,
        quantity: qty,
        source: formData.source || undefined,
        destination: formData.destination || undefined,
        partnerId: formData.partnerId || undefined,
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
        transferDestinationId: formData.transferDestinationId || undefined
      }


      let result: any
      try {
        result = await apiClient.executeStockOperation(operationData)
      } catch (apiError: any) {
        console.error('❌ Erreur API:', apiError)
        throw apiError
      }

      // Afficher le message de succès immédiatement
      toast({
        title: "Succès",
        description: (result as any).message || "Opération de stock exécutée avec succès",
        duration: 3000
      })

      // Réinitialiser le formulaire
      setFormData({
        workId: '',
        quantity: '',
        source: '',
        destination: '',
        partnerId: '',
        reason: '',
        notes: '',
        unitPrice: '',
        transferDestinationId: ''
      })
      setSelectedOperation('')
      setSelectedSubType('')

      // Fermer le dialogue immédiatement
      setShowOperationDialog(false)
      setIsExecuting(false)

      // Recharger les données immédiatement
      loadData().then(() => {
      }).catch((err) => {
        console.error('❌ Erreur lors du rechargement:', err)
      })

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'exécution:', error)
      console.error('❌ Détails de l\'erreur:', {
        message: error.message,
        error: error.error,
        stack: error.stack
      })

      // Extraire le message d'erreur de la réponse API si disponible
      let errorMessage = "Erreur lors de l'exécution de l'opération"
      if (error.message) {
        errorMessage = error.message
      } else if (error.error) {
        errorMessage = error.error
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      })

      // Ne pas fermer le dialogue en cas d'erreur pour permettre la correction
      setIsExecuting(false)
    }
  }

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'INBOUND': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'OUTBOUND': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'DIRECT_SALE': return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'PARTNER_ALLOCATION': return <Building2 className="w-4 h-4 text-purple-600" />
      case 'PARTNER_RETURN': return <RotateCcw className="w-4 h-4 text-orange-600" />
      case 'CORRECTION': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'DAMAGED': return <XCircle className="w-4 h-4 text-red-600" />
      case 'TRANSFER': return <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
      default: return <Package className="w-4 h-4 text-gray-600" />
    }
  }

  const getOperationBadge = (type: string) => {
    switch (type) {
      case 'INBOUND': return <Badge className="bg-green-100 text-green-800">Entrée</Badge>
      case 'OUTBOUND': return <Badge className="bg-red-100 text-red-800">Sortie</Badge>
      case 'DIRECT_SALE': return <Badge className="bg-blue-100 text-blue-800">Vente directe</Badge>
      case 'PARTNER_ALLOCATION': return <Badge className="bg-purple-100 text-purple-800">Dépôt partenaire</Badge>
      case 'PARTNER_RETURN': return <Badge className="bg-orange-100 text-orange-800">Retour partenaire</Badge>
      case 'CORRECTION': return <Badge className="bg-red-100 text-red-800">Correction</Badge>
      case 'DAMAGED': return <Badge className="bg-red-100 text-red-800">Perte/Casse</Badge>
      case 'TRANSFER': return <Badge className="bg-indigo-100 text-indigo-800">Transfert</Badge>
      default: return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>
    }
  }

  const handleEdit = async (operation: StockOperation) => {
    try {
      const data = await apiClient.getStockMovement(operation.id) as any
      setEditingMovement(data.movement)

      // Déterminer le type d'opération et sous-type pour pré-remplir
      if (data.movement.quantity > 0) {
        setSelectedOperation('ENTRY')
      } else {
        setSelectedOperation('EXIT')
      }

      // Mapper le type au sous-type
      const typeMap: Record<string, string> = {
        'INBOUND': 'APPROVISIONNEMENT',
        'PARTNER_RETURN': 'RETOUR_PARTENAIRE',
        'CORRECTION': 'CORRECTION',
        'DIRECT_SALE': 'VENTE_DIRECTE',
        'PARTNER_ALLOCATION': 'DEPOT_PARTENAIRE',
        'DAMAGED': 'PERTE',
        'TRANSFER': 'TRANSFERT'
      }
      setSelectedSubType(typeMap[data.movement.type] || '')

      setFormData({
        workId: data.movement.workId,
        quantity: Math.abs(data.movement.quantity).toString(),
        source: data.movement.source || '',
        destination: data.movement.destination || '',
        partnerId: data.movement.partner?.id || '',
        reason: data.movement.reason || '',
        notes: data.movement.correctionReason || '',
        unitPrice: data.movement.unitPrice?.toString() || '',
        transferDestinationId: ''
      })

      setShowEditDialog(true)
    } catch (error) {
      console.error('Error loading movement:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du mouvement",
        variant: "destructive"
      })
    }
  }

  const handleUpdate = async () => {
    if (!editingMovement) return

    try {
      setIsExecuting(true)

      const qty = parseInt(formData.quantity)
      if (isNaN(qty) || qty <= 0) {
        toast({
          title: "Erreur",
          description: "La quantité doit être un nombre positif",
          variant: "destructive"
        })
        setIsExecuting(false)
        return
      }

      const finalQuantity = selectedOperation === 'EXIT' ? -qty : qty

      // Mapper le sous-type au type StockMovementType
      const typeMap: Record<string, string> = {
        'APPROVISIONNEMENT': 'INBOUND',
        'RETOUR_PARTENAIRE': 'PARTNER_RETURN',
        'CORRECTION': 'CORRECTION',
        'VENTE_DIRECTE': 'DIRECT_SALE',
        'DEPOT_PARTENAIRE': 'PARTNER_ALLOCATION',
        'PERTE': 'DAMAGED',
        'TRANSFERT': 'TRANSFER'
      }

      const movementType = typeMap[selectedSubType] || editingMovement.type

      const response = await apiClient.updateStockMovement(editingMovement.id, {
        workId: formData.workId,
        type: movementType as any,
        quantity: finalQuantity,
        reason: formData.reason || undefined,
        partnerId: formData.partnerId || undefined,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined
      } as any)

      toast({
        title: "Succès",
        description: "Opération modifiée avec succès",
      })
      setShowEditDialog(false)
      setEditingMovement(null)
      loadData()
    } catch (error: any) {
      console.error('Error updating movement:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification",
        variant: "destructive"
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleDelete = async (operation: StockOperation) => {
    setDeletingMovement(operation)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingMovement) return

    try {
      setIsExecuting(true)

      await apiClient.deleteStockMovement(deletingMovement.id)

      toast({
        title: "Succès",
        description: "Opération supprimée avec succès",
      })
      setShowDeleteDialog(false)
      setDeletingMovement(null)
      loadData()
    } catch (error: any) {
      console.error('Error deleting movement:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header avec gradient */}
      <div className="bg-slate-700 text-white p-6 rounded-b-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-blue-200" />
              <h2 className="text-3xl font-bold">Opérations de stock</h2>
            </div>
            <p className="text-slate-300 text-lg">Gestion complète des entrées et sorties de stock</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadData}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>

            <Dialog
              open={showOperationDialog}
              onOpenChange={(open) => {
                // Ne pas permettre la fermeture pendant l'exécution
                if (isExecuting) {
                  return
                }

                setShowOperationDialog(open)

                // Réinitialiser le formulaire quand le dialogue se ferme
                if (!open) {
                  setFormData({
                    workId: '',
                    quantity: '',
                    source: '',
                    destination: '',
                    partnerId: '',
                    reason: '',
                    notes: '',
                    unitPrice: '',
                    transferDestinationId: ''
                  })
                  setSelectedOperation('')
                  setSelectedSubType('')
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => setShowOperationDialog(true)}
                  className="bg-white text-slate-700 hover:bg-slate-50 border-2 border-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nouvelle opération
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nouvelle opération de stock</DialogTitle>
                  <DialogDescription>
                    Créer une nouvelle opération d'entrée, sortie, transfert ou correction de stock
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="operationType">Type d'opération</Label>
                      <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ENTRY">Entrée de stock</SelectItem>
                          <SelectItem value="EXIT">Sortie de stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subType">Sous-type</Label>
                      <Select value={selectedSubType} onValueChange={setSelectedSubType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le sous-type" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedOperation === 'ENTRY' && (
                            <>
                              <SelectItem value="APPROVISIONNEMENT">Approvisionnement</SelectItem>
                              <SelectItem value="RETOUR_PARTENAIRE">Retour partenaire</SelectItem>
                              <SelectItem value="CORRECTION">Correction manuelle</SelectItem>
                            </>
                          )}
                          {selectedOperation === 'EXIT' && (
                            <>
                              <SelectItem value="VENTE_DIRECTE">Vente directe</SelectItem>
                              <SelectItem value="DEPOT_PARTENAIRE">Dépôt partenaire</SelectItem>
                              <SelectItem value="PERTE">Perte/Casse</SelectItem>
                              <SelectItem value="TRANSFERT">Transfert interne</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="workId">Œuvre *</Label>
                    <Select value={formData.workId} onValueChange={(value) => setFormData({ ...formData, workId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une œuvre" />
                      </SelectTrigger>
                      <SelectContent>
                        {works.map((work) => (
                          <SelectItem key={work.id} value={work.id}>
                            {work.title} - Stock: {work.stock}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantité *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="Quantité"
                    />
                  </div>

                  {(selectedSubType === 'DEPOT_PARTENAIRE' || selectedSubType === 'RETOUR_PARTENAIRE') && (
                    <div>
                      <Label htmlFor="partnerId">Partenaire</Label>
                      <Select value={formData.partnerId} onValueChange={(value) => setFormData({ ...formData, partnerId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un partenaire" />
                        </SelectTrigger>
                        <SelectContent>
                          {partners.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.name} ({partner.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="source">Source</Label>
                      <Input
                        id="source"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        placeholder="Ex: Imprimerie Centrale"
                      />
                    </div>

                    <div>
                      <Label htmlFor="destination">Destination</Label>
                      <Input
                        id="destination"
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        placeholder="Ex: Client final"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reason">Raison</Label>
                    <Input
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Raison de l'opération"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Notes supplémentaires"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowOperationDialog(false)
                        setFormData({
                          workId: '',
                          quantity: '',
                          source: '',
                          destination: '',
                          partnerId: '',
                          reason: '',
                          notes: '',
                          unitPrice: '',
                          transferDestinationId: ''
                        })
                        setSelectedOperation('')
                        setSelectedSubType('')
                      }}
                      disabled={isExecuting}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        await handleExecuteOperation()
                      }}
                      disabled={isExecuting}
                      className="bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exécution...
                        </>
                      ) : (
                        "Exécuter l'opération"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="p-6 -mt-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entrées totales</p>
                <p className="text-2xl font-bold text-green-600">
                  {operations.filter(op => op.quantity > 0).reduce((sum, op) => sum + op.quantity, 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sorties totales</p>
                <p className="text-2xl font-bold text-red-600">
                  {Math.abs(operations.filter(op => op.quantity < 0).reduce((sum, op) => sum + op.quantity, 0))}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-slate-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Opérations</p>
                <p className="text-2xl font-bold text-slate-600">{operations.length}</p>
              </div>
              <Package className="w-8 h-8 text-slate-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valeur totale</p>
                <p className="text-2xl font-bold text-purple-600">
                  {operations.reduce((sum, op) => sum + (op.totalAmount || 0), 0).toLocaleString()} F CFA
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Historique des opérations avec design amélioré */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-xl">
            <CardTitle className="flex items-center text-xl">
              <Clock className="w-6 h-6 mr-3 text-slate-600" />
              Historique des opérations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {operations.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">Aucune opération</h3>
                <p className="text-gray-400">Commencez par créer votre première opération de stock</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Œuvre</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Détails</TableHead>
                      <TableHead>Auteur / Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.map((operation) => (
                      <TableRow key={operation.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getOperationIcon(operation.type)}
                            {getOperationBadge(operation.type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{operation.work.title}</div>
                          <div className="text-xs text-muted-foreground">{operation.work.isbn}</div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-bold ${operation.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {operation.quantity > 0 ? '+' : ''}{operation.quantity}
                          </div>
                          {operation.totalAmount && (
                            <div className="text-xs text-muted-foreground">
                              {operation.totalAmount.toLocaleString()} F CFA
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {operation.reason}
                            {operation.partner && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Partenaire: {operation.partner.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{operation.performedByUser?.name || 'Inconnu'}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(operation.createdAt).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(operation)}
                              className="h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(operation)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de modification */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier l'opération de stock</DialogTitle>
              <DialogDescription>
                Modifier les détails de cette opération de stock
              </DialogDescription>
            </DialogHeader>

            {editingMovement && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-operationType">Type d'opération</Label>
                    <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTRY">Entrée de stock</SelectItem>
                        <SelectItem value="EXIT">Sortie de stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-subType">Sous-type</Label>
                    <Select value={selectedSubType} onValueChange={setSelectedSubType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le sous-type" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedOperation === 'ENTRY' && (
                          <>
                            <SelectItem value="APPROVISIONNEMENT">Approvisionnement</SelectItem>
                            <SelectItem value="RETOUR_PARTENAIRE">Retour partenaire</SelectItem>
                            <SelectItem value="CORRECTION">Correction manuelle</SelectItem>
                          </>
                        )}
                        {selectedOperation === 'EXIT' && (
                          <>
                            <SelectItem value="VENTE_DIRECTE">Vente directe</SelectItem>
                            <SelectItem value="DEPOT_PARTENAIRE">Dépôt partenaire</SelectItem>
                            <SelectItem value="PERTE">Perte/Casse</SelectItem>
                            <SelectItem value="TRANSFERT">Transfert interne</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-workId">Œuvre *</Label>
                  <Select value={formData.workId} onValueChange={(value) => setFormData({ ...formData, workId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une œuvre" />
                    </SelectTrigger>
                    <SelectContent>
                      {works.map((work) => (
                        <SelectItem key={work.id} value={work.id}>
                          {work.title} - Stock: {work.stock}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-quantity">Quantité *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Quantité"
                  />
                </div>

                {(selectedSubType === 'DEPOT_PARTENAIRE' || selectedSubType === 'RETOUR_PARTENAIRE') && (
                  <div>
                    <Label htmlFor="edit-partnerId">Partenaire</Label>
                    <Select value={formData.partnerId} onValueChange={(value) => setFormData({ ...formData, partnerId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un partenaire" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name} ({partner.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-source">Source</Label>
                    <Input
                      id="edit-source"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      placeholder="Ex: Imprimerie Centrale"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-destination">Destination</Label>
                    <Input
                      id="edit-destination"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="Ex: Client final"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-reason">Raison</Label>
                  <Input
                    id="edit-reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Raison de l'opération"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditDialog(false)
                      setEditingMovement(null)
                    }}
                    disabled={isExecuting}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={isExecuting}
                    className="bg-black hover:bg-gray-800"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Modification...
                      </>
                    ) : (
                      "Modifier"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer cette opération de stock ?
                Cette action annulera l'effet de l'opération sur le stock.
              </DialogDescription>
            </DialogHeader>

            {deletingMovement && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{deletingMovement.work.title}</p>
                  <p className="text-sm text-gray-600">
                    Quantité: {deletingMovement.quantity > 0 ? '+' : ''}{deletingMovement.quantity}
                  </p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(deletingMovement.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteDialog(false)
                      setDeletingMovement(null)
                    }}
                    disabled={isExecuting}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    disabled={isExecuting}
                    variant="destructive"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      "Supprimer"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div >
  )
}
