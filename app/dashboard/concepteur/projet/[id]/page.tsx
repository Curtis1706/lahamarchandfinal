"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  FileText,
  BookOpen,
  Calendar,
  User,
  Send,
  Edit,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  GitBranch
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiClient } from "@/lib/api-client";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  objectives?: string;
  expectedDeliverables?: string;
  requiredResources?: string;
  timeline?: string;
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
  };
  works?: Work[];
}

interface Work {
  id: string;
  title: string;
  isbn: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectId = params.id as string;

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      // Note: Cette API devra être créée pour récupérer un projet spécifique
      const projectData = await apiClient.getProject(projectId);
      setProject(projectData);
    } catch (error) {
      console.error("Erreur lors du chargement du projet:", error);
      toast.error("Erreur lors du chargement du projet");
      router.push("/dashboard/concepteur/mes-projets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProject = async () => {
    if (!project) return;

    try {
      setIsSubmitting(true);
      await apiClient.submitConcepteurProject(project.id);
      toast.success("Projet soumis avec succès au PDG !");
      await fetchProject(); // Recharger les données
    } catch (error: any) {
      console.error("Erreur soumission projet:", error);
      toast.error(error.message || "Erreur lors de la soumission du projet");
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
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  const getWorkStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "PUBLISHED":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Publié</Badge>;
      case "REJECTED":
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Projet non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/concepteur/mes-projets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              {getStatusBadge(project.status)}
            </div>
            <p className="text-muted-foreground">
              Discipline: {project.discipline.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {project.status === "DRAFT" && (
            <>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button 
                size="sm" 
                onClick={handleSubmitProject}
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Soumission..." : "Soumettre"}
              </Button>
            </>
          )}
          
          {project.status === "ACCEPTED" && (
            <Link href="/dashboard/concepteur/nouvelle-oeuvre">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une œuvre
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails du projet */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="works">
                Œuvres ({project.works?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.description}
                  </p>
                </CardContent>
              </Card>

              {project.objectives && (
                <Card>
                  <CardHeader>
                    <CardTitle>Objectifs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {project.objectives}
                    </p>
                  </CardContent>
                </Card>
              )}

              {project.expectedDeliverables && (
                <Card>
                  <CardHeader>
                    <CardTitle>Livrables attendus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {project.expectedDeliverables}
                    </p>
                  </CardContent>
                </Card>
              )}

              {project.requiredResources && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ressources nécessaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {project.requiredResources}
                    </p>
                  </CardContent>
                </Card>
              )}

              {project.timeline && (
                <Card>
                  <CardHeader>
                    <CardTitle>Planning prévisionnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {project.timeline}
                    </p>
                  </CardContent>
                </Card>
              )}

              {project.status === "REJECTED" && project.rejectionReason && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Motif du refus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600 whitespace-pre-wrap">
                      {project.rejectionReason}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="works" className="space-y-4">
              {project.works && project.works.length > 0 ? (
                <div className="space-y-4">
                  {project.works.map((work) => (
                    <Card key={work.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <BookOpen className="h-5 w-5 text-blue-500" />
                            <div>
                              <h3 className="font-semibold">{work.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                ISBN: {work.isbn}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getWorkStatusBadge(work.status)}
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune œuvre</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {project.status === "ACCEPTED" 
                        ? "Ce projet n'a pas encore d'œuvres associées"
                        : "Les œuvres pourront être ajoutées une fois le projet validé"
                      }
                    </p>
                    {project.status === "ACCEPTED" && (
                      <Link href="/dashboard/concepteur/nouvelle-oeuvre">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter une œuvre
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historique du projet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Projet créé</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(project.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    
                    {project.submittedAt && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Projet soumis</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(project.submittedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {project.reviewedAt && (
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          project.status === "ACCEPTED" ? "bg-green-500" : "bg-red-500"
                        }`}></div>
                        <div>
                          <p className="font-medium">
                            Projet {project.status === "ACCEPTED" ? "accepté" : "refusé"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(project.reviewedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Créé le</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(project.createdAt), "dd/MM/yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Concepteur</p>
                  <p className="text-sm text-muted-foreground">
                    {project.concepteur.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Discipline</p>
                  <p className="text-sm text-muted-foreground">
                    {project.discipline.name}
                  </p>
                </div>
              </div>

              {project.works && project.works.length > 0 && (
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Œuvres générées</p>
                    <p className="text-sm text-muted-foreground">
                      {project.works.length} œuvre(s)
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* État du projet et fonctionnalités */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">État du projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.status === "DRAFT" && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Brouillon</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Le projet est en cours de rédaction. Vous pouvez le modifier et le soumettre quand il sera prêt.
                  </p>
                </div>
              )}

              {project.status === "SUBMITTED" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <Send className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">Soumis pour validation</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Votre projet a été soumis au PDG. Vous recevrez une notification dès qu'il sera examiné.
                  </p>
                </div>
              )}

              {project.status === "UNDER_REVIEW" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-700">En cours de révision</span>
                  </div>
                  <p className="text-xs text-yellow-600">
                    Le PDG examine actuellement votre projet. Veuillez patienter.
                  </p>
                </div>
              )}

              {project.status === "ACCEPTED" && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">✅ Projet validé !</span>
                  </div>
                  <p className="text-xs text-green-600 mb-3">
                    Félicitations ! Votre projet a été validé. Vous pouvez maintenant créer des œuvres associées.
                  </p>
                  <div className="text-xs text-green-600 space-y-1">
                    <div className="flex items-center space-x-1">
                      <span>✓</span>
                      <span>Création d'œuvres débloquée</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>✓</span>
                      <span>Fonctionnalités avancées disponibles</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>✓</span>
                      <span>Suivi de progression activé</span>
                    </div>
                  </div>
                </div>
              )}

              {project.status === "REJECTED" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">Projet refusé</span>
                  </div>
                  <p className="text-xs text-red-600">
                    Votre projet a été refusé. Consultez les détails pour connaître le motif et effectuer les corrections nécessaires.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          {project.status === "ACCEPTED" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/concepteur/nouvelle-oeuvre">
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une œuvre
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
