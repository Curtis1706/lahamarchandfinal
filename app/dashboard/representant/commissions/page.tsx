"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, TrendingUp, Clock, CheckCircle, Plus, Wallet } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Commission {
  id: string
  orderDate: string
  orderTotal: number
  commission: number
  status: string
  itemCount: number
  items: Array<{
    work: {
      title: string
      author: string
      discipline: string
    }
    quantity: number
    price: number
    subtotal: number
  }>
}

interface CommissionsSummary {
  totalCommissions: number
  paidCommissions: number
  pendingCommissions: number
  commissionRate: number
  totalOrders: number
  averageCommission: number
}

export default function CommissionsPage() {
  const { toast } = useToast()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [summary, setSummary] = useState<CommissionsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [withdrawalMethod, setWithdrawalMethod] = useState<"MOMO" | "BANK" | "CASH">("MOMO")
  const [momoNumber, setMomoNumber] = useState("")
  const [momoProvider, setMomoProvider] = useState<string>("")
  const [bankName, setBankName] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [bankAccountName, setBankAccountName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadCommissions()
  }, [])

  const loadCommissions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/representant/commissions')
      if (!response.ok) throw new Error('Erreur lors du chargement')

      const data = await response.json()
      setCommissions(data.commissions || [])
      setSummary(data.summary || null)
    } catch (error: any) {
      console.error("Error loading commissions:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des commissions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      })
      return
    }

    if (withdrawalMethod === "MOMO") {
      if (!momoNumber) {
        toast({
          title: "Erreur",
          description: "Veuillez entrer un numéro Mobile Money",
          variant: "destructive"
        })
        return
      }
      if (!momoProvider) {
        toast({
          title: "Erreur",
          description: "Veuillez choisir un opérateur",
          variant: "destructive"
        })
        return
      }
    }

    if (withdrawalMethod === "BANK" && (!bankName || !bankAccount)) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir les informations bancaires",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/representant/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(withdrawalAmount),
          method: withdrawalMethod,
          momoNumber: withdrawalMethod === "MOMO" ? momoNumber : undefined,
          momoProvider: withdrawalMethod === "MOMO" ? momoProvider : undefined,
          bankName: withdrawalMethod === "BANK" ? bankName : undefined,
          bankAccount: withdrawalMethod === "BANK" ? bankAccount : undefined,
          bankAccountName: withdrawalMethod === "BANK" ? bankAccountName : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la demande de retrait")
      }

      toast({
        title: "Succès",
        description: "Votre demande de retrait a été envoyée avec succès"
      })

      setShowWithdrawalDialog(false)
      setWithdrawalAmount("")
      setMomoNumber("")
      setMomoProvider("")
      setBankName("")
      setBankAccount("")
      setBankAccountName("")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la demande de retrait",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge className="bg-green-100 text-green-800">Payé</Badge>
      case 'VALIDATED':
      case 'PROCESSING':
      case 'SHIPPED':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const availableBalance = summary ? summary.paidCommissions : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Commissions</h1>
          <p className="text-gray-600">Consultez vos commissions et demandez un retrait</p>
        </div>
        <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Wallet className="h-4 w-4 mr-2" />
              Demander un retrait
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Demande de retrait</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Solde disponible</Label>
                <p className="text-2xl font-bold text-green-600">
                  {availableBalance.toLocaleString()} F CFA
                </p>
              </div>
              <div>
                <Label htmlFor="amount">Montant à retirer *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="Montant en F CFA"
                  min="5000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Montant minimum: 5 000 F CFA
                </p>
              </div>
              <div>
                <Label htmlFor="method">Méthode de paiement *</Label>
                <Select value={withdrawalMethod} onValueChange={(value: any) => setWithdrawalMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOMO">Mobile Money</SelectItem>
                    <SelectItem value="BANK">Virement bancaire</SelectItem>
                    <SelectItem value="CASH">Espèces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {withdrawalMethod === "MOMO" && (
                <>
                  <div>
                    <Label htmlFor="momoProvider">Opérateur *</Label>
                    <Select value={momoProvider} onValueChange={setMomoProvider}>
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
                    <Label htmlFor="momoNumber">Numéro Mobile Money *</Label>
                    <Input
                      id="momoNumber"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="+229 XX XX XX XX"
                    />
                  </div>
                </>
              )}
              {withdrawalMethod === "BANK" && (
                <>
                  <div>
                    <Label htmlFor="bankName">Nom de la banque *</Label>
                    <Input
                      id="bankName"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Nom de la banque"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Numéro de compte *</Label>
                    <Input
                      id="bankAccount"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Numéro de compte"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountName">Nom du titulaire</Label>
                    <Input
                      id="bankAccountName"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Nom du titulaire du compte"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowWithdrawalDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleWithdrawal} disabled={isSubmitting}>
                  {isSubmitting ? "Envoi..." : "Envoyer la demande"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total commissions</p>
                  <p className="text-2xl font-bold">{summary.totalCommissions.toLocaleString()} F CFA</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Commissions payées</p>
                  <p className="text-2xl font-bold text-green-600">{summary.paidCommissions.toLocaleString()} F CFA</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pendingCommissions.toLocaleString()} F CFA</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux de commission</p>
                  <p className="text-2xl font-bold">{summary.commissionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune commission pour le moment
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Montant commande</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      {new Date(commission.orderDate).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">Commande #{commission.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">{commission.itemCount} article(s)</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {commission.orderTotal.toLocaleString()} F CFA
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-green-600">
                        {commission.commission.toLocaleString()} F CFA
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(commission.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

