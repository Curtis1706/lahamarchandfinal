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

const classes = [
  {
    id: 1,
    classe: "CI",
    section: "Primaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 2,
    classe: "CP",
    section: "Primaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 3,
    classe: "CE1",
    section: "Primaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 4,
    classe: "CE2",
    section: "Primaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 5,
    classe: "CM1",
    section: "Primaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 6,
    classe: "CM2",
    section: "Primaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 7,
    classe: "6ème",
    section: "Secondaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 8,
    classe: "5ème",
    section: "Secondaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 9,
    classe: "4ème",
    section: "Secondaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 10,
    classe: "3ème",
    section: "Secondaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 11,
    classe: "2nde",
    section: "Secondaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 12,
    classe: "1ère",
    section: "Secondaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
  {
    id: 13,
    classe: "Tle",
    section: "Secondaire",
    statut: "Disponible",
    creeLe: "jeu. 20 juin 2024 19:52",
    modifieLe: "Invalid date",
  },
];

export default function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRefresh = () => {
    console.log("[v0] Refreshing classes data...");
  };

  const filteredClasses = classes.filter((classe) => {
    const matchesSearch = classe.classe
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || classe.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="" onRefresh={handleRefresh}>
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Classes</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Commandes - Collections - Catégories - Matières - Classes
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
                Classe +
              </Button>
            </div>

            {/* --- MODALE --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Ajouter une classe
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
                        <SelectItem value="Primaire">Primaire</SelectItem>
                        <SelectItem value="Secondaire">Secondaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Classe :
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
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">CLASSE</th>
                    <th className="text-left py-3 px-2">SECTION</th>
                    <th className="text-left py-3 px-2">STATUT</th>
                    <th className="text-left py-3 px-2">CRÉÉ LE</th>
                    <th className="text-left py-3 px-2">CRÉÉ PAR</th>
                    <th className="text-left py-3 px-2">MODIFIÉ LE</th>
                    <th className="text-left py-3 px-2">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((classe) => (
                    <tr key={classe.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{classe.classe}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            classe.section === "Primaire"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {classe.section}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {classe.statut}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {classe.creeLe}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">-</td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {classe.modifieLe}
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
                Affichage de 1 à 13 sur 13 éléments
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
