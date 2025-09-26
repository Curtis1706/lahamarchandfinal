"use client";

import { useState, useEffect } from "react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Filter,
  Eye, 
  CheckCircle,
  XCircle,
  AlertTriangle, 
  Trash2, 
  Plus,
  BookOpen,
  User,
  Calendar,
  Package,
  TrendingUp,
  BarChart3,
  FileText,
  Edit,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Work {
  id: string;
  title: string;
  isbn: string;
  price: number;
  tva: number;
  stock: number;
  minStock: number;
  maxStock: number | null;
  status: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  concepteur?: {
    id: string;
    name: string;
    email: string;
  };
  discipline: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    title: string;
    status: string;
  };
}

interface WorkStats {
  pending: number;
  published: number;
  suspended: number;
  total: number;
}

export default function ValidationOeuvresPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [workStats, setWorkStats] = useState<WorkStats>({
    pending: 0,
    published: 0,
    suspended: 0,
    total: 0
  });
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newReason, setNewReason] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<Work | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Charger les données
  useEffect(() => {
    fetchWorks();
    fetchDisciplines();
  }, [currentPage, searchTerm, disciplineFilter, activeTab]);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      });

      if (searchTerm) params.append("search", searchTerm);
      if (disciplineFilter && disciplineFilter !== "all") params.append("disciplineId", disciplineFilter);
      
      // Filtrer par statut selon l'onglet actif
      switch (activeTab) {
        case "pending":
          params.append("status", "PENDING");
          break;
        case "published":
          params.append("status", "PUBLISHED");
          break;
        case "suspended":
          params.append("status", "SUSPENDED");
          break;
      }

      const response = await fetch(`/api/works?${params}`);
      const data = await response.json();

      console.log("🔍 Réponse API works:", { response: response.ok, data });
      console.log("🔍 Paramètres envoyés:", params.toString());

      if (response.ok) {
        console.log("🔍 Œuvres reçues:", data.works);
        console.log("🔍 Statistiques reçues:", data.stats);
        setWorks(data.works || []);
        setTotalPages(data.pagination?.pages || 1);

        // Calculer les statistiques
        const total = data.stats?.total || 0;
        const pending = data.stats?.pending || 0;
        const published = data.stats?.published || 0;
        const suspended = data.stats?.suspended || 0;

        console.log("🔍 Statistiques calculées:", { total, pending, published, suspended });
        setWorkStats({ total, pending, published, suspended });
      } else {
        console.error("❌ Erreur API:", data.error);
        toast.error(data.error || "Erreur lors du chargement des œuvres");
      }
    } catch (error) {
      console.error("Error fetching works:", error);
      toast.error("Erreur lors du chargement des œuvres");
    } finally {
      setLoading(false);
    }
  };

  const fetchDisciplines = async () => {
    try {
      const response = await fetch("/api/disciplines");
      const data = await response.json();

      if (response.ok) {
        setDisciplines(data);
      }
    } catch (error) {
      console.error("Error fetching disciplines:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "En attente", variant: "secondary" as const },
      PUBLISHED: { label: "Publiée", variant: "default" as const },
      SUSPENDED: { label: "Suspendue", variant: "destructive" as const },
      DRAFT: { label: "Brouillon", variant: "outline" as const }
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

  const handleValidateWork = async (workId: string, status: string, reason?: string) => {
    try {
      const response = await fetch("/api/works", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workId: workId,
          status,
          validationComment: reason || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        const action = status === "PUBLISHED" ? "publiée" : "suspendue";
        toast.success(`Œuvre ${action} avec succès`);
        fetchWorks();
        setIsStatusDialogOpen(false);
        setNewStatus("");
        setNewReason("");
        setSelectedWork(null);
      } else {
        toast.error(data.error || "Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Error validating work:", error);
      toast.error("Erreur lors de la validation");
    }
  };

  const handleDeleteWork = async () => {
    if (!workToDelete) return;

    try {
      const response = await fetch(`/api/works?id=${workToDelete.id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Œuvre supprimée avec succès");
        fetchWorks();
        setIsDeleteDialogOpen(false);
        setWorkToDelete(null);
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting work:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <DynamicDashboardLayout title="Validation des Œuvres" showActions>
      <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
          <div>
                  <p className="text-sm font-medium text-gray-600">Total Œuvres</p>
                  <p className="text-2xl font-bold">{workStats.total}</p>
          </div>
        </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">À valider</p>
                  <p className="text-2xl font-bold">{workStats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Publiées</p>
                  <p className="text-2xl font-bold">{workStats.published}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Suspendues</p>
                  <p className="text-2xl font-bold">{workStats.suspended}</p>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>À Valider ({workStats.pending})</span>
            </TabsTrigger>
            <TabsTrigger value="published" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Publiées ({workStats.published})</span>
            </TabsTrigger>
            <TabsTrigger value="suspended" className="flex items-center space-x-2">
              <XCircle className="h-4 w-4" />
              <span>Suspendues ({workStats.suspended})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Filtres et recherche */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Filtres et Recherche</span>
                  <Button onClick={fetchWorks} variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
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
                        placeholder="Titre, ISBN, auteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discipline">Discipline</Label>
          <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les disciplines" />
            </SelectTrigger>
            <SelectContent>
                        <SelectItem value="all">Toutes les disciplines</SelectItem>
                        {disciplines.map((discipline) => (
                <SelectItem key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
                </div>
            </CardContent>
          </Card>

            {/* Table des œuvres */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "pending" && "Œuvres en attente de validation"}
                  {activeTab === "published" && "Œuvres publiées"}
                  {activeTab === "suspended" && "Œuvres suspendues"}
                </CardTitle>
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
                          <TableHead>Œuvre</TableHead>
                          <TableHead>Auteur</TableHead>
                          <TableHead>Concepteur</TableHead>
                          <TableHead>Projet</TableHead>
                          <TableHead>Origine</TableHead>
                          <TableHead>Discipline</TableHead>
                          <TableHead>Prix</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {works.map((work) => (
                          <TableRow key={work.id}>
                            <TableCell>
                        <div>
                                <div className="font-medium">{work.title}</div>
                                <div className="text-sm text-gray-500">ISBN: {work.isbn}</div>
                          </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm">{work.author?.name || work.concepteur?.name || "Non assigné"}</div>
                                <div className="text-xs text-gray-500">{work.author?.email || work.concepteur?.email || ""}</div>
                        </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm">{work.concepteur?.name || "Non assigné"}</div>
                                <div className="text-xs text-gray-500">{work.concepteur?.email || ""}</div>
                      </div>
                            </TableCell>
                            <TableCell>
                              {work.project ? (
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">{work.project.title}</div>
                                  <div className="text-xs text-gray-500">ID: {work.project.id}</div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic">Aucun projet</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {work.project ? (
                                <div className="space-y-1">
                                  <Badge variant="secondary" className="text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Projet
                                  </Badge>
                                  <div className="text-xs text-gray-500">{work.project.title}</div>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  Direct
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{work.discipline.name}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {work.price.toFixed(2)} €
                            </TableCell>
                            <TableCell>
                          <div className="flex items-center space-x-1">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span>{work.stock}</span>
                          </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(work.status)}</TableCell>
                            <TableCell>
                              {format(new Date(work.createdAt), "dd/MM/yyyy", { locale: fr })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                                  onClick={() => {
                                    setSelectedWork(work);
                                    setIsDetailsOpen(true);
                                  }}
                      >
                                  <Eye className="h-4 w-4" />
                      </Button>
                      
                                {activeTab === "pending" && (
                        <>
                          <Button
                                      variant="outline"
                            size="sm"
                                      onClick={() => handleValidateWork(work.id, "PUBLISHED")}
                          >
                                      <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                                      variant="outline"
                            size="sm"
                                      onClick={() => {
                                        setSelectedWork(work);
                                        setNewStatus("SUSPENDED");
                                        setIsStatusDialogOpen(true);
                                      }}
                                    >
                                      <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                                {activeTab === "published" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedWork(work);
                                      setNewStatus("SUSPENDED");
                                      setIsStatusDialogOpen(true);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}

                                {activeTab === "suspended" && (
                        <Button
                                    variant="outline"
                          size="sm"
                                    onClick={() => handleValidateWork(work.id, "PUBLISHED")}
                        >
                                    <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setWorkToDelete(work);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
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
        </Tabs>

        {/* Dialog de détails de l'œuvre */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de l'œuvre</DialogTitle>
            </DialogHeader>
            {selectedWork && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Titre</Label>
                    <p>{selectedWork.title}</p>
                  </div>
                  <div>
                    <Label className="font-medium">ISBN</Label>
                    <p>{selectedWork.isbn}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Prix</Label>
                    <p className="font-bold">{selectedWork.price.toFixed(2)} €</p>
                  </div>
                  <div>
                    <Label className="font-medium">TVA</Label>
                    <p>{(selectedWork.tva * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <Label className="font-medium">Stock</Label>
                    <p>{selectedWork.stock} exemplaires</p>
                  </div>
                  <div>
                    <Label className="font-medium">Statut</Label>
                    <div>{getStatusBadge(selectedWork.status)}</div>
                  </div>
                </div>

                <div>
                  <Label className="font-medium">Auteur</Label>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{selectedWork.author?.name || selectedWork.concepteur?.name || "Non assigné"}</span>
                    </div>
                    <div className="text-sm text-gray-500">{selectedWork.author?.email || selectedWork.concepteur?.email || ""}</div>
                  </div>
                </div>

                <div>
                  <Label className="font-medium">Concepteur</Label>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{selectedWork.concepteur?.name || "Non assigné"}</span>
                    </div>
                    <div className="text-sm text-gray-500">{selectedWork.concepteur?.email || ""}</div>
                  </div>
                </div>

                <div>
                  <Label className="font-medium">Discipline</Label>
                  <Badge variant="outline">{selectedWork.discipline.name}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Date de création</Label>
                    <p>{format(new Date(selectedWork.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Dernière mise à jour</Label>
                    <p>{format(new Date(selectedWork.updatedAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de modification du statut */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le statut</DialogTitle>
            </DialogHeader>
            {selectedWork && (
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Œuvre</Label>
                  <p className="text-sm text-gray-600">{selectedWork.title}</p>
                </div>

                <div>
                  <Label className="font-medium">Nouveau statut</Label>
                  <p className="text-sm text-gray-600">
                    {newStatus === "SUSPENDED" ? "Suspendre" : "Publier"}
                  </p>
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

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={() => handleValidateWork(selectedWork.id, newStatus, newReason)}
                    disabled={!newStatus}
                  >
                    Confirmer
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
              <AlertDialogTitle>Supprimer l'œuvre</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'œuvre "{workToDelete?.title}" ?
                Cette action est irréversible et ne peut être effectuée que si l'œuvre n'a pas de commandes associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteWork}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DynamicDashboardLayout>
  );
}
