"use client";

import { useState, useEffect } from "react";
;
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
  MoreHorizontal,
  Tag,
  Download,
  Image as ImageIcon,
  Save,
  Loader2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Work {
  id: string;
  title: string;
  description?: string;
  isbn: string;
  internalCode?: string;
  price: number;
  tva: number;
  stock: number;
  minStock: number;
  maxStock: number | null;
  category?: string;
  targetAudience?: string;
  educationalObjectives?: string;
  contentType?: string;
  keywords?: string;
  files?: string;
  status: string;
  publishedAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  validationComment?: string;
  rejectionReason?: string;
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
  validated: number;
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
    validated: 0,
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<Partial<Work> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  // Charger les données
  useEffect(() => {
    fetchWorks(true);
    fetchDisciplines();
  }, [currentPage, searchTerm, disciplineFilter, activeTab]);

  const fetchWorks = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setIsRefreshing(true);
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
        case "validated":
          params.append("status", "VALIDATED");
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


      if (response.ok) {
        setWorks(data.works || []);
        setTotalPages(data.pagination?.pages || 1);

        // Calculer les statistiques
        const total = data.stats?.total || 0;
        const pending = data.stats?.pending || 0;
        const validated = data.stats?.validated || 0;
        const published = data.stats?.published || 0;
        const suspended = data.stats?.suspended || 0;

        setWorkStats({ total, pending, validated, published, suspended });
      } else {
        console.error("❌ Erreur API:", data.error);
        toast.error(data.error || "Erreur lors du chargement des œuvres");
      }
    } catch (error) {
      console.error("Error fetching works:", error);
      toast.error("Erreur lors du chargement des œuvres");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
      PENDING: { label: "En attente", variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
      VALIDATED: { label: "Validée", variant: "default" as const, className: "bg-green-100 text-green-800" },
      PUBLISHED: { label: "Publiée", variant: "default" as const, className: "bg-green-100 text-green-800" },
      SUSPENDED: { label: "Suspendue", variant: "destructive" as const, className: "bg-red-100 text-red-800" },
      REJECTED: { label: "Refusée", variant: "destructive" as const, className: "bg-red-100 text-red-800" },
      DRAFT: { label: "Brouillon", variant: "outline" as const, className: "bg-gray-100 text-gray-800" },
      ON_SALE: { label: "En vente", variant: "default" as const, className: "bg-blue-100 text-blue-800" },
      OUT_OF_STOCK: { label: "Rupture de stock", variant: "destructive" as const, className: "bg-red-100 text-red-800" },
      DISCONTINUED: { label: "Arrêté", variant: "outline" as const, className: "bg-gray-100 text-gray-800" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
      className: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge variant={config.variant} className={`text-xs ${config.className || ''}`}>
        {config.label}
      </Badge>
    );
  };

  const parseFiles = (filesJson?: string) => {
    if (!filesJson) return { files: [], coverImage: null, collectionId: null };
    try {
      const parsed = JSON.parse(filesJson);
      if (Array.isArray(parsed)) {
        return { files: parsed, coverImage: null, collectionId: null };
      }
      return {
        files: parsed.files || [],
        coverImage: parsed.coverImage || null,
        collectionId: parsed.collectionId || null
      };
    } catch {
      return { files: [], coverImage: null, collectionId: null };
    }
  };

  const parseKeywords = (keywordsString?: string) => {
    if (!keywordsString) return [];
    return keywordsString.split(',').map(k => k.trim()).filter(k => k);
  };

  const getDownloadUrl = (url: string) => {
    if (!url) {
      console.warn("🔗 [Download] Provided URL is empty");
      return '#';
    }

    // Si c'est déjà une URL de notre API, ne pas la modifier
    if (url.startsWith('/api/download-document')) return url;

    console.log("🔗 [Download] Original URL:", url);
    const apiUrl = `/api/download-document?url=${encodeURIComponent(url)}`;
    console.log("🔗 [Download] Proxy URL:", apiUrl);
    return apiUrl;
  };

  const handleUpdateWorkStatus = async (workId: string, action: string, reason?: string, authorId?: string) => {
    const actionKey = `${workId}-${action}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch("/api/works/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workId,
          action,
          reason,
          authorId: authorId || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        const messages: Record<string, string> = {
          validate: "Œuvre validée avec succès",
          publish: "Œuvre publiée avec succès",
          reject: "Œuvre refusée avec succès",
          suspend: "Œuvre suspendue avec succès"
        };
        toast.success(messages[action] || "Action effectuée avec succès");
        fetchWorks();
        setIsStatusDialogOpen(false);
        setNewStatus("");
        setNewReason("");
        setSelectedWork(null);
      } else {
        toast.error(data.error || "Erreur lors de l'opération");
      }
    } catch (error) {
      console.error(`Error with action ${action}:`, error);
      toast.error("Erreur lors de l'opération");
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Maintenir la compatibilité ou remplacer les appels direct
  const handleValidateWork = (workId: string, authorId?: string) =>
    handleUpdateWorkStatus(workId, "validate", undefined, authorId);

  const handlePublishWork = (workId: string) =>
    handleUpdateWorkStatus(workId, "publish");

  const handleDeleteWork = async () => {
    if (!workToDelete) return;
    const actionKey = `${workToDelete.id}-delete`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));

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
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleEditWork = (work: Work) => {
    setEditingWork({
      ...work,
      keywords: work.keywords ? parseKeywords(work.keywords).join(',') : ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingWork || !editingWork.id) return;

    try {
      setIsSaving(true);

      // Préparer les données à mettre à jour (sans modifier le stock)
      const updateData: any = {
        workId: editingWork.id,
        title: editingWork.title,
        description: editingWork.description || null,
        price: editingWork.price || 0,
        tva: editingWork.tva || 0.18,
        category: editingWork.category || null,
        targetAudience: editingWork.targetAudience || null,
        educationalObjectives: editingWork.educationalObjectives || null,
        contentType: editingWork.contentType || null,
        keywords: editingWork.keywords || null,
        internalCode: editingWork.internalCode || null,
        // Ne pas modifier le stock lors de l'édition avant publication
        // Le stock sera géré via les mouvements de stock après publication
      };

      const response = await fetch("/api/works", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Œuvre modifiée avec succès");
        fetchWorks();
        setIsEditDialogOpen(false);
        setEditingWork(null);
      } else {
        toast.error(data.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Error updating work:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
          <TabsTrigger value="validated" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span>Validées ({workStats.validated})</span>
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
                <Button onClick={() => fetchWorks(false)} variant="outline" size="sm" disabled={isRefreshing}>
                  <Loader2 className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
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
                            {work.price.toFixed(2)} FCFA
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
                                title="Voir les détails"
                                className="border-gray-300 hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4 mr-1.5" />
                                <span className="text-xs font-medium">Voir</span>
                              </Button>

                              {activeTab === "pending" && work.status === "PENDING" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleValidateWork(work.id)}
                                    title="Valider l'œuvre"
                                    className="bg-green-600 hover:bg-green-700 text-white border-0 hover:border-0"
                                    disabled={loadingActions[`${work.id}-validate`]}
                                  >
                                    {loadingActions[`${work.id}-validate`] ? (
                                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-1.5" />
                                    )}
                                    <span className="text-xs font-medium">Valider</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedWork(work);
                                      setNewStatus("REJECTED");
                                      setIsStatusDialogOpen(true);
                                    }}
                                    title="Refuser"
                                    className="bg-red-600 hover:bg-red-700 text-white border-0 hover:border-0"
                                    disabled={loadingActions[`${work.id}-reject`]}
                                  >
                                    {loadingActions[`${work.id}-reject`] ? (
                                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4 mr-1.5" />
                                    )}
                                    <span className="text-xs font-medium">Refuser</span>
                                  </Button>
                                </>
                              )}

                              {activeTab === "validated" && work.status === "VALIDATED" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditWork(work)}
                                    title="Modifier l'œuvre"
                                    className="border-blue-300 hover:bg-blue-50 text-blue-700"
                                  >
                                    <Edit className="h-4 w-4 mr-1.5" />
                                    <span className="text-xs font-medium">Modifier</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handlePublishWork(work.id)}
                                    title="Publier l'œuvre"
                                    className="bg-green-600 hover:bg-green-700 text-white border-0 hover:border-0"
                                    disabled={loadingActions[`${work.id}-publish`]}
                                  >
                                    {loadingActions[`${work.id}-publish`] ? (
                                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-1.5" />
                                    )}
                                    <span className="text-xs font-medium">Publier</span>
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
                                  disabled={loadingActions[`${work.id}-suspend`]}
                                >
                                  {loadingActions[`${work.id}-suspend`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              )}

                              {activeTab === "suspended" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleValidateWork(work.id)}
                                  disabled={loadingActions[`${work.id}-validate`]}
                                >
                                  {loadingActions[`${work.id}-validate`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setWorkToDelete(work);
                                  setIsDeleteDialogOpen(true);
                                }}
                                disabled={loadingActions[`${work.id}-delete`]}
                              >
                                {loadingActions[`${work.id}-delete`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'œuvre - {selectedWork?.title}</DialogTitle>
          </DialogHeader>
          {selectedWork && (() => {
            const filesData = parseFiles(selectedWork.files);
            return (
              <div className="space-y-6">
                {/* Étape 1: Informations de base */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
                    Informations de base
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Titre</Label>
                      <p className="mt-1">{selectedWork.title}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-sm text-gray-600">ISBN</Label>
                      <p className="mt-1 font-mono text-sm">{selectedWork.isbn}</p>
                    </div>
                    {selectedWork.description && (
                      <div className="md:col-span-2">
                        <Label className="font-medium text-sm text-gray-600">Description</Label>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{selectedWork.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Étape 2: Classification */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">2</span>
                    Classification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Discipline</Label>
                      <p className="mt-1">{selectedWork.discipline.name}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Catégorie</Label>
                      <p className="mt-1">{selectedWork.category || 'Non spécifié'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Public cible</Label>
                      <p className="mt-1">{selectedWork.targetAudience || 'Non spécifié'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Collection</Label>
                      <p className="mt-1">{filesData.collectionId ? `ID: ${filesData.collectionId}` : 'Aucune collection'}</p>
                    </div>
                    {selectedWork.contentType && (
                      <div>
                        <Label className="font-medium text-sm text-gray-600">Type de contenu</Label>
                        <p className="mt-1">{selectedWork.contentType}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Étape 3: Détails et Prix */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">3</span>
                    Détails et Prix
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Prix suggéré</Label>
                      <p className="mt-1">{selectedWork.price ? `${selectedWork.price.toFixed(2)} FCFA` : 'Non spécifié'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Code interne</Label>
                      <p className="mt-1 font-mono text-sm">{selectedWork.internalCode || 'Non spécifié'}</p>
                    </div>
                    {selectedWork.educationalObjectives && (
                      <div className="md:col-span-2">
                        <Label className="font-medium text-sm text-gray-600">Objectifs pédagogiques</Label>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{selectedWork.educationalObjectives}</p>
                      </div>
                    )}
                    {selectedWork.keywords && (
                      <div className="md:col-span-2">
                        <Label className="font-medium text-sm text-gray-600">Mots-clés</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {parseKeywords(selectedWork.keywords).map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Étape 4: Fichiers */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">4</span>
                    Fichiers et Documents
                  </h3>
                  <div className="space-y-4 pl-11">
                    {filesData.coverImage && (
                      <div>
                        <Label className="font-medium text-sm text-gray-600">Image de couverture</Label>
                        <div className="mt-2">
                          <div className="relative w-full max-w-md h-48 border rounded-lg overflow-hidden">
                            <img
                              src={filesData.coverImage}
                              alt="Image de couverture"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            asChild
                          >
                            <a href={getDownloadUrl(filesData.coverImage)} download target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger l'image
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                    {filesData.files && filesData.files.length > 0 && (
                      <div>
                        <Label className="font-medium text-sm text-gray-600">Fichiers associés</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {filesData.files.map((file: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.originalName || file.filename || file.name}</p>
                                <p className="text-xs text-muted-foreground">{file.type || file.mimeType}</p>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={getDownloadUrl(file.filepath || file.path || file.url)} download target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Informations supplémentaires */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informations supplémentaires</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Auteur</Label>
                      <p className="mt-1">{selectedWork.author?.name || "Non assigné"}</p>
                      <p className="text-xs text-gray-500">{selectedWork.author?.email}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Concepteur</Label>
                      <p className="mt-1">{selectedWork.concepteur?.name || "Non assigné"}</p>
                      <p className="text-xs text-gray-500">{selectedWork.concepteur?.email}</p>
                    </div>
                    {selectedWork.project && (
                      <div>
                        <Label className="font-medium text-sm text-gray-600">Projet parent</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary">{selectedWork.project.title}</Badge>
                          <span className="text-xs text-gray-500">({selectedWork.project.status})</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Stock</Label>
                      <p className="mt-1">{selectedWork.stock} exemplaires</p>
                    </div>
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Date de création</Label>
                      <p className="mt-1 text-sm">{format(new Date(selectedWork.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                    </div>
                    {selectedWork.submittedAt && (
                      <div>
                        <Label className="font-medium text-sm text-gray-600">Date de soumission</Label>
                        <p className="mt-1 text-sm">{format(new Date(selectedWork.submittedAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                      </div>
                    )}
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Dernière mise à jour</Label>
                      <p className="mt-1 text-sm">{format(new Date(selectedWork.updatedAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-sm text-gray-600">Statut</Label>
                      <div className="mt-1">{getStatusBadge(selectedWork.status)}</div>
                    </div>
                  </div>
                  {(selectedWork.validationComment || selectedWork.rejectionReason) && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="font-medium text-sm text-gray-600">Commentaires</Label>
                      {selectedWork.validationComment && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-800">{selectedWork.validationComment}</p>
                        </div>
                      )}
                      {selectedWork.rejectionReason && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-800">{selectedWork.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
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
                  onClick={() => {
                    const action =
                      newStatus === "SUSPENDED" ? "suspend" :
                        newStatus === "REJECTED" ? "reject" : "validate";
                    handleUpdateWorkStatus(selectedWork.id, action, newReason);
                  }}
                  disabled={!newStatus || loadingActions[`${selectedWork.id}-${newStatus === "SUSPENDED" ? "suspend" : newStatus === "REJECTED" ? "reject" : "validate"}`]}
                >
                  {loadingActions[`${selectedWork.id}-${newStatus === "SUSPENDED" ? "suspend" : newStatus === "REJECTED" ? "reject" : "validate"}`] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
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

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'œuvre</DialogTitle>
          </DialogHeader>
          {editingWork && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Titre *</Label>
                <Input
                  id="edit-title"
                  value={editingWork.title || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingWork.description || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price">Prix (FCFA)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingWork.price || ''}
                    onChange={(e) => setEditingWork({ ...editingWork, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Catégorie</Label>
                  <Input
                    id="edit-category"
                    value={editingWork.category || ''}
                    onChange={(e) => setEditingWork({ ...editingWork, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contentType">Type de contenu</Label>
                  <Input
                    id="edit-contentType"
                    value={editingWork.contentType || ''}
                    onChange={(e) => setEditingWork({ ...editingWork, contentType: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-targetAudience">Public cible</Label>
                  <Input
                    id="edit-targetAudience"
                    value={editingWork.targetAudience || ''}
                    onChange={(e) => setEditingWork({ ...editingWork, targetAudience: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-internalCode">Code interne</Label>
                  <Input
                    id="edit-internalCode"
                    value={editingWork.internalCode || ''}
                    onChange={(e) => setEditingWork({ ...editingWork, internalCode: e.target.value })}
                    className="font-mono"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-educationalObjectives">Objectifs pédagogiques</Label>
                <Textarea
                  id="edit-educationalObjectives"
                  value={editingWork.educationalObjectives || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, educationalObjectives: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-keywords">Mots-clés (séparés par des virgules)</Label>
                <Input
                  id="edit-keywords"
                  value={editingWork.keywords || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, keywords: e.target.value })}
                  placeholder="mot-clé1, mot-clé2, mot-clé3"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingWork(null);
                  }}
                  disabled={isSaving}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editingWork.title}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
