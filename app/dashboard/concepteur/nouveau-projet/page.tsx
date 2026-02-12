"use client";

import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Upload,
  Send,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { useDisciplines } from "@/hooks/use-disciplines";

interface ProjectFormData {
  title: string;
  description: string;
  disciplineId: string;
  objectives: string;
  expectedDeliverables: string;
  requiredResources: string;
  timeline: string;
}

export default function NouveauProjetPage() {
  const { user } = useCurrentUser();
  const { disciplines, loading: disciplinesLoading } = useDisciplines();
  const router = useRouter();

  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    disciplineId: "",
    objectives: "",
    expectedDeliverables: "",
    requiredResources: "",
    timeline: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} fichier(s) ajouté(s)`);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    toast.info("Fichier supprimé");
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error("Le titre du projet est obligatoire");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("La description du projet est obligatoire");
      return;
    }
    if (!formData.disciplineId) {
      toast.error("Veuillez sélectionner une discipline");
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload des fichiers s'il y en a
      const uploadedFilesList = [];
      if (attachedFiles.length > 0) {
        toast.info("Envoi des fichiers en cours...");

        // Upload un par un pour mieux gérer les erreurs
        for (const file of attachedFiles) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append('files', file);
            formDataUpload.append('type', 'project');

            // Appel direct à l'API d'upload (qui gère Vercel Blob / Cloudinary)
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formDataUpload
            });

            if (!response.ok) {
              throw new Error(`Erreur upload ${file.name}`);
            }

            const result = await response.json();

            // L'API retourne { files: [...] }
            const uploadedFile = result.files && result.files.length > 0 ? result.files[0] : null;

            if (uploadedFile && uploadedFile.path) {
              uploadedFilesList.push({
                name: file.name,
                url: uploadedFile.path,
                type: file.type,
                size: file.size
              });
            }
          } catch (uploadError) {
            console.error(`Erreur upload ${file.name}:`, uploadError);
            toast.error(`Erreur lors de l'envoi de ${file.name}`);
            // On continue avec les autres fichiers
          }
        }
      }

      const projectData: any = { // Using any to bypass strict type check for now
        title: formData.title.trim(),
        description: formData.description.trim(),
        disciplineId: formData.disciplineId,
        concepteurId: user?.id,
        objectives: formData.objectives.trim(),
        expectedDeliverables: formData.expectedDeliverables.trim(),
        requiredResources: formData.requiredResources.trim(),
        timeline: formData.timeline.trim(),
        files: uploadedFilesList.length > 0 ? JSON.stringify(uploadedFilesList) : null,
        status: "DRAFT"
      };

      const result = await apiClient.createConcepteurProject(projectData);

      toast.success("Projet créé avec succès !");
      router.push("/dashboard/concepteur/mes-projets");

    } catch (error: any) {
      console.error("Erreur création projet:", error);
      toast.error(error.message || "Erreur lors de la création du projet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.description.trim() && formData.disciplineId;

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
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/concepteur/mes-projets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouveau Projet</h1>
          <p className="text-muted-foreground">
            Créez un projet de conception qui pourra générer des œuvres
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Informations du projet</span>
              </CardTitle>
              <CardDescription>
                Renseignez les informations de base de votre projet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Titre du projet *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Manuel interactif d'Histoire"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="discipline">Discipline *</Label>
                <Select value={formData.disciplineId} onValueChange={(value) => handleInputChange("disciplineId", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplinesLoading ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Chargement...
                      </SelectItem>
                    ) : (
                      disciplines.map((discipline) => (
                        <SelectItem key={discipline.id} value={discipline.id}>
                          {discipline.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description du projet *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre projet, son contexte et ses enjeux..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="objectives">Objectifs du projet</Label>
                <Textarea
                  id="objectives"
                  placeholder="Quels sont les objectifs pédagogiques ou artistiques ?"
                  value={formData.objectives}
                  onChange={(e) => handleInputChange("objectives", e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="deliverables">Livrables attendus</Label>
                <Textarea
                  id="deliverables"
                  placeholder="Quels sont les livrables prévus (livres, supports, etc.) ?"
                  value={formData.expectedDeliverables}
                  onChange={(e) => handleInputChange("expectedDeliverables", e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="resources">Ressources nécessaires</Label>
                <Textarea
                  id="resources"
                  placeholder="Quelles ressources sont nécessaires pour ce projet ?"
                  value={formData.requiredResources}
                  onChange={(e) => handleInputChange("requiredResources", e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="timeline">Planning prévisionnel</Label>
                <Textarea
                  id="timeline"
                  placeholder="Quel est le planning prévisionnel du projet ?"
                  value={formData.timeline}
                  onChange={(e) => handleInputChange("timeline", e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pièces jointes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Pièces jointes</span>
              </CardTitle>
              <CardDescription>
                Ajoutez des fichiers pour illustrer votre projet (maquettes, visuels, documents...)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Label htmlFor="file-upload">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Cliquez pour ajouter des fichiers ou glissez-déposez
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, PNG, JPG (max 10MB par fichier)
                      </p>
                    </div>
                  </Label>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Fichiers attachés :</Label>
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statut */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statut du projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm">Brouillon</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Le projet sera sauvegardé en brouillon et pourra être modifié avant soumission.
              </p>
            </CardContent>
          </Card>

          {/* Workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>1. Création du projet</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-muted-foreground">2. Soumission au PDG</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-muted-foreground">3. Validation PDG</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-muted-foreground">4. Création d'œuvres</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Créer le projet
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Le projet sera créé en brouillon et pourra être modifié avant soumission au PDG.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
