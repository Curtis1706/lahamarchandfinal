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
  User,
  Filter,
  Printer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DemandeStockPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const handleRefresh = () => {
    console.log("Refreshing stock requests data...");
  };

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Demande stock</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Demande stock
            </span>
          </div>
        </div>
      </div>
      
      {/* Contenu */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            {/* Bouton filtre */}
            <div className="mb-6">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#7367F0] hover:bg-[#5E50EE] text-white flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Filtre compte
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filtre</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">
                          Compte :
                        </label>
                        <Select defaultValue="utilisateur">
                          <SelectTrigger>
                            <SelectValue placeholder="Utilisateur" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="utilisateur">
                              Utilisateur
                            </SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-600">
                          Utilisateur :
                        </label>
                        <Select defaultValue="tous">
                          <SelectTrigger>
                            <SelectValue placeholder="Tous les utilisateurs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tous">
                              Tous les utilisateurs
                            </SelectItem>
                            <SelectItem value="u1">Utilisateur 1</SelectItem>
                            <SelectItem value="u2">Utilisateur 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4">
                      <Button
                        className="bg-[#7367F0] hover:bg-[#5E50EE] text-white flex items-center gap-2"
                        onClick={() => setOpen(false)}
                      >
                        Appliquer
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setOpen(false)}
                      >
                        Remise à zéro
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Filtres haut */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Input type="date" defaultValue="2025-06-21" className="w-full" />

              <Select defaultValue="tous-statuts">
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous-statuts">Tous les statuts</SelectItem>
                  <SelectItem value="en-attente">En attente</SelectItem>
                  <SelectItem value="approuve">Approuvé</SelectItem>
                  <SelectItem value="rejete">Rejeté</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="tous-types">
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous-types">Tous les types</SelectItem>
                  <SelectItem value="commande">Commande</SelectItem>
                  <SelectItem value="precommande">Précommande</SelectItem>
                  <SelectItem value="depot">Dépôt</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-[#7367F0] hover:bg-[#5E50EE] text-white flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Appliquer
              </Button>
            </div>

            {/* Filtres bas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Select defaultValue="toutes-methodes">
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les méthodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes-methodes">
                    Toutes les méthodes
                  </SelectItem>
                  <SelectItem value="mtn-benin">MTN Benin</SelectItem>
                  <SelectItem value="autre-reseau">Autre réseau</SelectItem>
                  <SelectItem value="depot-stock">Dépôt de stock</SelectItem>
                  <SelectItem value="momopay">MomoPay</SelectItem>
                  <SelectItem value="carte-bancaire">Carte bancaire</SelectItem>
                  <SelectItem value="cheque-virement">Chèque/Virement</SelectItem>
                  <SelectItem value="reapprovisionnement">
                    Réapprovisionnement
                  </SelectItem>
                  <SelectItem value="proform">Proform</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="vacances-rentree">
                <SelectTrigger>
                  <SelectValue placeholder="Vacances et rentrée scolaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacances-rentree">
                    Vacances et rentrée scolaire
                  </SelectItem>
                  <SelectItem value="cours-vacances">
                    Cours de vacances
                  </SelectItem>
                  <SelectItem value="rentree-scolaire">
                    Rentrée scolaire
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contrôles tableau */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="25">
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
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Référence",
                      "Nbr. livre",
                      "Demandé par",
                      "Fait le",
                      "Date livraison",
                      "Type",
                      "Statut",
                      "Livraison",
                      "Département",
                      "Zone",
                      "Commande",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        className="py-3 px-2 text-left border-b text-gray-600"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={12}
                      className="py-12 text-center text-gray-500"
                    >
                      Aucune donnée disponible dans le tableau
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <p className="text-sm text-gray-600">
                Affichage de 0 à 0 sur 0 éléments
              </p>
              <div className="flex items-center gap-2">
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

            {/* Export */}
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                EXCEL
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
