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
import { Edit, Power } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const collections = [
  {
    id: 1,
    nom: "Collection LAHA",
    description: "",
    statut: "Disponible",
    creeLe: "sam. 20 juil. 2024 18:33",
    creePar: "Super administrateur (FASSINOU)",
    modifieLe: "Invalid date",
  },
  {
    id: 2,
    nom: "Collection citoyenne",
    description: "",
    statut: "Disponible",
    creeLe: "sam. 20 juil. 2024 18:33",
    creePar: "Super administrateur (FASSINOU)",
    modifieLe: "Invalid date",
  },
  {
    id: 3,
    nom: "Collection vitale",
    description: "",
    statut: "Disponible",
    creeLe: "sam. 20 juil. 2024 18:33",
    creePar: "Super administrateur (FASSINOU)",
    modifieLe: "Invalid date",
  },
];

export default function CollectionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRefresh = () => {
    console.log("[v0] Refreshing collections data...");
  };

  const filteredCollections = collections.filter((collection) => {
    const matchesSearch = collection.nom
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || collection.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Collections</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Collections
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-4 lg:p-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="Disponible">Disponible</SelectItem>
                    <SelectItem value="Indisponible">Indisponible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ouvre la modale */}
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setIsModalOpen(true)}
              >
                Collection +
              </Button>
            </div>

            {/* --- MODALE --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Ajouter une collection
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nom :
                    </label>
                    <Input placeholder="" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description :
                    </label>
                    <Textarea placeholder="" rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Statut :
                    </label>
                    <Select defaultValue="Disponible">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Disponible">Disponible</SelectItem>
                        <SelectItem value="Indisponible">
                          Indisponible
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Fermer
                  </Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    Enregistrer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">NOM</th>
                    <th className="text-left py-3 px-2">DESCRIPTION</th>
                    <th className="text-left py-3 px-2">STATUT</th>
                    <th className="text-left py-3 px-2">CRÉÉ LE</th>
                    <th className="text-left py-3 px-2">CRÉÉ PAR</th>
                    <th className="text-left py-3 px-2">MODIFIÉ LE</th>
                    <th className="text-left py-3 px-2">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollections.map((collection) => (
                    <tr
                      key={collection.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-2 font-medium">
                        {collection.nom}
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        {collection.description || "-"}
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {collection.statut}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {collection.creeLe}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {collection.creePar}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {collection.modifieLe}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Edit className="w-4 h-4 text-orange-500" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Power className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <p className="text-sm text-gray-600">
                Affichage de 1 à 3 sur 3 éléments
              </p>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Premier
                </Button>
                <Button variant="outline" size="sm">
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-indigo-600 text-white"
                >
                  1
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
