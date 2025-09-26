"use client";

import { useState, useEffect, useCallback } from "react";
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
  Music,
  Video,
  XCircle,
  Tag,
  Plus,
  Trash2,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { useDisciplines } from "@/hooks/use-disciplines";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface WorkFormData {
  title: string;
  description: string;
  disciplineId: string;
  projectId: string;
  category: string;
  targetAudience: string;
  educationalObjectives: string;
  contentType: string;
  estimatedPrice: string;
  keywords: string[];
}

interface Project {
  id: string;
  title: string;
  description?: string;
  discipline: {
    id: string;
    name: string;
  };
  concepteur: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
}

export default function CreerOeuvrePage() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatedProjects, setValidatedProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  
  const { disciplines, isLoading: disciplinesLoading } = useDisciplines();
  
  const [formData, setFormData] = useState<WorkFormData>({
    title: "",
    description: "",
    disciplineId: "",
    projectId: initialProjectId || "none",
    category: "",
    targetAudience: "",
    educationalObjectives: "",
    contentType: "",
    estimatedPrice: "",
    keywords: [],
  });

  // Redirection si pas connecté ou pas auteur
  useEffect(() => {
    if (!userLoading && (!user || user.role !== "AUTEUR")) {
      router.push("/auth/login");
    }
  }, [user, userLoading, router]);

  // Charger les projets validés quand l'utilisateur est disponible
  useEffect(() => {
    if (user && user.role === "AUTEUR" && !userLoading) {
      console.log("🔍 useEffect - État:", { userLoading, user: user.email, role: user.role });
      console.log("✅ Utilisateur auteur détecté, chargement des projets...");
      fetchValidatedProjects();
      
      // Auto-sélection de la discipline si l'utilisateur en a une
      if (user.disciplineId && !formData.disciplineId) {
        setFormData(prev => ({ ...prev, disciplineId: user.disciplineId }));
      }
    }
  }, [user, userLoading, router, formData.disciplineId]);

  const fetchValidatedProjects = useCallback(async () => {
    try {
      setIsLoadingProjects(true);
      console.log("🔍 Début du chargement des projets validés...");
      console.log("🔍 Utilisateur actuel:", user?.email, "Rôle:", user?.role);
      
      // Récupérer uniquement les projets validés (disponibles pour les auteurs)
      const validatedProjectsOnly = await apiClient.getValidatedProjects();
      
      console.log("📚 Réponse API projets validés:", validatedProjectsOnly);
      console.log("📚 Type de réponse:", typeof validatedProjectsOnly);
      console.log("📚 Nombre de projets reçus:", validatedProjectsOnly?.length || 0);
      
      setValidatedProjects(validatedProjectsOnly || []);
      
      if (validatedProjectsOnly && validatedProjectsOnly.length > 0) {
        console.log("✅ Projets validés chargés avec succès:");
        validatedProjectsOnly.forEach((project, index) => {
          console.log(`   ${index + 1}. "${project.title}" (${project.discipline?.name}) - ${project.concepteur?.name}`);
        });
      } else {
        console.log("⚠️ Aucun projet validé trouvé");
        console.log("🔍 Vérifiez que des projets sont en statut ACCEPTED en base de données");
      }
    } catch (error: any) {
      console.error("❌ Erreur lors du chargement des projets validés:", error);
      console.error("❌ Détails de l'erreur:", {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      if (error.message?.includes("Non authentifié")) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        router.push("/auth/login");
      } else {
        toast.error("Erreur lors du chargement des projets disponibles: " + error.message);
      }
    } finally {
      setIsLoadingProjects(false);
      console.log("🔍 Chargement des projets terminé");
    }
  }, [user, router]);

  const handleInputChange = (field: keyof WorkFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} fichier(s) ajouté(s)`);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    toast.info("Fichier supprimé");
  };

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keywordInput.trim() !== "") {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()],
      }));
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }));
  };

  const handleNextStep = () => {
    // Validation basique pour l'étape actuelle avant de continuer
    if (currentStep === 1) {
      if (!formData.title.trim() || !formData.description.trim()) {
        toast.error("Le titre et la description sont obligatoires.");
      return;
    }
    } else if (currentStep === 2) {
      if (!formData.disciplineId || !formData.contentType || !formData.category) {
        toast.error("La discipline, le type de contenu et la catégorie sont obligatoires.");
      return;
    }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vous devez être connecté pour soumettre une œuvre.");
      return;
    }

    // Validation finale
    if (!formData.title.trim() || !formData.description.trim() || !formData.disciplineId || !formData.contentType || !formData.category) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Upload des fichiers d'abord (en mode temporaire)
      let uploadedFiles = [];
      if (attachedFiles.length > 0) {
        const uploadResult = await apiClient.uploadFiles(attachedFiles, "temp");
        uploadedFiles = uploadResult.files || [];
        toast.success("Fichiers uploadés avec succès !");
      }

      // 2. Créer l'œuvre avec les métadonnées
      const workData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        disciplineId: formData.disciplineId,
        authorId: user.id, // Obligatoire pour les auteurs
        projectId: formData.projectId !== "none" ? formData.projectId : null,
        category: formData.category,
        targetAudience: formData.targetAudience,
        educationalObjectives: formData.educationalObjectives,
        contentType: formData.contentType,
        estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : 0,
        keywords: formData.keywords,
        files: uploadedFiles,
        status: "PENDING" // En attente de validation PDG
      };

      console.log("🔍 Debug - WorkData:", workData);
      console.log("🔍 Debug - Description:", {
        original: formData.description,
        trimmed: formData.description.trim(),
        type: typeof formData.description,
        length: formData.description?.length,
        isEmpty: !formData.description?.trim()
      });

      const createdWork = await apiClient.createWork(workData);

      toast.success("Œuvre soumise avec succès pour validation !");
      router.push("/dashboard/auteur"); // Redirection vers le dashboard auteur
    } catch (error: any) {
      console.error("Error creating work:", error);
      toast.error(error.message || "Erreur lors de la soumission de l'œuvre.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "AUTEUR") {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/dashboard/auteur" className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
        </Link>
        <h1 className="text-3xl font-bold">Créer une nouvelle œuvre</h1>
        <p className="text-gray-600 mt-2">Soumettez votre création pour validation</p>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Informations de l'œuvre</CardTitle>
          <CardDescription>
            En tant qu'auteur, vous pouvez créer des œuvres et les rattacher à des projets validés.
          </CardDescription>
          </CardHeader>
        <CardContent>
          {/* Indicateur de progression */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Création d'œuvre - Étape {currentStep} sur 4</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {validatedProjects.length} projet(s) disponible(s)
                </Badge>
              </div>
            </div>
            
            {/* Barre de progression */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
            
            {/* Étapes */}
            <div className="flex justify-between text-xs text-gray-600">
              <div className={`text-center ${currentStep >= 1 ? 'text-blue-600 font-medium' : ''}`}>
                <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</div>
                Informations
              </div>
              <div className={`text-center ${currentStep >= 2 ? 'text-blue-600 font-medium' : ''}`}>
                <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</div>
                Classification
              </div>
              <div className={`text-center ${currentStep >= 3 ? 'text-blue-600 font-medium' : ''}`}>
                <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</div>
                Détails
              </div>
              <div className={`text-center ${currentStep >= 4 ? 'text-blue-600 font-medium' : ''}`}>
                <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">4</div>
                Fichiers
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Informations de base */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Informations de base</h3>
                  <p className="text-sm text-gray-600">Commencez par définir le titre et la description de votre œuvre</p>
                </div>
                <div>
                <Label htmlFor="title">Titre de l'œuvre *</Label>
                <Input
                  id="title"
                    placeholder="Ex: Manuel de Mathématiques CM2"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>
                <div>
                  <Label htmlFor="description">Description détaillée *</Label>
                <Textarea
                  id="description"
                    placeholder="Décrivez le contenu, les objectifs et le public cible de votre œuvre..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={6}
                  required
                />
              </div>
            </div>
            )}

            {/* Step 2: Classification et Projet */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Classification et Rattachement</h3>
                  <p className="text-sm text-gray-600">Définissez la discipline et rattachez votre œuvre à un projet validé</p>
                </div>
                <div>
                <Label htmlFor="discipline">Discipline *</Label>
                  <Select
                    value={formData.disciplineId}
                    onValueChange={(value) => handleInputChange("disciplineId", value)}
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
                
                <div className="border border-blue-200 p-4 rounded-lg bg-blue-50">
                  <Label htmlFor="projectId" className="flex items-center gap-2 text-blue-800 font-medium">
                    <FolderOpen className="h-4 w-4" />
                    Projet à rattacher (optionnel)
                    <Badge variant="outline" className="text-xs bg-blue-100 border-blue-300">
                      {validatedProjects.length} disponible(s)
                    </Badge>
                  </Label>
                  <p className="text-xs text-blue-600 mt-1">
                    Vous pouvez rattacher votre œuvre à un projet validé par l'administration
                  </p>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => handleInputChange("projectId", value)}
                    disabled={isLoadingProjects}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingProjects 
                          ? "Chargement des projets..." 
                          : "Choisir un projet validé"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          <div>
                            <div className="font-medium">Aucun projet (création libre)</div>
                            <div className="text-xs text-muted-foreground">
                              Créer une œuvre indépendante
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      {validatedProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <FolderOpen className="h-4 w-4 mr-2" />
                              {project.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {project.discipline.name} • par {project.concepteur.name}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isLoadingProjects ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                      Chargement des projets validés...
                    </p>
                  ) : validatedProjects.length === 0 ? (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-800">
                        <strong>ℹ️ Aucun projet validé disponible</strong>
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Vous pouvez créer une œuvre indépendante en sélectionnant "Aucun projet".
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        <strong>✅ {validatedProjects.length} projet(s) validé(s) disponible(s)</strong>
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Vous pouvez rattacher votre œuvre à l'un de ces projets validés.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="contentType">Type de contenu *</Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value) => handleInputChange("contentType", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type de contenu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUEL">Manuel scolaire</SelectItem>
                      <SelectItem value="CAHIER">Cahier d'exercices</SelectItem>
                      <SelectItem value="LIVRE">Livre de lecture</SelectItem>
                      <SelectItem value="GUIDE">Guide pédagogique</SelectItem>
                      <SelectItem value="AUTRE">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange("category", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EDUCATION">Éducation</SelectItem>
                      <SelectItem value="LITTERATURE">Littérature</SelectItem>
                      <SelectItem value="SCIENCES">Sciences</SelectItem>
                      <SelectItem value="HISTOIRE">Histoire</SelectItem>
                      <SelectItem value="GEOGRAPHIE">Géographie</SelectItem>
                      <SelectItem value="AUTRE">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Détails et Prix */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Détails et Prix</h3>
                  <p className="text-sm text-gray-600">Ajoutez les détails complémentaires et définissez le prix de votre œuvre</p>
                </div>
                
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedPrice">Prix suggéré (F CFA)</Label>
                <Input
                      id="estimatedPrice"
                  type="number"
                  placeholder="0"
                      value={formData.estimatedPrice}
                      onChange={(e) => handleInputChange("estimatedPrice", e.target.value)}
                />
              </div>
                  <div>
                    <Label htmlFor="targetAudience">Public cible</Label>
                <Input
                      id="targetAudience"
                      placeholder="Étudiants, Professionnels, Grand public..."
                      value={formData.targetAudience}
                      onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                />
              </div>
            </div>

                <div>
                  <Label htmlFor="educationalObjectives">Objectifs pédagogiques</Label>
                  <Textarea
                    id="educationalObjectives"
                    placeholder="Décrivez les objectifs d'apprentissage de votre œuvre..."
                    value={formData.educationalObjectives}
                    onChange={(e) => handleInputChange("educationalObjectives", e.target.value)}
                    rows={4}
                />
              </div>

                <div>
                  <Label htmlFor="keywords">Mots-clés</Label>
              <div className="space-y-2">
                <Input
                      placeholder="Tapez un mot-clé et appuyez sur Entrée"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleAddKeyword}
                    />
                    {formData.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {keyword}
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(index)}
                              className="ml-1 hover:text-red-500"
                            >
                              <XCircle className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
              </div>
            </div>
              </div>
            )}

            {/* Step 4: Fichiers et Soumission */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Fichiers et Soumission</h3>
                  <p className="text-sm text-gray-600">Ajoutez les fichiers nécessaires et soumettez votre œuvre pour validation</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                    <Label>Image de couverture</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Choisir une image
                      </Button>
              </div>
            </div>

            <div className="space-y-2">
                    <Label>Contenu principal</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Choisir un fichier
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                    <Label>Aperçu/Extrait</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Choisir un aperçu
                  </Button>
                    </div>
                </div>
              </div>

                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Fichiers attachés</Label>
              <div className="space-y-2">
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                  <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                        </div>
                      ))}
                </div>
              </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Processus de validation</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>1. Création de l'œuvre (Brouillon)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>2. Soumission pour validation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>3. Validation par le PDG</span>
              </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>4. Publication si approuvée</span>
                    </div>
                  </div>
                  </div>
                </div>
              )}

            {/* Navigation et Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center space-x-2">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handlePreviousStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Précédent
                </Button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {currentStep < 4 ? (
                  <Button type="button" onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700">
                    {currentStep === 1 ? "Continuer" : "Suivant"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Soumission...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Soumettre l'œuvre
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
            </CardContent>
          </Card>
    </div>
  );
}