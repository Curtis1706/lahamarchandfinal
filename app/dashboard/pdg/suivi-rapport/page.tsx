"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, FileText, Users, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface TrackingData {
  id: string;
  livre: string;
  reference: string;
  rentree: number;
  vacances: number;
  depot: number;
  stockActuel: number;
  creeLe: string;
  creePar: string;
  description: string;
  discipline: string;
}

interface Stats {
  enStock: number;
  enDepot: number;
  total: number;
}

export default function SuiviRapportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("tous-livres");
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ enStock: 0, enDepot: 0, total: 0 });
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [disciplines, setDisciplines] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadDisciplines();
  }, []);

  useEffect(() => {
    loadTrackingData();
  }, [currentPage, itemsPerPage, dateFilter, disciplineFilter, searchTerm]);

  const loadDisciplines = async () => {
    try {
      const data = await apiClient.getDisciplines();
      setDisciplines(data || []);
    } catch (error) {
      console.error("Error loading disciplines:", error);
    }
  };

  const loadTrackingData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (dateFilter) {
        params.append("date", dateFilter);
      }
      if (disciplineFilter && disciplineFilter !== "tous-livres") {
        params.append("disciplineId", disciplineFilter);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/pdg/suivi-rapport?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setStats(data.stats || { enStock: 0, enDepot: 0, total: 0 });
      setTrackingData(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading tracking data:", error);
      toast.error("Erreur lors du chargement des données de suivi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTrackingData();
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadTrackingData();
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      toast.info(`Export ${format.toUpperCase()} en cours de préparation...`);
      // TODO: Implémenter l'export PDF/Excel
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Suivi et rapport</h2>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
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
            <div className="text-3xl font-bold text-gray-800">
              {stats.enStock.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              En dépôt
            </h3>
            <div className="text-3xl font-bold text-gray-800">
              {stats.enDepot.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm text-center sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Total</h3>
            <div className="text-3xl font-bold text-gray-800">
              {stats.total.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-4 lg:p-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les livres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous-livres">Tous les livres</SelectItem>
                    {disciplines.map((discipline) => (
                      <SelectItem key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mb-6">
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleApplyFilters}>
                Appliquer
              </Button>
            </div>

            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => {
                    setItemsPerPage(parseInt(v));
                    setCurrentPage(1);
                  }}
                >
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
                  placeholder="Titre, ISBN..."
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
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">LIVRE</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">RÉFÉRENCE</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">RENTRÉE</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">VACANCES</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">DÉPÔT</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">CRÉÉ LE</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">CRÉÉ PAR</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        Chargement...
                      </td>
                    </tr>
                  ) : trackingData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        Aucune donnée disponible dans le tableau
                      </td>
                    </tr>
                  ) : (
                    trackingData.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">{item.livre}</td>
                        <td className="py-3 px-2">{item.reference}</td>
                        <td className="py-3 px-2">{item.rentree.toLocaleString()}</td>
                        <td className="py-3 px-2">{item.vacances.toLocaleString()}</td>
                        <td className="py-3 px-2">{item.depot.toLocaleString()}</td>
                        <td className="py-3 px-2">{item.creeLe}</td>
                        <td className="py-3 px-2">{item.creePar}</td>
                        <td className="py-3 px-2 text-sm text-gray-600 truncate max-w-xs" title={item.description}>
                          {item.description}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <p className="text-sm text-gray-600">
                Affichage de {startIndex} à {endIndex} sur {totalItems} éléments
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Premier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Dernier
                </Button>
              </div>
            </div>

            {/* Export */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleExport("pdf")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("excel")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                EXCEL
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
