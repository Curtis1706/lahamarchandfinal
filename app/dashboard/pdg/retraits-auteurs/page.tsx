"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Wallet, CheckCircle, XCircle, Clock, DollarSign, Search, Filter, RefreshCw, Loader2, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Withdrawal {
  id: string
  amount: number
  method: 'MOMO' | 'BANK' | 'CASH'
  momoNumber?: string
  bankName?: string
  bankAccount?: string
  bankAccountName?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED'
  requestedAt: string
  validatedAt?: string
  paidAt?: string
  rejectionReason?: string
  notes?: string
  author: {
    id: string
    name: string
    email: string
    phone?: string
    balance: {
      totalPaid: number
      totalWithdrawn: number
      available: number
    }
  }
  validatedBy?: {
    id: string
    name: string
    email: string
  } | null
}

export default function RetraitsAuteursPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'MARK_PAID' | 'PAY_VIA_MONEROO'>('APPROVE')
  const [rejectionReason, setRejectionReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isProcessingPayout, setIsProcessingPayout] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadWithdrawals()
  }, [statusFilter])

  const loadWithdrawals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/pdg/withdrawals?${params}`)
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.withdrawals || [])
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les retraits",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading withdrawals:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des retraits",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePayViaMoneroo = async () => {
    if (!selectedWithdrawal) return
    
    setIsProcessingPayout(true)
    
    try {
      const response = await fetch('/api/moneroo/payout/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal.id,
          withdrawalType: 'author'
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Succès",
          description: `Paiement initié via Moneroo. ID: ${data.payout_id}`,
        })
        setIsActionDialogOpen(false)
        setSelectedWithdrawal(null)
        loadWithdrawals()
      } else {
        const error = await response.json()
        toast({
          title: "Erreur",
          description: error.message || error.error || "Erreur lors de l'initiation du paiement",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error initiating payout:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de l'initiation du paiement via Moneroo",
        variant: "destructive"
      })
    } finally {
      setIsProcessingPayout(false)
    }
  }

  const handleAction = async () => {
    if (!selectedWithdrawal) return

    if (actionType === 'PAY_VIA_MONEROO') {
      await handlePayViaMoneroo()
      return
    }

    if (actionType === 'REJECT' && !rejectionReason.trim()) {
      toast({
        title: "Erreur",
        description: "La raison du rejet est requise",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/pdg/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal.id,
          action: actionType,
          rejectionReason: actionType === 'REJECT' ? rejectionReason : undefined,
          notes: notes || undefined
        })
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: `Retrait ${actionType === 'APPROVE' ? 'approuvé' : actionType === 'REJECT' ? 'rejeté' : 'marqué comme payé'} avec succès`,
        })
        setIsActionDialogOpen(false)
        setRejectionReason('')
        setNotes('')
        setSelectedWithdrawal(null)
        loadWithdrawals()
      } else {
        const error = await response.json()
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de l'action",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error processing action:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement",
        variant: "destructive"
      })
    }
  }

  const openActionDialog = (withdrawal: Withdrawal, action: 'APPROVE' | 'REJECT' | 'MARK_PAID' | 'PAY_VIA_MONEROO') => {
    setSelectedWithdrawal(withdrawal)
    setActionType(action)
    setRejectionReason('')
    setNotes('')
    setIsActionDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Payé</Badge>
      case 'CANCELLED':
        return <Badge variant="outline">Annulé</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'MOMO':
        return 'Mobile Money'
      case 'BANK':
        return 'Virement bancaire'
      case 'CASH':
        return 'Espèces'
      default:
        return method
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' F CFA'
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: fr })
    } catch {
      return dateString
    }
  }

  const filteredWithdrawals = withdrawals.filter(w => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        w.author.name.toLowerCase().includes(search) ||
        w.author.email.toLowerCase().includes(search) ||
        w.id.toLowerCase().includes(search)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {withdrawals.filter(w => w.status === 'PENDING').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Approuvés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {withdrawals.filter(w => w.status === 'APPROVED').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Payés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {withdrawals.filter(w => w.status === 'PAID').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Rejetés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {withdrawals.filter(w => w.status === 'REJECTED').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Demandes de retrait</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={loadWithdrawals}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="APPROVED">Approuvé</SelectItem>
                  <SelectItem value="PAID">Payé</SelectItem>
                  <SelectItem value="REJECTED">Rejeté</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1">
                <Input
                  placeholder="Rechercher par auteur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </div>

            {/* Liste des retraits */}
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Aucune demande de retrait</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWithdrawals.map((withdrawal) => (
                  <Card key={withdrawal.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-lg">{formatCurrency(withdrawal.amount)}</span>
                            {getStatusBadge(withdrawal.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Auteur</p>
                              <p className="text-sm">{withdrawal.author.name}</p>
                              <p className="text-xs text-gray-500">{withdrawal.author.email}</p>
                              {withdrawal.author.phone && (
                                <p className="text-xs text-gray-500">{withdrawal.author.phone}</p>
                              )}
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700">Solde disponible</p>
                              <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(withdrawal.author.balance.available)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Total payé: {formatCurrency(withdrawal.author.balance.totalPaid)} | 
                                Retiré: {formatCurrency(withdrawal.author.balance.totalWithdrawn)}
                              </p>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Méthode: {getMethodLabel(withdrawal.method)}</p>
                            {withdrawal.momoNumber && <p>N° MoMo: {withdrawal.momoNumber}</p>}
                            {withdrawal.bankName && <p>Banque: {withdrawal.bankName}</p>}
                            {withdrawal.bankAccount && <p>Compte: {withdrawal.bankAccount}</p>}
                            {withdrawal.bankAccountName && <p>Titulaire: {withdrawal.bankAccountName}</p>}
                            <p>Demandé le: {formatDate(withdrawal.requestedAt)}</p>
                            {withdrawal.validatedAt && (
                              <p>Validé le: {formatDate(withdrawal.validatedAt)} par {withdrawal.validatedBy?.name}</p>
                            )}
                            {withdrawal.paidAt && <p>Payé le: {formatDate(withdrawal.paidAt)}</p>}
                            {withdrawal.rejectionReason && (
                              <p className="text-red-600">Raison du rejet: {withdrawal.rejectionReason}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          {withdrawal.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openActionDialog(withdrawal, 'APPROVE')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openActionDialog(withdrawal, 'REJECT')}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Rejeter
                              </Button>
                            </>
                          )}
                          {withdrawal.status === 'APPROVED' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openActionDialog(withdrawal, 'PAY_VIA_MONEROO')}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Payer via Moneroo
                              </Button>
                            <Button
                              size="sm"
                                variant="outline"
                              onClick={() => openActionDialog(withdrawal, 'MARK_PAID')}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marquer comme payé
                            </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog d'action */}
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'APPROVE' && 'Approuver le retrait'}
                {actionType === 'REJECT' && 'Rejeter le retrait'}
                {actionType === 'MARK_PAID' && 'Marquer comme payé'}
                {actionType === 'PAY_VIA_MONEROO' && 'Payer via Moneroo'}
              </DialogTitle>
              <DialogDescription>
                {selectedWithdrawal && (
                  <>
                    Retrait de {formatCurrency(selectedWithdrawal.amount)} par {selectedWithdrawal.author.name}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {selectedWithdrawal && (
              <div className="space-y-4">
                {actionType === 'PAY_VIA_MONEROO' && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Informations du paiement</h4>
                    <div className="space-y-1 text-sm text-purple-800">
                      <p><strong>Montant:</strong> {formatCurrency(selectedWithdrawal.amount)}</p>
                      <p><strong>Bénéficiaire:</strong> {selectedWithdrawal.author.name}</p>
                      <p><strong>Méthode:</strong> {getMethodLabel(selectedWithdrawal.method)}</p>
                      {selectedWithdrawal.momoNumber && <p><strong>N° Mobile Money:</strong> {selectedWithdrawal.momoNumber}</p>}
                      {selectedWithdrawal.bankAccount && <p><strong>Compte bancaire:</strong> {selectedWithdrawal.bankAccount}</p>}
                    </div>
                    <p className="mt-3 text-xs text-purple-700">
                      🔒 Le paiement sera traité via Moneroo. Vous recevrez une notification de confirmation.
                    </p>
                  </div>
                )}
                
                {actionType === 'REJECT' && (
                  <div>
                    <Label htmlFor="rejectionReason">Raison du rejet *</Label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Expliquez la raison du rejet..."
                      required
                    />
                  </div>
                )}
                
                {actionType !== 'PAY_VIA_MONEROO' && (
                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes internes..."
                  />
                </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsActionDialogOpen(false)}
                    disabled={isProcessingPayout}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleAction}
                    disabled={isProcessingPayout}
                    className={
                      actionType === 'REJECT' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : actionType === 'PAY_VIA_MONEROO'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : ''
                    }
                  >
                    {isProcessingPayout ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                    {actionType === 'APPROVE' && 'Approuver'}
                    {actionType === 'REJECT' && 'Rejeter'}
                    {actionType === 'MARK_PAID' && 'Marquer comme payé'}
                        {actionType === 'PAY_VIA_MONEROO' && 'Confirmer et payer'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}

