"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Filter, Plus, RotateCcw, Calendar, Printer } from "lucide-react";

export default function VentesRetoursPage() {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState("20");

  return (
    <DashboardLayout title="">
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Effectif</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Effectif
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded">
                <span className="text-gray-400">↻</span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <span className="text-gray-400">⛶</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Dialog open={showSaleModal} onOpenChange={setShowSaleModal}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Effectif
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Ajouter un effectif</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Form Fields */}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Champ Classe */}
                      <div>
                        <Label>Classe</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CI">CI</SelectItem>
                            <SelectItem value="CP">CP</SelectItem>
                            <SelectItem value="CE1">CE1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Champ Effectif */}
                      <div>
                        <Label>Effectif</Label>
                        <Input type="number" defaultValue="0" />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        Enregistrer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowSaleModal(false)}
                      >
                        Fermer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

            </div>
          </div>

          {/* Filters */}


          {/* Table Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Afficher</span>
              <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">éléments</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Rechercher:</span>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    CLASSE
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    EFFECTIF
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 uppercase">
                    créé le
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 uppercase">
                    créé par
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    MODIFIÉ LE
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    Aucune donnée disponible dans le tableau
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
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
    </DashboardLayout>
  );
}
