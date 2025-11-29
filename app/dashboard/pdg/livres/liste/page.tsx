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
import { Plus, Upload, Edit, Trash2, Image as ImageIcon, X, CheckCircle, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  prix: number
  tva: number
  auteur: string
  concepteur: string
  disciplineId: string
  authorId?: string
  status?: string // Statut brut (DRAFT, PUBLISHED, etc.)
}

export default function LivresListePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLivre, setEditingLivre] = useState<Livre | null>(null);
  const [livres, setLivres] = useState<Livre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [newLivre, setNewLivre] = useState({
    titre: "",
    categorie: "",
    collectionId: "",
    classes: "",
    matiere: "",
    isbn: "",
    courteDescription: "",
    prix: "",
    tva: "18",
    auteurId: "",
    concepteurId: "",
    disciplineId: ""
  });
  const [collections, setCollections] = useState<any[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [auteurs, setAuteurs] = useState<any[]>([]);
  const [concepteurs, setConcepteurs] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { toast } = useToast();

  // Charger les livres depuis l'API
  useEffect(() => {
    loadLivres();
    loadDisciplines();
    loadAuteurs();
    loadConcepteurs();
    loadCollections();
  }, []);

  // Vérifier si les données sont chargées
  useEffect(() => {
    console.log("🔍 Vérification des données:", {
      disciplines: disciplines.length,
      auteurs: auteurs.length,
      concepteurs: concepteurs.length,
      dataLoaded
    });
    if (disciplines.length > 0 && auteurs.length > 0) {
      console.log("✅ Toutes les données sont chargées!");
      setDataLoaded(true);
    } else {
      console.log("⏳ En attente de données...");
    }
  }, [disciplines, auteurs, concepteurs]);

  const loadLivres = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Chargement des livres depuis /api/works...");
      // Pour le PDG, récupérer tous les works sans limite de pagination
      const response = await fetch('/api/works?limit=1000&page=1');
      console.log("🔍 Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Data reçue:", data);
        console.log("🔍 Structure de la réponse:", {
          hasWorks: !!data.works,
          worksType: Array.isArray(data.works) ? 'array' : typeof data.works,
          worksLength: data.works?.length,
          hasPagination: !!data.pagination,
          hasStats: !!data.stats,
          paginationTotal: data.pagination?.total,
          paginationPage: data.pagination?.page,
          paginationLimit: data.pagination?.limit
        });
        
        // Log détaillé pour debug
        if (data.pagination?.total > 0 && data.works?.length === 0) {
          console.error("❌ INCOHÉRENCE: total > 0 mais works.length = 0");
          console.error("❌ Pagination:", data.pagination);
          console.error("❌ Stats:", data.stats);
        }
        // L'API retourne un objet avec works, pagination, stats
        const worksArray = data.works || [];
        console.log(`✅ ${worksArray.length} works trouvés dans la réponse`);
        // Transformer les données des œuvres en format livre
        const livresData = worksArray.map((work: any) => {
          // Extraire l'image de couverture et la collection depuis le champ files
          let coverImage = "/placeholder.jpg";
          let collectionName = "-";
          
          if (work.files) {
            try {
              const filesData = typeof work.files === 'string' ? JSON.parse(work.files) : work.files;
              if (filesData.coverImage) {
                coverImage = filesData.coverImage;
              }
              if (filesData.collectionId && collections.length > 0) {
                // Trouver le nom de la collection depuis l'ID
                const collection = collections.find((c: any) => c.id === filesData.collectionId);
                if (collection) {
                  collectionName = collection.nom;
                }
              }
            } catch (e) {
              console.error("Erreur lors du parsing des fichiers:", e);
            }
          }
          
          return {
            id: work.id,
            image: coverImage,
            libelle: work.title,
            categorie: work.discipline?.name || "Non définie",
            collection: collectionName,
            statut: work.status === 'PUBLISHED' ? 'Disponible' : work.status === 'PENDING' ? 'En attente' : work.status === 'DRAFT' ? 'Brouillon' : work.status === 'REJECTED' ? 'Refusé' : work.status,
            ajouteLe: new Date(work.createdAt).toLocaleDateString('fr-FR'),
            classes: work.targetAudience || "-",
            matiere: work.discipline?.name || "Non définie",
            code: work.isbn || "-",
            prix: work.price || 0,
            tva: work.tva ? (work.tva * 100) : 18, // Convertir en pourcentage
            auteur: work.author?.name || "Non assigné",
            concepteur: work.concepteur?.name || "-",
            disciplineId: work.disciplineId || "",
            authorId: work.authorId || "",
            status: work.status
          };
        });
        console.log(`✅ ${livresData.length} livres formatés et ajoutés à l'état`);
        setLivres(livresData);
      } else {
        const errorText = await response.text();
        console.error("❌ Erreur API works:", response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Erreur inconnue" };
        }
        console.error("❌ Détails de l'erreur:", errorData);
        toast({
          title: "Erreur",
          description: errorData.error || `Erreur ${response.status}: Impossible de charger les livres`,
          variant: "destructive"
        });
        setLivres([]);
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
        // L'API peut retourner un tableau directement ou un objet avec disciplines
        const disciplinesArray = Array.isArray(data) ? data : (data.disciplines || data || []);
        console.log("Disciplines array:", disciplinesArray);
        setDisciplines(disciplinesArray);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur API disciplines:", response.status, errorData);
        toast({
          title: "Erreur",
          description: "Impossible de charger les disciplines",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading disciplines:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des disciplines",
        variant: "destructive"
      });
    }
  };

  const loadAuteurs = async () => {
    try {
      const response = await fetch('/api/users/list?role=AUTEUR');
      if (response.ok) {
        const data = await response.json();
        console.log("Auteurs chargés:", data);
        // L'API retourne un objet avec users et total
        const auteursArray = data.users || data || [];
        console.log("Auteurs array:", auteursArray);
        setAuteurs(auteursArray);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur API auteurs:", response.status, errorData);
        toast({
          title: "Erreur",
          description: "Impossible de charger les auteurs",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading auteurs:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des auteurs",
        variant: "destructive"
      });
    }
  };

  const loadConcepteurs = async () => {
    try {
      const response = await fetch('/api/users/list?role=CONCEPTEUR');
      if (response.ok) {
        const data = await response.json();
        console.log("Concepteurs chargés:", data);
        // L'API retourne un objet avec users et total
        const concepteursArray = data.users || data || [];
        console.log("Concepteurs array:", concepteursArray);
        setConcepteurs(concepteursArray);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur API concepteurs:", response.status, errorData);
        toast({
          title: "Erreur",
          description: "Impossible de charger les concepteurs",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading concepteurs:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des concepteurs",
        variant: "destructive"
      });
    }
  };

  const loadCollections = async () => {
    try {
      const response = await fetch('/api/pdg/collections');
      if (response.ok) {
        const data = await response.json();
        console.log("Collections chargées:", data);
        setCollections(data);
      }
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier image",
          variant: "destructive"
        });
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "L'image ne doit pas dépasser 5MB",
          variant: "destructive"
        });
        return;
      }

      setCoverImage(file);
      
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
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

    if (!newLivre.disciplineId || !newLivre.auteurId) {
      toast({
        title: "Erreur",
        description: "La discipline et l'auteur sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (!newLivre.prix || parseFloat(newLivre.prix) <= 0) {
      toast({
        title: "Erreur",
        description: "Le prix doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    const selectedDiscipline = disciplines.find((d: any) => d.id === newLivre.disciplineId);
    const selectedAuthor = auteurs.find((a: any) => a.id === newLivre.auteurId);

    if (!selectedDiscipline || !selectedAuthor) {
      toast({
        title: "Erreur",
        description: "Discipline ou auteur invalide. Veuillez réessayer.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // 1. Upload de l'image de couverture si présente
      let coverImageUrl = null;
      if (coverImage) {
        const formData = new FormData();
        formData.append('files', coverImage);
        formData.append('type', 'work');
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.files && uploadData.files.length > 0) {
            coverImageUrl = uploadData.files[0].path;
          }
        } else {
          console.warn("Erreur lors de l'upload de l'image, continuation sans image");
        }
      }

      // 2. Créer le livre
      // Utiliser la courte description si fournie, sinon générer une description par défaut
      // La description est obligatoire dans l'API
      let description = newLivre.courteDescription.trim();
      if (!description) {
        // Générer une description par défaut basée sur les informations disponibles
        const disciplineName = selectedDiscipline?.name || newLivre.matiere || "la discipline";
        const classes = newLivre.classes || "tous niveaux";
        description = `Livre de ${disciplineName} pour ${classes}`;
      }
      
      // S'assurer que la description n'est pas vide
      if (!description || description.trim().length === 0) {
        description = `Livre "${newLivre.titre}" - ${selectedDiscipline?.name || "Discipline non spécifiée"}`;
      }
      
      const workData = {
        title: newLivre.titre,
        description: description,
        disciplineId: selectedDiscipline.id,
        authorId: selectedAuthor.id,
        concepteurId: newLivre.concepteurId || null,
        category: newLivre.categorie,
        targetAudience: newLivre.classes,
        contentType: 'MANUAL',
        price: parseFloat(newLivre.prix),
        tva: parseFloat(newLivre.tva) / 100, // Convertir le pourcentage en décimal
        estimatedPrice: parseFloat(newLivre.prix),
        status: 'DRAFT', // Le PDG crée en DRAFT, puis peut publier
        isbn: newLivre.isbn,
        collectionId: newLivre.collectionId || null,
        coverImage: coverImageUrl
      };
      
      console.log("📤 Envoi des données de création:", workData);
      
      const response = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workData),
      });

      console.log("📥 Réponse création livre:", response.status, response.statusText);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log("✅ Livre créé avec succès:", responseData);
        toast({
          title: "Succès",
          description: "Livre créé avec succès"
        });
        setNewLivre({
          titre: "",
          categorie: "",
          collectionId: "",
          classes: "",
          matiere: "",
          isbn: "",
          courteDescription: "",
          prix: "",
          tva: "18",
          auteurId: "",
          concepteurId: "",
          disciplineId: ""
        });
        setCoverImage(null);
        setCoverImagePreview(null);
        setShowCreateModal(false);
        // Recharger les livres après un court délai pour s'assurer que la base est à jour
        setTimeout(() => {
          console.log("🔄 Rechargement des livres après création...");
          loadLivres();
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error("❌ Erreur API création:", response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Erreur inconnue" };
        }
        console.error("❌ Détails de l'erreur:", errorData);
        toast({
          title: "Erreur",
          description: errorData.error || `Erreur ${response.status}: Impossible de créer le livre`,
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

  const handleEdit = async (livre: Livre) => {
    try {
      // Récupérer le work complet depuis l'API
      const response = await fetch('/api/works');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des livres');
      }
      const data = await response.json();
      const worksArray = data.works || [];
      const work = worksArray.find((w: any) => w.id === livre.id);
      
      if (work) {
        setEditingLivre(livre);
        
        // Extraire collectionId depuis files si présent
        let collectionId = "";
        if (work.files) {
          try {
            const filesData = typeof work.files === 'string' ? JSON.parse(work.files) : work.files;
            collectionId = filesData.collectionId || "";
          } catch (e) {
            console.error("Erreur parsing files:", e);
          }
        }
        
        setNewLivre({
          titre: work.title || livre.libelle,
          categorie: work.category || "",
          collectionId: collectionId,
          classes: work.targetAudience || livre.classes,
          matiere: work.discipline?.name || livre.matiere,
          isbn: work.isbn || livre.code,
          courteDescription: work.description || "",
          prix: String(work.price || livre.prix || 0),
          tva: String(work.tva ? (work.tva * 100) : livre.tva),
          auteurId: work.authorId || "",
          concepteurId: work.concepteurId || "",
          disciplineId: work.disciplineId || livre.disciplineId
        });
        setShowEditModal(true);
      } else {
        toast({
          title: "Erreur",
          description: "Livre introuvable",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading work:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du livre",
        variant: "destructive"
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingLivre) return;

    if (!newLivre.titre.trim() || !newLivre.isbn.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre et l'ISBN sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (!newLivre.disciplineId || !newLivre.auteurId) {
      toast({
        title: "Erreur",
        description: "La discipline et l'auteur sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/works?id=${editingLivre.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newLivre.titre,
          description: newLivre.courteDescription || "",
          disciplineId: newLivre.disciplineId,
          authorId: newLivre.auteurId,
          concepteurId: newLivre.concepteurId || null,
          category: newLivre.categorie,
          targetAudience: newLivre.classes,
          price: parseFloat(newLivre.prix),
          tva: parseFloat(newLivre.tva) / 100,
          isbn: newLivre.isbn,
          collectionId: newLivre.collectionId || null
        }),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Livre modifié avec succès"
        });
        setShowEditModal(false);
        setEditingLivre(null);
        loadLivres();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de modifier le livre",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating livre:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du livre",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (livreId: string) => {
    try {
      setIsDeleting(livreId);
      const response = await fetch(`/api/works?id=${livreId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Livre supprimé avec succès"
        });
        loadLivres();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de supprimer le livre",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting livre:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du livre",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePublish = async (livreId: string, authorId: string) => {
    try {
      setIsPublishing(livreId);
      const response = await fetch('/api/works/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workId: livreId,
          action: 'publish',
          authorId: authorId // Utiliser l'auteur existant
        }),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Livre publié avec succès. Il est maintenant visible dans le catalogue."
        });
        loadLivres();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de publier le livre",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error publishing livre:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la publication du livre",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(null);
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
              <table className="w-full min-w-[1400px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Libellé</th>
                    <th className="text-left py-3 px-2">ISBN/Code</th>
                    <th className="text-left py-3 px-2">Auteur</th>
                    <th className="text-left py-3 px-2">Concepteur</th>
                    <th className="text-left py-3 px-2">Discipline</th>
                    <th className="text-left py-3 px-2">Prix (F CFA)</th>
                    <th className="text-left py-3 px-2">TVA (%)</th>
                    <th className="text-left py-3 px-2">Statut</th>
                    <th className="text-left py-3 px-2">Collection</th>
                    <th className="text-left py-3 px-2">Classe(s)</th>
                    <th className="text-left py-3 px-2">Ajouté le</th>
                    <th className="text-left py-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-gray-500">
                        Chargement des livres...
                      </td>
                    </tr>
                  ) : livres.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-gray-500">
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
                        <td className="py-3 px-2 text-sm text-gray-600 font-mono">
                          {livre.code}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.auteur}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.concepteur}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.categorie}
                        </td>
                        <td className="py-3 px-2 text-sm font-semibold text-gray-900">
                          {livre.prix > 0 ? `${livre.prix.toLocaleString('fr-FR')} F CFA` : "Non défini"}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.tva.toFixed(1)}%
                        </td>
                        <td className="py-3 px-2">
                          <Badge
                            variant={livre.statut === "Disponible" ? "default" : "secondary"}
                            className={
                              livre.statut === "Disponible"
                                ? "bg-green-100 text-green-800"
                                : livre.statut === "En attente"
                                ? "bg-yellow-100 text-yellow-800"
                                : livre.statut === "Brouillon"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {livre.statut}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.collection}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.classes}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {livre.ajouteLe}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleEdit(livre)}
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4 text-orange-500" />
                            </button>
                            {livre.status === 'DRAFT' && (
                              <button 
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={() => livre.authorId && handlePublish(livre.id, livre.authorId)}
                                disabled={isPublishing === livre.id || !livre.authorId}
                                title="Publier"
                              >
                                {isPublishing === livre.id ? (
                                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-blue-500" />
                                )}
                              </button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button 
                                  className="p-1 hover:bg-gray-100 rounded"
                                  disabled={isDeleting === livre.id}
                                  title="Supprimer"
                                >
                                  {isDeleting === livre.id ? (
                                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  )}
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir supprimer le livre "{livre.libelle}" ? 
                                    Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(livre.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

      {/* Modal Création/Édition */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setShowEditModal(false);
          setEditingLivre(null);
          // Réinitialiser le formulaire
          setNewLivre({
            titre: "",
            categorie: "",
            collectionId: "",
            classes: "",
            matiere: "",
            isbn: "",
            courteDescription: "",
            prix: "",
            tva: "18",
            auteurId: "",
            concepteurId: "",
            disciplineId: ""
          });
          setCoverImage(null);
          setCoverImagePreview(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {showEditModal ? "Modifier un livre" : "Ajouter un livre"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Section Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">
                  Titre * :
                </Label>
                <Input 
                  placeholder="Titre du livre" 
                  value={newLivre.titre}
                  onChange={(e) => setNewLivre({ ...newLivre, titre: e.target.value })}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">
                  Code ISBN * :
                </Label>
                <Input 
                  placeholder="ISBN du livre" 
                  value={newLivre.isbn}
                  onChange={(e) => setNewLivre({ ...newLivre, isbn: e.target.value })}
                />
              </div>
            </div>

            {/* Section Discipline et Catégorie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">
                  Discipline * :
                </Label>
                <Select 
                  value={newLivre.disciplineId} 
                  onValueChange={(value) => setNewLivre({ ...newLivre, disciplineId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplines.map((discipline: any) => (
                      <SelectItem key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>

            {/* Section Auteur et Concepteur */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">
                  Auteur * :
                </Label>
                <Select 
                  value={newLivre.auteurId} 
                  onValueChange={(value) => setNewLivre({ ...newLivre, auteurId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un auteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {auteurs.map((auteur: any) => (
                      <SelectItem key={auteur.id} value={auteur.id}>
                        {auteur.name} ({auteur.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">
                  Concepteur (optionnel) :
                </Label>
                <Select 
                  value={newLivre.concepteurId || "none"} 
                  onValueChange={(value) => setNewLivre({ ...newLivre, concepteurId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un concepteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun concepteur</SelectItem>
                    {concepteurs.map((concepteur: any) => (
                      <SelectItem key={concepteur.id} value={concepteur.id}>
                        {concepteur.name} ({concepteur.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section Prix et TVA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">
                  Prix public (F CFA) * :
                </Label>
                <Input 
                  type="number"
                  placeholder="0" 
                  value={newLivre.prix}
                  onChange={(e) => setNewLivre({ ...newLivre, prix: e.target.value })}
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">
                  TVA (%) * :
                </Label>
                <Input 
                  type="number"
                  placeholder="18" 
                  value={newLivre.tva}
                  onChange={(e) => setNewLivre({ ...newLivre, tva: e.target.value })}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>

            {/* Section Collection et Classes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">
                  Collection (optionnel) :
                </Label>
                <Select 
                  value={newLivre.collectionId || "none"} 
                  onValueChange={(value) => setNewLivre({ ...newLivre, collectionId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune collection</SelectItem>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>

            {/* Photo de couverture */}
            <div>
              <Label className="block text-sm font-medium mb-1">
                Photo de couverture (optionnel) :
              </Label>
              {coverImagePreview ? (
                <div className="relative">
                  <img 
                    src={coverImagePreview} 
                    alt="Aperçu" 
                    className="w-full h-48 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <Label htmlFor="cover-image" className="cursor-pointer">
                    <span className="text-sm text-gray-600">Cliquez pour sélectionner une image</span>
                    <Input
                      id="cover-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG ou GIF (max 5MB)</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <Label className="block text-sm font-medium mb-1">
                Courte description (optionnel) :
              </Label>
              <Textarea 
                placeholder="Description courte du livre" 
                value={newLivre.courteDescription}
                onChange={(e) => setNewLivre({ ...newLivre, courteDescription: e.target.value })}
                rows={3}
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
              onClick={showEditModal ? handleUpdate : handleCreateLivre}
              disabled={isSaving || !newLivre.titre.trim() || !newLivre.isbn.trim() || !newLivre.disciplineId || !newLivre.auteurId || !newLivre.prix || !dataLoaded}
            >
              {isSaving ? (showEditModal ? "Modification..." : "Enregistrement...") : dataLoaded ? (showEditModal ? "Modifier" : "Enregistrer") : "Chargement..."}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}