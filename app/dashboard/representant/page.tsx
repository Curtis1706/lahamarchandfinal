"use client";

import { useState, useEffect } from "react";
import { Users, Briefcase, TrendingUp, Target, BookOpen, MessageSquare, FileText, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { apiClient } from "@/lib/api-client";

interface DashboardStats {
  authors: {
    total: number
    active: number
    pending: number
  }
  works: {
    total: number
    pending: number
    published: number
    underReview: number
  }
  orders: {
    total: number
    active: number
    completed: number
  }
  messages: {
    unread: number
    total: number
  }
}

export default function RepresentantDashboard() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState<DashboardStats>({
    authors: { total: 0, active: 0, pending: 0 },
    works: { total: 0, pending: 0, published: 0, underReview: 0 },
    orders: { total: 0, active: 0, completed: 0 },
    messages: { unread: 0, total: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Charger les statistiques en parallèle
      const [authorsData, worksData, conversationsData] = await Promise.all([
        apiClient.getRepresentantAuthors(),
        apiClient.getRepresentantWorks(),
        apiClient.getRepresentantConversations()
      ]);

      // Calculer les statistiques des auteurs
      const authorsStats = {
        total: authorsData.length,
        active: authorsData.filter((a: any) => a.status === 'ACTIVE').length,
        pending: authorsData.filter((a: any) => a.status === 'PENDING').length
      };

      // Calculer les statistiques des œuvres
      const worksStats = {
        total: worksData.length,
        pending: worksData.filter((w: any) => w.status === 'PENDING').length,
        published: worksData.filter((w: any) => w.status === 'PUBLISHED').length,
        underReview: worksData.filter((w: any) => w.status === 'UNDER_REVIEW').length
      };

      // Calculer les statistiques des messages
      const messagesStats = {
        unread: conversationsData.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0),
        total: conversationsData.length
      };

      setStats({
        authors: authorsStats,
        works: worksStats,
        orders: { total: 0, active: 0, completed: 0 }, // TODO: Implémenter les commandes
        messages: messagesStats
      });

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Bienvenue, {user?.name}</h2>
              <p className="text-yellow-100">Représentant commercial</p>
              <p className="text-sm text-yellow-200 mt-1">
                Gérez vos auteurs, validez les œuvres et suivez les commandes
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mes auteurs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.authors.total}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.authors.active} actifs, {stats.authors.pending} en attente
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Œuvres en attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.works.pending}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.works.underReview} en révision
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Œuvres publiées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.works.published}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.works.total} au total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.messages.unread}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.messages.total} conversations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/dashboard/representant/auteurs" className="text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Gérer les auteurs</h4>
                    <p className="text-sm text-gray-500">Ajouter et valider des auteurs</p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/representant/oeuvres" className="text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Valider les œuvres</h4>
                    <p className="text-sm text-gray-500">Transmettre au PDG</p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/representant/messagerie" className="text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Messagerie</h4>
                    <p className="text-sm text-gray-500">Communiquer avec PDG et auteurs</p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/representant/rapports" className="text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Rapports</h4>
                    <p className="text-sm text-gray-500">Générer des rapports d'activité</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
    </div>
  );
}