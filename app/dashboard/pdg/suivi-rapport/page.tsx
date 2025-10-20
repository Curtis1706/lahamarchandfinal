"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, FileText, Users } from "lucide-react";


export default function SuiviRapportPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleRefresh = () => {
    console.log("[v0] Refreshing stock tracking data...");
  };

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Suivi et rapport</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Suivi et rapport
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 lg:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              En stock
            </h3>
            <div className="text-3xl font-bold text-gray-800">0</div>
          </div>

          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              En dépôt
            </h3>
            <div className="text-3xl font-bold text-gray-800">0</div>
          </div>

          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm text-center sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Total</h3>
            <div className="text-3xl font-bold text-gray-800">0</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-4 lg:p-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Input
                  type="date"
                  defaultValue="2025-08-22"
                  className="w-full"
                />
              </div>
              <div>
                <Select defaultValue="tous-livres">
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les livre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous-livres">Tous les livre</SelectItem>
                    <SelectItem value="francais">Français</SelectItem>
                    <SelectItem value="mathematiques">Mathématiques</SelectItem>
                    <SelectItem value="sciences">Sciences</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mb-6">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Appliquer
              </Button>
            </div>

            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="20">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input
                  placeholder=""
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">LIVRE</th>
                    <th className="text-left py-3 px-2">RÉFÉRENCE</th>
                    <th className="text-left py-3 px-2">RENTRÉE</th>
                    <th className="text-left py-3 px-2">VACANCES</th>
                    <th className="text-left py-3 px-2">DÉPÔT</th>
                    <th className="text-left py-3 px-2">CRÉÉ LE</th>
                    <th className="text-left py-3 px-2">CRÉÉ PAR</th>
                    <th className="text-left py-3 px-2">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      Aucune donnée disponible dans le tableau
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <p className="text-sm text-gray-600">
                Affichage de 0 à 0 sur 0 éléments
              </p>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Premier
                </Button>
                <Button variant="outline" size="sm">
                  Précédent
                </Button>
                <Button variant="outline" size="sm">
                  Suivant
                </Button>
                <Button variant="outline" size="sm">
                  Dernier
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
