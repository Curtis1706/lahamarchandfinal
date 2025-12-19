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
import { Label } from "@/components/ui/label";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Users,
  Package,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  BarChart3,
  FileText,
  TrendingUp,
  Building2,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface School {
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

interface SchoolStats {
  total: number;
  active: number;
  pending: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function GestionEcolesPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [representants, setRepresentants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [schoolStats, setSchoolStats] = useState<SchoolStats>({
    total: 0,
    active: 0,
    pending: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newRepresentantId, setNewRepresentantId] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [newSchoolData, setNewSchoolData] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    representantId: "",
    userData: {
      name: "",
      email: "",
      phone: "",
      password: ""
    }
  });

  // Charger les données
  useEffect(() => {
    fetchSchools();
    fetchRepresentants();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        type: "école" // Filtrer uniquement les écoles
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const response = await fetch(`/api/partners?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSchools(data.partners);
        setTotalPages(data.pagination.pages);

        // Calculer les statistiques pour les écoles
        const total = data.partners.length;
        const active = data.partners.filter((school: School) => school.user.status === "ACTIVE").length;
        const pending = data.partners.filter((school: School) => school.user.status === "PENDING").length;
        const totalOrders = data.partners.reduce((sum: number, school: School) => sum + school._count.orders, 0);

        // Calculer le chiffre d'affaires (simulation)
        const totalRevenue = totalOrders * 100000; // Estimation moyenne de 100000 FCFA par commande

        setSchoolStats({ total, active, pending, totalOrders, totalRevenue });
      } else {
        toast.error(data.error || "Erreur lors du chargement des écoles");
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
      toast.error("Erreur lors du chargement des écoles");
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

  const handleStatusChange = async () => {
    if (!selectedSchool || !newStatus) return;

    try {
      const response = await fetch("/api/partners", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: selectedSchool.id,
          status: newStatus,
          representantId: (newRepresentantId && newRepresentantId !== "none") ? newRepresentantId : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Statut de l'école modifié en ${newStatus}`);
        fetchSchools();
        setIsStatusDialogOpen(false);
        setNewStatus("");
        setNewRepresentantId("");
        setSelectedSchool(null);
      } else {
        toast.error(data.error || "Erreur lors de la modification du statut");
      }
    } catch (error) {
      console.error("Error updating school status:", error);
      toast.error("Erreur lors de la modification du statut");
    }
  };

  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return;

    try {
      const response = await fetch(`/api/partners?id=${schoolToDelete.id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("École supprimée avec succès");
        fetchSchools();
        setIsDeleteDialogOpen(false);
        setSchoolToDelete(null);
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting school:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleCreateSchool = async () => {
    // Validation
    if (!newSchoolData.name || !newSchoolData.contact || !newSchoolData.userData.name || 
        !newSchoolData.userData.email || !newSchoolData.userData.password) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSchoolData.userData.email)) {
      toast.error("Email invalide");
      return;
    }

    // Validation mot de passe (minimum 6 caractères)
    if (newSchoolData.userData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newSchoolData.name,
          type: "école", // Type fixe pour les écoles
          contact: newSchoolData.contact,
          email: newSchoolData.email || newSchoolData.userData.email,
          phone: newSchoolData.phone || newSchoolData.userData.phone || '',
          address: newSchoolData.address || '',
          website: newSchoolData.website || '',
          description: newSchoolData.description || '',
          representantId: newSchoolData.representantId && newSchoolData.representantId !== "none" ? newSchoolData.representantId : null,
          userData: {
            name: newSchoolData.userData.name,
            email: newSchoolData.userData.email,
            phone: newSchoolData.userData.phone || newSchoolData.phone || '',
            password: newSchoolData.userData.password
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("École créée avec succès");
        setShowAddSchoolModal(false);
        // Réinitialiser le formulaire
        setNewSchoolData({
          name: "",
          contact: "",
          email: "",
          phone: "",
          address: "",
          website: "",
          description: "",
          representantId: "",
          userData: {
            name: "",
            email: "",
            phone: "",
            password: ""
          }
        });
        fetchSchools();
      } else {
        toast.error(data.error || "Erreur lors de la création de l'école");
      }
    } catch (error) {
      console.error("Error creating school:", error);
      toast.error("Erreur lors de la création de l'école");
    }
  };

  return (
    <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Écoles</p>
                  <p className="text-2xl font-bold">{schoolStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Actives</p>
                  <p className="text-2xl font-bold">{schoolStats.active}</p>
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
                  <p className="text-2xl font-bold">{schoolStats.pending}</p>
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
                  <p className="text-2xl font-bold">{schoolStats.totalOrders}</p>
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
                  <p className="text-2xl font-bold">{schoolStats.totalRevenue.toFixed(0)} FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="schools" className="space-y-4">
          <TabsList>
            <TabsTrigger value="schools">Gestion des Écoles</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
          </TabsList>

          <TabsContent value="schools" className="space-y-4">
            {/* Filtres et recherche */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Filtres et Recherche</span>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowAddSchoolModal(true)} size="sm" className="bg-black hover:bg-gray-800">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une école
                    </Button>
                    <Button onClick={fetchSchools} variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Rechercher</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Nom de l'école, contact..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
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

            {/* Table des écoles */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des Écoles</CardTitle>
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
                          <TableHead>École</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Représentant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Commandes</TableHead>
                          <TableHead>Inscription</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schools.map((school) => (
                          <TableRow key={school.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{school.name}</div>
                                {school.email && (
                                  <div className="text-sm text-gray-500">{school.email}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm">{school.user.name}</div>
                                {school.user.phone && (
                                  <div className="text-xs text-gray-500">{school.user.phone}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {school.representant ? (
                                <div className="space-y-1">
                                  <div className="text-sm">{school.representant.name}</div>
                                  <div className="text-xs text-gray-500">{school.representant.email}</div>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">Non assigné</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(school.user.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span>{school._count.orders}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(school.createdAt), "dd/MM/yyyy", { locale: fr })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSchool(school);
                                    setIsDetailsOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSchool(school);
                                    setNewStatus("");
                                    setNewRepresentantId(school.representant?.id || "");
                                    setIsStatusDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
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
                        <span className="font-medium">Actives</span>
                      </div>
                      <span className="font-bold text-green-600">{schoolStats.active}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">En attente</span>
                      </div>
                      <span className="font-bold text-yellow-600">{schoolStats.pending}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">Total</span>
                      </div>
                      <span className="font-bold text-gray-600">{schoolStats.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activité des écoles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Activité des écoles</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total commandes</span>
                      <span className="font-bold">{schoolStats.totalOrders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Chiffre d'affaires estimé</span>
                      <span className="font-bold text-green-600">{schoolStats.totalRevenue.toFixed(2)} FCFA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Panier moyen estimé</span>
                      <span className="font-bold">
                        {schoolStats.totalOrders > 0 ? (schoolStats.totalRevenue / schoolStats.totalOrders).toFixed(2) : "0"} FCFA
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog de détails de l'école */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de l'école</DialogTitle>
            </DialogHeader>
            {selectedSchool && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Nom de l'école</Label>
                    <p>{selectedSchool.name}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Statut</Label>
                    <div>{getStatusBadge(selectedSchool.user.status)}</div>
                  </div>
                  <div>
                    <Label className="font-medium">Commandes</Label>
                    <p>{selectedSchool._count.orders}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Type</Label>
                    <Badge variant="outline">{selectedSchool.type}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="font-medium">Contact principal</Label>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{selectedSchool.user.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{selectedSchool.user.email}</span>
                    </div>
                    {selectedSchool.user.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{selectedSchool.user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedSchool.address && (
                  <div>
                    <Label className="font-medium">Adresse</Label>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 mt-1" />
                      <p>{selectedSchool.address}</p>
                    </div>
                  </div>
                )}

                {selectedSchool.website && (
                  <div>
                    <Label className="font-medium">Site web</Label>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <a
                        href={selectedSchool.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectedSchool.website}
                      </a>
                    </div>
                  </div>
                )}

                {selectedSchool.representant && (
                  <div>
                    <Label className="font-medium">Représentant assigné</Label>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{selectedSchool.representant.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{selectedSchool.representant.email}</span>
                      </div>
                      {selectedSchool.representant.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedSchool.representant.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Date d'inscription</Label>
                    <p>{format(new Date(selectedSchool.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Dernière mise à jour</Label>
                    <p>{format(new Date(selectedSchool.updatedAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                  </div>
                </div>

                {selectedSchool.description && (
                  <div>
                    <Label className="font-medium">Description</Label>
                    <p className="text-sm text-gray-600">{selectedSchool.description}</p>
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
              <DialogTitle>Modifier l'école</DialogTitle>
            </DialogHeader>
            {selectedSchool && (
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">École</Label>
                  <p className="text-sm text-gray-600">{selectedSchool.name}</p>
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
              <AlertDialogTitle>Supprimer l'école</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'école "{schoolToDelete?.name}" ?
                Cette action est irréversible et ne peut être effectuée que si l'école n'a pas de commandes associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSchool}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog d'ajout d'école */}
        <Dialog open={showAddSchoolModal} onOpenChange={setShowAddSchoolModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle école</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Informations de l'école */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Informations de l'école</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="school-name">Nom de l'école *</Label>
                    <Input
                      id="school-name"
                      value={newSchoolData.name}
                      onChange={(e) => setNewSchoolData({...newSchoolData, name: e.target.value})}
                      placeholder="Ex: École Primaire ABC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="school-contact">Personne de contact *</Label>
                    <Input
                      id="school-contact"
                      value={newSchoolData.contact}
                      onChange={(e) => setNewSchoolData({...newSchoolData, contact: e.target.value})}
                      placeholder="Nom du directeur ou responsable"
                    />
                  </div>
                  <div>
                    <Label htmlFor="school-email">Email de l'école</Label>
                    <Input
                      id="school-email"
                      type="email"
                      value={newSchoolData.email}
                      onChange={(e) => setNewSchoolData({...newSchoolData, email: e.target.value})}
                      placeholder="contact@ecole.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="school-phone">Téléphone</Label>
                    <Input
                      id="school-phone"
                      value={newSchoolData.phone}
                      onChange={(e) => setNewSchoolData({...newSchoolData, phone: e.target.value})}
                      placeholder="+241 XX XX XX XX"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="school-address">Adresse</Label>
                    <Input
                      id="school-address"
                      value={newSchoolData.address}
                      onChange={(e) => setNewSchoolData({...newSchoolData, address: e.target.value})}
                      placeholder="Adresse complète de l'école"
                    />
                  </div>
                  <div>
                    <Label htmlFor="school-website">Site web</Label>
                    <Input
                      id="school-website"
                      value={newSchoolData.website}
                      onChange={(e) => setNewSchoolData({...newSchoolData, website: e.target.value})}
                      placeholder="https://www.ecole.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="school-representant">Représentant assigné</Label>
                    <Select 
                      value={newSchoolData.representantId} 
                      onValueChange={(value) => setNewSchoolData({...newSchoolData, representantId: value})}
                    >
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
                  <div className="md:col-span-2">
                    <Label htmlFor="school-description">Description</Label>
                    <Input
                      id="school-description"
                      value={newSchoolData.description}
                      onChange={(e) => setNewSchoolData({...newSchoolData, description: e.target.value})}
                      placeholder="Informations complémentaires (optionnel)"
                    />
                  </div>
                </div>
              </div>

              {/* Informations de connexion */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold text-lg">Compte de connexion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user-name">Nom d'utilisateur *</Label>
                    <Input
                      id="user-name"
                      value={newSchoolData.userData.name}
                      onChange={(e) => setNewSchoolData({
                        ...newSchoolData, 
                        userData: {...newSchoolData.userData, name: e.target.value}
                      })}
                      placeholder="Nom pour le compte de connexion"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-email">Email de connexion *</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={newSchoolData.userData.email}
                      onChange={(e) => setNewSchoolData({
                        ...newSchoolData, 
                        userData: {...newSchoolData.userData, email: e.target.value}
                      })}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-phone">Téléphone</Label>
                    <Input
                      id="user-phone"
                      value={newSchoolData.userData.phone}
                      onChange={(e) => setNewSchoolData({
                        ...newSchoolData, 
                        userData: {...newSchoolData.userData, phone: e.target.value}
                      })}
                      placeholder="+241 XX XX XX XX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-password">Mot de passe *</Label>
                    <Input
                      id="user-password"
                      type="password"
                      value={newSchoolData.userData.password}
                      onChange={(e) => setNewSchoolData({
                        ...newSchoolData, 
                        userData: {...newSchoolData.userData, password: e.target.value}
                      })}
                      placeholder="Minimum 6 caractères"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddSchoolModal(false);
                    setNewSchoolData({
                      name: "",
                      contact: "",
                      email: "",
                      phone: "",
                      address: "",
                      website: "",
                      description: "",
                      representantId: "",
                      userData: {
                        name: "",
                        email: "",
                        phone: "",
                        password: ""
                      }
                    });
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleCreateSchool} className="bg-black hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer l'école
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}


