"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DeliveryNoteDetails {
    id: string;
    reference: string;
    order: {
        id: string;
        reference: string;
        client: string;
        clientEmail: string;
        total: number;
        items: Array<{
            work: string;
            isbn: string;
            requestedQuantity: number;
            deliveredQuantity: number;
            price: number;
        }>;
    };
    generatedBy: string;
    validatedBy: string | null;
    validatedAt: string | null;
    controlledBy: string | null;
    controlledAt: string | null;
    status: string;
    period: string | null;
    createdAt: string;
}

export default function BonSortieDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [deliveryNote, setDeliveryNote] = useState<DeliveryNoteDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (params.id) {
            loadDeliveryNote(params.id as string);
        }
    }, [params.id]);

    const loadDeliveryNote = async (id: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/pdg/bon-sortie/${id}`);
            if (!response.ok) throw new Error("Erreur lors du chargement");

            const data = await response.json();
            setDeliveryNote(data.deliveryNote);
        } catch (error) {
            console.error("Error loading delivery note:", error);
            toast.error("Erreur lors du chargement du bon de sortie");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        try {
            return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
        } catch {
            return dateString;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En attente</Badge>;
            case "VALIDATED":
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Validé</Badge>;
            case "CONTROLLED":
                return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Contrôlé</Badge>;
            case "COMPLETED":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complété</Badge>;
            case "CANCELLED":
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Annulé</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
        }
    };

    const getItemStatusBadge = (requested: number, delivered: number) => {
        if (delivered >= requested) {
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Livraison terminée</Badge>;
        } else if (delivered > 0) {
            return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En attente de validation</Badge>;
        } else {
            return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En attente de validation</Badge>;
        }
    };

    const handleAction = async (action: "validate" | "cancel") => {
        if (!deliveryNote) return;

        try {
            setIsProcessing(true);
            const response = await fetch("/api/pdg/bon-sortie", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: deliveryNote.id, action }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erreur lors de l'action");
            }

            toast.success(
                action === "validate" ? "Bon de sortie validé" : "Bon de sortie refusé"
            );

            // Recharger les données
            await loadDeliveryNote(deliveryNote.id);
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'action");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Chargement...</p>
            </div>
        );
    }

    if (!deliveryNote) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-gray-500 mb-4">Bon de sortie introuvable</p>
                <Button onClick={() => router.push("/dashboard/pdg/bon-sortie")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                </Button>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Détails de bon de sortie {deliveryNote.reference}
                        </h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-slate-300">
                            Tableau de bord - Détails Détails bon de sortie
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-6">
                <div className="bg-white rounded-lg shadow-sm">
                    {/* Informations principales */}
                    <div className="p-6 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Référence</label>
                                <p className="text-base font-semibold mt-1">{deliveryNote.reference}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Commande</label>
                                <p className="text-base font-semibold mt-1">{deliveryNote.order.reference}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Statut</label>
                                <div className="mt-1">{getStatusBadge(deliveryNote.status)}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Client</label>
                                <p className="text-base mt-1">{deliveryNote.order.client}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Validé par</label>
                                <p className="text-base mt-1">{deliveryNote.validatedBy || "-"}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Validé le</label>
                                <p className="text-base mt-1">{formatDate(deliveryNote.validatedAt)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Contrôlé par</label>
                                <p className="text-base mt-1">-</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Contrôlé le</label>
                                <p className="text-base mt-1">-</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Date de création</label>
                                <p className="text-base mt-1">{formatDate(deliveryNote.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table Controls */}
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Afficher</span>
                                <select className="border rounded px-2 py-1 text-sm">
                                    <option>10</option>
                                </select>
                                <span className="text-sm text-gray-600">éléments</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Rechercher:</span>
                                <input
                                    type="text"
                                    className="border rounded px-3 py-1 text-sm w-64"
                                    placeholder="Rechercher..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tableau des livres */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left p-4 font-semibold text-gray-700">
                                        <div className="flex items-center">
                                            <span className="mr-1">♦</span>
                                            Nom du livre
                                        </div>
                                    </th>
                                    <th className="text-left p-4 font-semibold text-gray-700">
                                        <div className="flex items-center">
                                            <span className="mr-1">♦</span>
                                            Quantité demandée
                                        </div>
                                    </th>
                                    <th className="text-left p-4 font-semibold text-gray-700">
                                        <div className="flex items-center">
                                            <span className="mr-1">♦</span>
                                            Quantité à sortir
                                        </div>
                                    </th>
                                    <th className="text-left p-4 font-semibold text-gray-700">
                                        <div className="flex items-center">
                                            <span className="mr-1">♦</span>
                                            Statut
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveryNote.order.items.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="p-4">{item.work}</td>
                                        <td className="p-4">{item.requestedQuantity || item.deliveredQuantity}</td>
                                        <td className="p-4">{item.deliveredQuantity || item.requestedQuantity}</td>
                                        <td className="p-4">
                                            {getItemStatusBadge(
                                                item.requestedQuantity || item.deliveredQuantity,
                                                item.deliveredQuantity || item.requestedQuantity
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-6 border-t">
                        <p className="text-sm text-gray-600">
                            Affichage de 1 à {deliveryNote.order.items.length} sur {deliveryNote.order.items.length} éléments
                        </p>
                        <div className="flex items-center justify-center space-x-2 mt-4">
                            <Button variant="outline" size="sm">Premier</Button>
                            <Button variant="outline" size="sm">Précédent</Button>
                            <Button variant="default" size="sm">1</Button>
                            <Button variant="outline" size="sm">Suivant</Button>
                            <Button variant="outline" size="sm">Dernier</Button>
                        </div>
                    </div>

                    {/* Footer avec boutons */}
                    <div className="p-6 border-t bg-gray-50">
                        <div className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={() => router.push("/dashboard/pdg/bon-sortie")}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Retour
                            </Button>
                            <div className="flex space-x-2">
                                <Button
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="w-4 h-4 mr-2" />
                                    Imprimer
                                </Button>
                                {deliveryNote.status === "PENDING" && (
                                    <>
                                        <Button
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                            onClick={() => handleAction("cancel")}
                                            disabled={isProcessing}
                                        >
                                            Refuser
                                        </Button>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => handleAction("validate")}
                                            disabled={isProcessing}
                                        >
                                            Valider
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
