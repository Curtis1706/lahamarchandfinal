"use client"

import { useState, useEffect } from "react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Book, Filter, ShoppingBag } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Types locaux pour éviter les problèmes d'import Prisma
interface Work {
  id: string
  title: string
  isbn: string
  price: number
  tva: number
  stock: number
  disciplineId: string
  status: string
}

interface Discipline {
  id: string
  name: string
}

interface WorkWithDiscipline extends Work {
  discipline?: Discipline
  image?: string
  files?: string
  discount?: {
    id: string
    type: string
    reduction: number
    quantiteMin: number
  } | null
  finalPrice?: number
}

// Fonction pour extraire l'image de couverture depuis le champ files
const getBookImageUrl = (work: WorkWithDiscipline, title: string, discipline?: string): string => {
  // D'abord, essayer d'extraire l'image depuis le champ files
  if (work.files) {
    try {
      const filesData = typeof work.files === 'string' ? JSON.parse(work.files) : work.files
      if (filesData.coverImage) {
        return filesData.coverImage
      }
    } catch (e) {
      console.error("Erreur lors du parsing des fichiers:", e)
    }
  }
  
  // Si pas d'image dans files, utiliser les images par défaut
  const availableImages = [
    '/01.png',
    '/02.png', 
    '/10001.png',
    '/10002.png',
    '/10011.png',
    '/10012.png',
    '/10013.png'
  ]
  
  const disciplineImages: { [key: string]: string[] } = {
    'Mathématiques': ['/10001.png'],
    'Français': ['/01.png', '/02.png'],
    'Sciences': ['/10002.png', '/10011.png', '/10012.png', '/10013.png'],
    'Histoire': ['/communication-book.jpg'],
    'Géographie': ['/communication-book.jpg'],
    'Anglais': ['/french-textbook-coffret-ce2.jpg']
  }
  
  if (discipline) {
    const disciplineImageList = disciplineImages[discipline]
    if (disciplineImageList && disciplineImageList.length > 0) {
      const randomIndex = Math.floor(Math.random() * disciplineImageList.length)
      return disciplineImageList[randomIndex]
    }
  }
  
  const randomIndex = Math.floor(Math.random() * availableImages.length)
  return availableImages[randomIndex]
}

export default function ClientCataloguePage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const router = useRouter()
  const [works, setWorks] = useState<WorkWithDiscipline[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all")
  const [loadingDiscounts, setLoadingDiscounts] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [worksData, disciplinesData] = await Promise.all([
          apiClient.getWorks(),
          apiClient.getDisciplines()
        ])
        
        // L'API retourne un objet avec works, pagination, stats
        // ou directement un tableau selon le contexte
        const worksArray = Array.isArray(worksData) ? worksData : (worksData.works || [])
        
        // Filtrer uniquement les livres PUBLISHED (sécurité supplémentaire)
        const publishedWorks = worksArray.filter((work: any) => work.status === 'PUBLISHED')
        
        // Charger les remises pour chaque livre
        setLoadingDiscounts(true)
        const worksWithDiscounts = await Promise.all(
          publishedWorks.map(async (work: any) => {
            try {
              // Déterminer le type de client (CLIENT par défaut)
              const clientType = user?.role === 'PARTENAIRE' ? 'Partenaire' : 
                                user?.role === 'REPRESENTANT' ? 'Représentant' : 'Client'
              
              const discountResponse = await fetch(
                `/api/discounts/applicable?workId=${work.id}&workTitle=${encodeURIComponent(work.title)}&clientType=${clientType}&quantity=1`
              )
              
              if (discountResponse.ok) {
                const discountData = await discountResponse.json()
                const discount = discountData.applicable
                
                // Calculer le prix final avec remise
                let finalPrice = work.price || 0
                if (discount && work.price) {
                  if (discount.type === 'Pourcentage') {
                    finalPrice = work.price * (1 - discount.reduction / 100)
                  } else if (discount.type === 'Montant') {
                    finalPrice = Math.max(0, work.price - discount.reduction)
                  }
                }
                
                return {
                  ...work,
                  discount: discount,
                  finalPrice: finalPrice
                }
              }
              
              return {
                ...work,
                discount: null,
                finalPrice: work.price || 0
              }
            } catch (error) {
              console.error(`Error loading discount for work ${work.id}:`, error)
              return {
                ...work,
                discount: null,
                finalPrice: work.price || 0
              }
            }
          })
        )
        
        setWorks(worksWithDiscounts)
        setDisciplines(disciplinesData)
        setLoadingDiscounts(false)
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast.error("Erreur lors du chargement du catalogue")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fonction pour rediriger vers la page de commande avec un livre pré-sélectionné
  const handleSelectBook = (workId: string) => {
    router.push(`/dashboard/client/commande/nouvelle?workId=${workId}`)
  }

  const filteredWorks = works.filter(work => {
    // Filtrer uniquement les livres PUBLISHED (sécurité supplémentaire côté client)
    if (work.status !== 'PUBLISHED') {
      return false
    }
    const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDiscipline = selectedDiscipline === "all" || work.disciplineId === selectedDiscipline
    return matchesSearch && matchesDiscipline
  })



  if (userLoading || isLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DynamicDashboardLayout>
    )
  }

  if (!user) {
    return (
      <DynamicDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vous devez être connecté pour accéder au catalogue.</p>
        </div>
      </DynamicDashboardLayout>
    )
  }

  return (
    <DynamicDashboardLayout>
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Catalogue des Livres</h1>
              <p className="text-muted-foreground">
                Découvrez notre collection de livres scolaires et éducatifs
              </p>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un livre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les disciplines</SelectItem>
                {disciplines.map((discipline) => (
                  <SelectItem key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste des livres */}
        {filteredWorks.length === 0 ? (
          <div className="text-center py-12">
            <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun livre trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedDiscipline !== "all" 
                ? "Essayez de modifier vos critères de recherche"
                : "Le catalogue est actuellement vide"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorks.map((work) => {
              const discipline = disciplines.find(d => d.id === work.disciplineId)
              
              return (
                <Card key={work.id} className="flex flex-col h-full overflow-hidden">
                  {/* Image de couverture */}
                  <div className="relative h-48 w-full bg-gradient-to-br from-blue-50 to-indigo-100">
                    <Image
                      src={getBookImageUrl(work, work.title, discipline?.name)}
                      alt={work.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        // Fallback vers une image par défaut en cas d'erreur
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder.jpg'
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      {discipline && (
                        <Badge variant="secondary" className="bg-white/90 text-gray-800">
                          {discipline.name}
                        </Badge>
                      )}
                    </div>
                    {work.discount && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-red-500 text-white">
                          -{work.discount.type === 'Pourcentage' 
                            ? `${work.discount.reduction}%` 
                            : `${work.discount.reduction} F CFA`}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">
                      {work.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      ISBN: {work.isbn}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Stock:</span> {work.stock} exemplaires
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">TVA:</span> {(work.tva * 100).toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Statut:</span>{" "}
                        <Badge variant={work.status === 'PUBLISHED' ? 'default' : 'secondary'} className="text-xs">
                          {work.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                        </Badge>
                      </p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-4 border-t">
                    <div className="flex flex-col space-y-3 w-full">
                      {/* Prix */}
                      <div className="flex flex-col">
                        {work.discount && work.price ? (
                          <>
                            <div className="text-sm text-gray-500 line-through">
                              {work.price.toFixed(2)} FCFA
                            </div>
                            <div className="text-2xl font-bold text-indigo-600">
                              {work.finalPrice?.toFixed(2)} FCFA
                            </div>
                          </>
                        ) : (
                          <div className="text-2xl font-bold text-indigo-600">
                            {work.price ? `${work.price.toFixed(2)} FCFA` : "Prix non défini"}
                          </div>
                        )}
                        {work.discount && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            Remise : {work.discount.type === 'Pourcentage' 
                              ? `${work.discount.reduction}%` 
                              : `${work.discount.reduction} F CFA`} 
                            {work.discount.quantiteMin > 1 && ` (min. ${work.discount.quantiteMin} exemplaires)`}
                          </div>
                        )}
                      </div>
                      
                      {/* Bouton Commander */}
                      <Button
                        onClick={() => handleSelectBook(work.id)}
                        disabled={!work.price || work.stock === 0}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        size="lg"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        {work.stock === 0 ? "Rupture de stock" : "Commander"}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

      </div>
    </DynamicDashboardLayout>
  )
}
