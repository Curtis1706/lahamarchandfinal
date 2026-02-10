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
import { useToast } from "@/hooks/use-toast"
import { DollarSign, Wallet, Clock, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Withdrawal {
  id: string
  amount: number
  method: 'MOMO' | 'BANK' | 'CASH'
  momoNumber?: string
  momoProvider?: string
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
  totalRoyalties: number
  totalPaid: number
  totalWithdrawn: number
  available: number
}

export default function RetraitsPage() {
  const { user } = useCurrentUser()
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [balance, setBalance] = useState<Balance>({
    totalRoyalties: 0,
    totalPaid: 0,
    totalWithdrawn: 0,
    available: 0
  })
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    method: 'MOMO' as 'MOMO' | 'BANK' | 'CASH',
    momoNumber: '',
    momoProvider: '',
    bankName: '',
    bankAccount: '',
    bankAccountName: ''
  })
  const { toast } = useToast()

  const MIN_WITHDRAWAL_AMOUNT = 10

  useEffect(() => {
    if (user) {
      loadWithdrawals()
    }
  }, [user])

  const loadWithdrawals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auteur/withdrawals')
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.withdrawals || [])
        setBalance(data.balance || {
          totalRoyalties: 0,
          totalPaid: 0,
          totalWithdrawn: 0,
          available: 0
        })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

    if (formData.method === 'MOMO') {
      if (!formData.momoNumber) {
        toast({
          title: "Erreur",
          description: "Le numéro Mobile Money est requis",
          variant: "destructive"
        })
        return
      }
      if (!formData.momoProvider) {
        toast({
          title: "Erreur",
          description: "L'opérateur Mobile Money est requis",
          variant: "destructive"
        })
        return
      }
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
      const response = await fetch('/api/auteur/withdrawals', {
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
          momoProvider: '',
          bankName: '',
          bankAccount: '',
          bankAccountName: ''
        })
        loadWithdrawals()
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
            <CardTitle className="text-sm font-medium text-gray-600">Total des royalties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance.totalRoyalties)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Royalties payées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(balance.totalPaid)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Déjà retiré</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(balance.totalWithdrawn)}</div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800">Solde disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{formatCurrency(balance.available)}</div>
            <p className="text-xs text-purple-600 mt-1">Estimé sur le total généré</p>
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
                Solde disponible: <span className="font-semibold">{formatCurrency(balance.available)}</span>
                {balance.available < MIN_WITHDRAWAL_AMOUNT && (
                  <span className="block mt-2 text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Votre solde disponible est insuffisant. Le montant minimum est de {MIN_WITHDRAWAL_AMOUNT.toLocaleString()} F CFA.
                  </span>
                )}
                {balance.available >= MIN_WITHDRAWAL_AMOUNT && (
                  <span className="block mt-2 text-green-600 text-sm">
                    ✓ Vous pouvez effectuer un retrait
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
                  min={MIN_WITHDRAWAL_AMOUNT}
                  max={balance.available > 0 ? balance.available : undefined}
                  step="100"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  disabled={balance.available < MIN_WITHDRAWAL_AMOUNT}
                  placeholder={balance.available > 0 ? `Maximum: ${balance.available.toLocaleString()} F CFA` : `Minimum: ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()} F CFA`}
                />
                {balance.available < MIN_WITHDRAWAL_AMOUNT ? (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Votre solde disponible ({formatCurrency(balance.available)}) est insuffisant. Le montant minimum est de {MIN_WITHDRAWAL_AMOUNT.toLocaleString()} F CFA.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Montant minimum: {MIN_WITHDRAWAL_AMOUNT.toLocaleString()} F CFA | Maximum: {formatCurrency(balance.available)}
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
                <>
                  <div>
                    <Label htmlFor="momoProvider">Opérateur</Label>
                    <Select
                      value={formData.momoProvider}
                      onValueChange={(value) => setFormData({ ...formData, momoProvider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir l'opérateur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mtn">MTN</SelectItem>
                        <SelectItem value="moov">Moov</SelectItem>
                        <SelectItem value="celtiis">Celtiis</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="wave">Wave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="momoNumber">Numéro Mobile Money</Label>
                    <Input
                      id="momoNumber"
                      type="tel"
                      placeholder="Ex: 229 61 00 00 00"
                      value={formData.momoNumber}
                      onChange={(e) => setFormData({ ...formData, momoNumber: e.target.value })}
                      required
                    />
                  </div>
                </>
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
                <Button type="submit" disabled={balance.available < MIN_WITHDRAWAL_AMOUNT}>
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
                        {withdrawal.momoNumber && <p>N° MoMo: {withdrawal.momoNumber} ({withdrawal.momoProvider || 'N/A'})</p>}
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
    </div>
  )
}

