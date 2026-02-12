"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, X, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

interface Discipline {
  id: string;
  name: string;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);

  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    disciplineId: "",
    status: "",
    files: [] as any[] // Pour stocker les fichiers existants + nouveaux
  });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]); // Nouveaux fichiers à uploader
  const [existingFiles, setExistingFiles] = useState<any[]>([]); // Fichiers déjà présents


  useEffect(() => {
    if (params.id && user) {
      loadProject();
      loadDisciplines();
    }
  }, [params.id, user]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${params.id}`);

      if (!response.ok) {
        throw new Error("Projet non trouvé");
      }

      const project = await response.json();

      // Vérifier que l'utilisateur est bien le propriétaire
      if (project.concepteurId !== user?.id) {
        toast.error("Vous n'êtes pas autorisé à modifier ce projet");
        router.push("/dashboard/concepteur/mes-projets");
        return;
      }

      // Vérifier que le projet est modifiable (DRAFT ou REJECTED uniquement)
      if (project.status !== "DRAFT" && project.status !== "REJECTED") {
        toast.error("Seuls les projets en brouillon ou refusés peuvent être modifiés");
        router.push("/dashboard/concepteur/mes-projets");
        return;
      }

      setProjectData({
        title: project.title || "",
        description: project.description || "",
        disciplineId: project.disciplineId || "",
        status: project.status,
        files: []
      });

      // Gérer les fichiers existants
      if (project.files) {
        try {
          const parsedFiles = typeof project.files === 'string' ? JSON.parse(project.files) : project.files;
          if (Array.isArray(parsedFiles)) {
            setExistingFiles(parsedFiles);
          }
        } catch (e) {
          console.error("Erreur parsing files:", e);
        }
      }
    } catch (error: any) {
      console.error("Error loading project:", error);
      toast.error(error.message || "Erreur lors du chargement du projet");
      router.push("/dashboard/concepteur/mes-projets");
    } finally {
      setLoading(false);
    }
  };

  const loadDisciplines = async () => {
    try {
      const disciplinesData = await apiClient.getDisciplines();
      setDisciplines(disciplinesData);
    } catch (error) {
      console.error("Error loading disciplines:", error);
      toast.error("Erreur lors du chargement des disciplines");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} fichier(s) ajouté(s)`);
    }
  };

  const removeNewFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };


  const handleSave = async () => {
    if (!projectData.title.trim()) {
      toast.error("Le titre du projet est obligatoire");
      return;
    }

    if (!projectData.disciplineId) {
      toast.error("La discipline est obligatoire");
      return;
    }

    try {
      setSaving(true);

      // 1. Upload des nouveaux fichiers
      const uploadedFilesList = [];
      if (attachedFiles.length > 0) {
        toast.info("Envoi des fichiers en cours...");
        for (const file of attachedFiles) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append('files', file);
            formDataUpload.append('type', 'project');
            formDataUpload.append('entityId', params.id as string);

            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formDataUpload
            });

            if (!response.ok) throw new Error(`Erreur upload ${file.name}`);

            const result = await response.json();
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
          }
        }
      }

      // 2. Combiner fichiers existants et nouveaux
      const allFiles = [...existingFiles, ...uploadedFilesList];

      const response = await fetch(`/api/projects/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: projectData.title.trim(),
          description: projectData.description.trim(),
          disciplineId: projectData.disciplineId,
          files: allFiles.length > 0 ? JSON.stringify(allFiles) : null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }

      toast.success("Projet mis à jour avec succès");
      router.push("/dashboard/concepteur/mes-projets?refreshed=true");
      setTimeout(() => {
        router.refresh();
      }, 200);
    } catch (error: any) {
      console.error("Error updating project:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du projet");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/concepteur/mes-projets");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-white hover:bg-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h2 className="text-xl font-semibold">Modifier le projet</h2>
          </div>
          <span className="text-sm text-slate-300">
            Tableau de bord - Mes projets - Édition
          </span>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations du projet</CardTitle>
            <CardDescription>
              Modifiez les informations de votre projet. Seuls les projets en brouillon ou refusés peuvent être modifiés.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre du projet <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Entrez le titre du projet"
                value={projectData.title}
                onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                maxLength={200}
              />
              <p className="text-sm text-gray-500">
                {projectData.title.length}/200 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discipline">
                Discipline <span className="text-red-500">*</span>
              </Label>
              <Select
                value={projectData.disciplineId}
                onValueChange={(value) => setProjectData({ ...projectData, disciplineId: value })}
              >
                <SelectTrigger id="discipline">
                  <SelectValue placeholder="Sélectionnez une discipline" />
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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre projet (optionnel)"
                value={projectData.description}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                rows={6}
                maxLength={1000}
              />
              <p className="text-sm text-gray-500">
                {projectData.description.length}/1000 caractères
              </p>
            </div>

            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Pièces jointes
                </CardTitle>
                <CardDescription>
                  Ajoutez ou supprimez des fichiers associés à ce projet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {existingFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase">Fichiers actuels</Label>
                      {existingFiles.map((file, index) => (
                        <div key={`existing-${index}`} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {file.size ? `(${(file.size / 1024).toFixed(1)} KB)` : ''}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExistingFile(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

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
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm text-slate-600 font-medium">
                          Cliquez pour ajouter des fichiers
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          PDF, DOC, Images (max 10MB)
                        </p>
                      </div>
                    </Label>
                  </div>

                  {attachedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase">Nouveaux fichiers (à enregistrer)</Label>
                      {attachedFiles.map((file, index) => (
                        <div key={`new-${index}`} className="flex items-center justify-between p-2 bg-indigo-50 rounded border border-indigo-100">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-sm truncate font-medium text-indigo-700">{file.name}</span>
                            <span className="text-xs text-indigo-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNewFile(index)}
                            className="h-6 w-6 p-0 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Statut actuel</Label>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${projectData.status === "DRAFT"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-red-100 text-red-800"
                  }`}>
                  {projectData.status === "DRAFT" ? "Brouillon" : "Refusé"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !projectData.title.trim() || !projectData.disciplineId}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
