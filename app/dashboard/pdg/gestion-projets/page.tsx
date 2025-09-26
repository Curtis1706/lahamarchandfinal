"use client";

import { useState, useEffect } from "react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FolderOpen, 
  Search, 
  Filter,
  Eye,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  Edit,
  Trash2,
  Send,
  GitBranch,
  BookOpen,
  MessageSquare,
  History,
  Plus,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiClient } from "@/lib/api-client";

interface Project {
  id: string;
  title: string;
  description: string;
  objectives?: string;
  expectedDeliverables?: string;
  requiredResources?: string;
  timeline?: string;
  status: string;
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  discipline: {
    id: string;
    name: string;
  };
  concepteur: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
  works?: Work[]; // Optionnel car pas toujours disponible
}

interface Work {
  id: string;
  title: string;
  isbn: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
}

interface Discipline {
  id: string;
  name: string;
}

export default function GestionProjetsPage() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [disciplineFilter, setDisciplineFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [validationAction, setValidationAction] = useState<"accept" | "reject">("accept");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role === "PDG") {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [projectsData, disciplinesData] = await Promise.all([
        apiClient.getProjects(), // Récupère tous les projets
        apiClient.getDisciplines()
      ]);

      console.log("🔍 Données reçues:", { projectsData, disciplinesData });

      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setDisciplines(Array.isArray(disciplinesData) ? disciplinesData : []);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsDialogOpen(true);
  };

  const handleValidateProject = (project: Project, action: "accept" | "reject") => {
    setSelectedProject(project);
    setValidationAction(action);
    setRejectionReason("");
    setIsValidationDialogOpen(true);
  };

  const handleSubmitValidation = async () => {
    if (!selectedProject) return;

    if (validationAction === "reject" && !rejectionReason.trim()) {
      toast.error("Veuillez indiquer le motif du refus");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const newStatus = validationAction === "accept" ? "ACCEPTED" : "REJECTED";
      
      // Mettre à jour le statut du projet
      const updatedProject = await apiClient.updateProject(selectedProject.id, {
        status: newStatus,
        reviewedAt: new Date().toISOString()
      });

      console.log("✅ Projet mis à jour:", updatedProject);

      // Créer une notification pour le concepteur
      try {
        await apiClient.createNotification({
          userId: selectedProject.concepteur.id,
          title: validationAction === "accept" ? "Projet accepté" : "Projet refusé",
          message: validationAction === "accept" 
            ? `Votre projet "${selectedProject.title}" a été accepté par le PDG.`
            : `Votre projet "${selectedProject.title}" a été refusé. Motif: ${rejectionReason}`,
          type: validationAction === "accept" ? "PROJECT_ACCEPTED" : "PROJECT_REJECTED",
          data: JSON.stringify({
            projectId: selectedProject.id,
            projectTitle: selectedProject.title,
            action: validationAction,
            reason: validationAction === "reject" ? rejectionReason : null
          })
        });
      } catch (notificationError) {
        console.error("⚠️ Erreur création notification:", notificationError);
      }

      toast.success(
        validationAction === "accept" 
          ? "Projet accepté avec succès" 
          : "Projet refusé avec succès"
      );
      
      setIsValidationDialogOpen(false);
      setSelectedProject(null);
      setRejectionReason("");
      
      // Recharger les données
      await fetchData();
      
    } catch (error: any) {
      console.error("❌ Erreur validation projet:", error);
      toast.error(error.message || "Erreur lors de la validation du projet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><FileText className="h-3 w-3 mr-1" />Brouillon</Badge>;
      case "SUBMITTED":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Send className="h-3 w-3 mr-1" />Soumis</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En révision</Badge>;
      case "ACCEPTED":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Accepté</Badge>;
      case "REJECTED":
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <FileText className="h-4 w-4 text-gray-500" />;
      case "SUBMITTED":
        return <Send className="h-4 w-4 text-blue-500" />;
      case "UNDER_REVIEW":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Filtrage
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.concepteur.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.discipline.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesDiscipline = disciplineFilter === "all" || project.discipline.id === disciplineFilter;
    
    return matchesSearch && matchesStatus && matchesDiscipline;
  });

  // Statistiques
  const stats = {
    total: projects.length,
    submitted: projects.filter(p => p.status === "SUBMITTED").length,
    accepted: projects.filter(p => p.status === "ACCEPTED").length,
    rejected: projects.filter(p => p.status === "REJECTED").length,
    underReview: projects.filter(p => p.status === "UNDER_REVIEW").length
  };

  if (userLoading || isLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FolderOpen className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des projets...</p>
          </div>
        </div>
      </DynamicDashboardLayout>
    );
  }

  if (!user || user.role !== "PDG") {
    return (
      <DynamicDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Accès non autorisé</p>
        </div>
      </DynamicDashboardLayout>
    );
  }

  return (
    <DynamicDashboardLayout title="Gestion des Projets">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Projets</h1>
            <p className="text-muted-foreground">
              Consultez, validez et suivez les projets soumis par les concepteurs
            </p>
          </div>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Soumis</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En révision</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.underReview}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acceptés</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Refusés</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les projets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="SUBMITTED">Soumis</SelectItem>
              <SelectItem value="UNDER_REVIEW">En révision</SelectItem>
              <SelectItem value="ACCEPTED">Accepté</SelectItem>
              <SelectItem value="REJECTED">Refusé</SelectItem>
              <SelectItem value="DRAFT">Brouillon</SelectItem>
            </SelectContent>
          </Select>
          <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Discipline" />
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

        {/* Tableau des projets */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des projets</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun projet trouvé</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm || statusFilter !== "all" || disciplineFilter !== "all"
                    ? "Essayez de modifier vos critères de recherche"
                    : "Aucun projet soumis pour le moment"
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Concepteur</TableHead>
                    <TableHead>Discipline</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead>Date de soumission</TableHead>
                    <TableHead>Œuvres</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(project.status)}
                          <div>
                            <div className="font-semibold">{project.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {project.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{project.concepteur.name}</div>
                            <div className="text-sm text-muted-foreground">{project.concepteur.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                          <FileText className="h-3 w-3" />
                          <span>{project.discipline.name}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(project.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(project.createdAt), "dd/MM/yyyy", { locale: fr })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.submittedAt ? (
                          <div className="flex items-center space-x-1 text-sm">
                            <Send className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(project.submittedAt), "dd/MM/yyyy", { locale: fr })}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.works && project.works.length > 0 ? (
                          <div className="flex items-center space-x-1">
                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{project.works.length}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(project)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {project.status === "SUBMITTED" && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleValidateProject(project, "accept")}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleValidateProject(project, "reject")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog de détails du projet */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Détails du projet</DialogTitle>
              <DialogDescription>
                Informations complètes sur le projet soumis
              </DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Titre</Label>
                    <p className="text-sm text-muted-foreground">{selectedProject.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Statut</Label>
                    <div className="mt-1">{getStatusBadge(selectedProject.status)}</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedProject.description}</p>
                </div>

                {/* Informations détaillées du projet */}
                {selectedProject.objectives && (
                  <div>
                    <Label className="text-sm font-medium">Objectifs du projet</Label>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedProject.objectives}</p>
                  </div>
                )}

                {selectedProject.expectedDeliverables && (
                  <div>
                    <Label className="text-sm font-medium">Livrables attendus</Label>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedProject.expectedDeliverables}</p>
                  </div>
                )}

                {selectedProject.requiredResources && (
                  <div>
                    <Label className="text-sm font-medium">Ressources nécessaires</Label>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedProject.requiredResources}</p>
                  </div>
                )}

                {selectedProject.timeline && (
                  <div>
                    <Label className="text-sm font-medium">Planning prévisionnel</Label>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedProject.timeline}</p>
                  </div>
                )}

                {selectedProject.rejectionReason && (
                  <div className="border border-red-200 bg-red-50 p-3 rounded-md">
                    <Label className="text-sm font-medium text-red-700">Motif du refus</Label>
                    <p className="text-sm text-red-600 mt-1 whitespace-pre-wrap">{selectedProject.rejectionReason}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Concepteur</Label>
                    <p className="text-sm text-muted-foreground">{selectedProject.concepteur.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedProject.concepteur.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Discipline</Label>
                    <p className="text-sm text-muted-foreground">{selectedProject.discipline.name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Date de création</Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedProject.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </p>
                  </div>
                  {selectedProject.submittedAt && (
                    <div>
                      <Label className="text-sm font-medium">Date de soumission</Label>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedProject.submittedAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </p>
                    </div>
                  )}
                </div>

                {selectedProject.works && selectedProject.works.length > 0 ? (
                  <div>
                    <Label className="text-sm font-medium">Œuvres générées</Label>
                    <div className="mt-2 space-y-2">
                      {selectedProject.works.map((work) => (
                        <div key={work.id} className="flex items-center space-x-2 p-2 border rounded">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{work.title}</p>
                            <p className="text-xs text-muted-foreground">ISBN: {work.isbn}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {work.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm font-medium">Œuvres générées</Label>
                    <p className="text-sm text-muted-foreground mt-1">Aucune œuvre générée pour ce projet</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de validation */}
        <AlertDialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {validationAction === "accept" ? "Accepter le projet" : "Refuser le projet"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {validationAction === "accept" 
                  ? `Êtes-vous sûr de vouloir accepter le projet "${selectedProject?.title}" ?`
                  : `Êtes-vous sûr de vouloir refuser le projet "${selectedProject?.title}" ?`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {validationAction === "reject" && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Motif du refus *</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Indiquez le motif du refus..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmitValidation}
                disabled={isSubmitting}
                className={validationAction === "reject" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {isSubmitting 
                  ? "Traitement..." 
                  : validationAction === "accept" 
                    ? "Accepter" 
                    : "Refuser"
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DynamicDashboardLayout>
  );
}

