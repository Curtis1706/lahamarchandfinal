"use client";

import { useState } from "react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";
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
import {
  Plus,
  Filter,
  Upload,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";

export default function ClientsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const clients = [
    {
      id: 1,
      nom: "SOVIDE Atchadé Nicolas",
      telephone: "+2290195051184",
      type: "Concepteur",
      departement: "ATLANTIQUE",
      statut: "En attente",
      creeLe: "ven. 25 juil. 2025 17:42",
      dette: 0,
    },
    {
      id: 2,
      nom: "CSP PEPINIERE DE HOUEGBO",
      telephone: "+2290197283161",
      type: "Ecole contractuelle",
      departement: "ATLANTIQUE",
      statut: "Actif",
      creeLe: "ven. 13 juin 2025 07:50",
      dette: 0,
    },
    {
      id: 3,
      nom: "Bile FASSINOU",
      telephone: "+2290195554315",
      type: "Ecole contractuelle",
      departement: "ATLANTIQUE",
      statut: "Actif",
      creeLe: "ven. 30 mai 2025 15:48",
      dette: 0,
    },
    {
      id: 4,
      nom: "Lucie Viakinnou BRINSON",
      telephone: "+14045186455",
      type: "Auteur",
      departement: "ATLANTIQUE",
      statut: "Actif",
      creeLe: "lun. 14 avr. 2025 22:35",
      dette: 0,
    },
    {
      id: 5,
      nom: "Yacoubou Onitchango",
      telephone: "+2290196063882",
      type: "Auteur",
      departement: "ATLANTIQUE",
      statut: "Actif",
      creeLe: "lun. 7 avr. 2025 13:35",
      dette: 0,
    },
  ];

  return (
    <DynamicDashboardLayout title="Partenaires" breadcrumb="Représentant - Partenaires">
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Clients</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Clients
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Header with actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Filter className="w-4 h-4" />
              Filtre
            </Button>

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
                    <div>
                      <Label>Fichier excel :</Label>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline">Choisir un fichier</Button>
                        <span className="text-sm text-gray-500 self-center">
                          Aucun fichier choisi
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-blue-600">
                      Télécharger le modèle du fichier{" "}
                      <a href="#" className="underline">
                        ici
                      </a>
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => setShowImportModal(false)}
                        variant="outline"
                      >
                        Fermer
                      </Button>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        Exécuter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                    Client
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter un client</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Type de client :</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Particulier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="particulier">
                            Particulier
                          </SelectItem>
                          <SelectItem value="ecole">École</SelectItem>
                          <SelectItem value="auteur">Auteur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Prénom(s) :</Label>
                        <Input />
                      </div>
                      <div>
                        <Label>Nom :</Label>
                        <Input />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Département :</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Aucun" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="atlantique">
                              ATLANTIQUE
                            </SelectItem>
                            <SelectItem value="littoral">LITTORAL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Email :</Label>
                        <Input type="email" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Téléphone :</Label>
                        <div className="flex">
                          <div className="flex items-center px-3 border border-r-0 rounded-l bg-gray-50">
                            <div className="w-4 h-3 bg-green-600 mr-1"></div>
                            <span className="text-sm">+229</span>
                          </div>
                          <Input
                            placeholder="01 90 01 12 34"
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>N° IFU :</Label>
                        <Input />
                      </div>
                    </div>

                    <div>
                      <Label>Adresse :</Label>
                      <Textarea rows={3} />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => setShowCreateModal(false)}
                        variant="outline"
                      >
                        Fermer
                      </Button>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
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
                <Input placeholder="" className="w-64" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      NOM
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      TÉLÉPHONE
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      TYPE
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      DÉPARTEMENT
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      STATUT
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      CRÉÉ LE <ArrowUpDown className="w-4 h-4 inline ml-1" />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      DETTE
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                          <span className="font-medium">{client.nom}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{client.telephone}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            client.type === "Concepteur"
                              ? "secondary"
                              : client.type === "Ecole contractuelle"
                              ? "default"
                              : "outline"
                          }
                        >
                          {client.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {client.departement}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            client.statut === "Actif" ? "default" : "secondary"
                          }
                        >
                          {client.statut}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{client.creeLe}</td>
                      <td className="py-3 px-4 text-sm">{client.dette}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
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

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Affichage de 1 à 20 sur 2 513 éléments
              </span>
              <div className="flex gap-2">
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
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  126
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
    </DynamicDashboardLayout>
  );
}
