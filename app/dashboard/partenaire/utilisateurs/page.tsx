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
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Upload, Plus } from "lucide-react";

const users = [
  {
    id: 1,
    name: "partenaire partenaire",
    phone: "+229016789098",
    email: "partenaire@test.com",
    role: "Partenaire",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 2,
    name: "Controleur Controleur",
    phone: "+229015050050",
    email: "controleur@lahamarchand.com",
    role: "Magasinier compteur",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 3,
    name: "Magasinier Magasinier",
    phone: "+229014040040",
    email: "magasinier@lahamarchand.com",
    role: "Magasinier",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 4,
    name: "ABIOLA Espédit ABIOLA Espédit",
    phone: "+22964100939",
    email: "esperitossey@gmail.com",
    role: "Responsable de département",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 5,
    name: "URBAN GERAUD URBAN GERAUD",
    phone: "+22964082731",
    email: "geraud@urban-technology.net",
    role: "DGA",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 6,
    name: "KODJO CRESPIN",
    phone: "+22996448230",
    email: "kodjocrespin1@gmail.com",
    role: "Responsable de département",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 7,
    name: "Abdel-Hakim null",
    phone: "+22994776464",
    email: "lahakim1@gmail.com",
    role: "DGA",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 8,
    name: "NARE null",
    phone: "+22965070886",
    email: "whg1.contact@gmail.com",
    role: "DGA",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 9,
    name: "HOLINKPE W. Cyrille",
    phone: "+22951826358",
    email: "lahaeditions1@gmail.com",
    role: "DND",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 10,
    name: "TOCHOU Fossilo null",
    phone: "+22996078737",
    email: "fossilotochou@gmail.com",
    role: "Chef de département",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 11,
    name: "DODOMETIN Marcel",
    phone: "+22997824872",
    email: "marceldodometin@gmail.com",
    role: "Chef de département",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 12,
    name: "Amzat null",
    phone: "+22955900000",
    email: "",
    role: "DGA",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 13,
    name: "Livreur Livreur",
    phone: "+22940767676",
    email: "livreur@lahamarchand.com",
    role: "Livreur",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 14,
    name: "Chef département",
    phone: "+22940747474",
    email: "chefdepartement@lahamarchand.com",
    role: "Chef de département",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 15,
    name: "RESPONSABLE LAHA",
    phone: "+229737373",
    email: "responsable@lahamarchand.com",
    role: "Responsable de département",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 16,
    name: "FARO Patricia",
    phone: "+22997207516",
    email: "patriciafaro1994@gmail.com",
    role: "DGA",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 17,
    name: "axel axel",
    phone: "+22962074181",
    email: "axelchekete@gmail.com",
    role: "Responsable de département",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 18,
    name: "null",
    phone: "+22966396260",
    email: "pkouwannou@gmail.com",
    role: "Responsable de département",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
  {
    id: 19,
    name: "Super Administrateur",
    phone: "+22952734444",
    email: "support@lahamarchand.com",
    role: "PDG",
    status: "Actif",
    roleColor: "bg-cyan-500",
  },
];

export default function UtilisateursPage() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState("100");

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
  );

  return (
    <DashboardLayout title="">
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Liste des utilisateurs</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Liste des utilisateurs
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Liste des utilisateurs
            </h2>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded">
                <span className="text-gray-400">−</span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <span className="text-gray-400">↻</span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <span className="text-gray-400">⛶</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Importer un fichier</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Fichier excel :
                    </label>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Choisir un fichier
                      </Button>
                      <span className="text-sm text-gray-500">
                        Aucun fichier choisi
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-600">
                    Télécharger le modèle du fichier{" "}
                    <span className="underline cursor-pointer">ici</span>
                  </p>
                  <div className="flex justify-end">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Exécuter
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajouter un utilisateur</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Nom" />
                  <Input placeholder="Prénoms" />
                  <Input placeholder="Email" />
                  <Input placeholder="Téléphone" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="dga">DGA</SelectItem>
                      <SelectItem value="chef">Chef de département</SelectItem>
                      <SelectItem value="magasinier">Magasinier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    Enregistrer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {/* Bouton Ajouter avec modale */}

          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Afficher</span>
              <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="25">25</SelectItem>
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
                placeholder=""
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Nom complet
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Téléphone
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    email
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    rôle
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.phone}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge className={`${user.roleColor} text-white`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-green-500 text-white">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-orange-500 hover:bg-orange-50 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Affichage de 1 à 19 sur 19 éléments
            </p>
            <div className="flex items-center space-x-2">
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
    </DashboardLayout>
  );
}
