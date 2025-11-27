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
import {
  User,
  Filter,
  Printer,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface StockRequest {
  id: string;
  reference: string;
  nombreLivres: number;
  demandePar: string;
  faitLe: string;
  dateLivraison: string | null;
  type: string;
  statut: string;
  livraison: string;
  departement: string;
  zone: string;
  commande: string;
  method: string;
  period: string;
  items: Array<{
    work: string;
    isbn: string;
    quantity: number;
    approvedQuantity: number | null;
  }>;
  approvedBy: string | null;
  approvedAt: string | null;
}

export default function DemandeStockPage() {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous-statuts");
  const [typeFilter, setTypeFilter] = useState("tous-types");
  const [methodFilter, setMethodFilter] = useState("toutes-methodes");
  const [periodFilter, setPeriodFilter] = useState("toutes");
  const [accountTypeFilter, setAccountTypeFilter] = useState("utilisateur");
  const [userIdFilter, setUserIdFilter] = useState("tous");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string }>>([]);

  useEffect(() => {
    loadRequests();
    loadUsers();
  }, [currentPage, itemsPerPage, statusFilter, typeFilter, methodFilter, periodFilter, dateFilter, userIdFilter, searchTerm]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (statusFilter !== "tous-statuts") {
        params.append("status", statusFilter);
      }
      if (typeFilter !== "tous-types") {
        params.append("type", typeFilter);
      }
      if (methodFilter !== "toutes-methodes") {
        params.append("method", methodFilter);
      }
      if (periodFilter !== "toutes") {
        params.append("period", periodFilter);
      }
      if (dateFilter) {
        params.append("date", dateFilter);
      }
      if (userIdFilter !== "tous") {
        params.append("userId", userIdFilter);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/pdg/stock/demande?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setRequests(data.requests || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("Erreur lors du chargement des demandes de stock");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/pdg/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject" | "process" | "deliver") => {
    try {
      const response = await fetch("/api/pdg/stock/demande", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'action");
      }

      toast.success("Action effectuée avec succès");
      loadRequests();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'action");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
      APPROVED: { label: "Approuvé", className: "bg-green-100 text-green-800" },
      REJECTED: { label: "Rejeté", className: "bg-red-100 text-red-800" },
      PROCESSING: { label: "En traitement", className: "bg-blue-100 text-blue-800" },
      DELIVERED: { label: "Livré", className: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Annulé", className: "bg-gray-100 text-gray-800" },
    };

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      COMMANDE: "Commande",
      PRECOMMANDE: "Précommande",
      DEPOT: "Dépôt",
      REAPPROVISIONNEMENT: "Réapprovisionnement",
    };
    return typeMap[type] || type;
  };

  const handleRefresh = () => {
    loadRequests();
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadRequests();
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    setStatusFilter("tous-statuts");
    setTypeFilter("tous-types");
    setMethodFilter("toutes-methodes");
    setPeriodFilter("toutes");
    setDateFilter("");
    setUserIdFilter("tous");
    setSearchTerm("");
    setCurrentPage(1);
    loadRequests();
    setShowFilterModal(false);
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Demande stock</h2>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <span className="text-sm text-slate-300">
              Tableau de bord - Demande stock
            </span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            {/* Bouton filtre */}
            <div className="mb-6">
              <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                <DialogTrigger asChild>
                  <Button className="bg-[#7367F0] hover:bg-[#5E50EE] text-white flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Filtre compte
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filtre</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Compte :</Label>
                        <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Utilisateur" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="utilisateur">Utilisateur</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Utilisateur :</Label>
                        <Select value={userIdFilter} onValueChange={setUserIdFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les utilisateurs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tous">Tous les utilisateurs</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4">
                      <Button
                        className="bg-[#7367F0] hover:bg-[#5E50EE] text-white flex items-center gap-2"
                        onClick={handleApplyFilters}
                      >
                        Appliquer
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={handleResetFilters}
                      >
                        Remise à zéro
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filtres haut */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
              />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous-statuts">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="APPROVED">Approuvé</SelectItem>
                  <SelectItem value="REJECTED">Rejeté</SelectItem>
                  <SelectItem value="PROCESSING">En traitement</SelectItem>
                  <SelectItem value="DELIVERED">Livré</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous-types">Tous les types</SelectItem>
                  <SelectItem value="COMMANDE">Commande</SelectItem>
                  <SelectItem value="PRECOMMANDE">Précommande</SelectItem>
                  <SelectItem value="DEPOT">Dépôt</SelectItem>
                  <SelectItem value="REAPPROVISIONNEMENT">Réapprovisionnement</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-[#7367F0] hover:bg-[#5E50EE] text-white flex items-center gap-2" onClick={handleApplyFilters}>
                <Filter className="w-4 h-4" />
                Appliquer
              </Button>
            </div>

            {/* Filtres bas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les méthodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes-methodes">Toutes les méthodes</SelectItem>
                  <SelectItem value="mtn-benin">MTN Benin</SelectItem>
                  <SelectItem value="autre-reseau">Autre réseau</SelectItem>
                  <SelectItem value="depot-stock">Dépôt de stock</SelectItem>
                  <SelectItem value="momopay">MomoPay</SelectItem>
                  <SelectItem value="carte-bancaire">Carte bancaire</SelectItem>
                  <SelectItem value="cheque-virement">Chèque/Virement</SelectItem>
                  <SelectItem value="reapprovisionnement">Réapprovisionnement</SelectItem>
                  <SelectItem value="proform">Proform</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Vacances et rentrée scolaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes les périodes</SelectItem>
                  <SelectItem value="vacances-rentree">Vacances et rentrée scolaire</SelectItem>
                  <SelectItem value="cours-vacances">Cours de vacances</SelectItem>
                  <SelectItem value="rentree-scolaire">Rentrée scolaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contrôles tableau */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => {
                    setItemsPerPage(parseInt(v));
                    setCurrentPage(1);
                  }}
                >
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

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Référence, notes..."
                  className="w-64"
                />
              </div>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Référence",
                      "Nbr. livre",
                      "Demandé par",
                      "Fait le",
                      "Date livraison",
                      "Type",
                      "Statut",
                      "Livraison",
                      "Département",
                      "Zone",
                      "Commande",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        className="py-3 px-2 text-left border-b text-gray-600 font-medium"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-gray-500">
                        Chargement...
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-gray-500">
                        Aucune donnée disponible dans le tableau
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">{request.reference}</td>
                        <td className="py-3 px-2">{request.nombreLivres}</td>
                        <td className="py-3 px-2">{request.demandePar}</td>
                        <td className="py-3 px-2">{request.faitLe}</td>
                        <td className="py-3 px-2">{request.dateLivraison || "-"}</td>
                        <td className="py-3 px-2">{getTypeLabel(request.type)}</td>
                        <td className="py-3 px-2">{getStatusBadge(request.statut)}</td>
                        <td className="py-3 px-2">{request.livraison}</td>
                        <td className="py-3 px-2">{request.departement}</td>
                        <td className="py-3 px-2">{request.zone}</td>
                        <td className="py-3 px-2">{request.commande}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowViewModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {request.statut === "PENDING" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(request.id, "approve")}
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(request.id, "reject")}
                                >
                                  <XCircle className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            {request.statut === "APPROVED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(request.id, "process")}
                              >
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                              </Button>
                            )}
                            {request.statut === "PROCESSING" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(request.id, "deliver")}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <p className="text-sm text-gray-600">
                Affichage de {startIndex} à {endIndex} sur {totalItems} éléments
              </p>
              <div className="flex items-center gap-2">
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

            {/* Export */}
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => toast.info("Export PDF en cours de préparation...")}
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => toast.info("Export Excel en cours de préparation...")}
              >
                <Download className="w-4 h-4" />
                EXCEL
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de visualisation */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la demande de stock</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Référence</Label>
                  <p className="font-medium">{selectedRequest.reference}</p>
                </div>
                <div>
                  <Label>Statut</Label>
                  <div>{getStatusBadge(selectedRequest.statut)}</div>
                </div>
                <div>
                  <Label>Demandé par</Label>
                  <p>{selectedRequest.demandePar}</p>
                </div>
                <div>
                  <Label>Fait le</Label>
                  <p>{selectedRequest.faitLe}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p>{getTypeLabel(selectedRequest.type)}</p>
                </div>
                <div>
                  <Label>Date de livraison</Label>
                  <p>{selectedRequest.dateLivraison || "-"}</p>
                </div>
                <div>
                  <Label>Méthode</Label>
                  <p>{selectedRequest.method}</p>
                </div>
                <div>
                  <Label>Période</Label>
                  <p>{selectedRequest.period}</p>
                </div>
                {selectedRequest.approvedBy && (
                  <>
                    <div>
                      <Label>Approuvé par</Label>
                      <p>{selectedRequest.approvedBy}</p>
                    </div>
                    <div>
                      <Label>Approuvé le</Label>
                      <p>{selectedRequest.approvedAt}</p>
                    </div>
                  </>
                )}
              </div>
              <div>
                <Label>Articles demandés</Label>
                <div className="mt-2 border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Œuvre</th>
                        <th className="p-2 text-left">ISBN</th>
                        <th className="p-2 text-right">Quantité demandée</th>
                        <th className="p-2 text-right">Quantité approuvée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{item.work}</td>
                          <td className="p-2">{item.isbn}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">{item.approvedQuantity || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
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
