"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen,
  Upload,
  Send,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileText,
  Image,
  XCircle,
  Tag,
  Plus,
  Trash2,
  ArrowLeft as BackIcon
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

interface WorkFormData {
  title: string;
  description: string;
  courteDescription: string;
  isbn: string;
  disciplineId: string;
  authorId: string;
  projectId: string;
  category: string;
  targetAudience: string;
  educationalObjectives: string;
  contentType: string;
  price: string;
  keywords: string[];
  collectionId: string;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
}

interface Author {
  id: string;
  name: string;
  email: string;
}

const contentTypes = [
  { value: "MANUEL_SCOLAIRE", label: "Manuel Scolaire" },
  { value: "CAHIER_EXERCICES", label: "Cahier d'Exercices" },
  { value: "LIVRE_NUMERIQUE", label: "Livre Numérique" },
  { value: "MODULE_ELEARNING", label: "Module E-learning" },
  { value: "AUDIOVISUEL", label: "Contenu Audiovisuel" },
  { value: "AUTRE", label: "Autre" },
];

const categories = [
  { value: "FICTION", label: "Fiction" },
  { value: "NON_FICTION", label: "Non-Fiction" },
  { value: "PEDAGOGIE", label: "Pédagogie" },
  { value: "RECHERCHE", label: "Recherche" },
  { value: "ART", label: "Art" },
  { value: "TECHNIQUE", label: "Technique" },
];

export default function NouvelleOeuvrePage() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId');

  const [disciplines, setDisciplines] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [collections, setCollections] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkFormData>({
    title: "",
    description: "",
    courteDescription: "",
    isbn: "",
    disciplineId: "",
    authorId: "",
    projectId: initialProjectId || "",
    category: "",
    targetAudience: "",
    educationalObjectives: "",
    contentType: "",
    price: "",
    keywords: [],
    collectionId: "",
  });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    if (user && user.role === "CONCEPTEUR") {
      loadDisciplines();
      loadProjects();
      loadAuthors();
      loadCollections();
    }
  }, [user]);

  const loadDisciplines = async () => {
    try {
      const data = await apiClient.getDisciplines();
      setDisciplines(data || []);
    } catch (error) {
      console.error("Error loading disciplines:", error);
    }
  };

  const loadProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const data = await apiClient.getConcepteurProjects(user?.id || "");
      // Filtrer uniquement les projets acceptés
      const acceptedProjects = (data || []).filter((p: Project) => p.status === "ACCEPTED");
      setProjects(acceptedProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadAuthors = async () => {
    try {
      const response = await fetch("/api/pdg/users?role=AUTEUR");
      if (response.ok) {
        const data = await response.json();
        setAuthors(data.users || []);
      }
    } catch (error) {
      console.error("Error loading authors:", error);
    }
  };

  const loadCollections = async () => {
    try {
      const response = await fetch("/api/pdg/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data || []);
      }
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner une image");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }
      setCoverImage(file);
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

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.title.trim() || !formData.description.trim() || !formData.disciplineId || !formData.authorId) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vous devez être connecté pour créer une œuvre.");
      return;
    }

    // Validation finale
    if (!formData.title.trim() || !formData.description.trim() || !formData.disciplineId || !formData.authorId || !formData.contentType || !formData.category) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!formData.isbn.trim()) {
      toast.error("L'ISBN est obligatoire.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Upload de l'image de couverture si présente
      let coverImageUrl = null;
      if (coverImage) {
        const formDataImage = new FormData();
        formDataImage.append('file', coverImage);
        formDataImage.append('type', 'cover');
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataImage
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          coverImageUrl = uploadData.url;
        }
      }

      // 2. Upload des fichiers
      let uploadedFiles = [];
      if (attachedFiles.length > 0) {
        const uploadResult = await apiClient.uploadFiles(attachedFiles, "work");
        uploadedFiles = uploadResult.files || [];
      }

      // 3. Créer l'œuvre
      const workData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        courteDescription: formData.courteDescription.trim(),
        isbn: formData.isbn.trim(),
        disciplineId: formData.disciplineId,
        authorId: formData.authorId,
        concepteurId: user.id,
        projectId: formData.projectId || null,
        category: formData.category,
        targetAudience: formData.targetAudience,
        educationalObjectives: formData.educationalObjectives,
        contentType: formData.contentType,
        price: formData.price ? parseFloat(formData.price) : 0,
        keywords: formData.keywords,
        files: uploadedFiles,
        collectionId: formData.collectionId || null,
        coverImage: coverImageUrl,
        status: "DRAFT"
      };

      const response = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      toast.success("Œuvre créée avec succès !");
      router.push("/dashboard/concepteur/mes-oeuvres");
    } catch (error: any) {
      console.error("Error creating work:", error);
      toast.error(error.message || "Erreur lors de la création de l'œuvre");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || user.role !== "CONCEPTEUR") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Accès non autorisé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <BookOpen className="h-8 w-8" />
            <span>Nouvelle œuvre</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez une nouvelle œuvre en tant que concepteur
          </p>
        </div>
        <Link href="/dashboard/concepteur/mes-oeuvres">
          <Button variant="outline">
            <BackIcon className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
            <CardDescription>
              Étape {currentStep} sur 3
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Étape 1: Informations de base */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Titre de l'œuvre"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="isbn">ISBN *</Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                      placeholder="ISBN"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description complète de l'œuvre"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="courteDescription">Courte description</Label>
                  <Textarea
                    id="courteDescription"
                    value={formData.courteDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, courteDescription: e.target.value }))}
                    placeholder="Description courte (résumé)"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discipline">Discipline *</Label>
                    <Select
                      value={formData.disciplineId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, disciplineId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une discipline" />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplines.map((discipline) => (
                          <SelectItem key={discipline.id} value={discipline.id}>
                            {discipline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="author">Auteur *</Label>
                    <Select
                      value={formData.authorId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, authorId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un auteur" />
                      </SelectTrigger>
                      <SelectContent>
                        {authors.map((author) => (
                          <SelectItem key={author.id} value={author.id}>
                            {author.name} ({author.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project">Projet associé</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un projet (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucun projet</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="collection">Collection</Label>
                    <Select
                      value={formData.collectionId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, collectionId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une collection (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucune collection</SelectItem>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="coverImage">Photo de couverture</Label>
                  <div className="mt-2">
                    {coverImagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={coverImagePreview}
                          alt="Aperçu"
                          className="h-32 w-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2"
                          onClick={handleRemoveImage}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Image className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <Label htmlFor="coverImageInput" className="cursor-pointer">
                          <span className="text-sm text-gray-600">Cliquez pour télécharger</span>
                          <Input
                            id="coverImageInput"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Étape 2: Détails et métadonnées */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contentType">Type de contenu *</Label>
                    <Select
                      value={formData.contentType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {contentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="targetAudience">Public cible</Label>
                  <Input
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="Ex: Élèves de 6ème, Étudiants universitaires..."
                  />
                </div>

                <div>
                  <Label htmlFor="educationalObjectives">Objectifs pédagogiques</Label>
                  <Textarea
                    id="educationalObjectives"
                    value={formData.educationalObjectives}
                    onChange={(e) => setFormData(prev => ({ ...prev, educationalObjectives: e.target.value }))}
                    placeholder="Objectifs pédagogiques de l'œuvre"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="price">Prix (F CFA)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label>Mots-clés</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                      placeholder="Ajouter un mot-clé"
                    />
                    <Button type="button" onClick={handleAddKeyword}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-1"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Étape 3: Fichiers */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Fichiers associés</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <Label htmlFor="fileInput" className="cursor-pointer">
                      <span className="text-sm text-gray-600">Cliquez pour télécharger des fichiers</span>
                      <Input
                        id="fileInput"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </Label>
                  </div>
                  {attachedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(2)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
              {currentStep < 3 ? (
                <Button type="button" onClick={handleNextStep}>
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Créer l'œuvre
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

