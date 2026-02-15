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
import { Pencil, Trash2, Plus } from "lucide-react";

interface NotificationChain {
  id: string;
  client: string;
  titre: string;
  date: string;
  statut: string;
  creeeLe: string;
  creePar: string;
  sendSMS: boolean;
  sendEmail: boolean;
  daysBefore: number;
  message: string;
  orderId: string | null;
  orderReference: string | null;
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
  
  // Filtres
  const [selectedClient, setSelectedClient] = useState("tous-clients");
  const [selectedStatus, setSelectedStatus] = useState("tous-statuts");
  const [searchTerm, setSearchTerm] = useState("");

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
  }, [selectedClient, selectedStatus, searchTerm]);

  const loadChains = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClient !== "tous-clients") params.append("clientId", selectedClient);
      if (selectedStatus !== "tous-statuts") params.append("status", selectedStatus);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/pdg/notifications/chaine?${params}`);
      if (!response.ok) throw new Error("Erreur de chargement");

      const data = await response.json();
      setChains(data.chains || []);
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

  const handleOpenModal = (chain?: NotificationChain) => {
    if (chain) {
      setEditingChain(chain);
      // Extraire la date et l'heure
      const dateObj = new Date(chain.date);
      const dateStr = dateObj.toISOString().split('T')[0];
      const timeStr = dateObj.toTimeString().slice(0, 5);
      
      setFormData({
        title: chain.titre,
        clientId: chain.client || "tous-clients",
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
        <h1 className="text-2xl font-bold">Les chaînes de notification</h1>
        <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Chaîne +
        </Button>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label>Tous les clients</Label>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
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

        <div>
          <Label>Tous les statuts</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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

        <div>
          <Label>Rechercher</Label>
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé le</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé par</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {chains.map((chain) => (
                  <tr key={chain.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{chain.client}</td>
                    <td className="px-4 py-3 text-sm font-medium">{chain.titre}</td>
                    <td className="px-4 py-3 text-sm">{chain.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          chain.statut === "Actif"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {chain.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{chain.creeeLe}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{chain.creePar}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {chain.message}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(chain)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(chain.id)}
                          className="text-red-600 hover:text-red-800"
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

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChain ? "Modifier la chaîne" : "Les chaînes de notification"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  placeholder="Titre de la chaîne"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="time">Heure *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sms">Envoyé via SMS</Label>
                <Select
                  value={formData.sendSMS}
                  onValueChange={(value) => setFormData({ ...formData, sendSMS: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email">Envoyé via Mail</Label>
                <Select
                  value={formData.sendEmail}
                  onValueChange={(value) => setFormData({ ...formData, sendEmail: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daysBefore">Nombre de jours avant</Label>
                <Input
                  id="daysBefore"
                  type="number"
                  min="0"
                  value={formData.daysBefore}
                  onChange={(e) => setFormData({ ...formData, daysBefore: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message à envoyer *</Label>
              <Textarea
                id="message"
                placeholder="Saisissez le message..."
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
            <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
