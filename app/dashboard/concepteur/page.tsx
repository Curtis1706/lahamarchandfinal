"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FolderOpen, 
  Plus, 
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
  Send,
  Loader2,
  BarChart3
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  discipline: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface ProjectStats {
  total: number;
  draft: number;
  submitted: number;
  accepted: number;
  rejected: number;
}

export default function ConcepteurDashboard() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    draft: 0,
    submitted: 0,
    accepted: 0,
    rejected: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!userLoading && (!user || user.role !== "CONCEPTEUR")) {
      router.push("/auth/login");
    } else if (user) {
      fetchProjects();
    }
  }, [user, userLoading, router]);

  const fetchProjects = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const response = await apiClient.getConcepteurProjects(user.id);
      
      // L'API retourne { projects } ou directement un tableau
      const projectsData = Array.isArray(response) ? response : ((response as any).projects || []);
      
      setProjects(projectsData);
      
      // Calculer les statistiques
      const newStats = {
        total: projectsData.length,
        draft: projectsData.filter((p: Project) => p.status === "DRAFT").length,
        submitted: projectsData.filter((p: Project) => p.status === "SUBMITTED" || p.status === "UNDER_REVIEW").length,
        accepted: projectsData.filter((p: Project) => p.status === "ACCEPTED").length,
        rejected: projectsData.filter((p: Project) => p.status === "REJECTED").length,
      };
      setStats(newStats);
    } catch (error: any) {
      console.error("Erreur lors du chargement des projets:", error);
      toast.error(error.message || "Erreur lors du chargement des projets");
      setProjects([]);
      setStats({ total: 0, draft: 0, submitted: 0, accepted: 0, rejected: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline" className="text-gray-600"><Edit className="h-3 w-3 mr-1" />Brouillon</Badge>;
      case "SUBMITTED":
        return <Badge variant="secondary" className="text-blue-600"><Clock className="h-3 w-3 mr-1" />Soumis</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="secondary" className="text-blue-600"><Clock className="h-3 w-3 mr-1" />En révision</Badge>;
      case "ACCEPTED":
        return <Badge variant="default" className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Validé</Badge>;
      case "REJECTED":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.discipline?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-3 text-muted-foreground">Chargement...</p>
          </div>
    );
  }

  if (!user || user.role !== "CONCEPTEUR") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card Informations Personnelles */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            Mes Informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-indigo-200">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Nom complet</p>
                <p className="font-semibold text-gray-900">{user?.name || 'Non renseigné'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-indigo-200">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Rôle</p>
                <Badge className="bg-indigo-600 text-white">Concepteur</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-indigo-200">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Téléphone</p>
                <p className="font-semibold text-gray-900">{user?.phone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            <Edit className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refusés</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
          </div>

      {/* Actions principales */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes Projets</h1>
          <p className="text-muted-foreground">Gérez vos projets éducatifs</p>
        </div>
        <Link href="/dashboard/concepteur/nouveau-projet">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Projet
          </Button>
        </Link>
          </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="DRAFT">Brouillons</option>
          <option value="SUBMITTED">Soumis</option>
          <option value="UNDER_REVIEW">En révision</option>
          <option value="ACCEPTED">Validés</option>
          <option value="REJECTED">Refusés</option>
        </select>
              </div>

      {/* Liste des projets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {project.discipline?.name || "Discipline non définie"}
                  </CardDescription>
              </div>
                {getStatusBadge(project.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  Créé le {new Date(project.createdAt).toLocaleDateString()}
          </div>

                {project.status === "REJECTED" && project.rejectionReason && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <AlertTriangle className="h-3 w-3 mr-1 inline" />
                    {project.rejectionReason}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/concepteur/projet/${project.id}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Voir
                    </Button>
              </Link>

                  {project.status === "DRAFT" && (
                    <Link href={`/dashboard/concepteur/projet/${project.id}/edit`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Edit className="h-3 w-3" />
                        Modifier
                      </Button>
              </Link>
                  )}
            </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {searchTerm || statusFilter !== "all" 
              ? "Aucun projet trouvé" 
              : "Aucun projet créé"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Essayez de modifier vos critères de recherche"
              : "Commencez par créer votre premier projet"}
          </p>
        </div>
      )}

      {/* Information importante */}
      {/* <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Rôle du Concepteur</h4>
              <p className="text-sm text-blue-700 mt-1">
                En tant que concepteur, vous créez et proposez des <strong>projets éducatifs</strong>. 
                Une fois vos projets validés par le PDG, les <strong>auteurs</strong> pourront créer des œuvres 
                rattachées à ces projets.
              </p>
              <p className="text-sm text-blue-600 mt-2 italic">
                💡 Les œuvres sont créées exclusivement par les auteurs, pas par les concepteurs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card> */}
            </div>
  );
}