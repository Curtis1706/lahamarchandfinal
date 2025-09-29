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
      libelle: "Mathématiques 6ème",
      categorie: "Manuel",
      classe: "6ème",
      matiere: "Mathématiques",
      code: "MATH6",
      prix: "2500",
      stock: "150",
      statut: "Disponible",
      ajouteLe: "24/06/2024 16:59:08",
      classes: "6ème, 5ème",
    },
    {
      id: 2,
      libelle: "Français 5ème",
      categorie: "Exercice",
      classe: "5ème",
      matiere: "Français",
      code: "FR5",
      prix: "2000",
      stock: "80",
      statut: "Disponible",
      ajouteLe: "24/06/2024 16:59:08",
      classes: "6ème, 5ème",
    },
    {
      id: 3,
      libelle: "Sciences 4ème",
      categorie: "Manuel",
      classe: "4ème",
      matiere: "Sciences",
      code: "SCI4",
      prix: "3000",
      stock: "0",
      statut: "Indisponible",
      ajouteLe: "24/06/2024 16:59:08",
      classes: "6ème, 5ème",
    },
    {
      id: 4,
      libelle: "Histoire-Géographie 3ème",
      categorie: "Manuel",
      classe: "3ème",
      matiere: "Histoire-Géographie",
      code: "HG3",
      prix: "2800",
      stock: "120",
      statut: "Disponible",
      ajouteLe: "24/06/2024 16:59:08",
      classes: "6ème, 5ème",
    },
    {
      id: 5,
      libelle: "Anglais Terminale",
      categorie: "Exercice",
      classe: "Terminale",
      matiere: "Anglais",
      code: "ANGT",
      prix: "3500",
      stock: "90",
      statut: "Disponible",
      ajouteLe: "24/06/2024 16:59:08",
      classes: "6ème, 5ème",
    },
    {
      id: 6,
      libelle: "Physique-Chimie 2nde",
      categorie: "Manuel",
      classe: "2nde",
      matiere: "Physique-Chimie",
      code: "PC2",
      prix: "3200",
      stock: "60",
      statut: "Disponible",
      ajouteLe: "24/06/2024 16:59:08",
      classes: "6ème, 5ème",
    },
    {
      id: 7,
      libelle: "Économie 1ère",
      categorie: "Manuel",
      classe: "1ère",
      matiere: "Économie",
      code: "ECO1",
      prix: "2900",
      stock: "45",
      statut: "Disponible",
      ajouteLe: "24/06/2024 16:59:08",
      classes: "6ème, 5ème",
    },
    {
      id: 8,
      libelle: "Littérature Terminale",
      categorie: "Exercice",
      classe: "Terminale",
      matiere: "Littérature",
      code: "LITT",
      prix: "3100",
      stock: "0",
      statut: "Indisponible",
      ajouteLe: "24/06/2024 16:59:08",
      classes: "6ème, 5ème",
    },
    {
      id: 9,
      libelle: "Biologie 1ère",
      categorie: "Manuel",
      classe: "1ère",
      matiere: "Biologie",
      code: "BIO1",
      prix: "2700",
      stock: "75",
      statut: "Disponible",
      ajouteLe: "24/06/2024 16:59:08",
      classes: "6ème, 5ème",
    },
    {
      id: 10,
      libelle: "Philosophie Terminale",
      categorie: "Manuel",
      classe: "Terminale",
      matiere: "Philosophie",
      code: "PHIL",
      prix: "3300",
      stock: "55",
      statut: "Disponible",
      ajouteLe: "24/06/2024 16:59:08",
      classes: "6ème, 5ème",
      matiere: "Français",
      code: "TDL1",
    },
  ];

  return (
    <div>
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

          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                  >
                    Importer
                    <Upload className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importer un fichier</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Option d'importation</Label>
                        <Select defaultValue="prix">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prix">Prix</SelectItem>
                            <SelectItem value="stock">Stock</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Client</Label>
                        <Select defaultValue="particulier">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="particulier">
                              Particulier
                            </SelectItem>
                            <SelectItem value="ecole">École</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Fichier excel :</Label>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline">Choisir un fichier</Button>
                        <span className="text-sm text-gray-500 self-center">
                          Aucun fichier choisi
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowImportModal(false)}
                    >
                      Fermer
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Exécuter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter un livre
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Ajouter un nouveau livre</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Libellé du livre</Label>
                        <Input placeholder="Nom du livre" />
                      </div>
                      <div>
                        <Label>Code du livre</Label>
                        <Input placeholder="Code du livre" />
                      </div>
                      <div>
                        <Label>Collection</Label>
                        <Select defaultValue="citoyenne">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="citoyenne">
                              Collection citoyenne
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Type de livre</Label>
                        <Select defaultValue="manuels">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manuels">
                              Livre Manuels (primaire)
                            </SelectItem>
                            <SelectItem value="exercices">
                              Livre Exercices (secondaire)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Matière</Label>
                        <Select defaultValue="francais">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="francais">Français</SelectItem>
                            <SelectItem value="anglais">Anglais</SelectItem>
                            <SelectItem value="maths">Mathématiques</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Associer des classes</Label>
                        <Input placeholder="Sélectionnez les classes" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Courte Description</Label>
                        <Textarea placeholder="Courte description" rows={3} />
                      </div>
                      <div>
                        <Label>Longue Description</Label>
                        <Textarea placeholder="Courte description" rows={3} />
                      </div>
                    </div>

                    <div>
                      <Label>Fichier du livre :</Label>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline">Choisir un fichier</Button>
                        <span className="text-sm text-gray-500 self-center">
                          Aucun fichier choisi
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Auteur du livre</Label>
                        <Select defaultValue="auteur1">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auteur1">Auteur 1</SelectItem>
                            <SelectItem value="auteur2">Auteur 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Concepteurs du livre</Label>
                        <Input />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Prix HT</Label>
                        <Input placeholder="0" />
                      </div>
                      <div>
                        <Label>Remise</Label>
                        <Input placeholder="0" />
                      </div>
                      <div>
                        <Label>Type de remise</Label>
                        <Select defaultValue="percent">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">%</SelectItem>
                            <SelectItem value="fixed">Fixe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Fermer
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Enregistrer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input placeholder="" className="w-64" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Livre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matière
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ajouté le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {livres.map((livre) => (
                  <tr key={livre.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-10">
                          <img
                            src="/placeholder-book.jpg"
                            alt={livre.libelle}
                            className="w-10 h-12 object-cover rounded"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {livre.libelle}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livre.categorie}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livre.classe}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livre.matiere}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livre.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livre.prix} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livre.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={livre.statut === "Disponible" ? "default" : "destructive"}
                      >
                        {livre.statut}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {livre.ajouteLe}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 bg-transparent"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de 1 à 10 sur 10 entrées
              </div>
              <div className="flex items-center gap-2">
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
    </div>
  );
}