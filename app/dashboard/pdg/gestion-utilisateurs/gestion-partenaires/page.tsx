"use client";

import { useState, useEffect } from "react";
;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Eye, 
  CheckCircle,
  XCircle,
  AlertTriangle, 
  Trash2, 
  Building2,
  User,
  Calendar,
  TrendingUp,
  BarChart3,
  FileText,
  Edit,
  Users,
  DollarSign,
  Package,
  MapPin,
  Phone,
  Mail,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Partner {
  id: string;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  contact?: string;
  website?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    role: string;
    createdAt: string;
  };
  representant?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  _count: {
    orders: number;
  };
}

interface PartnerStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function GestionPartenairesPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [representants, setRepresentants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [partnerStats, setPartnerStats] = useState<PartnerStats>({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newRepresentantId, setNewRepresentantId] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);

  // Charger les données
  useEffect(() => {
    fetchPartners();
    fetchRepresentants();
  }, [currentPage, searchTerm, typeFilter, statusFilter]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      });

      if (searchTerm) params.append("search", searchTerm);
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const response = await fetch(`/api/partners?${params}`);
      const data = await response.json();

      if (response.ok) {
        // Vérifier que les données sont présentes et dans le bon format
        const partnersList = Array.isArray(data.partners) ? data.partners : (data.partners || []);
        const pagination = data.pagination || { pages: 1, total: 0 };
        
        setPartners(partnersList);
        setTotalPages(pagination.pages || 1);

        // Calculer les statistiques avec vérifications de sécurité
        const total = partnersList.length;
        const active = partnersList.filter((partner: Partner) => partner?.user?.status === "ACTIVE").length;
        const pending = partnersList.filter((partner: Partner) => partner?.user?.status === "PENDING").length;
        const suspended = partnersList.filter((partner: Partner) => partner?.user?.status === "SUSPENDED").length;
        const totalOrders = partnersList.reduce((sum: number, partner: Partner) => {
          return sum + (partner?._count?.orders || 0);
        }, 0);

        // Calculer le chiffre d'affaires (simulation)
        const totalRevenue = totalOrders * 150000; // Estimation moyenne de 150000 FCFA par commande

        setPartnerStats({ total, active, pending, suspended, totalOrders, totalRevenue });
      } else {
        toast.error(data.error || "Erreur lors du chargement des partenaires");
        setPartners([]);
        setPartnerStats({ total: 0, active: 0, pending: 0, suspended: 0, totalOrders: 0, totalRevenue: 0 });
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Erreur lors du chargement des partenaires");
    } finally {
      setLoading(false);
    }
  };

  const fetchRepresentants = async () => {
    try {
      const response = await fetch("/api/users?role=REPRESENTANT");
      const data = await response.json();

      if (response.ok) {
        // L'API retourne un objet avec une propriété 'users', pas directement un tableau
        const users = Array.isArray(data) ? data : (data.users || []);
        setRepresentants(users.filter((user: any) => user.status === "ACTIVE"));
      }
    } catch (error) {
      console.error("Error fetching representants:", error);
      setRepresentants([]); // S'assurer que representants est toujours un tableau
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "En attente", variant: "secondary" as const },
      APPROVED: { label: "Approuvé", variant: "default" as const },
      REJECTED: { label: "Rejeté", variant: "destructive" as const },
      ACTIVE: { label: "Actif", variant: "default" as const },
      INACTIVE: { label: "Inactif", variant: "secondary" as const },
      SUSPENDED: { label: "Suspendu", variant: "destructive" as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const
    };

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      "LIBRAIRIE": { label: "Librairie", variant: "secondary" as const },
      "DISTRIBUTEUR": { label: "Distributeur", variant: "outline" as const },
      "PARTENAIRE": { label: "Partenaire", variant: "default" as const }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || {
      label: type,
      variant: "secondary" as const
    };

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const handleStatusChange = async () => {
    if (!selectedPartner || !newStatus) return;

    try {
      const response = await fetch("/api/partners", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: selectedPartner.id,
          status: newStatus,
          reason: newReason || null,
          representantId: (newRepresentantId && newRepresentantId !== "none") ? newRepresentantId : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Statut du partenaire modifié en ${newStatus}`);
        fetchPartners();
        setIsStatusDialogOpen(false);
        setNewStatus("");
        setNewReason("");
        setNewRepresentantId("");
        setSelectedPartner(null);
      } else {
        toast.error(data.error || "Erreur lors de la modification du statut");
      }
    } catch (error) {
      console.error("Error updating partner status:", error);
      toast.error("Erreur lors de la modification du statut");
    }
  };

  const handleDeletePartner = async () => {
    if (!partnerToDelete) return;

    try {
      const response = await fetch(`/api/partners?id=${partnerToDelete.id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Partenaire supprimé avec succès");
        fetchPartners();
        setIsDeleteDialogOpen(false);
        setPartnerToDelete(null);
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
          <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{partnerStats.total}</p>
                </div>
          </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
          <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Actifs</p>
                  <p className="text-2xl font-bold">{partnerStats.active}</p>
          </div>
        </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold">{partnerStats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Suspendus</p>
                  <p className="text-2xl font-bold">{partnerStats.suspended}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Commandes</p>
                  <p className="text-2xl font-bold">{partnerStats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">CA Estimé</p>
                  <p className="text-2xl font-bold">{partnerStats.totalRevenue.toFixed(0)} FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="partners" className="space-y-4">
          <TabsList>
            <TabsTrigger value="partners">Gestion des Partenaires</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
          </TabsList>

          <TabsContent value="partners" className="space-y-4">
            {/* Filtres et recherche */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Filtres et Recherche</span>
                  <Button onClick={fetchPartners} variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Rechercher</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
                        id="search"
                        placeholder="Nom du partenaire, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
                        <SelectItem value="ALL">Tous les types</SelectItem>
                        <SelectItem value="LIBRAIRIE">Librairie</SelectItem>
                        <SelectItem value="DISTRIBUTEUR">Distributeur</SelectItem>
                        <SelectItem value="PARTENAIRE">Partenaire</SelectItem>
            </SelectContent>
          </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
                        <SelectItem value="ALL">Tous les statuts</SelectItem>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="APPROVED">Approuvé</SelectItem>
                        <SelectItem value="ACTIVE">Actif</SelectItem>
                        <SelectItem value="INACTIVE">Inactif</SelectItem>
                        <SelectItem value="SUSPENDED">Suspendu</SelectItem>
            </SelectContent>
          </Select>
        </div>
                </div>
            </CardContent>
          </Card>

            {/* Table des partenaires */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des Partenaires</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
        ) : (
          <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partenaire</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Représentant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Commandes</TableHead>
                          <TableHead>Inscription</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partners.map((partner) => (
                          <TableRow key={partner.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{partner.name}</div>
                                {partner.email && (
                                  <div className="text-sm text-gray-500">{partner.email}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(partner.type)}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm">{partner.user?.name || "N/A"}</div>
                                {partner.user?.phone && (
                                  <div className="text-xs text-gray-500">{partner.user.phone}</div>
                                )}
                      </div>
                            </TableCell>
                            <TableCell>
                              {partner.representant ? (
                                <div className="space-y-1">
                                  <div className="text-sm">{partner.representant.name}</div>
                                  <div className="text-xs text-gray-500">{partner.representant.email}</div>
                        </div>
                              ) : (
                                <span className="text-gray-500 text-sm">Non assigné</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(partner.user?.status || "INACTIVE")}</TableCell>
                            <TableCell>
                            <div className="flex items-center space-x-1">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span>{partner._count?.orders || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(partner.createdAt), "dd/MM/yyyy", { locale: fr })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPartner(partner);
                                    setIsDetailsOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPartner(partner);
                                    setNewStatus("");
                                    setNewReason("");
                                    setNewRepresentantId(partner.representant?.id || "");
                                    setIsStatusDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                            </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Page {currentPage} sur {totalPages}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Suivant
                          </Button>
                            </div>
                          </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Répartition par type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Répartition par type</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      partners.reduce((acc, partner) => {
                        acc[partner.type] = (acc[partner.type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {getTypeBadge(type)}
                          <span className="font-medium">{type}</span>
                        </div>
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                            </div>
                </CardContent>
              </Card>

              {/* Répartition par statut */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Répartition par statut</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Actifs</span>
                      </div>
                      <span className="font-bold text-green-600">{partnerStats.active}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">En attente</span>
                      </div>
                      <span className="font-bold text-yellow-600">{partnerStats.pending}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium">Suspendus</span>
                      </div>
                      <span className="font-bold text-red-600">{partnerStats.suspended}</span>
                            </div>
                          </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog de détails du partenaire */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du partenaire</DialogTitle>
            </DialogHeader>
            {selectedPartner && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Nom du partenaire</Label>
                    <p>{selectedPartner.name}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Type</Label>
                    <div>{getTypeBadge(selectedPartner.type)}</div>
                  </div>
                  <div>
                    <Label className="font-medium">Statut</Label>
                    <div>{getStatusBadge(selectedPartner.user.status)}</div>
                            </div>
                  <div>
                    <Label className="font-medium">Commandes</Label>
                    <p>{selectedPartner._count.orders}</p>
                            </div>
                          </div>
                          
                <div>
                  <Label className="font-medium">Contact principal</Label>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{selectedPartner.user.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{selectedPartner.user.email}</span>
                          </div>
                    {selectedPartner.user.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{selectedPartner.user.phone}</span>
                        </div>
                    )}
                      </div>
                    </div>
                    
                {selectedPartner.address && (
                  <div>
                    <Label className="font-medium">Adresse</Label>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 mt-1" />
                      <p>{selectedPartner.address}</p>
                    </div>
                  </div>
                )}

                {selectedPartner.website && (
                  <div>
                    <Label className="font-medium">Site web</Label>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <a
                        href={selectedPartner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectedPartner.website}
                      </a>
                    </div>
                  </div>
                )}

                {selectedPartner.representant && (
                  <div>
                    <Label className="font-medium">Représentant assigné</Label>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{selectedPartner.representant.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{selectedPartner.representant.email}</span>
                      </div>
                      {selectedPartner.representant.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedPartner.representant.phone}</span>
          </div>
        )}
      </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Date d'inscription</Label>
                    <p>{format(new Date(selectedPartner.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Dernière mise à jour</Label>
                    <p>{format(new Date(selectedPartner.updatedAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                  </div>
                </div>

                {selectedPartner.description && (
                  <div>
                    <Label className="font-medium">Description</Label>
                    <p className="text-sm text-gray-600">{selectedPartner.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de modification du statut */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le partenaire</DialogTitle>
            </DialogHeader>
            {selectedPartner && (
              <div className="space-y-4">
      <div>
                  <Label className="font-medium">Partenaire</Label>
                  <p className="text-sm text-gray-600">{selectedPartner.name}</p>
      </div>
      
      <div>
                  <Label htmlFor="newStatus">Statut</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
          <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
          </SelectTrigger>
          <SelectContent>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="APPROVED">Approuvé</SelectItem>
                      <SelectItem value="ACTIVE">Actif</SelectItem>
                      <SelectItem value="INACTIVE">Inactif</SelectItem>
                      <SelectItem value="SUSPENDED">Suspendu</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
                  <Label htmlFor="reason">Raison (optionnel)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Raison du changement de statut..."
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    rows={3}
        />
      </div>
      
      <div>
                  <Label htmlFor="representant">Représentant</Label>
                  <Select value={newRepresentantId} onValueChange={setNewRepresentantId}>
          <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un représentant" />
          </SelectTrigger>
          <SelectContent>
                      <SelectItem value="none">Aucun représentant</SelectItem>
                      {representants.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id}>
                          {rep.name} ({rep.email})
                        </SelectItem>
                      ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
          Annuler
        </Button>
                  <Button onClick={handleStatusChange} disabled={!newStatus}>
                    Modifier
        </Button>
      </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de suppression */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le partenaire</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le partenaire "{partnerToDelete?.name}" ?
                Cette action est irréversible et ne peut être effectuée que si le partenaire n'a pas de commandes associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePartner}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}