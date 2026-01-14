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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Filter,
  Upload,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  phone: string;
  type: string;
  city?: string;
  departement?: string;
  status: string;
  createdAt: string;
  dette: number;
  email?: string;
  address?: string;
  contact?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrder?: string | null;
  notes?: string;
}

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    type: "particulier",
    contact: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    departement: "",
    notes: "",
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/representant/clients");
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const data = await response.json();
      
      // Ajouter le champ dette depuis l'API (si disponible) ou utiliser 0
      const clientsWithDette = data.clients.map((client: any) => ({
        ...client,
        dette: client.dette || 0,
        createdAt: client.createdAt || new Date().toISOString(),
      }));
      
      setClients(clientsWithDette);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des clients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async () => {
    try {
      if (!formData.name || !formData.type) {
        toast({
          title: "Erreur",
          description: "Le nom et le type sont requis",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/representant/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          contact: formData.contact,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          departement: formData.departement,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      toast({
        title: "Succès",
        description: "Client créé avec succès",
      });

      setShowCreateModal(false);
      resetForm();
      loadClients();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du client",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/representant/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast({
        title: "Succès",
        description: "Client supprimé avec succès",
      });

      loadClients();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du client",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "particulier",
      contact: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      departement: "",
      notes: "",
    });
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      type: client.type.toLowerCase(),
      contact: client.contact || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      departement: client.departement || "",
      notes: client.notes || "",
    });
    setShowEditModal(true);
  };

  const openViewModal = (client: Client) => {
    setSelectedClient(client);
    setShowViewModal(true);
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesType = typeFilter === "all" || client.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Actif":
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case "En attente":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEE d MMM yyyy HH:mm", { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Clients</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Clients
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Header with actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Filter className="w-4 h-4" />
              Filtre
            </Button>

            <div className="flex gap-2">
              <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                  >
                    Importer
                    <Upload className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importer un fichier</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Fichier excel :</Label>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline">Choisir un fichier</Button>
                        <span className="text-sm text-gray-500 self-center">
                          Aucun fichier choisi
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-blue-600">
                      Télécharger le modèle du fichier{" "}
                      <a href="#" className="underline">
                        ici
                      </a>
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => setShowImportModal(false)}
                        variant="outline"
                      >
                        Fermer
                      </Button>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        Exécuter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                    onClick={resetForm}
                  >
                    Client
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Ajouter un client</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Type de client :</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Particulier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Particulier">Particulier</SelectItem>
                          <SelectItem value="École">École</SelectItem>
                          <SelectItem value="Auteur">Auteur</SelectItem>
                          <SelectItem value="Concepteur">Concepteur</SelectItem>
                          <SelectItem value="Ecole contractuelle">Ecole contractuelle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Nom complet :</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Nom complet"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Département :</Label>
                        <Select
                          value={formData.departement}
                          onValueChange={(value) =>
                            setFormData({ ...formData, departement: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Aucun" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ATLANTIQUE">ATLANTIQUE</SelectItem>
                            <SelectItem value="LITTORAL">LITTORAL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Email :</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Téléphone :</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+229 XX XX XX XX"
                        />
                      </div>
                      <div>
                        <Label>Personne de contact :</Label>
                        <Input
                          value={formData.contact}
                          onChange={(e) =>
                            setFormData({ ...formData, contact: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Adresse :</Label>
                      <Textarea
                        rows={3}
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label>Ville :</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label>Notes :</Label>
                      <Textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => setShowCreateModal(false)}
                        variant="outline"
                      >
                        Fermer
                      </Button>
                      <Button
                        onClick={handleCreateClient}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, téléphone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="Particulier">Particulier</SelectItem>
                  <SelectItem value="École">École</SelectItem>
                  <SelectItem value="Auteur">Auteur</SelectItem>
                  <SelectItem value="Concepteur">Concepteur</SelectItem>
                  <SelectItem value="Ecole contractuelle">Ecole contractuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="20">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        NOM
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        TÉLÉPHONE
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        TYPE
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        DÉPARTEMENT
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        STATUT
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        CRÉÉ LE <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        DETTE
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          {isLoading ? "Chargement..." : "Aucun client trouvé"}
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => (
                        <tr key={client.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                              <span className="font-medium">{client.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">{client.phone}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{client.type}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm">{client.departement || "-"}</td>
                          <td className="py-3 px-4">{getStatusBadge(client.status)}</td>
                          <td className="py-3 px-4 text-sm">
                            {formatDate(client.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {client.dette?.toLocaleString("fr-FR") || 0} FCFA
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(client)}
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadClients()}
                                title="Actualiser"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openViewModal(client)}
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 bg-transparent hover:bg-red-50"
                                onClick={() => handleDeleteClient(client.id)}
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Affichage de 1 à {filteredClients.length} sur {filteredClients.length} éléments
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du client</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom</Label>
                  <p className="font-semibold">{selectedClient.name}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p>{selectedClient.type}</p>
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <p>{selectedClient.phone || "-"}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p>{selectedClient.email || "-"}</p>
                </div>
                <div>
                  <Label>Département</Label>
                  <p>{selectedClient.departement || "-"}</p>
                </div>
                <div>
                  <Label>Ville</Label>
                  <p>{selectedClient.city || "-"}</p>
                </div>
                <div>
                  <Label>Statut</Label>
                  <div>{getStatusBadge(selectedClient.status)}</div>
                </div>
                <div>
                  <Label>Dette</Label>
                  <p className="font-semibold text-red-600">
                    {selectedClient.dette?.toLocaleString("fr-FR") || 0} FCFA
                  </p>
                </div>
                <div>
                  <Label>Commandes totales</Label>
                  <p>{selectedClient.totalOrders || 0}</p>
                </div>
                <div>
                  <Label>Total dépensé</Label>
                  <p>{selectedClient.totalSpent?.toLocaleString("fr-FR") || 0} FCFA</p>
                </div>
              </div>
              {selectedClient.address && (
                <div>
                  <Label>Adresse</Label>
                  <p>{selectedClient.address}</p>
                </div>
              )}
              {selectedClient.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-gray-600">{selectedClient.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal - TODO: Implement edit functionality */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              La fonctionnalité de modification sera implémentée prochainement.
            </p>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="outline"
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
