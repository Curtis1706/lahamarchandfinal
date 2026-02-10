"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Search, BookOpen, Package, DollarSign, Filter, Eye } from "lucide-react"
import Image from "next/image"

interface Work {
  id: string
  title: string
  isbn: string
  price: number
  tva: number
  stock: number
  status: string
  publishedAt: string | null
  discipline: {
    id: string
    name: string
  }
  author: {
    id: string
    name: string
    email: string
  } | null
  concepteur: {
    id: string
    name: string
    email: string
  } | null
  totalValue: number
  files?: string
  discount?: {
    id: string
    type: string
    reduction: number
    quantiteMin: number
  } | null
  finalPrice?: number
}

interface CatalogSummary {
  totalWorks: number
  totalValue: number
  disciplines: number
  authors: number
  averagePrice: number
  totalStock: number
}

export default function OeuvresPage() {
  const { toast } = useToast()
  const { user } = useCurrentUser()
  const [works, setWorks] = useState<Work[]>([])
  const [summary, setSummary] = useState<CatalogSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingDiscounts, setLoadingDiscounts] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [disciplineFilter, setDisciplineFilter] = useState("all")
  const [disciplines, setDisciplines] = useState<string[]>([])

  useEffect(() => {
    loadCatalog()
  }, [])

  const loadCatalog = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/representant/catalog')
      if (!response.ok) throw new Error('Erreur lors du chargement')

      const data = await response.json()
      const worksData = data.works || []

      // Charger les remises pour chaque livre
      setLoadingDiscounts(true)
      const worksWithDiscounts = await Promise.all(
        worksData.map(async (work: Work) => {
          try {
            // Le type de client est "Représentant" pour les représentants
            const clientType = 'Représentant'

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
      setSummary(data.summary || null)

      // Extraire les disciplines uniques
      const uniqueDisciplines = [...new Set(worksWithDiscounts.map((w: Work) => w.discipline.name))]
      setDisciplines(uniqueDisciplines)
      setLoadingDiscounts(false)
    } catch (error: any) {
      console.error("Error loading catalog:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement du catalogue",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredWorks = works.filter(work => {
    const matchesSearch =
      work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.author?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.discipline.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDiscipline = disciplineFilter === "all" || work.discipline.name === disciplineFilter

    return matchesSearch && matchesDiscipline
  })

  const getBookImageUrl = (work: Work) => {
    if (work.files) {
      try {
        const filesData = typeof work.files === 'string' ? JSON.parse(work.files) : work.files;
        if (filesData.coverImage) {
          return filesData.coverImage;
        }
      } catch (e) {
        console.error("Erreur parsing files:", e);
      }
    }
    return `/placeholder.jpg`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catalogue des Livres</h1>
        <p className="text-gray-600">Consultez tous les livres disponibles à la vente</p>
      </div>

      {/* Statistiques */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de livres</p>
                  <p className="text-2xl font-bold">{summary.totalWorks}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valeur totale</p>
                  <p className="text-2xl font-bold">{summary.totalValue.toLocaleString()} F CFA</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Disciplines</p>
                  <p className="text-2xl font-bold">{summary.disciplines}</p>
                </div>
                <Filter className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock total</p>
                  <p className="text-2xl font-bold">{summary.totalStock}</p>
                </div>
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un livre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les disciplines</SelectItem>
                {disciplines.map(discipline => (
                  <SelectItem key={discipline} value={discipline}>
                    {discipline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des livres */}
      <div>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {filteredWorks.length} livre{filteredWorks.length > 1 ? 's' : ''} trouvé{filteredWorks.length > 1 ? 's' : ''}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredWorks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun livre trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWorks.map((work) => (
              <Card key={work.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {/* Image de couverture */}
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center relative">
                    <Image
                      src={getBookImageUrl(work)}
                      alt={work.title}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder.jpg'
                      }}
                    />
                    <Badge variant="secondary" className="absolute top-2 right-2 bg-white/90">
                      {work.discipline.name}
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

                  {/* Informations */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{work.title}</h3>
                    <p className="text-sm text-gray-600">Par {work.author?.name || "Auteur inconnu"}</p>
                    <p className="text-xs text-gray-500">ISBN: {work.isbn}</p>

                    {/* Prix et stock */}
                    <div className="flex flex-col pt-2 space-y-1">
                      <div className="flex justify-between items-center">
                        {work.discount && work.price ? (
                          <>
                            <div className="flex flex-col">
                              <div className="text-sm text-gray-500 line-through">
                                {work.price.toLocaleString()} F CFA
                              </div>
                              <div className="text-lg font-bold text-green-600">
                                {work.finalPrice?.toLocaleString()} F CFA
                              </div>
                            </div>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-green-600">
                            {work.price ? `${work.price.toLocaleString()} F CFA` : 'Prix non défini'}
                          </span>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Package className="h-3 w-3 mr-1" />
                          {work.stock} disponible{work.stock > 1 ? 's' : ''}
                        </div>
                      </div>
                      {work.discount && (
                        <p className="text-xs text-green-600">
                          Remise: {work.discount.type === 'Pourcentage'
                            ? `${work.discount.reduction}%`
                            : `${work.discount.reduction} F CFA`}
                        </p>
                      )}
                    </div>

                    {/* TVA */}
                    <p className="text-xs text-gray-500">
                      TVA: {work.tva ? (work.tva * 100).toFixed(0) : 18}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
