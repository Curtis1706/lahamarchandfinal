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
  CheckCircle,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Users,
  Filter,
  Plus,
  RefreshCw,
  MoreVertical,
  Download,
  Eye,
  Trash2,
  Mail,
  MapPin,
  Globe,
  School,
  ShieldCheck,
  Lock,
  User,
  Edit,
  Loader2,
  Package,
  Calendar,
  Phone,
  BarChart3,
  FileText,
  TrendingUp,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CountrySelector } from "@/components/country-selector";
import { generateRandomPassword, sendCredentialsSMS } from "@/lib/sms";

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
  const [showEditSchoolModal, setShowEditSchoolModal] = useState(false);
  const [editSchoolData, setEditSchoolData] = useState({
    id: "",
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    representantId: "",
    schoolType: "ecole_contractuelle"
  });
  const [newSchoolData, setNewSchoolData] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    representantId: "",
    schoolType: "ecole_contractuelle",
    userData: {
      name: "",
      email: "",
      phone: ""
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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
        type: "école_all" // Nouveau flag pour inclure tous les types d'écoles
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

  const handleStatusChange = async (statusOverride?: string) => {
    const statusToUse = statusOverride || newStatus;
    if (!selectedSchool || !statusToUse) return;

    try {
      const response = await fetch("/api/partners", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: selectedSchool.id,
          status: statusToUse,
          representantId: (newRepresentantId && newRepresentantId !== "none") ? newRepresentantId : undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Statut de l'école modifié avec succès`);
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

  const handleUpdateSchoolInfo = async () => {
    if (!editSchoolData.id || !editSchoolData.name || !editSchoolData.contact) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/partners", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: editSchoolData.id,
          name: editSchoolData.name,
          type: editSchoolData.schoolType,
          contact: editSchoolData.contact,
          email: editSchoolData.email,
          phone: editSchoolData.phone,
          address: editSchoolData.address,
          website: editSchoolData.website,
          description: editSchoolData.description,
          representantId: editSchoolData.representantId
        })
      });

      if (response.ok) {
        toast.success("Informations de l'école mises à jour");
        setShowEditSchoolModal(false);
        fetchSchools();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating school:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
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
        !newSchoolData.userData.email) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSchoolData.userData.email)) {
      toast.error("Email invalide");
      return;
    }

    // Générer un mot de passe automatique
    const generatedPassword = generateRandomPassword(8);

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newSchoolData.name,
          type: newSchoolData.schoolType,
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
            password: generatedPassword
          },
          sendSms: true // Flag pour demander à l'API d'envoyer le SMS
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("École créée avec succès");
        toast.info("Les identifiants sont envoyés par SMS au gestionnaire");
        
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
          schoolType: "ecole_contractuelle",
          userData: {
            name: "",
            email: "",
            phone: ""
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
                                <div className="text-sm">{school.user?.name || "N/A"}</div>
                                {school.user?.phone && (
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
                            <TableCell>{getStatusBadge(school.user?.status || "INACTIVE")}</TableCell>
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
                                  className="h-8 w-8 p-0 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                  onClick={() => {
                                    setSelectedSchool(school);
                                    setIsDetailsOpen(true);
                                  }}
                                  title="Voir les détails"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 border-gray-200 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                  onClick={() => {
                                    setEditSchoolData({
                                      id: school.id,
                                      name: school.name,
                                      contact: school.contact || "",
                                      email: school.email || "",
                                      phone: school.phone || "",
                                      address: school.address || "",
                                      website: school.website || "",
                                      description: school.description || "",
                                      representantId: school.representant?.id || "none",
                                      schoolType: school.type as any
                                    });
                                    setShowEditSchoolModal(true);
                                  }}
                                  title="Modifier les informations"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-8 w-8 p-0 border-gray-200 transition-colors ${school.user?.status === 'ACTIVE' ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-green-50 hover:text-green-600'}`}
                                  onClick={() => {
                                    setSelectedSchool(school);
                                    // Inverser le statut
                                    const nextStatus = school.user?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                                    handleStatusChange(nextStatus);
                                  }}
                                  title={school.user?.status === 'ACTIVE' ? "Désactiver l'accès" : "Activer l'accès"}
                                >
                                  <CheckCircle className={`h-4 w-4 ${school.user?.status === 'ACTIVE' ? 'text-green-500' : 'text-gray-400'}`} />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 border-gray-200 hover:bg-red-50 hover:text-red-700 transition-colors"
                                  onClick={() => {
                                    setSchoolToDelete(school);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  title="Supprimer l'école"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
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
                    <div>{getStatusBadge(selectedSchool.user?.status || "INACTIVE")}</div>
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
                      <span>{selectedSchool.user?.name || "N/A"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{selectedSchool.user?.email || "N/A"}</span>
                    </div>
                    {selectedSchool.user?.phone && (
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
                   <Button onClick={() => handleStatusChange()} disabled={!newStatus}>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                   <div className="bg-white/20 p-2 rounded-lg">
                      <School className="h-6 w-6 text-white" />
                   </div>
                   Ajouter une nouvelle école
                </DialogTitle>
                <p className="text-indigo-100 text-sm mt-1">
                  Enregistrez une école et ses accès seront générés automatiquement.
                </p>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-8 bg-white">
              {/* Type d'école */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                   <h3 className="font-bold text-gray-800 uppercase tracking-wider text-xs">Type d'engagement</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div 
                      className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${newSchoolData.schoolType === 'ecole_contractuelle' ? 'border-indigo-600 bg-indigo-50 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-indigo-200'}`}
                      onClick={() => setNewSchoolData({...newSchoolData, schoolType: 'ecole_contractuelle'})}
                   >
                      <div className={`p-2 rounded-lg mr-3 ${newSchoolData.schoolType === 'ecole_contractuelle' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                         <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                         <p className="font-bold text-sm text-gray-900">Contractuelle</p>
                         <p className="text-xs text-gray-500">Partenariat officiel signé</p>
                      </div>
                      {newSchoolData.schoolType === 'ecole_contractuelle' && (
                        <div className="absolute top-2 right-2 h-2 w-2 bg-indigo-600 rounded-full" />
                      )}
                   </div>

                   <div 
                      className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${newSchoolData.schoolType === 'ecole_non_contractuelle' ? 'border-violet-600 bg-violet-50 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-violet-200'}`}
                      onClick={() => setNewSchoolData({...newSchoolData, schoolType: 'ecole_non_contractuelle'})}
                   >
                      <div className={`p-2 rounded-lg mr-3 ${newSchoolData.schoolType === 'ecole_non_contractuelle' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                         <XCircle className="h-5 w-5" />
                      </div>
                      <div>
                         <p className="font-bold text-sm text-gray-900">Non Contractuelle</p>
                         <p className="text-xs text-gray-500">Client ponctuel / prospect</p>
                      </div>
                      {newSchoolData.schoolType === 'ecole_non_contractuelle' && (
                        <div className="absolute top-2 right-2 h-2 w-2 bg-violet-600 rounded-full" />
                      )}
                   </div>
                </div>
              </div>

              {/* Informations de l'école */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                   <h3 className="font-bold text-gray-800 uppercase tracking-wider text-xs">Informations de l'école</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="school-name" className="text-xs font-semibold text-gray-600">Nom de l'école *</Label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="school-name"
                        className="pl-10 border-gray-200 focus:ring-indigo-500"
                        value={newSchoolData.name}
                        onChange={(e) => setNewSchoolData({...newSchoolData, name: e.target.value})}
                        placeholder="Ex: École Primaire ABC"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-contact" className="text-xs font-semibold text-gray-600">Référent / Contact *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="school-contact"
                        className="pl-10 border-gray-200 focus:ring-indigo-500"
                        value={newSchoolData.contact}
                        onChange={(e) => setNewSchoolData({...newSchoolData, contact: e.target.value})}
                        placeholder="Nom du responsable"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-email" className="text-xs font-semibold text-gray-600">Email de l'école</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="school-email"
                        type="email"
                        className="pl-10 border-gray-200 focus:ring-indigo-500"
                        value={newSchoolData.email}
                        onChange={(e) => setNewSchoolData({...newSchoolData, email: e.target.value})}
                        placeholder="contact@ecole.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-phone" className="text-xs font-semibold text-gray-600">Téléphone École</Label>
                    <CountrySelector
                      value={newSchoolData.phone}
                      onChange={(value) => setNewSchoolData({...newSchoolData, phone: value})}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="school-address" className="text-xs font-semibold text-gray-600">Adresse géographique</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="school-address"
                        className="pl-10 border-gray-200 focus:ring-indigo-500"
                        value={newSchoolData.address}
                        onChange={(e) => setNewSchoolData({...newSchoolData, address: e.target.value})}
                        placeholder="Quartier, Rue, Ville..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-representant" className="text-xs font-semibold text-gray-600">Représentant assigné</Label>
                    <Select 
                      value={newSchoolData.representantId} 
                      onValueChange={(value) => setNewSchoolData({...newSchoolData, representantId: value})}
                    >
                      <SelectTrigger className="border-gray-200 focus:ring-indigo-500">
                        <SelectValue placeholder="Sélectionner un représentant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun représentant</SelectItem>
                        {representants.map((rep) => (
                          <SelectItem key={rep.id} value={rep.id}>
                            {rep.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-website" className="text-xs font-semibold text-gray-600">Lien site web / Facebook</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="school-website"
                        className="pl-10 border-gray-200 focus:ring-indigo-500"
                        value={newSchoolData.website}
                        onChange={(e) => setNewSchoolData({...newSchoolData, website: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Compte Utilisateur */}
              <div className="space-y-4 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                   <h3 className="font-bold text-gray-800 uppercase tracking-wider text-xs flex items-center gap-2">
                      Compte Administrateur École
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                   </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="user-name" className="text-xs font-semibold text-gray-600">Nom du gestionnaire *</Label>
                    <Input
                      id="user-name"
                      className="border-gray-200 focus:ring-indigo-500 bg-white"
                      value={newSchoolData.userData.name}
                      onChange={(e) => setNewSchoolData({
                        ...newSchoolData, 
                        userData: {...newSchoolData.userData, name: e.target.value}
                      })}
                      placeholder="Nom complet"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email" className="text-xs font-semibold text-gray-600">Email de connexion *</Label>
                    <Input
                      id="user-email"
                      type="email"
                      className="border-gray-200 focus:ring-indigo-500 bg-white"
                      value={newSchoolData.userData.email}
                      onChange={(e) => setNewSchoolData({
                        ...newSchoolData, 
                        userData: {...newSchoolData.userData, email: e.target.value}
                      })}
                      placeholder="email@ecole.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-phone" className="text-xs font-semibold text-gray-600">Téléphone de connexion *</Label>
                    <CountrySelector
                      value={newSchoolData.userData.phone}
                      onChange={(value) => setNewSchoolData({
                        ...newSchoolData, 
                        userData: {...newSchoolData.userData, phone: value}
                      })}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="bg-white border-2 border-dashed border-indigo-200 p-3 rounded-xl flex items-center gap-3">
                       <div className="bg-indigo-100 p-2 rounded-lg">
                          <Lock className="h-4 w-4 text-indigo-600" />
                       </div>
                       <p className="text-[10px] text-gray-500 leading-tight">
                         Le mot de passe sera <strong>généré automatiquement</strong> et envoyé par <strong>SMS</strong> à ce numéro dès la validation.
                       </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl px-6"
                  onClick={() => {
                    setShowAddSchoolModal(false);
                    // Reset will be handled by logic or closure
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateSchool} 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-xl px-8 shadow-lg hover:shadow-indigo-500/30 transition-all font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : "Valider la création"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de modification d'école */}
        <Dialog open={showEditSchoolModal} onOpenChange={setShowEditSchoolModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                   <div className="bg-white/20 p-2 rounded-lg">
                      <Edit className="h-6 w-6 text-white" />
                   </div>
                   Modifier les informations de l'école
                </DialogTitle>
                <p className="text-amber-50 text-sm mt-1">
                  Mettez à jour les coordonnées et les préférences de l'école.
                </p>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-8 bg-white">
              {/* Type d'école */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-1 w-8 bg-amber-500 rounded-full" />
                   <h3 className="font-bold text-gray-800 uppercase tracking-wider text-xs">Type d'engagement</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div 
                      className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${editSchoolData.schoolType === 'ecole_contractuelle' ? 'border-amber-500 bg-amber-50 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-amber-200'}`}
                      onClick={() => setEditSchoolData({...editSchoolData, schoolType: 'ecole_contractuelle'})}
                   >
                      <div className={`p-2 rounded-lg mr-3 ${editSchoolData.schoolType === 'ecole_contractuelle' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                         <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                         <p className="font-bold text-sm text-gray-900">Contractuelle</p>
                         <p className="text-xs text-gray-500">Partenariat officiel signé</p>
                      </div>
                      {editSchoolData.schoolType === 'ecole_contractuelle' && (
                        <div className="absolute top-2 right-2 h-2 w-2 bg-amber-500 rounded-full" />
                      )}
                   </div>

                   <div 
                      className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${editSchoolData.schoolType === 'ecole_non_contractuelle' ? 'border-orange-500 bg-orange-50 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-orange-200'}`}
                      onClick={() => setEditSchoolData({...editSchoolData, schoolType: 'ecole_non_contractuelle'})}
                   >
                      <div className={`p-2 rounded-lg mr-3 ${editSchoolData.schoolType === 'ecole_non_contractuelle' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                         <XCircle className="h-5 w-5" />
                      </div>
                      <div>
                         <p className="font-bold text-sm text-gray-900">Non Contractuelle</p>
                         <p className="text-xs text-gray-500">Client ponctuel / prospect</p>
                      </div>
                      {editSchoolData.schoolType === 'ecole_non_contractuelle' && (
                        <div className="absolute top-2 right-2 h-2 w-2 bg-orange-500 rounded-full" />
                      )}
                   </div>
                </div>
              </div>

              {/* Informations de l'école */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-1 w-8 bg-amber-500 rounded-full" />
                   <h3 className="font-bold text-gray-800 uppercase tracking-wider text-xs">Informations de l'école</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="edit-school-name" className="text-xs font-semibold text-gray-600">Nom de l'école *</Label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="edit-school-name"
                        className="pl-10 border-gray-200 focus:ring-amber-500"
                        value={editSchoolData.name}
                        onChange={(e) => setEditSchoolData({...editSchoolData, name: e.target.value})}
                        placeholder="Ex: École Primaire ABC"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-school-contact" className="text-xs font-semibold text-gray-600">Référent / Contact *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="edit-school-contact"
                        className="pl-10 border-gray-200 focus:ring-amber-500"
                        value={editSchoolData.contact}
                        onChange={(e) => setEditSchoolData({...editSchoolData, contact: e.target.value})}
                        placeholder="Nom du responsable"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-school-email" className="text-xs font-semibold text-gray-600">Email de l'école</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="edit-school-email"
                        type="email"
                        className="pl-10 border-gray-200 focus:ring-amber-500"
                        value={editSchoolData.email}
                        onChange={(e) => setEditSchoolData({...editSchoolData, email: e.target.value})}
                        placeholder="contact@ecole.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-school-phone" className="text-xs font-semibold text-gray-600">Téléphone École</Label>
                    <CountrySelector
                      value={editSchoolData.phone}
                      onChange={(value) => setEditSchoolData({...editSchoolData, phone: value})}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="edit-school-address" className="text-xs font-semibold text-gray-600">Adresse géographique</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="edit-school-address"
                        className="pl-10 border-gray-200 focus:ring-amber-500"
                        value={editSchoolData.address}
                        onChange={(e) => setEditSchoolData({...editSchoolData, address: e.target.value})}
                        placeholder="Quartier, Rue, Ville..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-school-representant" className="text-xs font-semibold text-gray-600">Représentant assigné</Label>
                    <Select 
                      value={editSchoolData.representantId} 
                      onValueChange={(value) => setEditSchoolData({...editSchoolData, representantId: value})}
                    >
                      <SelectTrigger className="border-gray-200 focus:ring-amber-500">
                        <SelectValue placeholder="Sélectionner un représentant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun représentant</SelectItem>
                        {representants.map((rep) => (
                          <SelectItem key={rep.id} value={rep.id}>
                            {rep.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-school-website" className="text-xs font-semibold text-gray-600">Lien site web / Facebook</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="edit-school-website"
                        className="pl-10 border-gray-200 focus:ring-amber-500"
                        value={editSchoolData.website}
                        onChange={(e) => setEditSchoolData({...editSchoolData, website: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="edit-school-description" className="text-xs font-semibold text-gray-600">Description / Notes</Label>
                    <Input
                       id="edit-school-description"
                       className="border-gray-200 focus:ring-amber-500"
                       value={editSchoolData.description}
                       onChange={(e) => setEditSchoolData({...editSchoolData, description: e.target.value})}
                       placeholder="Informations complémentaires..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl px-6"
                  onClick={() => setShowEditSchoolModal(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpdateSchoolInfo} 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl px-8 shadow-lg hover:shadow-orange-500/30 transition-all font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : "Enregistrer les modifications"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}


