"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Eye, Save, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, Clock, Loader2, Search } from "lucide-react";

interface NotificationChain {
  id: string;
  client: string; // Nom formaté pour l'affichage
  clientId: string | null; // ID réel pour la modification
  titre: string;
  date: string; // Affichage formaté
  scheduledDate: string; // ISO brut pour l'édition
  statut: string;
  creeeLe: string;
  modifieLe: string; // Ajouté
  creePar: string;
  sendSMS: boolean;
  sendEmail: boolean;
  daysBefore: number;
  message: string;
  orderId: string | null;
  orderReference: string | null;
  isSent: boolean;
  sentAt: string | null;
  failureReason: string | null;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function ChainesNotificationPage() {
  const [chains, setChains] = useState<NotificationChain[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChain, setEditingChain] = useState<NotificationChain | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filtres
  const [selectedClient, setSelectedClient] = useState("tous-clients");
  const [selectedStatus, setSelectedStatus] = useState("tous-statuts");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination
  const [limit, setLimit] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Formulaire
  const [formData, setFormData] = useState({
    title: "",
    clientId: "tous-clients",
    scheduledDate: "",
    scheduledTime: "08:00",
    sendSMS: "Oui",
    sendEmail: "Non",
    daysBefore: "1",
    status: "Actif",
    message: "",
  });

  useEffect(() => {
    loadChains();
    loadClients();
  }, [selectedClient, selectedStatus, searchTerm, limit, currentPage]);

  const loadChains = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClient !== "tous-clients") params.append("clientId", selectedClient);
      if (selectedStatus !== "tous-statuts") params.append("status", selectedStatus);
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`/api/pdg/notifications/chaine?${params}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error("Erreur de chargement");

      const data = await response.json();
      setChains(data.chains || []);
      setTotalItems(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des chaînes");
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch("/api/users?role=CLIENT");
      if (!response.ok) throw new Error("Erreur de chargement");

      const data = await response.json();
      setClients(data.users || []);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleOpenModal = (chain?: NotificationChain, viewOnly = false) => {
    setIsViewOnly(viewOnly);
    if (chain) {
      setEditingChain(chain);
      // Extraire la date et l'heure
      const dateObj = new Date(chain.scheduledDate || chain.date);
      const dateStr = isNaN(dateObj.getTime()) ? "" : dateObj.toISOString().split('T')[0];
      const timeStr = isNaN(dateObj.getTime()) ? "08:00" : dateObj.toTimeString().slice(0, 5);
      
      setFormData({
        title: chain.titre,
        clientId: chain.clientId || "tous-clients",
        scheduledDate: dateStr,
        scheduledTime: timeStr,
        sendSMS: chain.sendSMS ? "Oui" : "Non",
        sendEmail: chain.sendEmail ? "Oui" : "Non",
        daysBefore: chain.daysBefore.toString(),
        status: chain.statut,
        message: chain.message,
      });
    } else {
      setEditingChain(null);
      setFormData({
        title: "",
        clientId: "tous-clients",
        scheduledDate: "",
        scheduledTime: "08:00",
        sendSMS: "Oui",
        sendEmail: "Non",
        daysBefore: "1",
        status: "Actif",
        message: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      if (!formData.title || !formData.scheduledDate || !formData.message) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      const payload = {
        ...formData,
        scheduledDate: `${formData.scheduledDate}T${formData.scheduledTime}`,
      };

      const url = "/api/pdg/notifications/chaine";
      const method = editingChain ? "PUT" : "POST";
      const body = editingChain ? { ...payload, id: editingChain.id } : payload;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Erreur lors de l'enregistrement");

      toast.success(
        editingChain
          ? "Chaîne modifiée avec succès"
          : "Chaîne créée avec succès"
      );
      setIsModalOpen(false);
      loadChains();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette chaîne ?")) return;

    try {
      const response = await fetch(`/api/pdg/notifications/chaine?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      toast.success("Chaîne supprimée avec succès");
      loadChains();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Les chaînes de notification</h1>
          <p className="text-sm text-gray-500">Gérez et suivez l'envoi de vos notifications automatiques</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Chaîne +
          </Button>
        </div>
      </div>

      {/* Filtres et Affichage */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-32">
            <Label>Afficher</Label>
            <div className="flex items-center gap-2">
              <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 50, 100, 300].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500 whitespace-nowrap">éléments</span>
            </div>
          </div>

          <div className="w-full md:w-64">
            <Label>Tous les clients</Label>
            <Select value={selectedClient} onValueChange={(v) => { setSelectedClient(v); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous-clients">Tous les clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <Label>Tous les statuts</Label>
            <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous-statuts">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full md:w-64">
          <Label>Rechercher</Label>
          <div className="relative">
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pr-8"
            />
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : chains.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune chaîne de notification trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Créé par</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modifié le</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {chains.map((chain) => (
                  <tr key={chain.id} className="hover:bg-gray-50 transition-colors border-b last:border-0 group">
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-gray-900">{chain.client}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-medium">{chain.titre}</td>
                    <td className="px-4 py-3 text-[11px] text-gray-600 leading-tight">{chain.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
                          chain.statut === "Actif"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {chain.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-500">{chain.creeeLe}</td>
                    <td className="px-4 py-3 text-[11px] text-gray-700 font-medium">{chain.creePar}</td>
                    <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">{chain.modifieLe}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md">
                      <div className="line-clamp-2 text-xs leading-relaxed italic text-gray-500" title={chain.message}>
                        {chain.message}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenModal(chain)}
                          className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-md transition-all opacity-70 group-hover:opacity-100"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(chain.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all opacity-70 group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && chains.length > 0 && (
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">
            Affichage de <span className="font-semibold">{Math.min((currentPage - 1) * limit + 1, totalItems)}</span> à <span className="font-semibold">{Math.min(currentPage * limit, totalItems)}</span> sur <span className="font-semibold">{totalItems}</span> éléments
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>

            <div className="flex gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 p-0 ${currentPage === pageNum ? "bg-indigo-600" : ""}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 px-2"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0 border-none">
          <DialogHeader className="p-6 bg-gray-50 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              {isViewOnly ? <Eye className="w-5 h-5 text-yellow-500" /> : editingChain ? <Pencil className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
              {isViewOnly ? "Détails de la chaîne" : editingChain ? "Modifier la chaîne" : "Nouvelle chaîne de notification"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold flex items-center gap-2">Titre :</Label>
                <Input
                  id="title"
                  placeholder="Titre de la chaîne"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-50"
                  disabled={isViewOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client" className="font-semibold flex items-center gap-2">Client :</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  disabled={isViewOnly}
                >
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="Sélectionnez le client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous-clients">Tous les clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="font-semibold flex items-center gap-2">Date :</Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="bg-gray-50 pl-10"
                    disabled={isViewOnly}
                  />
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="font-semibold flex items-center gap-2">Heure :</Label>
                <div className="relative">
                  <Input
                    id="time"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="bg-gray-50 pl-10"
                    disabled={isViewOnly}
                  />
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sms" className="font-semibold flex items-center gap-2">Envoyé un SMS :</Label>
                <Select
                  value={formData.sendSMS}
                  onValueChange={(value) => setFormData({ ...formData, sendSMS: value })}
                  disabled={isViewOnly}
                >
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold flex items-center gap-2">Envoyé un Mail :</Label>
                <Select
                  value={formData.sendEmail}
                  onValueChange={(value) => setFormData({ ...formData, sendEmail: value })}
                  disabled={isViewOnly}
                >
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="daysBefore" className="font-semibold flex items-center gap-2">Nombre de jours avant :</Label>
                <div className="flex h-10 w-full rounded-md border border-input bg-gray-50">
                  <input
                    id="daysBefore"
                    type="number"
                    min="0"
                    value={formData.daysBefore}
                    onChange={(e) => setFormData({ ...formData, daysBefore: e.target.value })}
                    className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
                    disabled={isViewOnly}
                  />
                  <div className="bg-gray-100 px-3 flex items-center justify-center border-l text-xs font-medium text-gray-500 rounded-r-md">
                    Jour(s)
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="font-semibold flex items-center gap-2">Statut :</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={isViewOnly}
                >
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="font-semibold flex items-center gap-2">Message à envoyer :</Label>
              <Textarea
                id="message"
                placeholder="Saisissez le message..."
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-gray-50 resize-none"
                disabled={isViewOnly}
              />
            </div>
          </div>

          <DialogFooter className="p-6 bg-gray-50 border-t flex items-center justify-end gap-3">
            {!isViewOnly && (
              <Button 
                onClick={handleSubmit} 
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-6 min-w-[140px]"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2 px-6"
            >
              <X className="w-4 h-4" />
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
