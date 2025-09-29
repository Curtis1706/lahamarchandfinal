"use client";

import { useState, useEffect } from "react";
import { User, BookOpen, ShoppingCart } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

const books = [
  {
    title: "COFFRET RÉUSSIR EN MATHÉMATIQUES CE1",
    subject: "MATHÉMATIQUES, CE1",
    price: "1700 F CFA",
    image: "/01.png",
  },
  {
    title: "RÉUSSIR EN DICTÉE ORTHOGRAPHE CE1-CE2",
    subject: "FRANÇAIS, CE1, CE2",
    price: "900 F CFA",
    image: "/02.png",
  },
  {
    title: "RÉUSSIR EN MATHÉMATIQUES - MANUEL DE CM2",
    subject: "MATHÉMATIQUES, CM2",
    price: "900 F CFA",
    image: "/01.png",
  },
];

export default function PDGDashboard() {
  const { user } = useCurrentUser();
  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorks: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBookIndex((prev) => (prev + 1) % books.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usersData, worksData, ordersData] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getWorks(),
        apiClient.getOrders().catch(() => []) // Orders API might not exist yet
      ]);

      setStats({
        totalUsers: usersData.length,
        totalWorks: worksData.length,
        totalOrders: ordersData.length || 0,
        totalRevenue: worksData.reduce((sum: number, work: any) => {
          return sum + (work.sales?.reduce((salesSum: number, sale: any) => salesSum + sale.amount, 0) || 0);
        }, 0)
      });

      setWorks(worksData.slice(0, 3)); // Show only first 3 works
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const currentBook = books[currentBookIndex];

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
    <>
      {/* Zone graphique */}
      <div className="relative mb-6 w-full">
        <div className="h-80 bg-slate-700 relative overflow-hidden rounded-lg">
          {/* Grille */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full">
              {[0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map((y, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={`${y * 100}%`}
                  x2="100%"
                  y2={`${y * 100}%`}
                  stroke="#626E82"
                  strokeWidth="1"
                />
              ))}
              {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((_, i) => (
                <line
                  key={i}
                  x1={`${(i + 1) * 14.28}%`}
                  y1="0"
                  x2={`${(i + 1) * 14.28}%`}
                  y2="100%"
                  stroke="#626E82"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>

          {/* Labels X */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-around text-[#626E82] text-sm">
            {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          {/* Labels Y */}
          <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-between text-[#626E82] text-sm py-4">
            {[0.875, 0.75, 0.625, 0.5, 0.375, 0.25, 0.125, 0].map((val) => (
              <span key={val}>{val}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {/* Grille générale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Card PDG */}
          <div className="bg-[#6967CE] rounded-2xl p-6 text-white flex items-center justify-between shadow-lg h-40">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{user?.name || "PDG"}</h3>
                <p className="text-indigo-200">{user?.email || "pdg@laha.gabon"}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-yellow-500 text-yellow-900 rounded-full text-xs font-medium">
                  {user?.role || "PDG"}
                </span>
              </div>
            </div>
          </div>

          {/* Card Livre */}
          <div className="bg-white rounded-2xl p-6 shadow-lg flex items-center justify-between h-40">
            <div className="flex-1 pr-6">
              <h3 className="font-bold text-gray-800 mb-2 text-sm leading-tight">
                {currentBook.title}
              </h3>
              <p className="text-gray-500 text-xs mb-4">— {currentBook.subject}</p>
              <div className="inline-block px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold text-xs">
                {currentBook.price}
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src={currentBook.image}
                alt={currentBook.title}
                className="w-24 h-28 object-contain rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Ligne stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#FA626B] rounded-2xl p-6 text-white shadow-lg h-40 flex items-center">
            <ShoppingCart className="w-8 h-8 mr-4 opacity-80" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Utilisateurs</h3>
              <p className="text-2xl font-bold">
                {stats.totalUsers} <span className="text-base">Utilisateur(s)</span>
              </p>
              <p className="text-red-100">Total inscrits</p>
            </div>
          </div>

          <div className="bg-gray-700 rounded-2xl p-6 text-white shadow-lg h-40 flex items-center">
            <BookOpen className="w-8 h-8 mr-4 opacity-80" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Œuvres publiées</h3>
              <p className="text-2xl font-bold">
                {stats.totalWorks} <span className="text-base">Livre(s)</span>
              </p>
              <p className="text-gray-300">Catalogue</p>
            </div>
          </div>

          <div className="bg-[#5ED84F] rounded-2xl p-6 text-white shadow-lg h-40 flex items-center">
            <ShoppingCart className="w-8 h-8 mr-4 opacity-80" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Revenus totaux</h3>
              <p className="text-2xl font-bold">
                {stats.totalRevenue.toLocaleString()} <span className="text-base">F CFA</span>
              </p>
              <p className="text-green-100">Ventes cumulées</p>
            </div>
          </div>
        </div>

        {/* Ligne validations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm h-40 flex items-center">
            <ShoppingCart className="w-8 h-8 mr-4 text-blue-500" />
            <div>
              <h3 className="text-blue-600 font-semibold mb-2">Validés aux clients</h3>
              <p className="text-2xl font-bold text-blue-600">
                5 <span className="text-base">Livre(s)</span>
              </p>
              <p className="text-blue-400">12500 F CFA</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm h-40 flex items-center">
            <ShoppingCart className="w-8 h-8 mr-4 text-purple-500" />
            <div>
              <h3 className="text-purple-600 font-semibold mb-2">Aux collaborateurs</h3>
              <p className="text-2xl font-bold text-purple-600">
                0 <span className="text-base">Livre(s)</span>
              </p>
              <p className="text-purple-400">0 F CFA</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm h-40 flex items-center">
            <ShoppingCart className="w-8 h-8 mr-4 text-red-500" />
            <div>
              <h3 className="text-red-600 font-semibold mb-2">Total validé</h3>
              <p className="text-2xl font-bold text-red-600">
                5 <span className="text-base">Livre(s)</span>
              </p>
              <p className="text-red-400">12500 F CFA</p>
            </div>
          </div>
        </div>

        {/* Stock épuisé */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Stock épuisé</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">REF</th>
                <th className="text-left py-2">QTE.RT</th>
                <th className="text-left py-2">QTE.VC</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <span>Philosophie Tle Bac Facile TOME 2</span>
                </td>
                <td>0</td>
                <td>0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
