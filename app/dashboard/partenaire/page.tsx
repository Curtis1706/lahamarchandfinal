"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, BookOpen, Package, TrendingDown, DollarSign, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";
import { useCurrentUser } from "@/hooks/use-current-user";

// Mock data pour les statistiques du partenaire
const mockStats = {
  totalCommandes: 12,
  commandesLivrees: 8,
  totalDepense: 1250000,
  livresCommandes: 45,
  commandesEnAttente: 3,
  commandesValidees: 9,
  chiffreAffaires: 1250000,
  evolution: "+15.2%"
}

export default function PartenaireDashboard() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState(mockStats);

  return (
    <DynamicDashboardLayout title="Tableau de bord">
      <div className="p-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Bienvenue, {user?.name}</h2>
              <p className="text-orange-100">Partenaire</p>
              <p className="text-sm text-orange-200 mt-1">
                Consultez votre stock alloué et passez vos commandes
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total commandes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCommandes}</p>
                <p className="text-xs text-gray-500">{stats.commandesEnAttente} en attente</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Commandes livrées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.commandesLivrees}</p>
                <p className="text-xs text-green-600">{stats.commandesValidees} validées</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">{stats.chiffreAffaires.toLocaleString()}</p>
                <p className="text-xs text-green-600">{stats.evolution} vs mois précédent</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Livres commandés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.livresCommandes}</p>
                <p className="text-xs text-gray-500">Cette année</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/partenaire/livres/liste" className="text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Consulter le catalogue</h4>
                    <p className="text-sm text-gray-500">Voir tous les livres disponibles</p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/partenaire/commandes" className="text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Nouvelle commande</h4>
                    <p className="text-sm text-gray-500">Passer une nouvelle commande</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DynamicDashboardLayout>
  );
}