"use client";

import { useState, useEffect } from "react";
import { Building2, Briefcase, TrendingUp, ShoppingCart, Package, MessageSquare, FileText } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { apiClient } from "@/lib/api-client";

interface DashboardStats {
  partners: {
    total: number
    active: number
    pending: number
  }
  orders: {
    total: number
    active: number
    completed: number
  }
  revenue: {
    total: number
    thisMonth: number
  }
  messages: {
    unread: number
    total: number
  }
}

export default function RepresentantDashboard() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState<DashboardStats>({
    partners: { total: 0, active: 0, pending: 0 },
    orders: { total: 0, active: 0, completed: 0 },
    revenue: { total: 0, thisMonth: 0 },
    messages: { unread: 0, total: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Charger uniquement les statistiques autorisées (partenaires, commandes, messages)
      const [conversationsData, partnersData, ordersData] = await Promise.all([
        apiClient.getRepresentantConversations(),
        apiClient.getRepresentantPartners(),
        apiClient.getRepresentantPartnerOrders()
      ]);

      // Calculer les statistiques des partenaires
      const partnersStats = {
        total: partnersData.length || 0,
        active: partnersData.filter((p: any) => p.user?.status === 'ACTIVE').length || 0,
        pending: partnersData.filter((p: any) => p.user?.status === 'PENDING').length || 0
      };

      // Calculer les statistiques des commandes des partenaires
      const ordersStats = {
        total: ordersData.length || 0,
        active: ordersData.filter((o: any) => ['PENDING', 'VALIDATED', 'PROCESSING'].includes(o.status)).length || 0,
        completed: ordersData.filter((o: any) => o.status === 'DELIVERED').length || 0
      };

      // Calculer le chiffre d'affaires
      const completedOrders = ordersData.filter((o: any) => o.status === 'DELIVERED') || [];
      const totalRevenue = completedOrders.reduce((sum: number, order: any) => {
        return sum + (order.total || 0);
      }, 0);

      // Calculer le CA du mois en cours
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthOrders = completedOrders.filter((o: any) => {
        const orderDate = new Date(o.createdAt || o.updatedAt);
        return orderDate >= currentMonthStart;
      });
      const thisMonthRevenue = thisMonthOrders.reduce((sum: number, order: any) => {
        return sum + (order.total || 0);
      }, 0);

      // Calculer les statistiques des messages
      const messagesStats = {
        unread: conversationsData.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0),
        total: conversationsData.length || 0
      };

      setStats({
        partners: partnersStats,
        orders: ordersStats,
        revenue: {
          total: totalRevenue,
          thisMonth: thisMonthRevenue
        },
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
                Gérez vos partenaires, suivez leurs commandes et rapports d'activité
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mes partenaires</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.partners.total}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.partners.active} actifs, {stats.partners.pending} en attente
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Commandes actives</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.orders.active}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.orders.total} au total
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
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : (stats.revenue.total / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-gray-500">
                  {stats.revenue.thisMonth > 0 ? `${(stats.revenue.thisMonth / 1000).toFixed(0)}k ce mois` : 'Aucune vente ce mois'}
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
              <Link href="/dashboard/representant/partenaires" className="text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Mes partenaires</h4>
                    <p className="text-sm text-gray-500">Gérer les partenaires de ma zone</p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/representant/commandes" className="text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Commandes partenaires</h4>
                    <p className="text-sm text-gray-500">Suivre les commandes de ma zone</p>
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
                    <p className="text-sm text-gray-500">Communiquer avec l'administration</p>
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