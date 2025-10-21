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
import { Plus, Filter, Calendar, Printer } from "lucide-react";

export default function ProformaPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMatiere, setSelectedMatiere] = useState("");
  const [selectedClasse, setSelectedClasse] = useState("");
  const [selectedLivre, setSelectedLivre] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [commandType, setCommandType] = useState("");
  const [items, setItems] = useState<any[]>([]);

  const handleAddItem = () => {
    if (selectedLivre && quantity && price) {
      const unitPrice = Number.parseFloat(price);
      const qty = Number.parseInt(quantity);
      const newItem = {
        id: Date.now(),
        livre: selectedLivre,
        prix: unitPrice,
        quantite: qty,
        montant: unitPrice * qty,
      };
      setItems([...items, newItem]);
      setQuantity("");
      setPrice("");
    }
  };

  const total = items.reduce((sum, item) => sum + item.montant, 0);

  return (
    <div>
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Proforma</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Proforma
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Header with filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Filter className="w-4 h-4" />
              Filtre compte
            </Button>

            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 ml-auto">
                  Etablir un Proforma
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Facture Proforma</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Client Selection */}
                  <div>
                    <Label>Sélectionner le client</Label>
                    <Select
                      value={selectedClient}
                      onValueChange={setSelectedClient}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client1">
                          ECOLE CONTRACTUELLE
                        </SelectItem>
                        <SelectItem value="client2">EPP AZALO</SelectItem>
                        <SelectItem value="client3">Particulier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selection Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Choix de la catégorie</Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manuels">
                            Manuels (Primaire et Secondaire)
                          </SelectItem>
                          <SelectItem value="exercices">
                            Livre Exercices (secondaire)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Choix de la Matière</Label>
                      <Select
                        value={selectedMatiere}
                        onValueChange={setSelectedMatiere}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une matière" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="francais">Français</SelectItem>
                          <SelectItem value="anglais">Anglais</SelectItem>
                          <SelectItem value="maths">Mathématiques</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Choix de la classe</Label>
                      <Select
                        value={selectedClasse}
                        onValueChange={setSelectedClasse}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la classe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6eme">6ème</SelectItem>
                          <SelectItem value="5eme">5ème</SelectItem>
                          <SelectItem value="4eme">4ème</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Book and Quantity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Choix du livre</Label>
                      <Select
                        value={selectedLivre}
                        onValueChange={setSelectedLivre}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un livre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="livre1">
                            The New English Student 6e
                          </SelectItem>
                          <SelectItem value="livre2">
                            Réussir en conjugaison 6e en Tle
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {!selectedLivre && (
                        <p className="text-red-500 text-sm mt-1">
                          Sélectionnez un livre
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Prix unitaire (F CFA)</Label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="100"
                      />
                    </div>

                    <div>
                      <Label>Quantité</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0"
                          min="1"
                        />
                        <Button
                          onClick={handleAddItem}
                          className="bg-indigo-600 hover:bg-indigo-700"
                          disabled={!selectedLivre || !quantity || !price}
                        >
                          Ajouter
                        </Button>
                      </div>
                      {quantity && Number.parseInt(quantity) <= 0 && (
                        <p className="text-red-500 text-sm mt-1">
                          La quantité doit être supérieur à 0
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Livre
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Prix
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Quantité
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Montant
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-4 py-3 text-sm">{item.livre}</td>
                            <td className="px-4 py-3 text-sm">{item.prix}</td>
                            <td className="px-4 py-3 text-sm">
                              {item.quantite}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {item.montant}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setItems(
                                    items.filter((i) => i.id !== item.id)
                                  )
                                }
                              >
                                Supprimer
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-semibold">Total: {total} XOF</p>
                  </div>

                  {/* Promo Code and Command Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Code promo</Label>
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="CODE PROMO"
                        />
                        <Button variant="outline">Appliquer</Button>
                      </div>
                    </div>

                    <div>
                      <Label>Type de commande</Label>
                      <Select
                        value={commandType}
                        onValueChange={setCommandType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Commande pour la rentrée scolaire" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rentree">
                            Commande pour la rentrée scolaire
                          </SelectItem>
                          <SelectItem value="urgente">
                            Commande urgente
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4">
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
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Date Range and Status Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                20 juin 2025 - 20 sept. 2025
              </span>
            </div>

            <div className="flex gap-4">
              <Select defaultValue="tous-statuts">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous-statuts">Tous les statuts</SelectItem>
                  <SelectItem value="en-cours">En cours</SelectItem>
                  <SelectItem value="valide">Validé</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                Appliquer
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
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
                <Input placeholder="" className="w-64" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Référence
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Nbr. livre
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Demandé par
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Fait le
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Département
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Zone
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      Aucune donnée disponible dans le tableau
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Affichage de 0 à 0 sur 0 éléments
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

          {/* Export Buttons */}
          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" className="bg-[#6967CE] text-white ">
              PDF
            </Button>
            <Button variant="outline" className="bg-[#6967CE] text-white ">
              EXCEL
            </Button>
            <Button variant="outline">
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
