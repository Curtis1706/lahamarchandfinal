"use client";

import { useState, useEffect } from "react";
import { BookOpen, Search, Filter, Plus, Edit, Trash2, Eye, BarChart3, AlertTriangle, Clock, CheckCircle, XCircle, FileText, Image, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function MesOeuvresPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadWorks();
  }, [user, statusFilter, searchTerm]);

  const loadWorks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Construire les paramètres de recherche
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Utiliser l'API dédiée pour les auteurs qui inclut les statistiques de ventes
      const response = await fetch(`/api/auteur/works?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des œuvres');
      }

      const data = await response.json();
      setWorks(data.works || []);
    } catch (error) {
      console.error("Error loading works:", error);
      toast.error("Erreur lors du chargement des œuvres");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PUBLISHED: {
        variant: "default" as const,
        label: "Publiée",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-3 h-3 mr-1" />
      },
      PENDING: {
        variant: "secondary" as const,
        label: "En attente",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="w-3 h-3 mr-1" />
      },
      SUSPENDED: {
        variant: "destructive" as const,
        label: "Suspendue",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="w-3 h-3 mr-1" />
      },
      REJECTED: {
        variant: "destructive" as const,
        label: "Refusée",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="w-3 h-3 mr-1" />
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

  const handleDeleteWork = async (workId: string) => {
    try {
      await apiClient.deleteWork(workId);
      toast.success("Œuvre supprimée avec succès");
      loadWorks(); // Reload the list
    } catch (error) {
      console.error("Error deleting work:", error);
      toast.error("Erreur lors de la suppression de l'œuvre");
    }
  };

  const canEditWork = (work: any) => {
    return work.status === 'DRAFT' || work.status === 'REJECTED';
  };

  const canSubmitForPublication = (work: any) => {
    return work.status === 'DRAFT' || work.status === 'REJECTED';
  };

  const handleSubmitForPublication = async (workId: string) => {
    try {
      const response = await fetch('/api/works/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la soumission');
      }

      toast.success('Livre soumis pour publication avec succès. Le PDG va examiner votre demande.');
      loadWorks();
    } catch (error: any) {
      console.error('Error submitting work:', error);
      toast.error(error.message || 'Erreur lors de la soumission du livre');
    }
  };

  const canDeleteWork = (work: any) => {
    return work.status === 'DRAFT' || (work.status === 'PUBLISHED' && !hasOrderItems(work));
  };

  const hasOrderItems = (work: any) => {
    return work.orderItems && work.orderItems.length > 0;
  };

  const getWorkStats = (work: any) => {
    // Utiliser les statistiques déjà calculées par l'API si disponibles
    if (work.sales) {
      return {
        sales: work.sales.quantity || 0,
        revenue: work.sales.revenue || 0,
        royalties: work.sales.royalties?.total || 0
      };
    }

    // Fallback pour la compatibilité avec l'ancien format
    const sales = work.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    const revenue = work.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
    const royalties = work.royalties?.reduce((sum: number, roy: any) => sum + roy.amount, 0) || 0;

    return { sales, revenue, royalties };
  };

  // Les filtres sont maintenant gérés côté serveur, donc on utilise directement works
  const filteredWorks = works;

  // Pagination
  const totalItems = filteredWorks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWorks = filteredWorks.slice(startIndex, endIndex);

  const getCoverImage = (work: any) => {
    // D'abord, essayer d'obtenir l'image depuis le champ files
    if (work.files) {
      try {
        const filesData = typeof work.files === 'string' ? JSON.parse(work.files) : work.files;
        if (filesData.coverImage) {
          return (
            <img
              src={filesData.coverImage}
              alt={work.title}
              className="w-full h-full object-cover"
            />
          );
        }
      } catch (e) {
        console.error("Error parsing files:", e);
      }
    }

    // Fallback: vérifier work.coverImage
    if (work.coverImage) {
      return (
        <img
          src={work.coverImage}
          alt={work.title}
          className="w-full h-full object-cover"
        />
      );
    }

    // Générer une couleur de fond basée sur le titre
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500'];
    const colorIndex = work.title.length % colors.length;

    return (
      <div className={`w-full h-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-lg`}>
        {work.title.charAt(0).toUpperCase()}
      </div>
    );
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec titre et navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Mes œuvres</h1>
            <div className="text-sm text-gray-500 mt-1">
              Création - Publication - Gestion - Suivi
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg" title="Actualiser">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg" title="Plein écran">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contrôles de filtrage et recherche */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PUBLISHED">Publiées</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="DRAFT">Brouillons</SelectItem>
                <SelectItem value="REJECTED">Refusées</SelectItem>
                <SelectItem value="SUSPENDED">Suspendues</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Afficher</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">éléments</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Rechercher:</span>
              <Input
                placeholder="Rechercher une œuvre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button onClick={() => router.push('/dashboard/auteur/creer-oeuvre')}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle œuvre
            </Button>
          </div>
        </div>
      </div>

      {/* Tableau des œuvres */}
      <div className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider">
                  <div className="flex items-center">
                    Couverture
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider">
                  <div className="flex items-center">
                    Titre
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider">
                  <div className="flex items-center">
                    Discipline
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider">
                  <div className="flex items-center">
                    Statut
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider">
                  <div className="flex items-center">
                    Prix
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider">
                  <div className="flex items-center">
                    Ventes
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider">
                  <div className="flex items-center">
                    Créé le
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider">
                  <div className="flex items-center">
                    Modifié le
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedWorks.map((work: any) => {
                const stats = getWorkStats(work);
                return (
                  <tr key={work.id} className="hover:bg-gray-50">
                    {/* Couverture */}
                    <td className="py-4 px-6">
                      <div className="w-16 h-20 rounded-lg overflow-hidden shadow-sm border">
                        {getCoverImage(work)}
                      </div>
                    </td>

                    {/* Titre */}
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-gray-900">{work.title}</div>
                      <div className="text-sm text-gray-500">{work.isbn || `REF-${work.id.slice(0, 8)}`}</div>
                    </td>

                    {/* Discipline */}
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">{work.discipline?.name || 'Non définie'}</div>
                    </td>

                    {/* Statut */}
                    <td className="py-4 px-6">
                      {getStatusBadge(work.status)}
                    </td>

                    {/* Prix */}
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">{work.price?.toLocaleString() || 0} F CFA</div>
                    </td>

                    {/* Ventes */}
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">{stats.sales}</div>
                      <div className="text-xs text-gray-500">{stats.revenue.toLocaleString()} F CFA</div>
                    </td>

                    {/* Créé le */}
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">
                        {new Date(work.createdAt).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Modifié le */}
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">
                        {work.updatedAt && work.updatedAt !== work.createdAt ?
                          new Date(work.updatedAt).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) :
                          <span className="text-gray-400">Jamais modifié</span>
                        }
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedWork(work)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                        </Dialog>

                        {canEditWork(work) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/auteur/creer-oeuvre?edit=${work.id}`)}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}

                        {canSubmitForPublication(work) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                title="Soumettre pour publication"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Soumettre pour publication</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir soumettre le livre "{work.title}" pour publication ?
                                  Le PDG examinera votre demande et pourra publier ou refuser votre livre.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleSubmitForPublication(work.id)}>
                                  Soumettre
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {canDeleteWork(work) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer l'œuvre "{work.title}" ?
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteWork(work.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)} sur {totalItems} éléments
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Premier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(1)}
              >
                1
              </Button>
              {totalPages > 1 && (
                <Button
                  variant={currentPage === 2 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(2)}
                >
                  2
                </Button>
              )}
              {totalPages > 2 && (
                <Button
                  variant={currentPage === 3 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(3)}
                >
                  3
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Dernier
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog pour les détails de l'œuvre */}
      <Dialog open={!!selectedWork} onOpenChange={() => setSelectedWork(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedWork?.title}</DialogTitle>
          </DialogHeader>
          {selectedWork && (
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-24 h-32 rounded-lg overflow-hidden shadow-sm border">
                  {getCoverImage(selectedWork)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    {getStatusBadge(selectedWork.status)}
                    <span className="text-sm text-gray-500">
                      Créée le {new Date(selectedWork.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Discipline:</span>
                      <span className="ml-2 font-medium">{selectedWork.discipline?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Prix:</span>
                      <span className="ml-2 font-medium">{selectedWork.price?.toLocaleString()} F CFA</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Stock:</span>
                      <span className="ml-2 font-medium">{selectedWork.stock}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pages:</span>
                      <span className="ml-2 font-medium">{selectedWork.pages || 'Non spécifié'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-sm text-gray-700">{selectedWork.description}</p>
              </div>

              {selectedWork.status === 'REJECTED' && selectedWork.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">Motif du refus :</p>
                  <p className="text-sm text-red-700">{selectedWork.rejectionReason}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                {canEditWork(selectedWork) && (
                  <Button
                    onClick={() => {
                      setSelectedWork(null);
                      router.push(`/dashboard/auteur/creer-oeuvre?edit=${selectedWork.id}`);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedWork(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}