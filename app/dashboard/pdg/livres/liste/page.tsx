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
import { useToast } from "@/hooks/use-toast";

interface Livre {
  id: string
  image: string
  libelle: string
  categorie: string
  collection: string
  statut: string
  ajouteLe: string
  classes: string
  matiere: string
  code: string
}

export default function LivresListePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [livres, setLivres] = useState<Livre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newLivre, setNewLivre] = useState({
    titre: "",
    categorie: "",
    collection: "",
    classes: "",
    matiere: "",
    isbn: ""
  });
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [auteurs, setAuteurs] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { toast } = useToast();

  // Charger les livres depuis l'API
  useEffect(() => {
    loadLivres();
    loadDisciplines();
    loadAuteurs();
  }, []);

  // Vérifier si les données sont chargées
  useEffect(() => {
    console.log("🔍 Vérification des données:", {
      disciplines: disciplines.length,
      auteurs: auteurs.length,
      dataLoaded
    });
    if (disciplines.length > 0 && auteurs.length > 0) {
      console.log("✅ Toutes les données sont chargées!");
      setDataLoaded(true);
    } else {
      console.log("⏳ En attente de données...");
    }
  }, [disciplines, auteurs]);

  const loadLivres = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/works');
      if (response.ok) {
        const data = await response.json();
        console.log("Data reçue:", data);
        // L'API retourne un objet avec works, pagination, stats
        const worksArray = data.works || [];
        console.log("Works array:", worksArray);
        // Transformer les données des œuvres en format livre
        const livresData = worksArray.map((work: any) => ({
          id: work.id,
          image: work.coverImage || "/placeholder.jpg",
          libelle: work.title,
          categorie: work.discipline?.name || "Non définie",
          collection: work.collection || "-",
          statut: work.status === 'PUBLISHED' ? 'Disponible' : 'En attente',
          ajouteLe: new Date(work.createdAt).toLocaleDateString('fr-FR'),
          classes: work.targetClasses || "-",
          matiere: work.discipline?.name || "Non définie",
          code: work.isbn || "-"
        }));
        setLivres(livresData);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les livres",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading livres:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des livres",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDisciplines = async () => {
    try {
      const response = await fetch('/api/disciplines');
      if (response.ok) {
        const data = await response.json();
        console.log("Disciplines chargées:", data);
        setDisciplines(data);
      }
    } catch (error) {
      console.error("Error loading disciplines:", error);
    }
  };

  const loadAuteurs = async () => {
    try {
      const response = await fetch('/api/users?role=AUTEUR');
      if (response.ok) {
        const data = await response.json();
        console.log("Auteurs chargés:", data);
        // L'API retourne un objet avec users et total
        const auteursArray = data.users || [];
        console.log("Auteurs array:", auteursArray);
        setAuteurs(auteursArray);
      }
    } catch (error) {
      console.error("Error loading auteurs:", error);
    }
  };

  const handleCreateLivre = async () => {
    if (!newLivre.titre.trim() || !newLivre.isbn.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre et l'ISBN sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (disciplines.length === 0 || auteurs.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucune discipline ou auteur disponible. Veuillez réessayer.",
        variant: "destructive"
      });
      return;
    }

    const selectedDiscipline = disciplines[0];
    const selectedAuthor = auteurs[0];

    console.log("Disciplines:", disciplines);
    console.log("Auteurs:", auteurs);
    console.log("Selected discipline:", selectedDiscipline);
    console.log("Selected author:", selectedAuthor);

    if (!selectedDiscipline?.id || !selectedAuthor?.id) {
      console.error("Discipline ou auteur invalide:", { selectedDiscipline, selectedAuthor });
      toast({
        title: "Erreur",
        description: "Discipline ou auteur invalide. Veuillez réessayer.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newLivre.titre,
          description: `Livre de ${newLivre.matiere} pour ${newLivre.classes}`,
          disciplineId: selectedDiscipline.id,
          authorId: selectedAuthor.id,
          category: newLivre.categorie,
          targetAudience: newLivre.classes,
          contentType: 'MANUAL',
          estimatedPrice: 0,
          status: 'PENDING'
        }),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Livre créé avec succès"
        });
        setNewLivre({
          titre: "",
          categorie: "",
          collection: "",
          classes: "",
          matiere: "",
          isbn: ""
        });
        setShowCreateModal(false);
        loadLivres();
      } else {
        const errorData = await response.json();
        console.error("Erreur API:", errorData);
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de créer le livre",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating livre:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du livre",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Livres</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Livres
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
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => setShowImportModal(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer
                </Button>
              </div>

              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter +
              </Button>
            </div>

            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="50">
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
                  placeholder="Rechercher un livre..."
                  className="w-64"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Libellé</th>
                    <th className="text-left py-3 px-2">Catégorie</th>
                    <th className="text-left py-3 px-2">Statut</th>
                    <th className="text-left py-3 px-2">Collection</th>
                    <th className="text-left py-3 px-2">Courte description</th>
                    <th className="text-left py-3 px-2">Ajouté le</th>
                    <th className="text-left py-3 px-2">Classe(s)</th>
                    <th className="text-left py-3 px-2">Matière</th>
                    <th className="text-left py-3 px-2">Code</th>
                    <th className="text-left py-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-500">
                        Chargement des livres...
                      </td>
                    </tr>
                  ) : livres.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-500">
                        Aucun livre trouvé
                      </td>
                    </tr>
                  ) : (
                    livres.map((livre) => (
                      <tr key={livre.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={livre.image}
                              alt={livre.libelle}
                              className="w-12 h-16 object-cover rounded"
                            />
                            <span className="font-medium">{livre.libelle}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.categorie}
                        </td>
                        <td className="py-3 px-2">
                          <Badge
                            variant={livre.statut === "Disponible" ? "default" : "secondary"}
                            className={
                              livre.statut === "Disponible"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {livre.statut}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.collection}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">-</td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.ajouteLe}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.classes}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.matiere}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.code}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Edit className="w-4 h-4 text-orange-500" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Trash2 className="w-4 h-4 text-red-500" />
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
                Affichage de 1 à {livres.length} sur {livres.length} éléments
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

      {/* Modal Import */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Importer des livres
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="block text-sm font-medium mb-1">
                Fichier Excel :
              </Label>
              <Input type="file" accept=".xlsx,.xls" />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">
                Instructions :
              </Label>
              <Textarea
                placeholder="Instructions d'import..."
                rows={3}
                readOnly
                value="Format attendu : Titre, Catégorie, Collection, Classes, Matière, Code ISBN"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(false)}
            >
              Annuler
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Importer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Création */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Ajouter un livre
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="block text-sm font-medium mb-1">
                Titre :
              </Label>
              <Input 
                placeholder="Titre du livre" 
                value={newLivre.titre}
                onChange={(e) => setNewLivre({ ...newLivre, titre: e.target.value })}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">
                Catégorie :
              </Label>
              <Select value={newLivre.categorie} onValueChange={(value) => setNewLivre({ ...newLivre, categorie: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manuel">Manuel</SelectItem>
                  <SelectItem value="exercice">Exercice</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">
                Collection :
              </Label>
              <Input 
                placeholder="Nom de la collection" 
                value={newLivre.collection}
                onChange={(e) => setNewLivre({ ...newLivre, collection: e.target.value })}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">
                Classes cibles :
              </Label>
              <Input 
                placeholder="Ex: 6ème, 5ème" 
                value={newLivre.classes}
                onChange={(e) => setNewLivre({ ...newLivre, classes: e.target.value })}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">
                Matière :
              </Label>
              <Select value={newLivre.matiere} onValueChange={(value) => setNewLivre({ ...newLivre, matiere: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="francais">Français</SelectItem>
                  <SelectItem value="maths">Mathématiques</SelectItem>
                  <SelectItem value="anglais">Anglais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">
                Code ISBN :
              </Label>
              <Input 
                placeholder="ISBN du livre" 
                value={newLivre.isbn}
                onChange={(e) => setNewLivre({ ...newLivre, isbn: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Annuler
            </Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleCreateLivre}
              disabled={isSaving || !newLivre.titre.trim() || !newLivre.isbn.trim() || !dataLoaded}
            >
              {isSaving ? "Enregistrement..." : dataLoaded ? "Enregistrer" : "Chargement..."}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}