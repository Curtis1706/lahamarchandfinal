"use client"

import { useState, useEffect } from "react"
import { useGuest } from "@/hooks/use-guest"
import { GuestBanner } from "@/components/guest-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FolderOpen } from "lucide-react"

interface PublicProject {
  id: string
  title: string
  description?: string
  status: string
  discipline?: {
    name: string
  }
  createdAt: string
}

export default function PublicProjectsPage() {
  const { isGuest } = useGuest()
  const [projects, setProjects] = useState<PublicProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPublicProjects()
  }, [])

  const loadPublicProjects = async () => {
    try {
      setIsLoading(true)
      // Récupérer uniquement les projets publics (à adapter selon votre API)
      const response = await fetch("/api/projects/public")
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error("Error loading public projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <GuestBanner />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Projets publics
            </h1>
            <p className="text-gray-600">
              Découvrez nos projets en cours et réalisés
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chargement des projets...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun projet public disponible</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription>
                      {project.discipline?.name || "Discipline non définie"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {project.description && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <Badge
                          variant={project.status === "ACTIVE" ? "default" : "secondary"}
                          className={
                            project.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {project.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(project.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

