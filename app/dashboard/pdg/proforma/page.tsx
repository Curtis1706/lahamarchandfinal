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
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Plus, Filter, Calendar, Printer, Download, Search, X } from "lucide-react";

interface Work {
  id: string;
  title: string;
  isbn: string;
  price: number;
  stock: number;
  discipline?: {
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface ProformaItem {
  workId: string;
  livre: string;
  prix: number;
  quantite: number;
  montant: number;
}

interface Proforma {
  id: string;
  reference?: string;
  clientId?: string;
  partnerId?: string;
  client?: User;
  partner?: User;
  items: ProformaItem[];
  total: number;
  status: string;
  createdAt: string;
}

export default function ProformaPage() {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Formulaire de création
  const [selectedClient, setSelectedClient] = useState("");
  const [items, setItems] = useState<ProformaItem[]>([]);
  const [selectedLivre, setSelectedLivre] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [commandType, setCommandType] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [worksData, usersData, proformasData] = await Promise.all([
        apiClient.getWorks({ status: 'PUBLISHED' }),
        apiClient.getUsers(),
        apiClient.getPDGProformas().catch(() => ({ proformas: [] }))
      ]);
      
      setWorks(Array.isArray(worksData) ? worksData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      
      // Utiliser les proformas depuis l'API
      if (proformasData && Array.isArray(proformasData.proformas || proformasData)) {
        const proformas = Array.isArray(proformasData.proformas) ? proformasData.proformas : proformasData;
        setProformas(proformas.map((pf: any) => ({
          id: pf.id,
          reference: pf.reference,
          clientId: pf.userId,
          partnerId: pf.partnerId,
          client: pf.user || null,
          partner: pf.partner || null,
          items: (pf.items || []).map((item: any) => ({
            workId: item.workId,
            livre: item.work?.title || 'N/A',
            prix: item.unitPrice || item.price || 0,
            quantite: item.quantity || 0,
            montant: item.total || (item.unitPrice || item.price || 0) * (item.quantity || 0)
          })),
          total: pf.total,
          status: pf.status,
          createdAt: pf.createdAt
        })));
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedLivre || !quantity || !price) {
      toast.error("Sélectionnez un livre, saisissez une quantité et un prix");
      return;
    }

    const work = works.find(w => w.id === selectedLivre);
    if (!work) return;

    const unitPrice = parseFloat(price);
    const qty = parseInt(quantity);
    
    if (qty <= 0) {
      toast.error("La quantité doit être supérieure à 0");
      return;
    }

    if (unitPrice <= 0) {
      toast.error("Le prix doit être supérieur à 0");
      return;
    }

    const newItem: ProformaItem = {
      workId: work.id,
      livre: work.title,
      prix: unitPrice,
      quantite: qty,
      montant: unitPrice * qty
    };

    setItems([...items, newItem]);
    setSelectedLivre("");
    setQuantity("");
    setPrice("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateProforma = async () => {
    if (!selectedClient) {
      toast.error("Sélectionnez un client ou partenaire");
      return;
    }

    if (items.length === 0) {
      toast.error("Ajoutez au moins un livre au proforma");
      return;
    }

    try {
      const selectedUser = users.find(u => u.id === selectedClient);
      const isPartner = selectedUser?.role === 'PARTENAIRE';
      
      const proformaItems = items.map(item => ({
        workId: item.workId,
        quantity: item.quantite,
        unitPrice: item.prix
      }));

      await apiClient.createProforma({
        [isPartner ? 'partnerId' : 'userId']: selectedClient,
        items: proformaItems,
        notes: promoCode || undefined,
        deliveryZone: commandType || undefined
      });

      toast.success("Proforma créé avec succès");
      setShowCreateModal(false);
      setSelectedClient("");
      setItems([]);
      setPromoCode("");
      setCommandType("");
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast.error(error.message || "Erreur lors de la création du proforma");
    }
  };

  const handleDownloadPDF = async (proformaId: string) => {
    try {
      const response = await fetch(`/api/pdg/proforma/${proformaId}/pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proforma-${proformaId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("PDF téléchargé avec succès");
    } catch (error: any) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      toast.error(error.message || "Erreur lors du téléchargement du PDF");
    }
  };

  const handlePrint = async (proformaId: string) => {
    try {
      const response = await fetch(`/api/pdg/proforma/${proformaId}/pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast.success("Ouverture de l'impression...");
    } catch (error: any) {
      console.error('Erreur lors de l\'impression:', error);
      toast.error(error.message || "Erreur lors de l'impression");
    }
  };

  const total = items.reduce((sum, item) => sum + item.montant, 0);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'SENT': 'Envoyé',
      'AWAITING_RESPONSE': 'En attente de réponse',
      'ACCEPTED': 'Accepté',
      'REJECTED': 'Rejeté',
      'CONVERTED': 'Converti',
      'CANCELLED': 'Annulé'
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string): "default" | "outline" | "secondary" | "destructive" => {
    if (status === 'ACCEPTED' || status === 'CONVERTED') return 'default';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'destructive';
    return 'outline';
  };

  const filteredProformas = proformas.filter(proforma => {
    const matchesStatus = statusFilter === "all" || proforma.status === statusFilter;
    const recipient = proforma.partner || proforma.client;
    const matchesSearch = searchTerm === "" || 
      (recipient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipient?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proforma.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      proforma.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredProformas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProformas = filteredProformas.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des proformas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Proforma</h2>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Header with filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Filter className="w-4 h-4" />
              Filtre compte
            </Button>

            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 ml-auto">
                  Etablir un Proforma
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Facture Proforma</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Client Selection */}
                  <div>
                    <Label>Sélectionner le client *</Label>
                    <Select
                      value={selectedClient}
                      onValueChange={setSelectedClient}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.role === 'CLIENT' || u.role === 'PARTENAIRE').map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Book and Quantity */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Choix du livre *</Label>
                      <Select
                        value={selectedLivre}
                        onValueChange={setSelectedLivre}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un livre" />
                        </SelectTrigger>
                        <SelectContent>
                          {works.map(work => (
                            <SelectItem key={work.id} value={work.id}>
                              {work.title} - Stock: {work.stock}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Prix unitaire (F CFA) *</Label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="100"
                      />
                    </div>

                    <div>
                      <Label>Quantité *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0"
                          min="1"
                        />
                        <Button
                          onClick={handleAddItem}
                          className="bg-indigo-600 hover:bg-indigo-700"
                          disabled={!selectedLivre || !quantity || !price}
                        >
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Livre
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Prix
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Quantité
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Montant
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                              Aucun livre ajouté
                            </td>
                          </tr>
                        ) : (
                          items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-3 text-sm">{item.livre}</td>
                              <td className="px-4 py-3 text-sm">{item.prix} F CFA</td>
                              <td className="px-4 py-3 text-sm">
                                {item.quantite}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {item.montant} F CFA
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-semibold">Total: {total} F CFA</p>
                  </div>

                  {/* Promo Code and Command Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Code promo</Label>
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="CODE PROMO"
                        />
                        <Button variant="outline">Appliquer</Button>
                      </div>
                    </div>

                    <div>
                      <Label>Type de commande</Label>
                      <Select
                        value={commandType}
                        onValueChange={setCommandType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Commande pour la rentrée scolaire" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rentree">
                            Commande pour la rentrée scolaire
                          </SelectItem>
                          <SelectItem value="urgente">
                            Commande urgente
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Fermer
                    </Button>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={handleCreateProforma}
                    >
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Date Range and Status Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En cours</SelectItem>
                <SelectItem value="VALIDATED">Validé</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline"
              onClick={loadData}
            >
              Actualiser
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(parseInt(v))}>
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
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Référence
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Nbr. livre
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Demandé par
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Fait le
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Total
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProformas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        Aucune donnée disponible dans le tableau
                      </td>
                    </tr>
                  ) : (
                    paginatedProformas.map((proforma) => {
                      const recipient = proforma.partner || proforma.client;
                      return (
                        <tr key={proforma.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{proforma.reference || proforma.id.slice(0, 12)}</td>
                        <td className="py-3 px-4">{proforma.items.length}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{recipient?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{recipient?.email || ''}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(proforma.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusVariant(proforma.status)}>
                            {getStatusLabel(proforma.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {proforma.total.toLocaleString()} F CFA
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePrint(proforma.id)}
                              title="Imprimer"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadPDF(proforma.id)}
                              title="Télécharger PDF"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredProformas.length)} sur {filteredProformas.length} éléments
              </span>
              <div className="flex gap-2">
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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

          {/* Export Buttons */}
          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" className="bg-[#6967CE] text-white">
              PDF
            </Button>
            <Button variant="outline" className="bg-[#6967CE] text-white">
              EXCEL
            </Button>
            <Button variant="outline">
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
