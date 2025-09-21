"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout-client";

export default function ClientDashboard() {
  const [dateRange, setDateRange] = useState({
    start: "23 août 2025",
    end: "21 sept. 2025",
  });

  return (
    <DashboardLayout title="">
      <div className="w-full p-6 space-y-6">
        {/* Titre */}
        <h1 className="text-2xl font-semibold text-gray-800">Mes commandes</h1>

        {/* Cartes résumé */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center justify-center">
            <p className="text-gray-600">Validée</p>
            <p className="text-2xl font-semibold">0</p>
            <span className="text-gray-400">---------</span>
            <p className="text-sm font-medium text-gray-700">0 XOF</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center justify-center">
            <p className="text-gray-600">Livraison en cours</p>
            <p className="text-2xl font-semibold">0</p>
            <span className="text-gray-400">---------</span>
            <p className="text-sm font-medium text-gray-700">0 XOF</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center justify-center">
            <p className="text-gray-600">Livrée/Réceptionnée</p>
            <p className="text-2xl font-semibold">5</p>
            <span className="text-gray-400">---------</span>
            <p className="text-sm font-medium text-gray-700">12500 XOF</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white shadow rounded-lg p-4 space-y-4">
          <button className="flex items-center px-3 py-2 text-white bg-[#7367F0] rounded-md">
            <span className="mr-2">Filtre avancé</span>
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V20a1 1 0 01-1.447.894l-4-2A1 1 0 018 18v-4.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
          </button>

          {/* Sélecteur de dates */}
          <div className="flex items-center justify-between">
            <div className="flex items-center border px-3 py-2 rounded-md text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>
                {dateRange.start} - {dateRange.end}
              </span>
            </div>
            <button className="px-4 py-2 bg-[#7367F0] text-white rounded-md">
              Appliquer ✓
            </button>
          </div>

          {/* Résumé sous filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-600">Validée</p>
              <p className="text-lg font-semibold">0</p>
              <p className="text-sm text-gray-500">0 XOF</p>
            </div>
            <div>
              <p className="text-gray-600">Livraison en cours</p>
              <p className="text-lg font-semibold">0</p>
              <p className="text-sm text-gray-500">0 XOF</p>
            </div>
            <div>
              <p className="text-gray-600">Livrée/Réceptionnée</p>
              <p className="text-lg font-semibold">0</p>
              <p className="text-sm text-gray-500">0 XOF</p>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="mr-2 text-sm text-gray-600">Afficher</label>
              <select className="border rounded-md px-2 py-1 text-sm">
                <option>20</option>
                <option>50</option>
                <option>100</option>
              </select>
              <span className="ml-1 text-sm text-gray-600">éléments</span>
            </div>
            <div>
              <input
                type="text"
                placeholder="Rechercher..."
                className="border rounded-md px-2 py-1 text-sm"
              />
            </div>
          </div>

          <table className="w-full border text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2">Date de validation</th>
                <th className="px-3 py-2">Nom du livre</th>
                <th className="px-3 py-2">Qte envoyée</th>
                <th className="px-3 py-2">Montant</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Qte demandée</th>
                <th className="px-3 py-2">Qte déjà envoyée</th>
                <th className="px-3 py-2">Commande</th>
                <th className="px-3 py-2">Validé par</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-500">
                  Aucune donnée disponible dans le tableau
                </td>
              </tr>
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
            <p>Affichage de 0 à 0 sur 0 éléments</p>
            <div className="flex space-x-2">
              <button className="px-2 py-1 border rounded-md">Premier</button>
              <button className="px-2 py-1 border rounded-md">Précédent</button>
              <button className="px-2 py-1 border rounded-md">Suivant</button>
              <button className="px-2 py-1 border rounded-md">Dernier</button>
            </div>
          </div>

          {/* Boutons export */}
          <div className="flex space-x-2 justify-end mt-4">
            <button className="px-4 py-2 bg-[#7367F0] text-white rounded-md">
              PDF
            </button>
            <button className="px-4 py-2 bg-[#7367F0] text-white rounded-md">
              EXCEL
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
