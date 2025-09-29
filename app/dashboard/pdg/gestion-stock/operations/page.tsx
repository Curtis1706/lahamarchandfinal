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
  RotateCcw
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
  const [showOperationDialog, setShowOperationDialog] = useState(false)
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
      
      const [worksData, partnersData, operationsData] = await Promise.all([
        apiClient.getPDGWorks({ status: 'PUBLISHED' }),
        apiClient.getPartners(),
        apiClient.getPDGStockMovements({ limit: 50 })
      ])
      
      setWorks(worksData.works || [])
      setPartners(partnersData.partners || [])
      setOperations(operationsData.movements || [])
      
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExecuteOperation = async () => {
    try {
      if (!formData.workId || !formData.quantity) {
        toast({
          title: "Erreur",
          description: "Sélectionnez une œuvre et saisissez une quantité",
          variant: "destructive"
        })
        return
      }

      const operationData = {
        operationType: selectedOperation,
        subType: selectedSubType,
        workId: formData.workId,
        quantity: parseInt(formData.quantity),
        source: formData.source || null,
        destination: formData.destination || null,
        partnerId: formData.partnerId || null,
        reason: formData.reason || null,
        notes: formData.notes || null,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        transferDestinationId: formData.transferDestinationId || null
      }

      await apiClient.executeStockOperation(operationData)
      
      toast({
        title: "Succès",
        description: "Opération de stock exécutée avec succès"
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
      setShowOperationDialog(false)
      
      // Recharger les données
      loadData()
      
    } catch (error: any) {
      console.error('Erreur lors de l\'exécution:', error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'exécution de l'opération",
        variant: "destructive"
      })
    }
  }

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'INBOUND': return <TrendingUp className="w-4 h-4 text-green-600" />
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
      case 'DIRECT_SALE': return <Badge className="bg-blue-100 text-blue-800">Vente directe</Badge>
      case 'PARTNER_ALLOCATION': return <Badge className="bg-purple-100 text-purple-800">Dépôt partenaire</Badge>
      case 'PARTNER_RETURN': return <Badge className="bg-orange-100 text-orange-800">Retour partenaire</Badge>
      case 'CORRECTION': return <Badge className="bg-red-100 text-red-800">Correction</Badge>
      case 'DAMAGED': return <Badge className="bg-red-100 text-red-800">Perte/Casse</Badge>
      case 'TRANSFER': return <Badge className="bg-indigo-100 text-indigo-800">Transfert</Badge>
      default: return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header avec gradient */}
      <div className="bg-slate-700 text-white p-6 rounded-b-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">📦 Opérations de stock</h2>
            <p className="text-slate-300 text-lg">Gestion complète des entrées et sorties de stock</p>
          </div>
        
        <Dialog open={showOperationDialog} onOpenChange={setShowOperationDialog}>
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
                <Select value={formData.workId} onValueChange={(value) => setFormData({...formData, workId: value})}>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantité *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="Quantité"
                  />
                </div>
                
                <div>
                  <Label htmlFor="unitPrice">Prix unitaire (optionnel)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                    placeholder="Prix unitaire"
                  />
                </div>
              </div>

              {(selectedSubType === 'DEPOT_PARTENAIRE' || selectedSubType === 'RETOUR_PARTENAIRE') && (
                <div>
                  <Label htmlFor="partnerId">Partenaire</Label>
                  <Select value={formData.partnerId} onValueChange={(value) => setFormData({...formData, partnerId: value})}>
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
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    placeholder="Ex: Imprimerie Centrale"
                  />
                </div>
                
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    placeholder="Ex: Client final"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Raison</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Raison de l'opération"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Notes supplémentaires"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowOperationDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleExecuteOperation}>
                  Exécuter l'opération
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              <div className="divide-y divide-gray-100">
                {operations.map((operation) => (
                  <div key={operation.id} className="p-6 hover:bg-slate-50/50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-full bg-slate-100">
                          {getOperationIcon(operation.type)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{operation.work.title}</div>
                          <div className="text-sm text-gray-600 flex items-center space-x-2">
                            <span>{operation.work.isbn}</span>
                            <span>•</span>
                            <span>{operation.reason}</span>
                            {operation.partner && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600">{operation.partner.name}</span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Par {operation.performedByUser?.name || 'Utilisateur inconnu'} • {new Date(operation.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {getOperationBadge(operation.type)}
                        <div className="text-right">
                          <div className={`font-bold text-lg ${operation.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {operation.quantity > 0 ? '+' : ''}{operation.quantity}
                          </div>
                          {operation.totalAmount && (
                            <div className="text-sm text-gray-600">
                              {operation.totalAmount.toLocaleString()} F CFA
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
