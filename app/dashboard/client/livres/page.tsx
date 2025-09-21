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
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Edit, Trash2 } from "lucide-react";

export default function LivresListePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const livres = [
    {
      id: 1,
      image: "/french-textbook-ce1-ce2.jpg",
      libelle: "The New English Student 6e",
      categorie: "Manuels (Primaire et Secondaire)",
      price: "1700 F CFA",
      collection: "",
      statut: "Disponible",
      ajouteLe: "24/06/2024 16:39:02",
      classes: "6ème",
      matiere: "Anglais",
      code: "NES6",
    },
    {
      id: 2,
      image: "/french-textbook-coffret-ce2.jpg",
      libelle: "Réussir en conjugaison 6e en Tle",
      categorie: "Manuels (Primaire et Secondaire)",
      price: "1700 F CFA",
      collection: "",
      statut: "Disponible",
      ajouteLe: "24/06/2024 16:52:46",
      classes: "6ème, 5ème, 4ème, 3ème, 2nde, 1ère, Tle",
      matiere: "Français",
      code: "REC",
    },
    {
      id: 3,
      image: "/mathematics-textbook-ce1.jpg",
      libelle: "Tests de Lecture 6e et 5e",
      categorie: "Livre Exercices (secondaire)",
      price: "900 F CFA",
      collection: "",
      statut: "Disponible",
      ajouteLe: "24/06/2024 16:59:08",
      classes: "6ème, 5ème",
      matiere: "Français",
      code: "TDL1",
    },
  ];

  return (
    <DashboardLayout title="">
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Nos livres</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Commandes - Collections - Catégories - Matières - Classes
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Header with filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Select defaultValue="toutes-categories">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes-categories">
                  Toutes les catégories
                </SelectItem>
                <SelectItem value="manuels">Manuels</SelectItem>
                <SelectItem value="exercices">Exercices</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="toutes-classes">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes-classes">
                  Toutes les classes
                </SelectItem>
                <SelectItem value="6eme">6ème</SelectItem>
                <SelectItem value="5eme">5ème</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="toutes-matieres">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes-matieres">
                  Toutes les matières
                </SelectItem>
                <SelectItem value="francais">Français</SelectItem>
                <SelectItem value="anglais">Anglais</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="tous-statuts">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous-statuts">Tous les statuts</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="indisponible">Indisponible</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="50">
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

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input placeholder="" className="w-64" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Libellé
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Catégorie
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Prix</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Collection
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Ajouté
                      <br />
                      le
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Classe(s)
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Matière
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Code
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {livres.map((livre) => (
                    <tr key={livre.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <img
                            src={livre.image || "/placeholder.svg"}
                            alt={livre.libelle}
                            className="w-10 h-12 object-cover rounded"
                          />
                          <span className="font-medium text-blue-600">
                            {livre.libelle}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{livre.categorie}</td>
                      <td className="py-3 px-4 text-sm">{livre.price}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">
                          {livre.statut}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {livre.collection || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm">{livre.ajouteLe}</td>
                      <td className="py-3 px-4 text-sm">{livre.classes}</td>
                      <td className="py-3 px-4 text-sm">{livre.matiere}</td>
                      <td className="py-3 px-4 text-sm font-mono">
                        {livre.code}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Affichage de 1 à 3 sur 3 éléments
              </span>
              <div className="flex gap-2">
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
    </DashboardLayout>
  );
}
