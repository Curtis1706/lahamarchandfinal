"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Calendar, Printer, RefreshCw, Maximize2 } from "lucide-react";

export default function BonSortiePage() {
  const handleRefresh = () => {
    console.log("[v0] Refreshing table data...");
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Bon de sortie</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Bon de sortie
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 w-full justify-start">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">23 août 2025 - 21 sept. 2025</span>
                </button>
              </div>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="valide">Validé</SelectItem>
                  <SelectItem value="en-attente">En attente</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les commandes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes les commandes</SelectItem>
                  <SelectItem value="commande">Commande</SelectItem>
                  <SelectItem value="precommande">Précommande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Vacances et rentrée scolaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cours-vacances">
                    Cours de vacances
                  </SelectItem>
                  <SelectItem value="rentree-scolaire">
                    Rentrée scolaire
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex justify-end">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Filter className="w-4 h-4 mr-2" />
                  Appliquer
                </Button>
              </div>
            </div>
          </div>

          {/* Table Controls */}
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="10">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input placeholder="" className="w-full sm:w-64" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">
                    Référence
                  </th>
                  <th className="text-left p-4 font-medium text-gray-700">
                    Commande
                  </th>
                  <th className="text-left p-4 font-medium text-gray-700">
                    Généré par
                  </th>
                  <th className="text-left p-4 font-medium text-gray-700">
                    Client
                  </th>
                  <th className="text-left p-4 font-medium text-gray-700">
                    Validé par
                  </th>
                  <th className="text-left p-4 font-medium text-gray-700">
                    Validé le
                  </th>
                  <th className="text-left p-4 font-medium text-gray-700">
                    Contrôlé par
                  </th>
                  <th className="text-left p-4 font-medium text-gray-700">
                    Contrôlé le
                  </th>
                  <th className="text-left p-4 font-medium text-gray-700">
                    Statut
                  </th>
                  <th className="text-left p-4 font-medium text-gray-700">
                    Créé le
                  </th>
                  <th className="text-left p-4 font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-500">
                    Aucune donnée disponible dans le tableau
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-gray-600">
                Affichage de 0 à 0 sur 0 éléments
              </p>

              <div className="flex items-center space-x-2">
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

          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-end space-x-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                PDF
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                EXCEL
              </Button>
              <Button variant="outline">
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
