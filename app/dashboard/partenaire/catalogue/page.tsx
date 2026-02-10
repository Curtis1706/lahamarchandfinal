"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import Image from "next/image"
import {
  Search,
  Filter,
  BookOpen,
  Eye,
  Package
} from "lucide-react"

interface Work {
  id: string
  title: string
  isbn: string
  discipline: string
  author: string
  price: number
  available: boolean
  stock: number
  description: string
  coverImage?: string
}


export default function PartenaireCataloguePage() {
  const { toast } = useToast()
  const [works, setWorks] = useState<Work[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [disciplineFilter, setDisciplineFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")

  useEffect(() => {
    loadCatalogue()
  }, [disciplineFilter, priceFilter])

  const loadCatalogue = async () => {
    try {
      setIsLoading(true)

      const data = await apiClient.getPartenaireCatalogue({
        discipline: disciplineFilter === 'all' ? undefined : disciplineFilter,
        price: priceFilter === 'all' ? undefined : priceFilter
      }) as any

      setWorks(data.works)

    } catch (error: any) {
      console.error('Erreur lors du chargement du catalogue:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement du catalogue",
        variant: "destructive"
      })
      setWorks([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredWorks = works.filter(work => {
    const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.discipline.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDiscipline = disciplineFilter === "all" || work.discipline === disciplineFilter
    const matchesPrice = priceFilter === "all" ||
      (priceFilter === "low" && work.price < 3500) ||
      (priceFilter === "medium" && work.price >= 3500 && work.price < 4500) ||
      (priceFilter === "high" && work.price >= 4500)

    return matchesSearch && matchesDiscipline && matchesPrice
  })


  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catalogue des Œuvres</h1>
        <p className="text-gray-600">Découvrez les œuvres disponibles dans notre catalogue</p>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher une œuvre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les disciplines</SelectItem>
                <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                <SelectItem value="Français">Français</SelectItem>
                <SelectItem value="Sciences">Sciences</SelectItem>
                <SelectItem value="Histoire-Géographie">Histoire-Géographie</SelectItem>
                <SelectItem value="Littérature">Littérature</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les prix</SelectItem>
                <SelectItem value="low">Moins de 3500 FCFA</SelectItem>
                <SelectItem value="medium">3500 - 4500 FCFA</SelectItem>
                <SelectItem value="high">Plus de 4500 FCFA</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grille des œuvres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredWorks.map((work) => (
            <Card key={work.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                {/* Image de couverture */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                  {work.coverImage ? (
                    <Image
                      src={work.coverImage}
                      alt={work.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      onError={(e) => {
                        // Si l'image échoue, on pourrait remettre l'icône ou un placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-blue-600" />
                  )}
                </div>

                {/* Informations de l'œuvre */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg line-clamp-2">{work.title}</h3>
                  <p className="text-sm text-gray-600">Par {work.author}</p>
                  <Badge variant="secondary" className="text-xs">{work.discipline}</Badge>

                  {/* Prix et stock */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold text-green-600">
                      {Math.round(work.price).toLocaleString('fr-FR')} FCFA
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Package className="h-3 w-3 mr-1" />
                      {work.stock} disponibles
                    </div>
                  </div>

                  {/* Informations seulement - pas d'action de commande */}
                  <div className="pt-3 text-center">
                    <p className="text-xs text-gray-500 italic">
                      Consultation uniquement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Message si aucun résultat */}
      {!isLoading && filteredWorks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune œuvre trouvée</h3>
            <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
