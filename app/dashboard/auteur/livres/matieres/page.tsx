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
import DashboardLayout from "@/components/dashboard-layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const matieres = [
  {
    id: 1,
    matiere: "Français",
    section: "Langue",
    statut: "Disponible",
    creeLe: "lun. 1 juil. 2024 21:31",
    creePar: "billfass2010@gmail.com",
    modifieLe: "jeu. 18 juil. 2024 16:44",
  },
  {
    id: 2,
    matiere: "Anglais",
    section: "Langue",
    statut: "Disponible",
    creeLe: "mar. 2 juil. 2024 18:37",
    creePar: "billfass2010@gmail.com",
    modifieLe: "sam. 20 juil. 2024 09:44",
  },
  {
    id: 3,
    matiere: "SVT",
    section: "Science",
    statut: "Disponible",
    creeLe: "mar. 2 juil. 2024 18:37",
    creePar: "billfass2010@gmail.com",
    modifieLe: "Invalid date",
  },
  {
    id: 4,
    matiere: "Histoire - Géographie",
    section: "Science",
    statut: "Disponible",
    creeLe: "mar. 2 juil. 2024 18:38",
    creePar: "billfass2010@gmail.com",
    modifieLe: "Invalid date",
  },
  {
    id: 5,
    matiere: "Mathématiques",
    section: "Science",
    statut: "Disponible",
    creeLe: "mar. 2 juil. 2024 18:38",
    creePar: "billfass2010@gmail.com",
    modifieLe: "Invalid date",
  },
  {
    id: 6,
    matiere: "EPS",
    section: "Science",
    statut: "Disponible",
    creeLe: "mar. 2 juil. 2024 18:38",
    creePar: "billfass2010@gmail.com",
    modifieLe: "Invalid date",
  },
  {
    id: 7,
    matiere: "Allemand",
    section: "Langue",
    statut: "Disponible",
    creeLe: "mar. 2 juil. 2024 18:39",
    creePar: "billfass2010@gmail.com",
    modifieLe: "Invalid date",
  },
  {
    id: 8,
    matiere: "Philosophie",
    section: "Langue",
    statut: "Disponible",
    creeLe: "mar. 2 juil. 2024 18:39",
    creePar: "billfass2010@gmail.com",
    modifieLe: "Invalid date",
  },
  {
    id: 9,
    matiere: "Économie",
    section: "Science",
    statut: "Disponible",
    creeLe: "mar. 2 juil. 2024 18:39",
    creePar: "billfass2010@gmail.com",
    modifieLe: "Invalid date",
  },
  {
    id: 10,
    matiere: "PCT",
    section: "Science",
    statut: "Disponible",
    creeLe: "mar. 2 juil. 2024 18:39",
    creePar: "billfass2010@gmail.com",
    modifieLe: "Invalid date",
  },
  {
    id: 11,
    matiere: "Espagnol",
    section: "Langue",
    statut: "Disponible",
    creeLe: "mar. 2 juil. 2024 18:40",
    creePar: "billfass2010@gmail.com",
    modifieLe: "Invalid date",
  },
  {
    id: 12,
    matiere: "Éducation civique et morale",
    section: "Science",
    statut: "Disponible",
    creeLe: "mar. 2 juil. 2024 18:41",
    creePar: "billfass2010@gmail.com",
    modifieLe: "Invalid date",
  },
  {
    id: 13,
    matiere: "Économie",
    section: "Science",
    statut: "Disponible",
    creeLe: "mer. 10 juil. 2024 20:41",
    creePar: "billfass2010@gmail.com",
    modifieLe: "ven. 3 janv. 2025 17:31",
  },
  {
    id: 14,
    matiere: "ES",
    section: "Science",
    statut: "Disponible",
    creeLe: "mer. 24 juil. 2024 08:24",
    creePar: "billfass2010@gmail.com",
    modifieLe: "Invalid date",
  },
  {
    id: 15,
    matiere: "EST",
    section: "Science",
    statut: "Disponible",
    creeLe: "mer. 24 juil. 2024 08:24",
    creePar: "billfass2010@gmail.com",
    modifieLe: "mer. 24 juil. 2024 08:33",
  },
];

export default function MatieresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRefresh = () => {
    console.log("[v0] Refreshing subjects data...");
  };

  const filteredMatieres = matieres.filter((matiere) => {
    const matchesSearch = matiere.matiere
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || matiere.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout
      title="Les matières"
      breadcrumb="Commandes - Collections - Catégories - Matières - Livres"
      onRefresh={handleRefresh}
    >
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Matières</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Commandes - Collections - Catégories - Matières - Matières
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
                Matière +
              </Button>
            </div>

            {/* --- MODALE --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Ajouter une Matière
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Niveau :
                    </label>
                    <Select defaultValue="Aucun">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aucun">Aucun</SelectItem>
                        <SelectItem value="Langue">Langue</SelectItem>
                        <SelectItem value="Sciences">Sciences</SelectItem>
                        <SelectItem value="Technologie">Technologie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Matière :
                    </label>
                    <Input placeholder="" />
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
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">MATIÈRE</th>
                    <th className="text-left py-3 px-2">SECTION</th>
                    <th className="text-left py-3 px-2">STATUT</th>
                    <th className="text-left py-3 px-2">CRÉÉ LE</th>
                    <th className="text-left py-3 px-2">CRÉÉ PAR</th>
                    <th className="text-left py-3 px-2">MODIFIÉ LE</th>
                    <th className="text-left py-3 px-2">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatieres.map((matiere) => (
                    <tr key={matiere.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">
                        {matiere.matiere}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            matiere.section === "Langue"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {matiere.section}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {matiere.statut}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {matiere.creeLe}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {matiere.creePar}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {matiere.modifieLe}
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
                Affichage de 1 à 15 sur 15 éléments
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
    </DashboardLayout>
  );
}
