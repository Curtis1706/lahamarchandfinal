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

interface Discipline {
  id: string;
  name: string;
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

  const { disciplines, isLoading: isLoadingDisciplines } = useDisciplines();
  const [validatedProjects, setValidatedProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
        
    if (!userLoading && (!user || user.role !== "AUTEUR")) {
            router.push("/auth/login");
    } else if (user) {
            fetchValidatedProjects();
      if (user.disciplineId && !formData.disciplineId) {
        setFormData(prev => ({ ...prev, disciplineId: user.disciplineId }));
      }
    }
  }, [user, userLoading, router, formData.disciplineId]);

  const fetchValidatedProjects = useCallback(async () => {
    try {
      setIsLoadingProjects(true);
                  
      // Récupérer uniquement les projets validés (disponibles pour les auteurs)
      const validatedProjectsOnly = await apiClient.getValidatedProjects();
      
                        
      setValidatedProjects(validatedProjectsOnly || []);
      
      if (validatedProjectsOnly && validatedProjectsOnly.length > 0) {
                validatedProjectsOnly.forEach((project, index) => {
                  });
      } else {
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

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove),
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

  if (userLoading || isLoadingDisciplines || isLoadingProjects) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-3 text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!user || user.role !== "AUTEUR") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vous n'avez pas les permissions pour accéder à cette page.</p>
      </div>
    );
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4 mr-2 text-muted-foreground" />;
    if (fileType.startsWith("audio/")) return <Music className="h-4 w-4 mr-2 text-muted-foreground" />;
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4 mr-2 text-muted-foreground" />;
    if (fileType === "application/pdf") return <FileText className="h-4 w-4 mr-2 text-muted-foreground" />;
    return <FileText className="h-4 w-4 mr-2 text-muted-foreground" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/dashboard/auteur" className="hover:text-primary">Dashboard</Link>
        <span>/</span>
        <span>Nouvelle Œuvre</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Créer une nouvelle œuvre
          </CardTitle>
          <CardDescription>
            En tant qu'auteur, vous pouvez créer des œuvres et les rattacher à des projets validés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Informations de base */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Étape 1: Informations de base</h3>
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Étape 2: Classification et Rattachement</h3>
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
                
                <div>
                  <Label htmlFor="projectId" className="flex items-center gap-2">
                    📋 Projet à rattacher (optionnel)
                    {validatedProjects.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {validatedProjects.length} disponible(s)
                      </Badge>
                    )}
                  </Label>
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
                    <p className="text-sm text-muted-foreground mt-1">
                      Chargement des projets validés...
                    </p>
                  ) : validatedProjects.length === 0 ? (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>ℹ️ Aucun projet validé disponible</strong>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Vous pouvez créer une œuvre libre. Les projets validés par le PDG apparaîtront ici.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        <strong>✅ {validatedProjects.length} projet(s) validé(s) disponible(s)</strong>
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Vous pouvez rattacher votre œuvre à un projet existant ou créer une œuvre libre.
                      </p>
                    </div>
                  )}
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
                    onValueChange={(value) => handleInputChange("contentType", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type de contenu" />
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
            )}

            {/* Step 3: Détails complémentaires */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Étape 3: Détails et Fichiers</h3>
                <div>
                  <Label htmlFor="targetAudience">Public cible</Label>
                  <Input
                    id="targetAudience"
                    placeholder="Ex: Élèves de primaire, Enseignants, Grand public"
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="educationalObjectives">Objectifs pédagogiques</Label>
                  <Textarea
                    id="educationalObjectives"
                    placeholder="Décrivez les compétences ou connaissances que l'œuvre vise à développer..."
                    value={formData.educationalObjectives}
                    onChange={(e) => handleInputChange("educationalObjectives", e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="keywords">Mots-clés (appuyez sur Entrée pour ajouter)</Label>
                  <Input
                    id="keywords"
                    placeholder="Ex: grammaire, conjugaison, exercices"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleAddKeyword}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {keyword}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 p-0 text-muted-foreground hover:text-red-500"
                          onClick={() => handleRemoveKeyword(keyword)}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="attachments">Fichiers (manuscrit, PDF, images, audio, vidéo...)</Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="file:text-blue-600 file:hover:text-blue-700"
                  />
                  <div className="mt-2 space-y-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                        <div className="flex items-center">
                          {getFileIcon(file.type)}
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({(file.size / 1024).toFixed(2)} KB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="estimatedPrice">Prix de vente estimé (optionnel)</Label>
                  <Input
                    id="estimatedPrice"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 25.99"
                    value={formData.estimatedPrice}
                    onChange={(e) => handleInputChange("estimatedPrice", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Récapitulatif et soumission */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Étape 4: Récapitulatif et Soumission</h3>
                <Card className="p-4 space-y-3">
                  <p className="text-sm">
                    <span className="font-medium">Titre:</span> {formData.title}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Description:</span> {formData.description}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Discipline:</span> {disciplines.find(d => d.id === formData.disciplineId)?.name || "N/A"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Projet rattaché:</span> {
                      formData.projectId !== "none" 
                        ? validatedProjects.find(p => p.id === formData.projectId)?.title || "Non trouvé"
                        : "Aucun (création libre)"
                    }
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Catégorie:</span> {categories.find(c => c.value === formData.category)?.label || "N/A"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Type de contenu:</span> {contentTypes.find(ct => ct.value === formData.contentType)?.label || "N/A"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Fichiers attachés:</span> {attachedFiles.length > 0 ? `${attachedFiles.length} fichier(s)` : "Aucun"}
                  </p>
                  <Separator className="my-4" />
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span>
                      En soumettant, votre œuvre sera mise en attente de validation par le PDG.
                    </span>
                  </div>
                </Card>
              </div>
            )}

            {/* Navigation entre étapes */}
            <div className="flex justify-between pt-6">
              <div>
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handlePreviousStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Précédent
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Étape {currentStep} sur 4
                  </span>
                  {currentStep === 1 && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      📋 Champ projet à l'étape 2
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={handlePreviousStep}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Précédent
                    </Button>
                  )}
                  
                  {currentStep < 4 ? (
                    <Button type="button" onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700">
                      {currentStep === 1 ? "Aller au champ projet" : "Suivant"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
