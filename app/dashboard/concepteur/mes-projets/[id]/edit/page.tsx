"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, X, Loader2 } from "lucide-react";
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
    status: ""
  });

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
        status: project.status
      });
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

      const response = await fetch(`/api/projects/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: projectData.title.trim(),
          description: projectData.description.trim(),
          disciplineId: projectData.disciplineId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }

      toast.success("Projet mis à jour avec succès");
      router.push("/dashboard/concepteur/mes-projets");
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
      {/* En-tête */}
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

      {/* Contenu */}
      <div className="p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations du projet</CardTitle>
            <CardDescription>
              Modifiez les informations de votre projet. Seuls les projets en brouillon ou refusés peuvent être modifiés.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Titre */}
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

            {/* Discipline */}
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

            {/* Description */}
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

            {/* Statut (lecture seule) */}
            <div className="space-y-2">
              <Label>Statut actuel</Label>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  projectData.status === "DRAFT" 
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {projectData.status === "DRAFT" ? "Brouillon" : "Refusé"}
                </span>
              </div>
            </div>

            {/* Actions */}
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

