"use client";

import { useState, useEffect } from "react";
import { DollarSign, Search, Filter, CheckCircle, Clock, Wallet, Calendar, TrendingUp, Download, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

interface Royalty {
  id: string;
  amount: number;
  paid: boolean;
  createdAt: string;
  paidAt?: string;
  work: {
    id: string;
    title: string;
    coverImage?: string;
    discipline: { name: string };
    orderItems?: any[];
  };
}

export default function MesDroitsPage() {
  const { user } = useCurrentUser();
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRoyalty, setSelectedRoyalty] = useState<Royalty | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      loadRoyalties();
    }
  }, [user]);

  const loadRoyalties = async () => {
    try {
      setLoading(true);
      const allWorks = await apiClient.getWorks();
      const myWorks = allWorks.filter((work: any) => work.authorId === user?.id);
      
      // Extract all royalties from my works
      const allRoyalties = myWorks.flatMap((work: any) =>
        work.royalties?.map((royalty: any) => ({
          ...royalty,
          work: {
            id: work.id,
            title: work.title,
            coverImage: work.coverImage,
            discipline: work.discipline,
            orderItems: work.orderItems
          }
        })) || []
      );
      
      // Sort by creation date (newest first)
      allRoyalties.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setRoyalties(allRoyalties);
    } catch (error) {
      console.error("Error loading royalties:", error);
      toast.error("Erreur lors du chargement de vos droits d'auteur.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (paid: boolean) => {
    return paid ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Payée
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        En attente
      </Badge>
    );
  };

  const getWorkCover = (work: any) => {
    if (work.coverImage) {
      return work.coverImage;
    }
    
    // Generate a color based on work title
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500'];
    const colorIndex = work.title.length % colors.length;
    
    return (
      <div className={`w-full h-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-lg`}>
        {work.title.charAt(0).toUpperCase()}
      </div>
    );
  };

  const getRoyaltyStats = () => {
    const total = royalties.reduce((sum, roy) => sum + roy.amount, 0);
    const paid = royalties.filter(roy => roy.paid).reduce((sum, roy) => sum + roy.amount, 0);
    const pending = royalties.filter(roy => !roy.paid).reduce((sum, roy) => sum + roy.amount, 0);
    
    return { total, paid, pending };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter royalties based on search and status
  const filteredRoyalties = royalties.filter(royalty => {
    const matchesSearch = royalty.work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         royalty.work.discipline.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'paid' && royalty.paid) ||
                         (statusFilter === 'pending' && !royalty.paid);
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalItems = filteredRoyalties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoyalties = filteredRoyalties.slice(startIndex, endIndex);

  const stats = getRoyaltyStats();

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
            <h1 className="text-2xl font-semibold text-gray-900">Mes droits d'auteur</h1>
            <div className="text-sm text-gray-500 mt-1">
              Revenus - Paiements - Historique - Statistiques
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

      {/* Statistiques en cartes */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total des royalties</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.total)}</p>
                  <p className="text-xs text-blue-600">Tous temps</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Royalties payées</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.paid)}</p>
                  <p className="text-xs text-green-600">Déjà reçues</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">En attente de paiement</p>
                  <p className="text-2xl font-bold text-yellow-900">{formatCurrency(stats.pending)}</p>
                  <p className="text-xs text-yellow-600">À recevoir</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
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
                <SelectItem value="paid">Payées</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
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
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Tableau des royalties */}
      <div className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider">
                  <div className="flex items-center">
                    Œuvre
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
                    Montant
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
                    Date de génération
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider">
                  <div className="flex items-center">
                    Date de paiement
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
              {paginatedRoyalties.map((royalty) => (
                <tr key={royalty.id} className="hover:bg-gray-50">
                  {/* Œuvre */}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-16 rounded-lg overflow-hidden shadow-sm border">
                        {getWorkCover(royalty.work)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{royalty.work.title}</div>
                        <div className="text-xs text-gray-500">ID: {royalty.work.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Discipline */}
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900">{royalty.work.discipline.name}</div>
                  </td>
                  
                  {/* Montant */}
                  <td className="py-4 px-6">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(royalty.amount)}</div>
                    <div className="text-xs text-gray-500">
                      {royalty.work.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0} ventes
                    </div>
                  </td>
                  
                  {/* Statut */}
                  <td className="py-4 px-6">
                    {getStatusBadge(royalty.paid)}
                  </td>
                  
                  {/* Date de génération */}
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900">{formatDate(royalty.createdAt)}</div>
                  </td>
                  
                  {/* Date de paiement */}
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900">
                      {royalty.paidAt ? formatDate(royalty.paidAt) : 
                       <span className="text-gray-400">Non payée</span>}
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedRoyalty(royalty)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>

                      <Button variant="ghost" size="sm" title="Télécharger le reçu">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Dialog pour les détails de la royalty */}
      <Dialog open={!!selectedRoyalty} onOpenChange={() => setSelectedRoyalty(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du droit d'auteur</DialogTitle>
          </DialogHeader>
          {selectedRoyalty && (
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-28 rounded-lg overflow-hidden shadow-sm border">
                  {getWorkCover(selectedRoyalty.work)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedRoyalty.work.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{selectedRoyalty.work.discipline.name}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(selectedRoyalty.amount)}
                    </div>
                    {getStatusBadge(selectedRoyalty.paid)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Générée le:</span>
                      <span className="ml-2 font-medium">{formatDate(selectedRoyalty.createdAt)}</span>
                    </div>
                    {selectedRoyalty.paidAt && (
                      <div>
                        <span className="text-gray-600">Payée le:</span>
                        <span className="ml-2 font-medium">{formatDate(selectedRoyalty.paidAt)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Ventes:</span>
                      <span className="ml-2 font-medium">
                        {selectedRoyalty.work.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">ID:</span>
                      <span className="ml-2 font-medium font-mono text-xs">{selectedRoyalty.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {!selectedRoyalty.paid && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Paiement en attente</p>
                      <p className="text-sm text-yellow-700">
                        Cette royalty sera payée selon le calendrier de paiement établi.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le reçu
                </Button>
                <Button variant="outline" onClick={() => setSelectedRoyalty(null)}>
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