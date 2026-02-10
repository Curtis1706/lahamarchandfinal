'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Wallet, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowUpRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RoyaltiesPage() {
    const [balance, setBalance] = useState(0);
    const [withdrawals, setWithdrawals] = useState([]); // Pour l'instant vide, il faudrait une API pour l'historique
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        method: 'mobile_money',
        phoneNumber: '',
        provider: 'mtn',
        // bank info
        bankName: '',
        accountNumber: '',
        accountName: ''
    });

    useEffect(() => {
        loadBalance();
        // loadWithdrawals(); // À implémenter : GET /api/withdrawals
    }, []);

    const loadBalance = async () => {
        try {
            const response = await fetch('/api/withdrawals/balance');
            if (response.ok) {
                const data = await response.json();
                setBalance(data.balance);
            }
        } catch (error) {
            console.error('Erreur chargement solde:', error);
        }
    };

    const handleWithdraw = async () => {
        try {
            setLoading(true);
            const amount = parseFloat(withdrawForm.amount);

            if (isNaN(amount) || amount <= 0) {
                toast.error('Montant invalide');
                setLoading(false);
                return;
            }

            if (amount > balance) {
                toast.error('Solde insuffisant');
                setLoading(false);
                return;
            }

            const response = await fetch('/api/withdrawals/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(withdrawForm)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur inconnue');
            }

            toast.success('Demande de retrait créée avec succès');
            setShowWithdrawModal(false);
            setWithdrawForm({ ...withdrawForm, amount: '' }); // Reset amount only
            loadBalance();
            // loadWithdrawals();
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la demande');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-5xl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mes Royalties</h1>
                    <p className="text-gray-500 mt-1">Gérez vos revenus et vos retraits</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Solde */}
                <Card className="col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl border-none">
                    <CardHeader pb-2>
                        <CardTitle className="flex items-center gap-2 text-blue-100 font-normal">
                            <Wallet className="h-5 w-5" />
                            Solde disponible
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <p className="text-5xl font-bold tracking-tighter">
                                    {balance.toLocaleString()} <span className="text-2xl text-blue-200 font-normal">F CFA</span>
                                </p>
                                <p className="text-blue-200 mt-2 text-sm flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Prêt pour retrait immédiat
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowWithdrawModal(true)}
                                disabled={balance < 500}
                                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-sm"
                                size="lg"
                            >
                                <ArrowUpRight className="mr-2 h-4 w-4" />
                                Retirer mes gains
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats rapides */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Retiré (À venir)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0 F CFA</div>
                        <p className="text-xs text-gray-500 mt-1">Depuis le début</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="history" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="history">Historique des transactions</TabsTrigger>
                    <TabsTrigger value="payouts">Mes Retraits</TabsTrigger>
                </TabsList>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transactions Récentes</CardTitle>
                            <CardDescription>Vos gains sur les dernières commandes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* TODO: Lister les royalties (Table Royalty) */}
                            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                Aucune transaction récente à afficher
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payouts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historique des Retraits</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* TODO: Lister les retraits (Table WithdrawalRequest) */}
                            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                Aucun retrait effectué pour le moment
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal de retrait */}
            <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Demander un retrait</DialogTitle>
                        <DialogDescription>
                            Transférez vos gains vers votre compte Mobile Money ou Banque.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Montant (F CFA)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Min: 500"
                                value={withdrawForm.amount}
                                onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 text-right">
                                Max: {balance.toLocaleString()} F CFA
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label>Méthode de réception</Label>
                            <Tabs defaultValue="mobile_money" onValueChange={(v: any) => setWithdrawForm({ ...withdrawForm, method: v })}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="mobile_money">Mobile Money</TabsTrigger>
                                    <TabsTrigger value="bank_transfer">Virement</TabsTrigger>
                                </TabsList>

                                <TabsContent value="mobile_money" className="space-y-4 pt-2">
                                    <div className="grid gap-2">
                                        <Label>Opérateur</Label>
                                        <Select
                                            value={withdrawForm.provider}
                                            onValueChange={(value) => setWithdrawForm({ ...withdrawForm, provider: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                                                <SelectItem value="moov">Moov Money</SelectItem>
                                                <SelectItem value="orange">Orange Money</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Numéro de téléphone</Label>
                                        <Input
                                            type="tel"
                                            placeholder="ex: 229XXXXXXXX"
                                            value={withdrawForm.phoneNumber}
                                            onChange={(e) => setWithdrawForm({ ...withdrawForm, phoneNumber: e.target.value })}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="bank_transfer" className="space-y-4 pt-2">
                                    <div className="grid gap-2">
                                        <Label>Banque</Label>
                                        <Input
                                            placeholder="Nom de la banque"
                                            value={withdrawForm.bankName}
                                            onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>IBAN / Numéro de compte</Label>
                                        <Input
                                            placeholder="Numéro de compte"
                                            value={withdrawForm.accountNumber}
                                            onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Titulaire du compte</Label>
                                        <Input
                                            placeholder="Nom complet"
                                            value={withdrawForm.accountName}
                                            onChange={(e) => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowWithdrawModal(false)}>Annuler</Button>
                        <Button onClick={handleWithdraw} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirmer le retrait
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
