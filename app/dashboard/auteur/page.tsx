"use client";

import { useState, useEffect } from "react";
import { BookOpen, DollarSign, TrendingUp, Award } from "lucide-react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export default function AuteurDashboard() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState({
    totalWorks: 0,
    totalRoyalties: 0,
    unpaidRoyalties: 0,
    totalSales: 0
  });
  const [works, setWorks] = useState([]);
  const [royalties, setRoyalties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const worksData = await apiClient.getWorks();
      
      // Filter works by current author
      const myWorks = worksData.filter((work: any) => 
        work.authorId === user.id
      );

      // Calculate stats from works
      const totalSales = myWorks.reduce((sum: number, work: any) => {
        return sum + (work.sales?.reduce((salesSum: number, sale: any) => salesSum + sale.amount, 0) || 0);
      }, 0);

      const totalRoyalties = myWorks.reduce((sum: number, work: any) => {
        return sum + (work.royalties?.reduce((roySum: number, roy: any) => roySum + roy.amount, 0) || 0);
      }, 0);

      const unpaidRoyalties = myWorks.reduce((sum: number, work: any) => {
        return sum + (work.royalties?.filter((roy: any) => !roy.paid)
          .reduce((roySum: number, roy: any) => roySum + roy.amount, 0) || 0);
      }, 0);

      setStats({
        totalWorks: myWorks.length,
        totalRoyalties,
        unpaidRoyalties,
        totalSales
      });

      setWorks(myWorks.slice(0, 5)); // Show only first 5 works
      
      // Extract royalties for the recent royalties section
      const allRoyalties = myWorks.flatMap((work: any) => 
        work.royalties?.map((roy: any) => ({
          ...roy,
          workTitle: work.title
        })) || []
      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setRoyalties(allRoyalties.slice(0, 5));
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
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Bienvenue, {user?.name}</h2>
              <p className="text-green-100">Auteur</p>
              <p className="text-sm text-green-200 mt-1">
                Suivez vos œuvres et vos droits d'auteur
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mes œuvres</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWorks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Royalties totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRoyalties.toLocaleString()}</p>
                <p className="text-xs text-gray-500">F CFA</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">À recevoir</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unpaidRoyalties.toLocaleString()}</p>
                <p className="text-xs text-gray-500">F CFA</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ventes totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSales.toLocaleString()}</p>
                <p className="text-xs text-gray-500">F CFA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Works */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Mes œuvres</h3>
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
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {work.sales?.reduce((sum: number, sale: any) => sum + sale.amount, 0)?.toLocaleString() || 0} F CFA
                        </p>
                        <p className="text-xs text-gray-500">Ventes</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune œuvre</h4>
                  <p className="text-gray-500">Vous n'avez pas encore d'œuvre publiée.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Royalties */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Royalties récentes</h3>
            </div>
            <div className="p-6">
              {royalties.length > 0 ? (
                <div className="space-y-4">
                  {royalties.map((royalty: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 w-3 rounded-full ${royalty.paid ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {royalty.workTitle}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(royalty.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {royalty.amount.toLocaleString()} F CFA
                        </p>
                        <p className={`text-xs ${royalty.paid ? 'text-green-600' : 'text-yellow-600'}`}>
                          {royalty.paid ? 'Payé' : 'En attente'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune royalty</h4>
                  <p className="text-gray-500">Vous n'avez pas encore de droits d'auteur.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DynamicDashboardLayout>
  );
}