"use client"

import { useState, useEffect } from "react"
import { useGuest } from "@/hooks/use-guest"
import { useCart } from "@/hooks/use-cart"
import { GuestBanner } from "@/components/guest-banner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, BookOpen, ShoppingCart, Package, Plus, Eye, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

interface PublicWork {
  id: string
  title: string
  isbn: string
  price: number
  tva: number
  stock: number
  files?: string
  discipline?: {
    id: string
    name: string
  }
  author?: {
    id: string
    name: string
  }
  status: string
  discount?: {
    id: string
    type: string
    reduction: number
  } | null
  finalPrice?: number
}

// Fonction pour extraire l'image de couverture
const getBookImageUrl = (work: PublicWork): string => {
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
  
  // Images par défaut
  const defaultImages = [
    '/01.png',
    '/02.png', 
    '/10001.png',
    '/10002.png',
    '/10011.png',
    '/10012.png',
    '/10013.png'
  ]
  
  const randomIndex = Math.floor(Math.random() * defaultImages.length)
  return defaultImages[randomIndex]
}

export default function InviteCataloguePage() {
  const { isGuest } = useGuest()
  const { addToCart, getTotalItems } = useCart()
  const router = useRouter()
  const [works, setWorks] = useState<PublicWork[]>([])
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingDiscounts, setLoadingDiscounts] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [disciplineFilter, setDisciplineFilter] = useState("all")

  useEffect(() => {
    // Le layout gère la redirection, on charge juste les données
    if (isGuest) {
      loadPublicWorks()
    }
  }, [isGuest])

  const loadPublicWorks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/works/public")
      if (response.ok) {
        const data = await response.json()
        const publishedWorks = (data.works || []).filter((work: any) => work.status === 'PUBLISHED')
        
        // Charger les remises pour chaque livre (pour les invités, type "Client")
        setLoadingDiscounts(true)
        const worksWithDiscounts = await Promise.all(
          publishedWorks.map(async (work: any) => {
            try {
              const discountResponse = await fetch(
                `/api/discounts/applicable/public?workId=${work.id}&workTitle=${encodeURIComponent(work.title)}&clientType=Client&quantity=1`
              )
              
              if (discountResponse.ok) {
                const discountData = await discountResponse.json()
                const discount = discountData.applicable
                
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
        
        // Extraire les disciplines uniques
        const uniqueDisciplines = [...new Set(worksWithDiscounts.map((w: PublicWork) => w.discipline?.name).filter(Boolean))]
        setDisciplines(uniqueDisciplines as string[])
        setLoadingDiscounts(false)
      }
    } catch (error) {
      console.error("Error loading public works:", error)
      toast.error("Erreur lors du chargement du catalogue")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredWorks = works.filter(work => {
    const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         work.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         work.discipline?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDiscipline = disciplineFilter === "all" || work.discipline?.name === disciplineFilter
    return matchesSearch && matchesDiscipline
  })

  const handleAddToCart = (work: PublicWork) => {
    if (work.stock <= 0) {
      toast.error("Ce livre n'est plus en stock")
      return
    }
    
    addToCart({
      id: work.id,
      title: work.title,
      isbn: work.isbn,
      price: work.finalPrice || work.price,
      tva: work.tva || 0.18,
      stock: work.stock,
      discipline: work.discipline || { id: '', name: '' },
      image: getBookImageUrl(work),
      files: work.files
    } as any, 1)
    
    toast.success(`"${work.title}" ajouté au panier`)
  }

  const handleViewDetails = (workId: string) => {
    router.push(`/livre/${workId}`)
  }

  return (
    <>
      <GuestBanner />
      <div className="min-h-screen bg-gray-50">
        {/* Header avec navigation et panier */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/invite">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au dashboard
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Catalogue Invité</h1>
                  <p className="text-sm text-gray-600">Découvrez notre collection de livres</p>
                </div>
              </div>
              <Link href="/checkout">
                <Button variant="outline" className="relative">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Panier
                  {getTotalItems() > 0 && (
                    <span className="ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">
                      {getTotalItems()}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filtres */}
          <div className="mb-6 space-y-4">
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
            
            {disciplines.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={disciplineFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDisciplineFilter("all")}
                >
                  Toutes
                </Button>
                {disciplines.map((discipline) => (
                  <Button
                    key={discipline}
                    variant={disciplineFilter === discipline ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDisciplineFilter(discipline)}
                  >
                    {discipline}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Liste des livres */}
          {isLoading || loadingDiscounts ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Chargement du catalogue...</p>
            </div>
          ) : filteredWorks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun livre trouvé</p>
              {(searchTerm || disciplineFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("")
                    setDisciplineFilter("all")
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                {filteredWorks.length} livre{filteredWorks.length > 1 ? 's' : ''} trouvé{filteredWorks.length > 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredWorks.map((work) => (
                  <Card key={work.id} className="hover:shadow-lg transition-shadow flex flex-col">
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                        <Image
                          src={getBookImageUrl(work)}
                          alt={work.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder.jpg'
                          }}
                        />
                        <Badge variant="secondary" className="absolute top-2 right-2 bg-white/90">
                          {work.discipline?.name || "N/A"}
                        </Badge>
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
                      
                      <div className="space-y-2 flex-1 flex flex-col">
                        <h3 className="font-semibold text-lg line-clamp-2">{work.title}</h3>
                        <p className="text-sm text-gray-600">Par {work.author?.name || "Auteur inconnu"}</p>
                        <p className="text-xs text-gray-500">ISBN: {work.isbn}</p>
                        
                        {/* Prix et stock */}
                        <div className="flex justify-between items-center pt-2">
                          {work.discount && work.price ? (
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 line-through">
                                {work.price.toLocaleString()} F CFA
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                {work.finalPrice?.toLocaleString()} F CFA
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-green-600">
                              {work.price.toLocaleString()} F CFA
                            </span>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <Package className="h-3 w-3 mr-1" />
                            {work.stock} disponible{work.stock > 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2 pt-2 mt-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleViewDetails(work.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleAddToCart(work)}
                            disabled={work.stock <= 0}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Panier
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

