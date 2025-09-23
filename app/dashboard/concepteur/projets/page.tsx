"use client";

import { useState } from "react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Steps } from "lucide-react";

type ProjectStatus = "SOUMIS" | "VALIDATION" | "PUBLIE" | "EN_VENTE";

interface NewProjectForm {
  titre: string;
  discipline: string;
  resume: string;
  fichier?: File | null;
}

export default function ProjetsPage() {
  const [form, setForm] = useState<NewProjectForm>({ titre: "", discipline: "", resume: "" });
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; titre: string; status: ProjectStatus; createdAt: string }>>([]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const id = Math.random().toString(36).slice(2);
      setProjects([{ id, titre: form.titre, status: "SOUMIS", createdAt: new Date().toISOString() }, ...projects]);
      setForm({ titre: "", discipline: "", resume: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DynamicDashboardLayout title="Mes projets" breadcrumb="Concepteur - Projets">
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de soumission */}
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Soumettre un nouveau projet</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Titre</label>
              <Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Titre du projet" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Discipline</label>
              <Select value={form.discipline} onValueChange={(v) => setForm({ ...form, discipline: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une discipline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sciences">Sciences</SelectItem>
                  <SelectItem value="litterature">Littérature</SelectItem>
                  <SelectItem value="philosophie">Philosophie</SelectItem>
                  <SelectItem value="arts">Arts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Résumé</label>
              <Textarea rows={4} value={form.resume} onChange={(e) => setForm({ ...form, resume: e.target.value })} placeholder="Brève description du projet" />
            </div>
            <div className="flex justify-end">
              <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={submitting || !form.titre || !form.discipline} onClick={handleSubmit}>
                Soumettre
              </Button>
            </div>
          </div>
        </div>

        {/* Liste + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Mes projets</h3>
            </div>
            <div className="p-6">
              {projects.length === 0 ? (
                <p className="text-gray-500">Aucun projet soumis pour le moment.</p>
              ) : (
                <div className="space-y-4">
                  {projects.map((p) => (
                    <div key={p.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{p.titre}</p>
                          <p className="text-xs text-gray-500">Soumis le {new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">{p.status}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-4 gap-3">
                        {(["SOUMIS", "VALIDATION", "PUBLIE", "EN_VENTE"] as ProjectStatus[]).map((s, i) => (
                          <div key={s} className={`p-3 rounded border text-center ${s === p.status ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                            <div className="text-xs font-semibold">{s}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DynamicDashboardLayout>
  );
}


