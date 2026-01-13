"use client";

import { useState, useEffect } from "react";
import { Plus, PenTool, Clock, CheckCircle, XCircle, Eye, Edit, Trash2, Search, Filter, FileText, Send, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDisciplines } from "@/hooks/use-disciplines";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  discipline: { name: string };
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "ACCEPTED" | "APPROVED" | "REJECTED" | "ARCHIVED";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MesProjetsPage() {
  const { user } = useCurrentUser();
  const { disciplines, isLoading: disciplinesLoading } = useDisciplines();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Formulaire de création de projet
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    disciplineId: ""
  });

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const projectsData = await apiClient.getProjects(user.id);
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title.trim() || !newProject.disciplineId.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!user) {
      toast.error("Utilisateur non connecté");
      return;
    }

    try {
      const projectData = {
        title: newProject.title.trim(),
        disciplineId: newProject.disciplineId,
        concepteurId: user.id,
        description: newProject.description.trim(),
        status: "DRAFT"
      };

      const createdProject = await apiClient.createProject(projectData);
      
      // Recharger la liste des projets
      await loadProjects();
      
      setShowCreateModal(false);
      setNewProject({ title: "", description: "", disciplineId: "" });
      toast.success("Projet créé avec succès en brouillon");
    } catch (error: any) {
      console.error("Erreur lors de la création du projet:", error);
      const errorMessage = error?.message || "Erreur lors de la création du projet";
      toast.error(errorMessage);
    }
  };

  const handleViewProject = (project: any) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleEditProject = (project: any) => {
    // Vérifier que le projet est modifiable
    if (project.status !== "DRAFT" && project.status !== "REJECTED") {
      toast.error("Seuls les projets en brouillon ou refusés peuvent être modifiés");
      return;
    }
    
    // Rediriger vers la page d'édition
    router.push(`/dashboard/concepteur/mes-projets/${project.id}/edit`);
  };

  const handleDeleteProject = async (project: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?`)) {
      return;
    }

    try {
      await apiClient.deleteProject(project.id);
      toast.success(`Projet "${project.title}" supprimé avec succès`);
      await loadProjects(); // Recharger la liste
    } catch (error: any) {
      console.error("Erreur lors de la suppression du projet:", error);
      const errorMessage = error?.message || "Erreur lors de la suppression du projet";
      toast.error(errorMessage);
    }
  };

  const handleSubmitProject = async (project: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir soumettre le projet "${project.title}" au PDG pour validation ?\n\nUne fois soumis, vous ne pourrez plus le modifier.`)) {
      return;
    }

    try {
      await apiClient.submitConcepteurProject(project.id);
      toast.success("Projet soumis avec succès au PDG pour validation !");
      await loadProjects(); // Recharger la liste pour voir le nouveau statut
    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error);
      const errorMessage = error?.message || "Erreur lors de la soumission du projet";
      toast.error(errorMessage);
    }
  };

  const handleArchiveProject = async (project: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir archiver le projet "${project.title}" ?\n\nUn projet archivé ne pourra plus être modifié.`)) {
      return;
    }

    try {
      await apiClient.archiveConcepteurProject(project.id);
      toast.success("Projet archivé avec succès !");
      await loadProjects(); // Recharger la liste pour voir le nouveau statut
    } catch (error: any) {
      console.error("Erreur lors de l'archivage:", error);
      const errorMessage = error?.message || "Erreur lors de l'archivage du projet";
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACCEPTED: { 
        variant: "default" as const, 
        label: "Accepté", 
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-3 h-3 mr-1" />
      },
      APPROVED: { 
        variant: "default" as const, 
        label: "Approuvé", 
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-3 h-3 mr-1" />
      },
      SUBMITTED: { 
        variant: "secondary" as const, 
        label: "Soumis", 
        color: "bg-blue-100 text-blue-800",
        icon: <Clock className="w-3 h-3 mr-1" />
      },
      UNDER_REVIEW: { 
        variant: "secondary" as const, 
        label: "En révision", 
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="w-3 h-3 mr-1" />
      },
      REJECTED: { 
        variant: "destructive" as const, 
        label: "Refusé", 
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="w-3 h-3 mr-1" />
      },
      ARCHIVED: { 
        variant: "outline" as const, 
        label: "Archivé", 
        color: "bg-gray-200 text-gray-600",
        icon: <FileText className="w-3 h-3 mr-1" />
      },
      DRAFT: { 
        variant: "outline" as const, 
        label: "Brouillon", 
        color: "bg-gray-100 text-gray-800",
        icon: <FileText className="w-3 h-3 mr-1" />
      }
    };
    
    const config = variants[status as keyof typeof variants] || variants.DRAFT;
    return (
      <Badge className={config.color}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.discipline?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des projets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Projets</h1>
          <p className="text-gray-600">Gérez vos projets et œuvres créatives</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Projet
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="DRAFT">Brouillon</SelectItem>
              <SelectItem value="SUBMITTED">Soumis</SelectItem>
              <SelectItem value="UNDER_REVIEW">En révision</SelectItem>
              <SelectItem value="APPROVED">Approuvé</SelectItem>
              <SelectItem value="ACCEPTED">Accepté</SelectItem>
              <SelectItem value="REJECTED">Refusé</SelectItem>
              <SelectItem value="ARCHIVED">Archivé</SelectItem>
            </SelectContent>
          </Select>
      </div>

      {/* Liste des projets */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <PenTool className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet trouvé</h3>
            <p className="text-gray-500 mb-4">
              {projects.length === 0 
                ? "Vous n'avez pas encore créé de projet." 
                : "Aucun projet ne correspond à vos critères de recherche."
              }
            </p>
            {projects.length === 0 && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer votre premier projet
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project: any) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Discipline: {project.discipline?.name || 'N/A'} • Créé le {project.createdAt ? new Date(project.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status)}
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewProject(project)}
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {project.status === "DRAFT" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditProject(project)}
                          title="Modifier le projet"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {project.status === "DRAFT" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => handleSubmitProject(project)}
                          title="Soumettre au PDG pour validation"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                      {(project.status === "APPROVED" || project.status === "ACCEPTED" || project.status === "REJECTED") && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-600 hover:text-gray-700"
                          onClick={() => handleArchiveProject(project)}
                          title="Archiver le projet"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                      {project.status === "DRAFT" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteProject(project)}
                          title="Supprimer le projet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              {project.description && (
                <CardContent>
                  <p className="text-gray-600 text-sm">{project.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création de projet */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau Projet</DialogTitle>
            <DialogDescription>
              Créez un nouveau projet éducatif
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre du projet *
              </label>
              <Input
                value={newProject.title}
                onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Manuel de Mathématiques 6ème"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discipline *
              </label>
              <Select 
                value={newProject.disciplineId} 
                onValueChange={(value) => setNewProject(prev => ({ ...prev, disciplineId: value }))}
                disabled={disciplinesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={disciplinesLoading ? "Chargement..." : "Sélectionnez une discipline"} />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre projet..."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreateProject}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!newProject.title.trim() || !newProject.disciplineId.trim() || disciplinesLoading}
              >
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de détails du projet */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du projet</DialogTitle>
            <DialogDescription>
              Informations complètes sur le projet
            </DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedProject.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedProject.discipline?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedProject.status)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Créé le</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
              </div>
              
              {selectedProject.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">{selectedProject.description}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Fermer
                </Button>
                {selectedProject.status === "DRAFT" && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEditProject(selectedProject);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                )}
                {selectedProject.status === "DRAFT" && (
                  <Button 
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleSubmitProject(selectedProject);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Soumettre au PDG
                  </Button>
                )}
                {(selectedProject.status === "APPROVED" || selectedProject.status === "ACCEPTED" || selectedProject.status === "REJECTED") && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleArchiveProject(selectedProject);
                    }}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archiver
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
