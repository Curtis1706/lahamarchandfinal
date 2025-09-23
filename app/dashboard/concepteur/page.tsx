"use client";

import { useState, useEffect } from "react";
import { BookOpen, PenTool, Clock, CheckCircle } from "lucide-react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export default function ConcepteurDashboard() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState({
    totalProjects: 0,
    publishedWorks: 0,
    pendingProjects: 0,
    totalRevenue: 0
  });
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const worksData = await apiClient.getWorks();
      
      // Filter works by current concepteur
      const myWorks = worksData.filter((work: any) => 
        work.concepteurId === user.id
      );

      setStats({
        totalProjects: myWorks.length, // Simplified - in real app would fetch projects separately
        publishedWorks: myWorks.filter((work: any) => work.status === "PUBLISHED").length,
        pendingProjects: myWorks.filter((work: any) => work.status === "DRAFT").length,
        totalRevenue: myWorks.reduce((sum: number, work: any) => {
          return sum + (work.sales?.reduce((salesSum: number, sale: any) => salesSum + sale.amount, 0) || 0);
        }, 0)
      });

      setWorks(myWorks.slice(0, 5)); // Show only first 5 works
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DynamicDashboardLayout title="Tableau de bord">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </DynamicDashboardLayout>
    );
  }

  return (
    <DynamicDashboardLayout title="Tableau de bord" showActions={true} onRefresh={loadDashboardData}>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <PenTool className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Bienvenue, {user?.name}</h2>
              <p className="text-blue-100">Concepteur pédagogique</p>
              <p className="text-sm text-blue-200 mt-1">
                Créez et gérez vos projets éducatifs
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <PenTool className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projets totaux</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Œuvres publiées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedWorks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenus générés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">F CFA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Works */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Mes œuvres récentes</h3>
            </div>
            <div className="p-6">
              {works.length > 0 ? (
                <div className="space-y-4">
                  {works.map((work: any) => (
                    <div key={work.id} className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {work.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {work.discipline.name} • {work.price.toLocaleString()} F CFA
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        work.status === "PUBLISHED" ? "bg-green-100 text-green-800" :
                        work.status === "ON_SALE" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {work.status === "PUBLISHED" ? "Publié" :
                         work.status === "ON_SALE" ? "En vente" : work.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune œuvre</h4>
                  <p className="text-gray-500">Vous n'avez pas encore créé d'œuvre.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <button className="w-full text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <PenTool className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Nouveau projet</h4>
                      <p className="text-sm text-gray-500">Créer un nouveau projet éducatif</p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Voir mes œuvres</h4>
                      <p className="text-sm text-gray-500">Gérer toutes mes œuvres publiées</p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Projets en cours</h4>
                      <p className="text-sm text-gray-500">Continuer mes projets en développement</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DynamicDashboardLayout>
  );
}