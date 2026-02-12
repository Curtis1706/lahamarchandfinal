"use client";

import { useState, useEffect } from "react";
;
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
  RefreshCw,
  Upload,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiClient } from "@/lib/api-client";

interface Project {
  id: string;
  title: string;
  description?: string;
  objectives?: string;
  expectedDeliverables?: string;
  requiredResources?: string;
  timeline?: string;
  status: string;
  createdAt: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  files?: string; // JSON string of file URLs
  discipline?: {
    id: string;
    name: string;
  };
  concepteur?: {
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
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [concepteurs, setConcepteurs] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    objectives: "",
    expectedDeliverables: "",
    requiredResources: "",
    timeline: "",
    disciplineId: "",
    concepteurId: ""
  });

  useEffect(() => {
    if (user && user.role === "PDG") {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [projectsData, disciplinesData, usersData] = await Promise.all([
        apiClient.getProjects(), // Récupère tous les projets
        apiClient.getDisciplines(),
        fetch('/api/users?role=CONCEPTEUR').then(res => res.json())
      ]);


      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setDisciplines(Array.isArray(disciplinesData) ? disciplinesData : []);
      setConcepteurs(usersData?.users || []);
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

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // ... (existing code)

  const handleCreateProject = async () => {
    if (!newProject.title || !newProject.disciplineId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Upload des fichiers
      const uploadedFilesList = [];
      if (attachedFiles.length > 0) {
        toast.info("Envoi des fichiers en cours...");
        for (const file of attachedFiles) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append('files', file);
            formDataUpload.append('type', 'project');
            // On n'a pas encore l'ID du projet, on met null ou on gère côté serveur
            // Ici l'API upload attend entityId mais c'est optionnel ou on peut mettre 'new'
            formDataUpload.append('entityId', 'new');

            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formDataUpload
            });

            if (!response.ok) throw new Error(`Erreur upload ${file.name}`);

            const result = await response.json();
            const uploadedFile = result.files && result.files.length > 0 ? result.files[0] : null;

            if (uploadedFile && uploadedFile.path) {
              uploadedFilesList.push({
                name: file.name,
                url: uploadedFile.path,
                type: file.type,
                size: file.size
              });
            }
          } catch (uploadError) {
            console.error(`Erreur upload ${file.name}:`, uploadError);
            toast.error(`Erreur lors de l'envoi de ${file.name}`);
          }
        }
      }

      // 2. Création du projet
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description || '',
          objectives: newProject.objectives || '',
          expectedDeliverables: newProject.expectedDeliverables || '',
          requiredResources: newProject.requiredResources || '',
          timeline: newProject.timeline || '',
          disciplineId: newProject.disciplineId,
          concepteurId: newProject.concepteurId,
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          files: uploadedFilesList.length > 0 ? JSON.stringify(uploadedFilesList) : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Projet créé avec succès");
        setIsAddProjectDialogOpen(false);
        setNewProject({
          title: "",
          description: "",
          objectives: "",
          expectedDeliverables: "",
          requiredResources: "",
          timeline: "",
          disciplineId: "",
          concepteurId: ""
        });
        setAttachedFiles([]); // Reset files
        fetchData();
      } else {
        toast.error(data.error || "Erreur lors de la création du projet");
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error("Erreur lors de la création du projet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} fichier(s) ajouté(s)`);
    }
  };

  const removeNewFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };


  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Projet supprimé avec succès");
        setIsDeleteDialogOpen(false);
        setProjectToDelete(null);
        fetchData();
      } else {
        toast.error(data.error || "Erreur lors de la suppression du projet");
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error("Erreur lors de la suppression du projet");
    } finally {
      setIsSubmitting(false);
    }
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
        status: newStatus
      });


      // Créer une notification pour le concepteur
      if (selectedProject.concepteur) {
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
      (project.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.concepteur?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.discipline?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesDiscipline = disciplineFilter === "all" || project.discipline?.id === disciplineFilter;

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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FolderOpen className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des projets...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "PDG") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Accès non autorisé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Projets</h1>
          <p className="text-muted-foreground">
            Consultez, validez et suivez les projets soumis par les concepteurs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsAddProjectDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un projet
          </Button>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
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
                          <div className="font-medium">{project.concepteur?.name || "Inconnu"}</div>
                          <div className="text-sm text-muted-foreground">{project.concepteur?.email || ""}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                        <FileText className="h-3 w-3" />
                        <span>{project.discipline?.name || "Non défini"}</span>
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
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {project.status === "SUBMITTED" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleValidateProject(project, "accept")}
                              className="bg-green-600 hover:bg-green-700"
                              title="Accepter"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleValidateProject(project, "reject")}
                              title="Refuser"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProjectToDelete(project);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

              <div>
                <Label className="text-sm font-medium">Objectifs du projet</Label>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {selectedProject.objectives || "Non renseigné"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Livrables attendus</Label>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {selectedProject.expectedDeliverables || "Non renseigné"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Ressources nécessaires</Label>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {selectedProject.requiredResources || "Non renseigné"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Planning prévisionnel</Label>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {selectedProject.timeline || "Non renseigné"}
                </p>
              </div>

              {selectedProject.rejectionReason && (
                <div className="border border-red-200 bg-red-50 p-3 rounded-md">
                  <Label className="text-sm font-medium text-red-700">Motif du refus</Label>
                  <p className="text-sm text-red-600 mt-1 whitespace-pre-wrap">{selectedProject.rejectionReason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Concepteur</Label>
                  <p className="text-sm text-muted-foreground">{selectedProject.concepteur?.name || "Inconnu"}</p>
                  <p className="text-xs text-muted-foreground">{selectedProject.concepteur?.email || ""}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Discipline</Label>
                  <p className="text-sm text-muted-foreground">{selectedProject.discipline?.name || "Non défini"}</p>
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

              {selectedProject.files && (
                <div>
                  <Label className="text-sm font-medium">Fichiers joints</Label>
                  <div className="mt-2 space-y-2">
                    {(() => {
                      try {
                        const files = JSON.parse(selectedProject.files);
                        if (Array.isArray(files) && files.length > 0) {
                          return files.map((file: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded bg-muted/20">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">{file.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a href={file.url} download target="_blank" rel="noopener noreferrer" title="Télécharger">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          ));
                        }
                        return <p className="text-sm text-muted-foreground">Aucun fichier valide trouvé.</p>;
                      } catch (e) {
                        return <p className="text-sm text-muted-foreground">Erreur lors du chargement des fichiers.</p>;
                      }
                    })()}
                  </div>
                </div>
              )}

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

      {/* Dialog d'ajout de projet */}
      <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau projet</DialogTitle>
            <DialogDescription>
              Créer un nouveau projet pour un concepteur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-title">Titre du projet *</Label>
              <Input
                id="project-title"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder="Ex: Nouveau manuel de français"
              />
            </div>

            <div>
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Description du projet (optionnel)"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="project-objectives">Objectifs du projet</Label>
              <Textarea
                id="project-objectives"
                value={newProject.objectives}
                onChange={(e) => setNewProject({ ...newProject, objectives: e.target.value })}
                placeholder="Objectifs du projet (optionnel)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="project-deliverables">Livrables attendus</Label>
              <Textarea
                id="project-deliverables"
                value={newProject.expectedDeliverables}
                onChange={(e) => setNewProject({ ...newProject, expectedDeliverables: e.target.value })}
                placeholder="Livrables attendus (optionnel)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="project-resources">Ressources nécessaires</Label>
              <Textarea
                id="project-resources"
                value={newProject.requiredResources}
                onChange={(e) => setNewProject({ ...newProject, requiredResources: e.target.value })}
                placeholder="Ressources nécessaires (optionnel)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="project-timeline">Planning prévisionnel</Label>
              <Textarea
                id="project-timeline"
                value={newProject.timeline}
                onChange={(e) => setNewProject({ ...newProject, timeline: e.target.value })}
                placeholder="Planning prévisionnel (optionnel)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Pièces jointes</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                <input
                  type="file"
                  id="pdg-file-upload"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Label htmlFor="pdg-file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-600 font-medium">
                    Cliquez pour ajouter des fichiers
                  </p>
                </Label>
              </div>

              {attachedFiles.length > 0 && (
                <div className="space-y-2 mt-2">
                  {attachedFiles.map((file, index) => (
                    <div key={`new-${index}`} className="flex items-center justify-between p-2 bg-indigo-50 rounded border border-indigo-100">
                      <span className="text-sm truncate font-medium text-indigo-700">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNewFile(index)}
                        className="h-6 w-6 p-0 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project-discipline">Discipline *</Label>
                <Select value={newProject.disciplineId} onValueChange={(value) => setNewProject({ ...newProject, disciplineId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplines.map((discipline) => (
                      <SelectItem key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project-concepteur">Concepteur (optionnel)</Label>
                <Select value={newProject.concepteurId} onValueChange={(value) => setNewProject({ ...newProject, concepteurId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un concepteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {concepteurs.map((concepteur) => (
                      <SelectItem key={concepteur.id} value={concepteur.id}>
                        {concepteur.name} ({concepteur.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddProjectDialogOpen(false);
                  setNewProject({
                    title: "",
                    description: "",
                    objectives: "",
                    expectedDeliverables: "",
                    requiredResources: "",
                    timeline: "",
                    disciplineId: "",
                    concepteurId: ""
                  });
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={isSubmitting}
                className="bg-black hover:bg-gray-800"
              >
                {isSubmitting ? "Création..." : "Créer le projet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le projet</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le projet "{projectToDelete?.title}" ?
              Cette action est irréversible. {projectToDelete?.works && projectToDelete.works.length > 0 && (
                <span className="text-red-600 font-semibold">
                  Attention : Ce projet a {projectToDelete.works.length} œuvre(s) associée(s) et ne pourra pas être supprimé.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isSubmitting || (projectToDelete?.works && projectToDelete.works.length > 0)}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

