"use client"

import { useState, useEffect } from "react"
import { useGuest } from "@/hooks/use-guest"
import { GuestBanner } from "@/components/guest-banner"
import { AuthRequiredPrompt } from "@/components/auth-required-prompt"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, BookOpen, Eye } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface PublicWork {
  id: string
  title: string
  isbn: string
  price: number
  discipline?: {
    name: string
  }
  author?: {
    name: string
  }
  status: string
}

export default function PublicWorksPage() {
  const { isGuest } = useGuest()
  const [works, setWorks] = useState<PublicWork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  useEffect(() => {
    loadPublicWorks()
  }, [])

  const loadPublicWorks = async () => {
    try {
      setIsLoading(true)
      // Récupérer uniquement les œuvres publiques via l'API publique
      const response = await fetch("/api/works/public")
      if (response.ok) {
        const data = await response.json()
        setWorks(data.works || [])
      }
    } catch (error) {
      console.error("Error loading public works:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredWorks = works.filter(work =>
    work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    work.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    work.discipline?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewDetails = (workId: string) => {
    if (isGuest) {
      setShowAuthPrompt(true)
    } else {
      // Rediriger vers la page de détails (à créer)
      window.location.href = `/works/${workId}`
    }
  }

  return (
    <>
      <GuestBanner />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Catalogue des œuvres
            </h1>
            <p className="text-gray-600">
              Découvrez notre collection d'œuvres disponibles
            </p>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Rechercher par titre, ISBN ou discipline..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chargement des œuvres...</p>
            </div>
          ) : filteredWorks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune œuvre trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorks.map((work) => (
                <Card key={work.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{work.title}</CardTitle>
                    <CardDescription>
                      {work.discipline?.name || "Discipline non définie"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">ISBN</p>
                        <p className="font-mono text-sm">{work.isbn}</p>
                      </div>
                      {work.author && (
                        <div>
                          <p className="text-sm text-gray-600">Auteur</p>
                          <p className="text-sm font-medium">{work.author.name}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Prix</p>
                        <p className="text-lg font-bold text-indigo-600">
                          {work.price.toLocaleString()} XOF
                        </p>
                      </div>
                      <div className="pt-2">
                        <Badge
                          variant={work.status === "ON_SALE" ? "default" : "secondary"}
                          className={
                            work.status === "ON_SALE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {work.status === "ON_SALE" ? "En vente" : work.status}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handleViewDetails(work.id)}
                        className="w-full"
                        variant={isGuest ? "outline" : "default"}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {isGuest ? "Voir les détails (connexion requise)" : "Voir les détails"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthRequiredPrompt
        open={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title="Connexion requise"
        description="Pour voir les détails complets d'une œuvre, veuillez vous connecter ou créer un compte."
      />
    </>
  )
}

