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

      if (statusFilter !== "tous") {
        params.append("status", statusFilter);
      }
      if (orderTypeFilter !== "toutes") {
        params.append("orderType", orderTypeFilter);
      }
      if (periodFilter !== "toutes") {
        params.append("period", periodFilter);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/pdg/bon-sortie?${params}`);
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
      const response = await fetch("/api/orders?status=VALIDATED");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders?.map((o: any) => ({
          id: o.id,
          reference: `CMD-${o.id.slice(-8)}`,
          client: o.user?.name || "N/A",
          total: o.total || 0
        })) || []);
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

  const handleAction = async (id: string, action: "validate" | "control" | "complete" | "cancel") => {
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

      toast.success("Action effectuée avec succès");
      loadDeliveryNotes();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'action");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING: { label: "En attente", variant: "secondary" },
      VALIDATED: { label: "Validé", variant: "default" },
      CONTROLLED: { label: "Contrôlé", variant: "default" },
      COMPLETED: { label: "Complété", variant: "default" },
      CANCELLED: { label: "Annulé", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return (
      <Badge variant={statusInfo.variant} className={
        status === "VALIDATED" || status === "CONTROLLED" || status === "COMPLETED"
          ? "bg-green-100 text-green-800"
          : status === "CANCELLED"
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-800"
      }>
        {statusInfo.label}
      </Badge>
    );
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

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Bon de sortie</h2>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un bon
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <span className="text-sm text-slate-300">
              Tableau de bord - Bon de sortie
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="w-4 h-4 mr-2" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd MMM yyyy", { locale: fr })} -{" "}
                          {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: fr })
                      )
                    ) : (
                      <span>Période</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="VALIDATED">Validé</SelectItem>
                  <SelectItem value="CONTROLLED">Contrôlé</SelectItem>
                  <SelectItem value="COMPLETED">Complété</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les commandes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes les commandes</SelectItem>
                  <SelectItem value="commande">Commande</SelectItem>
                  <SelectItem value="precommande">Précommande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex justify-end">
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={loadDeliveryNotes}>
                  <Filter className="w-4 h-4 mr-2" />
                  Appliquer
                </Button>
              </div>
            </div>
          </div>

          {/* Table Controls */}
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input
                  placeholder="Référence, commande..."
                  className="w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">Référence</th>
                  <th className="text-left p-4 font-medium text-gray-700">Commande</th>
                  <th className="text-left p-4 font-medium text-gray-700">Généré par</th>
                  <th className="text-left p-4 font-medium text-gray-700">Client</th>
                  <th className="text-left p-4 font-medium text-gray-700">Validé par</th>
                  <th className="text-left p-4 font-medium text-gray-700">Validé le</th>
                  <th className="text-left p-4 font-medium text-gray-700">Contrôlé par</th>
                  <th className="text-left p-4 font-medium text-gray-700">Contrôlé le</th>
                  <th className="text-left p-4 font-medium text-gray-700">Statut</th>
                  <th className="text-left p-4 font-medium text-gray-700">Créé le</th>
                  <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : deliveryNotes.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-500">
                      Aucune donnée disponible dans le tableau
                    </td>
                  </tr>
                ) : (
                  deliveryNotes.map((note) => (
                    <tr key={note.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{note.reference}</td>
                      <td className="p-4">{note.order.reference}</td>
                      <td className="p-4">{note.generatedBy}</td>
                      <td className="p-4">{note.order.client}</td>
                      <td className="p-4">{note.validatedBy || "-"}</td>
                      <td className="p-4">{note.validatedAt || "-"}</td>
                      <td className="p-4">{note.controlledBy || "-"}</td>
                      <td className="p-4">{note.controlledAt || "-"}</td>
                      <td className="p-4">{getStatusBadge(note.status)}</td>
                      <td className="p-4">{note.createdAt}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedNote(note);
                              setShowViewModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {note.status === "PENDING" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(note.id, "validate")}
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {note.status === "VALIDATED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(note.id, "control")}
                            >
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          {note.status === "CONTROLLED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(note.id, "complete")}
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {note.status !== "COMPLETED" && note.status !== "CANCELLED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(note.id, "cancel")}
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-gray-600">
                Affichage de {startIndex} à {endIndex} sur {totalItems} éléments
              </p>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Premier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Dernier
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-end space-x-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                PDF
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                EXCEL
              </Button>
              <Button variant="outline">
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de création */}
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
            <Button onClick={handleCreate}>Créer</Button>
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
