'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        loadOrder();
    }, []);

    const loadOrder = async () => {
        try {
            // On utilise l'API detail order existante ou on suppose qu'elle existe
            // Si elle n'existe pas, on peut utiliser une server action ou fetcher via une route dédiée
            // Pour l'instant on va utiliser une route générique supposée
            const response = await fetch(`/api/orders/${params.orderId}`); // À vérifier si cette route existe
            if (response.ok) {
                const data = await response.json();
                setOrder(data);
            } else {
                toast.error("Impossible de charger la commande");
            }
        } catch (error) {
            console.error('Erreur chargement commande:', error);
            toast.error("Erreur de connexion");
        } finally {
            setInitializing(false);
        }
    };

    const handlePayment = async () => {
        try {
            setLoading(true);

            const response = await fetch(`/api/orders/${params.orderId}/pay`, {
                method: 'POST'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'initialisation du paiement');
            }

            if (data.paymentUrl) {
                // Rediriger vers la page de paiement Moneroo
                window.location.href = data.paymentUrl;
            } else {
                throw new Error("URL de paiement non reçue");
            }

        } catch (error: any) {
            console.error('Erreur paiement:', error);
            toast.error(error.message || 'Erreur lors du paiement');
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container max-w-2xl mx-auto py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Commande introuvable</h1>
                <Button onClick={() => router.push('/dashboard')}>Retour au tableau de bord</Button>
            </div>
        );
    }

    return (
        <div className="container max-w-md mx-auto py-12 px-4">
            <Card className="w-full shadow-lg border-2">
                <CardHeader className="text-center bg-gray-50/50 pb-8 border-b">
                    <CardTitle className="text-2xl font-bold text-gray-900">Paiement Sécurisé</CardTitle>
                    <CardDescription className="text-gray-500">
                        Finalisez votre commande en toute sécurité
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                        <span className="text-gray-600">Commande</span>
                        <span className="font-mono font-medium">#{order.id.slice(-8).toUpperCase()}</span>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500 mb-2">Récapitulatif</p>
                        {order.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-700 truncate max-w-[200px]">{item.work?.title || 'Article'} <span className="text-gray-400">x{item.quantity}</span></span>
                                <span className="font-medium">{(item.price * item.quantity).toLocaleString()} F CFA</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center mt-6">
                        <span className="text-blue-700 font-medium">Total à payer</span>
                        <span className="text-2xl font-bold text-blue-800">{order.total.toLocaleString()} F CFA</span>
                    </div>

                    {order.status === 'PENDING' && (
                        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200 flex items-start gap-2">
                            <Lock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <strong>En attente de validation</strong>
                                <p className="mt-1">
                                    Votre commande doit être validée par un administrateur avant le paiement. Vous serez notifié une fois la validation effectuée.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4 pt-6">
                    {order.status === 'VALIDATED' || order.status === 'PROCESSING' ? (
                        order.paymentStatus === 'PAID' ? (
                            <div className="w-full p-4 bg-green-50 text-green-700 rounded-lg text-center font-medium border border-green-200">
                                Commande déjà payée
                            </div>
                        ) : (
                            <Button
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full h-12 text-lg font-medium shadow-md transition-all hover:scale-[1.02]"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Redirection Moneroo...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-2 h-5 w-5" />
                                        Payer avec Moneroo
                                    </>
                                )}
                            </Button>
                        )
                    ) : (
                        <Button disabled className="w-full h-12 text-lg font-medium bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200">
                            Paiement indisponible pour le moment
                        </Button>
                    )}

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <Lock className="h-3 w-3" />
                        <span>Paiement 100% sécurisé via Moneroo (Mobile Money, Carte)</span>
                    </div>
                </CardFooter>
            </Card>

            <div className="text-center mt-8">
                <Button variant="link" onClick={() => router.back()} className="text-gray-500">
                    Annuler et retourner
                </Button>
            </div>
        </div>
    );
}
