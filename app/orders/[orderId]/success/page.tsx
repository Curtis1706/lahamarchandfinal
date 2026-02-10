'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle, Download, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function OrderSuccessPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<any>(null);

    const paymentStatus = searchParams.get('paymentStatus');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (paymentStatus === 'success') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            // Déclencher la vérification immédiate
            verifyPayment();
        } else {
            loadOrder();
        }
    }, [paymentStatus]);

    const verifyPayment = async () => {
        try {
            setVerifying(true);
            // Appeler l'endpoint de vérification qui va forcer la mise à jour côté serveur
            await fetch(`/api/orders/${params.orderId}/verify`, { method: 'POST' });
            // Ensuite charger la commande à jour
            loadOrder();
        } catch (error) {
            console.error("Erreur vérification:", error);
            loadOrder(); // Charger quand même
        } finally {
            setVerifying(false);
        }
    };

    const loadOrder = async () => {
        try {
            const response = await fetch(`/api/orders/${params.orderId}`);
            if (response.ok) {
                const data = await response.json();
                setOrder(data);
            } else {
                toast.error("Impossible de charger les détails de la commande");
            }
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || verifying) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                {verifying && <p className="text-gray-500 font-medium">Vérification du paiement en cours...</p>}
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container max-w-2xl mx-auto py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Commande introuvable</h1>
                <Button onClick={() => router.push('/dashboard/client')}>Retour au tableau de bord</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-green-500">
                    <div className="text-center mb-8">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Paiement Réussi !</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Merci pour votre commande. Votre transaction a été validée avec succès.
                        </p>
                        <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-800">
                            Commande #{order.id.slice(-8).toUpperCase()}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h3>
                        <div className="space-y-4">
                            {order.items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-gray-900">{item.work?.title}</h4>
                                        <p className="text-xs text-gray-500">{item.work?.author?.name}</p>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{(item.price * item.quantity).toLocaleString()} F CFA</p>
                                </div>
                            ))}

                            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                <span className="text-base font-medium text-gray-900">Total payé</span>
                                <span className="text-lg font-bold text-green-600">{order.total.toLocaleString()} F CFA</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => router.push('/dashboard/client/commandes')}
                        >
                            <BookOpen className="mr-2 h-4 w-4" />
                            Voir mes commandes
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push('/dashboard/client/catalogue')}
                        >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Retour au catalogue
                        </Button>
                    </div>
                </div>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Un email de confirmation vous a été envoyé.
                    <br />
                    Besoin d'aide ? <a href="/contact" className="font-medium text-purple-600 hover:text-purple-500">Contactez le support</a>
                </p>
            </div>
        </div>
    );
}
