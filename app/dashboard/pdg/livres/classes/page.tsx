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

interface Class {
  id: string
  classe: string
  section: string
  statut: string
  creeLe: string
  creePar: string
  modifieLe: string
}

export default function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newClass, setNewClass] = useState({
    classe: "",
    section: "Primaire",
    statut: "Disponible"
  });
  const { toast } = useToast();

  // Charger les classes depuis l'API
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pdg/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les classes",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des classes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async () => {
    try {
      const response = await fetch('/api/pdg/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClass),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Classe créée avec succès"
        });
        setNewClass({ classe: "", section: "Primaire", statut: "Disponible" });
        setIsModalOpen(false);
        loadClasses();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de créer la classe",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating class:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la classe",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    loadClasses();
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
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Classes</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Classes
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
                    <Select 
                      value={newClass.section}
                      onValueChange={(value) => setNewClass({ ...newClass, section: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Primaire">Primaire</SelectItem>
                        <SelectItem value="Secondaire">Secondaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Classe :
                    </label>
                    <Input 
                      placeholder="Nom de la classe" 
                      value={newClass.classe}
                      onChange={(e) => setNewClass({ ...newClass, classe: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Statut :
                    </label>
                    <Select 
                      value={newClass.statut}
                      onValueChange={(value) => setNewClass({ ...newClass, statut: value })}
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
                    onClick={() => setIsModalOpen(false)}
                  >
                    Fermer
                  </Button>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleCreateClass}
                    disabled={!newClass.classe.trim()}
                  >
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Chargement des classes...
                      </td>
                    </tr>
                  ) : filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Aucune classe trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((classe) => (
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
                        <td className="py-3 px-2 text-sm text-gray-600">{classe.creePar}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <p className="text-sm text-gray-600">
                Affichage de 1 à {filteredClasses.length} sur {classes.length} éléments
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
