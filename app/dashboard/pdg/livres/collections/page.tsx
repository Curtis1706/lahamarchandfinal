"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";

interface Collection {
  id: string
  nom: string
  description: string
  statut: string
  creeLe: string
  creePar: string
  modifieLe: string
}

export default function CollectionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCollection, setNewCollection] = useState({
    nom: "",
    description: "",
    statut: "Disponible"
  });
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const { toast } = useToast();

  // Charger les collections depuis l'API
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pdg/collections');
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les collections",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading collections:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des collections",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCollection = async () => {
    try {
      const isEditing = !!editingCollection;
      const url = '/api/pdg/collections';
      const method = isEditing ? 'PATCH' : 'POST';
      const body = isEditing 
        ? { ...newCollection, id: editingCollection.id }
        : newCollection;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: isEditing ? "Collection modifiée avec succès" : "Collection créée avec succès"
        });
        resetForm();
        setIsModalOpen(false);
        loadCollections();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible d'enregistrer la collection",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving collection:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement de la collection",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    // Enlever le préfixe "Collection " pour l'édition si présent, 
    // l'API le rajoutera ou on le gère à l'enregistrement
    const displayNom = collection.nom.startsWith("Collection ") 
      ? collection.nom.replace("Collection ", "") 
      : collection.nom;
      
    setNewCollection({
      nom: displayNom,
      description: collection.description,
      statut: collection.statut
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingCollection(null);
    setNewCollection({ nom: "", description: "", statut: "Disponible" });
  };

  const handleRefresh = () => {
    loadCollections();
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
            {/* Ouvre la modale */}
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
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
              >
                Collection +
              </Button>
            </div>

            {/* --- MODALE --- */}
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) resetForm();
            }}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    {editingCollection ? "Modifier la collection" : "Ajouter une collection"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nom :
                    </label>
                    <Input 
                      placeholder="Nom de la collection" 
                      value={newCollection.nom}
                      onChange={(e) => setNewCollection({ ...newCollection, nom: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description :
                    </label>
                    <Textarea 
                      placeholder="Description de la collection" 
                      rows={3}
                      value={newCollection.description}
                      onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Statut :
                    </label>
                    <Select 
                      value={newCollection.statut}
                      onValueChange={(value) => setNewCollection({ ...newCollection, statut: value })}
                    >
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
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                  >
                    Fermer
                  </Button>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleSaveCollection}
                    disabled={!newCollection.nom.trim()}
                  >
                    {editingCollection ? "Mettre à jour" : "Enregistrer"}
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Chargement des collections...
                      </td>
                    </tr>
                  ) : filteredCollections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Aucune collection trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredCollections.map((collection) => (
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
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleEdit(collection)}
                            >
                              <Edit className="w-4 h-4 text-orange-500" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Power className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <p className="text-sm text-gray-600">
                Affichage de 1 à {filteredCollections.length} sur {collections.length} éléments
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
