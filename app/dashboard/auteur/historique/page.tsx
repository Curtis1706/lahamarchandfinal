"use client";

import { useState, useEffect } from "react";
import { History, Search, Filter, Calendar, BookOpen, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export default function HistoriquePage() {
  const { user } = useCurrentUser();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    loadWorks();
  }, [user]);

  const loadWorks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const worksData = await apiClient.getWorks();
      
      // Filter works by current author and sort by creation date (most recent first)
      const myWorks = worksData
        .filter((work: any) => work.authorId === user.id)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setWorks(myWorks);
    } catch (error) {
      console.error("Error loading works:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      DRAFT: { 
        label: "Brouillon", 
        color: "bg-gray-100 text-gray-800",
        icon: <FileText className="w-3 h-3" />
      },
      PENDING: { 
        label: "En attente", 
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="w-3 h-3" />
      },
      PUBLISHED: { 
        label: "Publiée", 
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-3 h-3" />
      },
      SUSPENDED: { 
        label: "Suspendue", 
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="w-3 h-3" />
      },
      REJECTED: { 
        label: "Refusée", 
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="w-3 h-3" />
      }
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.DRAFT;
  };

  const getTimelineEvents = (work: any) => {
    const events = [];
    
    // Création
    events.push({
      date: work.createdAt,
      type: "created",
      title: "Œuvre créée",
      description: "Création de l'œuvre en brouillon",
      status: "DRAFT"
    });

    // Si soumise pour validation
    if (work.status !== 'DRAFT') {
      events.push({
        date: work.updatedAt,
        type: "submitted",
        title: "Soumise pour validation",
        description: "L'œuvre a été soumise pour validation",
        status: "PENDING"
      });
    }

    // Si publiée
    if (work.status === 'PUBLISHED') {
      events.push({
        date: work.updatedAt,
        type: "published",
        title: "Œuvre publiée",
        description: "L'œuvre a été validée et publiée",
        status: "PUBLISHED"
      });
    }

    // Si refusée
    if (work.status === 'REJECTED') {
      events.push({
        date: work.updatedAt,
        type: "rejected",
        title: "Œuvre refusée",
        description: work.rejectionReason || "L'œuvre a été refusée",
        status: "REJECTED"
      });
    }

    // Si suspendue
    if (work.status === 'SUSPENDED') {
      events.push({
        date: work.updatedAt,
        type: "suspended",
        title: "Œuvre suspendue",
        description: "L'œuvre a été suspendue",
        status: "SUSPENDED"
      });
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filterWorks = () => {
    let filtered = works;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((work: any) =>
        work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.discipline?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((work: any) => work.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter((work: any) => 
        new Date(work.createdAt) >= filterDate
      );
    }

    return filtered;
  };

  const getWorkStats = (work: any) => {
    const sales = work.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    const revenue = work.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
    const royalties = work.royalties?.reduce((sum: number, roy: any) => sum + roy.amount, 0) || 0;
    
    return { sales, revenue, royalties };
  };

  const filteredWorks = filterWorks();

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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique des publications</h1>
          <p className="text-gray-600">Consultez l'historique complet de vos œuvres</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher une œuvre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="DRAFT">Brouillons</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="PUBLISHED">Publiées</SelectItem>
            <SelectItem value="REJECTED">Refusées</SelectItem>
            <SelectItem value="SUSPENDED">Suspendues</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les périodes</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{works.length}</div>
            <div className="text-sm text-gray-600">Œuvres créées</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {works.filter((w: any) => w.status === 'PUBLISHED').length}
            </div>
            <div className="text-sm text-gray-600">Œuvres publiées</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {works.filter((w: any) => w.status === 'PENDING').length}
            </div>
            <div className="text-sm text-gray-600">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {works.reduce((sum: number, work: any) => {
                const royalties = work.royalties?.reduce((roySum: number, roy: any) => roySum + roy.amount, 0) || 0;
                return sum + royalties;
              }, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">F CFA de royalties</div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline des œuvres */}
      {filteredWorks.length > 0 ? (
        <div className="space-y-6">
          {filteredWorks.map((work: any) => {
            const statusInfo = getStatusInfo(work.status);
            const stats = getWorkStats(work);
            const timeline = getTimelineEvents(work);
            
            return (
              <Card key={work.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{work.title}</CardTitle>
                        <p className="text-sm text-gray-600">{work.discipline?.name}</p>
                      </div>
                    </div>
                    <Badge className={statusInfo.color}>
                      {statusInfo.icon}
                      <span className="ml-1">{statusInfo.label}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Informations de l'œuvre */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Informations</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Prix :</span>
                            <span className="ml-2 font-medium">{work.price?.toLocaleString() || 0} F CFA</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Stock :</span>
                            <span className="ml-2 font-medium">{work.stock || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Ventes :</span>
                            <span className="ml-2 font-medium text-blue-600">{stats.sales}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Royalties :</span>
                            <span className="ml-2 font-medium text-green-600">{stats.royalties.toLocaleString()} F CFA</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-700 line-clamp-3">{work.description}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Historique</h4>
                      <div className="space-y-3">
                        {timeline.map((event, index) => {
                          const eventStatusInfo = getStatusInfo(event.status);
                          return (
                            <div key={index} className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  event.status === 'PUBLISHED' ? 'bg-green-500' :
                                  event.status === 'REJECTED' || event.status === 'SUSPENDED' ? 'bg-red-500' :
                                  event.status === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-500'
                                }`}></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(event.date).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-600">{event.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun historique trouvé</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all" || dateFilter !== "all"
              ? "Aucune œuvre ne correspond à vos critères de recherche."
              : "Vous n'avez pas encore créé d'œuvre."}
          </p>
        </div>
      )}
    </div>
  );
}



