"use client";

import { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  FileText,
  User,
  Tag,
  Calendar,
  BookOpen,
  Download,
  MessageSquare,
  AlertTriangle,
  Info,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Work {
  id: string;
  title: string;
  description?: string;
  isbn: string;
  category?: string;
  targetAudience?: string;
  educationalObjectives?: string;
  contentType?: string;
  keywords?: string;
  files?: string;
  status: string;
  submittedAt?: string;
  createdAt: string;
  validationComment?: string;
  rejectionReason?: string;
  concepteur?: {
    id: string;
    name: string;
    email: string;
  };
  author?: {
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
  total: number;
  pending: number;
  published: number;
  rejected: number;
  draft: number;
}

export default function ValidationOeuvresV2Page() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const [works, setWorks] = useState<Work[]>([]);
  const [stats, setStats] = useState<WorkStats>({ total: 0, pending: 0, published: 0, rejected: 0, draft: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationAction, setValidationAction] = useState<'approve' | 'reject'>('approve');
  const [validationComment, setValidationComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("all");

  const fetchWorks = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter && statusFilter !== "all") {
        params.append('status', statusFilter);
      }
      
      if (disciplineFilter && disciplineFilter !== "all") {
        params.append('disciplineId', disciplineFilter);
      }

      const response = await fetch(`/api/works?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des œuvres');
      }

      const data = await response.json();
      
      let filteredWorks = data.works || [];
      
      // Filtre de recherche côté client
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredWorks = filteredWorks.filter((work: Work) => 
          work.title.toLowerCase().includes(term) ||
          work.description?.toLowerCase().includes(term) ||
          work.concepteur?.name.toLowerCase().includes(term) ||
          work.author?.name.toLowerCase().includes(term) ||
          work.discipline.name.toLowerCase().includes(term)
        );
      }
      
      setWorks(filteredWorks);
      setStats(data.stats || { total: 0, pending: 0, published: 0, rejected: 0, draft: 0 });
    } catch (error) {
      console.error("Erreur lors du chargement des œuvres:", error);
      toast.error("Erreur lors du chargement des œuvres");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, disciplineFilter, searchTerm]);

  useEffect(() => {
    if (!userLoading && (!user || user.role !== "PDG")) {
      return;
    } else if (user) {
      fetchWorks();
    }
  }, [user, userLoading, fetchWorks]);

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: "secondary" as const, label: "En attente", icon: <Clock className="w-3 h-3 mr-1" /> },
      PUBLISHED: { variant: "default" as const, label: "Publié", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      REJECTED: { variant: "destructive" as const, label: "Refusé", icon: <XCircle className="w-3 h-3 mr-1" /> },
      DRAFT: { variant: "outline" as const, label: "Brouillon", icon: <FileText className="w-3 h-3 mr-1" /> }
    };

    const config = variants[status as keyof typeof variants] || variants.PENDING;
    return (
      <Badge variant={config.variant}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const parseFiles = (filesJson?: string) => {
    if (!filesJson) return [];
    try {
      return JSON.parse(filesJson);
    } catch {
      return [];
    }
  };

  const parseKeywords = (keywordsString?: string) => {
    if (!keywordsString) return [];
    return keywordsString.split(',').map(k => k.trim()).filter(k => k);
  };

  const handleViewDetails = (work: Work) => {
    setSelectedWork(work);
    setShowDetailsModal(true);
  };

  const handleValidate = (work: Work, action: 'approve' | 'reject') => {
    setSelectedWork(work);
    setValidationAction(action);
    setValidationComment("");
    setRejectionReason("");
    setShowDetailsModal(false);
    setShowValidationModal(true);
  };

  const submitValidation = async () => {
    if (!selectedWork) return;
    
    if (validationAction === 'reject' && !rejectionReason.trim()) {
      toast.error("Veuillez préciser la raison du refus");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData = {
        workId: selectedWork.id,
        status: validationAction === 'approve' ? 'PUBLISHED' : 'REJECTED',
        validationComment: validationComment.trim() || null,
        rejectionReason: validationAction === 'reject' ? rejectionReason.trim() : null
      };

      await apiClient.updateWork(selectedWork.id, updateData);
      
      toast.success(
        validationAction === 'approve' 
          ? "Œuvre validée et publiée avec succès !" 
          : "Œuvre refusée. Le concepteur/auteur a été notifié."
      );
      
      setShowValidationModal(false);
      setSelectedWork(null);
      fetchWorks(); // Recharger la liste
      
    } catch (error: any) {
      console.error("Erreur lors de la validation:", error);
      toast.error(error.message || "Erreur lors de la validation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement des œuvres...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "PDG") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vous n'avez pas les permissions pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Validation des Œuvres</h1>
        <p className="text-muted-foreground">
          Validez ou refusez les œuvres soumises par les concepteurs et auteurs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-sm font-medium">En attente</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Publiées</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Refusées</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Brouillons</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="PUBLISHED">Publiées</SelectItem>
                  <SelectItem value="REJECTED">Refusées</SelectItem>
                  <SelectItem value="DRAFT">Brouillons</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Titre, auteur, discipline..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <Button onClick={fetchWorks} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des œuvres */}
      <Card>
        <CardHeader>
          <CardTitle>Œuvres soumises ({works.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Discipline</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date soumission</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {works.map((work) => (
                <TableRow key={work.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{work.title}</p>
                      {work.project && (
                        <p className="text-xs text-muted-foreground">
                          Projet: {work.project.title}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {work.concepteur?.name || work.author?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {work.concepteur ? 'Concepteur' : 'Auteur'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{work.discipline.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{work.contentType || 'Non spécifié'}</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(work.status)}
                  </TableCell>
                  <TableCell>
                    {work.submittedAt ? (
                      <div className="text-sm">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {format(new Date(work.submittedAt), "dd/MM/yyyy", { locale: fr })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Non soumise</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(work)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {work.status === "PENDING" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleValidate(work, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleValidate(work, 'reject')}
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
          
          {works.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune œuvre trouvée avec ces filtres.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedWork?.title}</DialogTitle>
            <DialogDescription>
              Détails complets de l'œuvre soumise
            </DialogDescription>
          </DialogHeader>
          
          {selectedWork && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Auteur</Label>
                  <p className="text-sm">{selectedWork.concepteur?.name || selectedWork.author?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedWork.concepteur ? 'Concepteur' : 'Auteur'} - {selectedWork.concepteur?.email || selectedWork.author?.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Discipline</Label>
                  <p className="text-sm">{selectedWork.discipline.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type de contenu</Label>
                  <p className="text-sm">{selectedWork.contentType || 'Non spécifié'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Public cible</Label>
                  <p className="text-sm">{selectedWork.targetAudience || 'Non spécifié'}</p>
                </div>
              </div>

              {/* Description */}
              {selectedWork.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedWork.description}</p>
                </div>
              )}

              {/* Objectifs pédagogiques */}
              {selectedWork.educationalObjectives && (
                <div>
                  <Label className="text-sm font-medium">Objectifs pédagogiques</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedWork.educationalObjectives}</p>
                </div>
              )}

              {/* Projet parent */}
              {selectedWork.project && (
                <div>
                  <Label className="text-sm font-medium">Projet parent</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary">{selectedWork.project.title}</Badge>
                    <span className="text-xs text-muted-foreground">({selectedWork.project.status})</span>
                  </div>
                </div>
              )}

              {/* Mots-clés */}
              {selectedWork.keywords && (
                <div>
                  <Label className="text-sm font-medium">Mots-clés</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {parseKeywords(selectedWork.keywords).map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Fichiers */}
              {selectedWork.files && (
                <div>
                  <Label className="text-sm font-medium">Fichiers associés</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    {parseFiles(selectedWork.files).map((file: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.originalName || file.filename}</p>
                          <p className="text-xs text-muted-foreground">{file.type}</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={file.filepath} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-medium">Date de création</Label>
                  <p className="text-sm">{format(new Date(selectedWork.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                </div>
                {selectedWork.submittedAt && (
                  <div>
                    <Label className="text-sm font-medium">Date de soumission</Label>
                    <p className="text-sm">{format(new Date(selectedWork.submittedAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                  </div>
                )}
              </div>

              {/* Commentaires précédents */}
              {(selectedWork.validationComment || selectedWork.rejectionReason) && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Commentaires précédents</Label>
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
          )}
          
          <DialogFooter>
            {selectedWork?.status === "PENDING" && (
              <>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleValidate(selectedWork, 'reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleValidate(selectedWork, 'approve')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider et publier
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de validation */}
      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validationAction === 'approve' ? 'Valider l\'œuvre' : 'Refuser l\'œuvre'}
            </DialogTitle>
            <DialogDescription>
              {validationAction === 'approve' 
                ? 'Cette œuvre sera publiée et visible dans le système.'
                : 'Cette œuvre sera refusée et retournée à l\'auteur avec vos commentaires.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {validationAction === 'approve' && (
              <div>
                <Label htmlFor="validation-comment">Commentaire de validation (optionnel)</Label>
                <Textarea
                  id="validation-comment"
                  placeholder="Ajoutez un commentaire positif ou des suggestions..."
                  value={validationComment}
                  onChange={(e) => setValidationComment(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            
            {validationAction === 'reject' && (
              <div>
                <Label htmlFor="rejection-reason">Motif du refus *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Expliquez pourquoi cette œuvre est refusée et quelles améliorations sont nécessaires..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            )}

            <div className={`p-3 rounded-lg border ${
              validationAction === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-2">
                {validationAction === 'approve' ? (
                  <Info className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className={validationAction === 'approve' ? 'text-green-800' : 'text-red-800'}>
                    {validationAction === 'approve' 
                      ? 'L\'auteur recevra une notification de validation et l\'œuvre sera automatiquement publiée.'
                      : 'L\'auteur recevra une notification de refus avec vos commentaires et pourra resoumetre une version corrigée.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowValidationModal(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={submitValidation}
              disabled={isSubmitting || (validationAction === 'reject' && !rejectionReason.trim())}
              className={validationAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {validationAction === 'approve' ? 'Validation...' : 'Refus...'}
                </>
              ) : (
                <>
                  {validationAction === 'approve' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {validationAction === 'approve' ? 'Valider et publier' : 'Refuser l\'œuvre'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
