"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Filter, Calendar, Printer, RefreshCw, Maximize2, Eye, CheckCircle, XCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";

interface DeliveryNote {
  id: string;
  reference: string;
  order: {
    id: string;
    reference: string;
    client: string;
    clientEmail: string;
    partner: string | null;
    total: number;
    status: string;
    items: Array<{
      work: string;
      isbn: string;
      quantity: number;
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

export default function BonSortiePage() {
  const router = useRouter();
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [orderTypeFilter, setOrderTypeFilter] = useState("toutes");
  const [periodFilter, setPeriodFilter] = useState("toutes");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationData, setValidationData] = useState({
    motif: "",
    destination: "",
    etatLivres: "",
    transport: "",
    datePrevue: "",
    notes: ""
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);
  const [newNote, setNewNote] = useState({
    orderId: "",
    period: "",
    notes: ""
  });
  const [orders, setOrders] = useState<Array<{ id: string; reference: string; client: string; total: number }>>([]);

  useEffect(() => {
    loadDeliveryNotes();
    loadOrders();
  }, [currentPage, itemsPerPage, statusFilter, orderTypeFilter, periodFilter, searchTerm]);

  const loadDeliveryNotes = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (statusFilter !== "tous") params.append("status", statusFilter);
      if (orderTypeFilter !== "toutes") params.append("orderType", orderTypeFilter);
      if (periodFilter !== "toutes") params.append("period", periodFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/pdg/bon-sortie?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setDeliveryNotes(data.deliveryNotes || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading delivery notes:", error);
      toast.error("Erreur lors du chargement des bons de sortie");
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch("/api/orders?status=VALIDATED", { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        // L'API retourne directement un tableau
        const ordersArray = Array.isArray(data) ? data : (data.orders || []);
        
        setOrders(ordersArray.map((o: any) => ({
          id: o.id,
          reference: o.reference,
          client: o.user?.name || o.clientEmail || "Client",
          total: o.total || 0
        })));
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const handleCreate = async () => {
    try {
      if (!newNote.orderId) {
        toast.error("Veuillez sélectionner une commande");
        return;
      }

      const response = await fetch("/api/pdg/bon-sortie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      toast.success("Bon de sortie créé avec succès");
      setShowCreateModal(false);
      setNewNote({ orderId: "", period: "", notes: "" });
      loadDeliveryNotes();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    }
  };

  const handleCreateMissingForOrder = async (orderId: string) => {
    try {
      const response = await fetch("/api/pdg/bon-sortie/create-missing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      const data = await response.json();
      toast.success(data.message || "Bon de sortie créé avec succès");
      loadDeliveryNotes();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En attente</Badge>
      case 'VALIDATED':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Validé</Badge>
      case 'CONTROLLED':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Contrôlé</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complété</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Annulé</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>
    }
  };

  const handleRefresh = () => {
    loadDeliveryNotes();
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleAction = async (id: string, action: "validate" | "control" | "complete" | "cancel") => {
    if (action === "validate") {
      const note = deliveryNotes.find(n => n.id === id);
      if (note) {
        setSelectedNote(note);
        // Reset validation data
        setValidationData({
          motif: "",
          destination: "",
          etatLivres: "",
          transport: "",
          datePrevue: "",
          notes: ""
        });
        setShowValidationModal(true);
      }
      return;
    }

    if (action === "cancel" && !confirm("Êtes-vous sûr de vouloir annuler ce bon de sortie ? Les articles seront remis en stock.")) {
      return;
    }

    try {
      const response = await fetch("/api/pdg/bon-sortie", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'action");
      }

      toast.success(action === 'cancel' ? "Bon annulé et stock restauré avec succès" : "Action effectuée avec succès");
      loadDeliveryNotes();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'action");
    }
  };

  const handleConfirmValidation = async () => {
    if (!selectedNote) return;

    try {
      const response = await fetch("/api/pdg/bon-sortie", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedNote.id,
          action: "validate",
          ...validationData
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la validation");
      }

      toast.success("Bon de sortie validé avec succès");
      setShowValidationModal(false);
      loadDeliveryNotes();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation");
    }
  };

  // ... (keep rest of existing functions code until return)

  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bons de Sortie</h1>
            <p className="text-gray-500">Gérez les bons de sortie et validez les expéditions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
            </Button>
            <Button variant="outline" onClick={handleFullscreen}>
              <Maximize2 className="mr-2 h-4 w-4" />
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nouveau Bon de Sortie
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end bg-white p-4 rounded-lg border shadow-sm">
          <div className="grid gap-2 flex-1">
            <Label>Recherche</Label>
            <Input
              placeholder="Référence, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="grid gap-2 w-full md:w-[200px]">
            <Label>Statut</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="VALIDATED">Validés</SelectItem>
                <SelectItem value="CONTROLLED">Contrôlés</SelectItem>
                <SelectItem value="COMPLETED">Complétés</SelectItem>
                <SelectItem value="CANCELLED">Annulés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 w-full md:w-[200px]">
            <Label>Période</Label>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les périodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les périodes</SelectItem>
                <SelectItem value="cours-vacances">Cours de vacances</SelectItem>
                <SelectItem value="rentree-scolaire">Rentrée scolaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Commande</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Généré par</th>
                  <th className="px-4 py-3">Validé par</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Chargement en cours...
                    </td>
                  </tr>
                ) : deliveryNotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Aucun bon de sortie trouvé.
                    </td>
                  </tr>
                ) : (
                  deliveryNotes.map((note) => (
                    <tr key={note.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{note.reference}</td>
                      <td className="px-4 py-3">{note.order.reference}</td>
                      <td className="px-4 py-3">
                        <div>{note.order.client}</div>
                        <div className="text-xs text-gray-500">{note.order.partner || "-"}</div>
                      </td>
                      <td className="px-4 py-3">{note.generatedBy}</td>
                      <td className="px-4 py-3">
                        <div>{note.validatedBy || "-"}</div>
                        {note.validatedAt && <div className="text-xs text-gray-500">{formatDate(note.validatedAt)}</div>}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(note.status)}</td>
                      <td className="px-4 py-3">{formatDate(note.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => router.push(`/dashboard/pdg/bon-sortie/${note.id}`)}
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination du pauvre (simple next/prev) */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              Page {currentPage} sur {totalPages} ({totalItems} résultats)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un bon de sortie</DialogTitle>
            <DialogDescription>
              Sélectionnez une commande validée pour générer un bon de sortie
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Commande</Label>
              <Select value={newNote.orderId} onValueChange={(v) => setNewNote({ ...newNote, orderId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une commande" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.reference} - {order.client} ({order.total.toLocaleString()} XOF)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Période</Label>
              <Select value={newNote.period} onValueChange={(v) => setNewNote({ ...newNote, period: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cours-vacances">Cours de vacances</SelectItem>
                  <SelectItem value="rentree-scolaire">Rentrée scolaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={newNote.notes}
                onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
                placeholder="Notes additionnelles..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate}>Créer le bon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de visualisation */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails du bon de sortie</DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Référence</Label>
                  <p className="font-medium">{selectedNote.reference}</p>
                </div>
                <div>
                  <Label>Statut</Label>
                  <div>{getStatusBadge(selectedNote.status)}</div>
                </div>
                <div>
                  <Label>Commande</Label>
                  <p className="font-medium">{selectedNote.order.reference}</p>
                </div>
                <div>
                  <Label>Client</Label>
                  <p>{selectedNote.order.client}</p>
                </div>
                <div>
                  <Label>Généré par</Label>
                  <p>{selectedNote.generatedBy}</p>
                </div>
                <div>
                  <Label>Validé par</Label>
                  <p>{selectedNote.validatedBy || "-"}</p>
                </div>
                <div>
                  <Label>Contrôlé par</Label>
                  <p>{selectedNote.controlledBy || "-"}</p>
                </div>
                <div>
                  <Label>Période</Label>
                  <p>{selectedNote.period || "-"}</p>
                </div>
              </div>
              <div>
                <Label>Articles</Label>
                <div className="mt-2 border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Œuvre</th>
                        <th className="p-2 text-left">ISBN</th>
                        <th className="p-2 text-right">Quantité</th>
                        <th className="p-2 text-right">Prix unitaire</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedNote.order.items.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{item.work}</td>
                          <td className="p-2">{item.isbn}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">{item.price.toLocaleString()} XOF</td>
                          <td className="p-2 text-right">{(item.quantity * item.price).toLocaleString()} XOF</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="p-2 text-right font-medium">Total</td>
                        <td className="p-2 text-right font-bold">{selectedNote.order.total.toLocaleString()} XOF</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MinusCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
    </svg>
  )
}
