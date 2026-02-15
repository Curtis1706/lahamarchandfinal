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
import { Plus, Upload, Edit, Trash2, Image as ImageIcon, X, CheckCircle, Loader2, RotateCcw } from "lucide-react";
import Image from "next/image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CLIENT_TYPE_LABELS, ROYALTY_TYPE_LABELS, ROYALTY_TYPES, CLIENT_TYPES } from "@/lib/constants/labels";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  auteur: string
  concepteur: string
  disciplineId: string
  authorId?: string
  status?: string // Statut brut (DRAFT, PUBLISHED, etc.)
  prices?: any[]
  royaltyRate?: number
  royaltyType?: string
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
    auteurId: "",
    concepteurId: "",
    disciplineId: "",
    royaltyRate: "0",
    royaltyType: "PERCENTAGE",
    prices: Object.values(CLIENT_TYPES).map(type => ({ clientType: type, price: "" }))
  });
  const [collections, setCollections] = useState<any[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [auteurs, setAuteurs] = useState<any[]>([]);
  const [concepteurs, setConcepteurs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { toast } = useToast();

  // Charger les livres depuis l'API
  useEffect(() => {
    loadLivres();
    loadDisciplines();
    loadAuteurs();
    loadConcepteurs();
    loadCollections();
    loadCategories();
    loadSchoolClasses();
  }, []);

  // Vérifier si les données sont chargées
  useEffect(() => {
    if (disciplines.length > 0 && auteurs.length > 0 && schoolClasses.length > 0) {
      setDataLoaded(true);
    }
  }, [disciplines, auteurs, concepteurs, schoolClasses]);

  const loadLivres = async () => {
    try {
      setIsLoading(true);

      // Diagnostic: vérifier d'abord si des works existent (optionnel, ne bloque pas si erreur)
      try {
        const debugResponse = await fetch('/api/works/debug');
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          if (debugData.worksWithoutRelations && debugData.worksWithoutRelations.length > 0) {
          }
        } else {
          const errorText = await debugResponse.text();
        }
      } catch (debugError) {
        // Ne pas bloquer si le debug échoue
      }

      // Pour le PDG, récupérer tous les works sans limite de pagination
      const response = await fetch('/api/works?limit=1000&page=1');
      if (response.ok) {
        const data = await response.json();

        // Log détaillé pour debug
        if (data.pagination?.total > 0 && data.works?.length === 0) {
          console.error("❌ INCOHÉRENCE: total > 0 mais works.length = 0");
          console.error("❌ Pagination:", data.pagination);
          console.error("❌ Stats:", data.stats);
        }
        // L'API retourne un objet avec works, pagination, stats
        const worksArray = data.works || [];
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
            statut: work.status === 'PUBLISHED' ? 'Disponible' : work.status === 'PENDING' ? 'En attente' : work.status === 'VALIDATED' ? 'Validée' : work.status === 'SUSPENDED' ? 'Suspendue' : work.status === 'DRAFT' ? 'Brouillon' : work.status === 'REJECTED' ? 'Refusé' : work.status === 'ON_SALE' ? 'En vente' : work.status === 'OUT_OF_STOCK' ? 'Rupture de stock' : work.status === 'DISCONTINUED' ? 'Arrêté' : work.status,
            ajouteLe: new Date(work.createdAt).toLocaleDateString('fr-FR'),
            classes: work.targetAudience || "-",
            matiere: work.discipline?.name || "Non définie",
            code: work.isbn || "-",
            prix: work.price || 0,
            auteur: work.author?.name || "Non assigné",
            concepteur: work.concepteur?.name || "-",
            disciplineId: work.disciplineId || "",
            authorId: work.authorId || "",
            status: work.status,
            prices: work.prices || [],
            royaltyRate: work.royaltyRate || 0,
            royaltyType: work.royaltyType || "PERCENTAGE"
          };
        });
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
        // L'API peut retourner un tableau directement ou un objet avec disciplines
        const disciplinesArray = Array.isArray(data) ? data : (data.disciplines || data || []);
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
        // L'API retourne un objet avec users et total
        const auteursArray = data.users || data || [];
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
        // L'API retourne un objet avec users et total
        const concepteursArray = data.users || data || [];
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
        setCollections(data);
      }
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/pdg/categories');
      if (response.ok) {
        const data = await response.json();
        // Filtrer uniquement les catégories actives
        const activeCategories = Array.isArray(data) ? data.filter((cat: any) => cat.statut === 'Disponible' || cat.isActive) : [];
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories",
        variant: "destructive"
      });
    }
  };

  const loadSchoolClasses = async () => {
    try {
      const response = await fetch('/api/pdg/classes');
      if (response.ok) {
        const data = await response.json();
        setSchoolClasses(data);
      }
    } catch (error) {
      console.error("Error loading school classes:", error);
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
        // tva supprimé, géré par l'API
        estimatedPrice: parseFloat(newLivre.prix),
        status: 'PUBLISHED', // Le PDG publie directement
        isbn: newLivre.isbn,
        collectionId: newLivre.collectionId || null,
        coverImage: coverImageUrl,
        royaltyRate: parseFloat(newLivre.royaltyRate),
        royaltyType: newLivre.royaltyType,
        prices: newLivre.prices
          .filter(p => p.price && !isNaN(parseFloat(p.price)))
          .map(p => ({
            clientType: p.clientType,
            price: parseFloat(p.price)
          }))
      };


      const response = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workData),
      });


      if (response.ok) {
        const responseData = await response.json();
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
          auteurId: "",
          concepteurId: "",
          disciplineId: "",
          royaltyRate: "0",
          royaltyType: "PERCENTAGE",
          prices: Object.values(CLIENT_TYPES).map(type => ({
            clientType: type,
            price: ""
          }))
        });
        setCoverImage(null);
        setCoverImagePreview(null);
        setShowCreateModal(false);
        // Recharger les livres après un court délai pour s'assurer que la base est à jour
        setTimeout(() => {
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

        // Extraire collectionId et coverImage depuis files si présent
        let collectionId = "";
        if (work.files) {
          try {
            const filesData = typeof work.files === 'string' ? JSON.parse(work.files) : work.files;
            collectionId = filesData.collectionId || "";
            // Charger l'image de couverture existante
            if (filesData.coverImage) {
              setCoverImagePreview(filesData.coverImage);
            }
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
          auteurId: work.authorId || "",
          concepteurId: work.concepteurId || "",
          disciplineId: work.disciplineId || livre.disciplineId,
          royaltyRate: String(work.royaltyRate || 0),
          royaltyType: work.royaltyType || "PERCENTAGE",
          prices: Object.values(CLIENT_TYPES).map(type => {
            const existing = (work.prices || []).find((p: any) => p.clientType === type);
            return {
              clientType: type,
              price: existing ? String(existing.price) : ""
            };
          })
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

      // 1. Upload de l'image de couverture si une nouvelle image a été sélectionnée
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
        }
      }

      // 2. Préparer les données de mise à jour
      const updateData: any = {
        workId: editingLivre.id,
        title: newLivre.titre,
        description: newLivre.courteDescription || "",
        disciplineId: newLivre.disciplineId,
        authorId: newLivre.auteurId,
        concepteurId: newLivre.concepteurId || null,
        category: newLivre.categorie,
        targetAudience: newLivre.classes,
        price: parseFloat(newLivre.prix),
        // tva supprimé, géré par l'API (modif préserve l'existant)
        isbn: newLivre.isbn,
        collectionId: newLivre.collectionId || null,
        royaltyRate: parseFloat(newLivre.royaltyRate),
        royaltyType: newLivre.royaltyType,
        prices: newLivre.prices.map(p => ({
          clientType: p.clientType,
          price: parseFloat(p.price)
        }))
      };

      // 3. Ajouter l'image de couverture si elle a été uploadée
      if (coverImageUrl) {
        updateData.files = JSON.stringify({ coverImage: coverImageUrl });
      }

      const response = await fetch('/api/works', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
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
    // 1. Sauvegarder l'état actuel pour pouvoir restaurer en cas d'erreur
    const previousLivres = [...livres];

    // 2. Mise à jour optimiste de l'UI
    setLivres(currentLivres =>
      currentLivres.map(livre =>
        livre.id === livreId
          ? { ...livre, statut: 'Disponible', status: 'PUBLISHED' }
          : livre
      )
    );

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
        // On recharge les données en arrière-plan pour être sûr, mais l'UI est déjà à jour
        loadLivres();
      } else {
        // En cas d'erreur API, on restaure l'état précédent
        setLivres(previousLivres);
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de publier le livre",
          variant: "destructive"
        });
      }
    } catch (error) {
      // En cas d'erreur réseau, on restaure l'état précédent
      setLivres(previousLivres);
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
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                  onClick={loadLivres}
                  disabled={isLoading}
                >
                  <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualiser
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
                            <div className="relative w-12 h-16 bg-gray-100 rounded overflow-hidden">
                              <Image
                                src={livre.image}
                                alt={livre.libelle}
                                fill
                                className="object-cover"
                                sizes="48px"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.jpg';
                                }}
                              />
                            </div>
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
                        <td className="py-3 px-2">
                          <Badge
                            variant={livre.statut === "Disponible" || livre.statut === "Validée" ? "default" : "secondary"}
                            className={
                              livre.statut === "Disponible" || livre.statut === "Validée"
                                ? "bg-green-100 text-green-800"
                                : livre.statut === "En attente"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : livre.statut === "Brouillon"
                                    ? "bg-gray-100 text-gray-800"
                                    : livre.statut === "Suspendue" || livre.statut === "Refusé"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
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
                                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                                onClick={() => livre.authorId && handlePublish(livre.id, livre.authorId)}
                                disabled={isPublishing === livre.id}
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
            auteurId: "",
            concepteurId: "",
            disciplineId: "",
            royaltyRate: "0",
            royaltyType: "PERCENTAGE",
            prices: Object.values(CLIENT_TYPES).map(type => ({
              clientType: type,
              price: ""
            }))
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
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.nom || category.name}>
                          {category.nom || category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-category" disabled>Aucune catégorie disponible</SelectItem>
                    )}
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

            {/* Section Prix */}
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
            </div>

            {/* Section Droit d'auteur (Style Input Group) */}
            <div className="border-t pt-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                {/* Groupe Droit d'auteur + Type */}
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium text-indigo-900">
                    Droit d'auteur
                  </Label>
                  <div className="flex items-center">
                    <div className="bg-slate-100 border border-r-0 border-gray-300 rounded-l-md px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
                      Droit d'auteur
                    </div>
                    <Select
                      value={newLivre.royaltyType}
                      onValueChange={(value) => setNewLivre({ ...newLivre, royaltyType: value })}
                    >
                      <SelectTrigger className="rounded-l-none border-l-0 focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">%</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">F CFA</SelectItem>
                        {/* Option Annuel désactivée pour le moment car non supportée par le backend */}
                        {/* <SelectItem value="ANNUAL">Annuel</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Valeur */}
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium text-indigo-900">
                    Valeur ({newLivre.royaltyType === 'PERCENTAGE' ? '%' : 'F CFA'})
                  </Label>
                  <Input
                    type="number"
                    value={newLivre.royaltyRate}
                    onChange={(e) => setNewLivre({ ...newLivre, royaltyRate: e.target.value })}
                    min="0"
                    step={newLivre.royaltyType === 'PERCENTAGE' ? "0.1" : "1"}
                    placeholder={newLivre.royaltyType === 'PERCENTAGE' ? "Ex: 10" : "Ex: 500"}
                  />
                </div>
              </div>
            </div>

            {/* Section Tarification Multi-Prix */}
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold mb-2 text-indigo-600">Tarification par type de client (optionnel)</h3>
              <p className="text-[10px] text-gray-500 mb-3">
                Laissez vide pour utiliser le prix public par défaut pour ce type de client.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {Object.values(CLIENT_TYPES).filter(type => type !== CLIENT_TYPES.INDIVIDUAL).map(type => {
                  const label = CLIENT_TYPE_LABELS[type] || type;
                  const priceEntry = newLivre.prices.find(p => p.clientType === type);
                  return (
                    <div key={type} className="flex flex-col space-y-1">
                      <Label htmlFor={`price-${type}`} className="text-xs font-medium">
                        Prix {label} (F CFA) :
                      </Label>
                      <Input
                        id={`price-${type}`}
                        type="number"
                        placeholder={newLivre.prix || "0"}
                        value={priceEntry?.price || ""}
                        onChange={(e) => {
                          const newPrices = [...newLivre.prices];
                          const index = newPrices.findIndex(p => p.clientType === type);
                          if (index >= 0) {
                            newPrices[index].price = e.target.value;
                          } else {
                            newPrices.push({ clientType: type, price: e.target.value });
                          }
                          setNewLivre({ ...newLivre, prices: newPrices });
                        }}
                        min="0"
                        step="100"
                        className="h-8 text-sm"
                      />
                    </div>
                  );
                })}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal h-10 bg-white"
                    >
                      <span className="truncate">
                        {newLivre.classes || "Sélectionner les classes"}
                      </span>
                      <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="p-2 border-b">
                      <div className="flex items-center space-x-2 px-2 py-1">
                        <Checkbox
                          id="select-all-classes"
                          checked={schoolClasses.length > 0 && newLivre.classes.split(', ').filter(c => c).length === schoolClasses.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const allClassNames = schoolClasses.map(c => c.classe).join(', ');
                              setNewLivre({ ...newLivre, classes: allClassNames });
                            } else {
                              setNewLivre({ ...newLivre, classes: "" });
                            }
                          }}
                        />
                        <label htmlFor="select-all-classes" className="text-sm font-medium cursor-pointer">
                          Toutes les classes
                        </label>
                      </div>
                    </div>
                    <ScrollArea className="h-72 p-2">
                      <div className="grid grid-cols-2 gap-2">
                        {schoolClasses.map((classe) => {
                          const isSelected = newLivre.classes.split(', ').includes(classe.classe);
                          return (
                            <div key={classe.id} className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded text-left">
                              <Checkbox
                                id={`class-${classe.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  let currentClasses = newLivre.classes ? newLivre.classes.split(', ').filter(c => c) : [];
                                  if (checked) {
                                    if (!currentClasses.includes(classe.classe)) {
                                      currentClasses.push(classe.classe);
                                    }
                                  } else {
                                    currentClasses = currentClasses.filter(c => c !== classe.classe);
                                  }
                                  // Trier les classes pour un affichage cohérent (optionnel)
                                  setNewLivre({ ...newLivre, classes: currentClasses.join(', ') });
                                }}
                              />
                              <label htmlFor={`class-${classe.id}`} className="text-sm cursor-pointer truncate">
                                {classe.classe}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
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
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setEditingLivre(null);
              }}
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