"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, Wallet, Clock, CheckCircle, XCircle, AlertCircle, Plus, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface PartnerRebate {
  id: string
  amount: number
  rate: number
  status: 'PENDING' | 'VALIDATED' | 'PAID' | 'CANCELLED'
  validatedAt?: string
  paidAt?: string
  notes?: string
  createdAt: string
  order?: {
    id: string
    reference?: string
    total: number
    createdAt: string
  }
  work?: {
    title: string
    author: {
      name: string
    }
  }
}

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
}

interface Balance {
  totalRebates: number
  totalValidated: number
  totalPaid: number
  available: number
}

export default function PartnerRebatesPage() {
  const { user } = useCurrentUser()
  const [rebates, setRebates] = useState<PartnerRebate[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [balance, setBalance] = useState<Balance>({
    totalRebates: 0,
    totalValidated: 0,
    totalPaid: 0,
    available: 0
  })
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    method: 'MOMO' as 'MOMO' | 'BANK' | 'CASH',
    momoNumber: '',
    bankName: '',
    bankAccount: '',
    bankAccountName: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      // Charger les ristournes
      const rebatesResponse = await fetch('/api/partenaire/rebates')
      if (rebatesResponse.ok) {
        const rebatesData = await rebatesResponse.json()
        setRebates(rebatesData.rebates || [])
        setBalance(rebatesData.balance || {
          totalRebates: 0,
          totalValidated: 0,
          totalPaid: 0,
          available: 0
        })
      }

      // Charger les retraits
      const withdrawalsResponse = await fetch('/api/partenaire/withdrawals')
      if (withdrawalsResponse.ok) {
        const withdrawalsData = await withdrawalsResponse.json()
        setWithdrawals(withdrawalsData.withdrawals || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const MIN_WITHDRAWAL_AMOUNT = 5000 // Montant minimum de retrait

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      })
      return
    }

    if (parseFloat(formData.amount) < MIN_WITHDRAWAL_AMOUNT) {
      toast({
        title: "Erreur",
        description: `Montant minimum de retrait: ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()} F CFA`,
        variant: "destructive"
      })
      return
    }

    if (parseFloat(formData.amount) > balance.available) {
      toast({
        title: "Erreur",
        description: `Solde insuffisant. Solde disponible: ${balance.available.toLocaleString()} F CFA`,
        variant: "destructive"
      })
      return
    }

    if (formData.method === 'MOMO' && !formData.momoNumber) {
      toast({
        title: "Erreur",
        description: "Le numéro Mobile Money est requis",
        variant: "destructive"
      })
      return
    }

    if (formData.method === 'BANK' && (!formData.bankName || !formData.bankAccount)) {
      toast({
        title: "Erreur",
        description: "Les informations bancaires sont requises",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/partenaire/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Demande de retrait créée avec succès",
        })
        setIsDialogOpen(false)
        setFormData({
          amount: '',
          method: 'MOMO',
          momoNumber: '',
          bankName: '',
          bankAccount: '',
          bankAccountName: ''
        })
        loadData()
      } else {
        const error = await response.json()
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la création de la demande",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating withdrawal:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la demande",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>
      case 'VALIDATED':
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Validé</Badge>
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mes Ristournes</h1>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Total des ristournes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance.totalRebates)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Ristournes validées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(balance.totalValidated)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Déjà retiré</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(balance.totalPaid)}</div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
              <Wallet className="w-4 h-4 mr-2" />
              Solde disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{formatCurrency(balance.available)}</div>
            <p className="text-xs text-purple-600 mt-1">Montant retirable</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Mes demandes de retrait</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Demander un retrait
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle demande de retrait</DialogTitle>
              <DialogDescription>
                Solde disponible: {formatCurrency(balance.available)}
                {balance.available <= 0 && (
                  <span className="block mt-2 text-red-600 font-medium">
                    ⚠️ Votre solde disponible est insuffisant pour effectuer un retrait.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Montant (F CFA)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="5000"
                  max={balance.available > 0 ? balance.available : undefined}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  disabled={balance.available <= 0}
                  placeholder="Minimum: 5 000 F CFA"
                />
                {balance.available <= 0 ? (
                  <p className="text-xs text-red-600 mt-1">
                    Vous devez avoir un solde disponible pour effectuer un retrait.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Montant minimum: 5 000 F CFA
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="method">Méthode de paiement</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value: 'MOMO' | 'BANK' | 'CASH') => setFormData({ ...formData, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOMO">Mobile Money (MTN/Moov)</SelectItem>
                    <SelectItem value="BANK">Virement bancaire</SelectItem>
                    <SelectItem value="CASH">Espèces</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.method === 'MOMO' && (
                <div>
                  <Label htmlFor="momoNumber">Numéro Mobile Money</Label>
                  <Input
                    id="momoNumber"
                    type="tel"
                    placeholder="Ex: +229 40 76 76 76"
                    value={formData.momoNumber}
                    onChange={(e) => setFormData({ ...formData, momoNumber: e.target.value })}
                    required
                  />
                </div>
              )}

              {formData.method === 'BANK' && (
                <>
                  <div>
                    <Label htmlFor="bankName">Nom de la banque</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Numéro de compte</Label>
                    <Input
                      id="bankAccount"
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountName">Nom du titulaire</Label>
                    <Input
                      id="bankAccountName"
                      value={formData.bankAccountName}
                      onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={balance.available <= 0}>
                  Envoyer la demande
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des retraits */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des retraits</CardTitle>
          <CardDescription>Liste de toutes vos demandes de retrait</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Aucune demande de retrait</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold">{formatCurrency(withdrawal.amount)}</span>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Méthode: {getMethodLabel(withdrawal.method)}</p>
                        {withdrawal.momoNumber && <p>N° MoMo: {withdrawal.momoNumber}</p>}
                        {withdrawal.bankName && <p>Banque: {withdrawal.bankName}</p>}
                        {withdrawal.bankAccount && <p>Compte: {withdrawal.bankAccount}</p>}
                        <p>Demandé le: {formatDate(withdrawal.requestedAt)}</p>
                        {withdrawal.validatedAt && <p>Validé le: {formatDate(withdrawal.validatedAt)}</p>}
                        {withdrawal.paidAt && <p>Payé le: {formatDate(withdrawal.paidAt)}</p>}
                        {withdrawal.rejectionReason && (
                          <p className="text-red-600">Raison du rejet: {withdrawal.rejectionReason}</p>
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

      {/* Liste des ristournes */}
      <Card>
        <CardHeader>
          <CardTitle>Mes ristournes</CardTitle>
          <CardDescription>Détail de vos ristournes par commande</CardDescription>
        </CardHeader>
        <CardContent>
          {rebates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Aucune ristourne</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rebates.map((rebate) => (
                <div key={rebate.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-green-600">{formatCurrency(rebate.amount)}</span>
                        {getStatusBadge(rebate.status)}
                        <Badge variant="outline" className="text-xs">Taux: {rebate.rate}%</Badge>
                      </div>
                      {rebate.work && (
                        <p className="text-sm text-gray-700">{rebate.work.title} - {rebate.work.author.name}</p>
                      )}
                      {rebate.order && (
                        <p className="text-xs text-gray-500">
                          Commande: {formatCurrency(rebate.order.total)} - {formatDate(rebate.order.createdAt)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Créée le: {formatDate(rebate.createdAt)}</p>
                      {rebate.validatedAt && <p className="text-xs text-gray-500">Validée le: {formatDate(rebate.validatedAt)}</p>}
                      {rebate.paidAt && <p className="text-xs text-gray-500">Payée le: {formatDate(rebate.paidAt)}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


