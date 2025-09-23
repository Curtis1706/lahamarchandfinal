"use client"

import { useState, useEffect } from "react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BookOpen, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Star,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import Image from "next/image"

// Types pour les œuvres
interface Work {
  id: string
  title: string
  isbn: string
  price: number
  tva: number
  stock: number
  disciplineId: string
  discipline?: {
    id: string
    name: string
  }
  authorId?: string
  author?: {
    id: string
    name: string
  }
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published'
  createdAt: string
  updatedAt: string
}

interface Discipline {
  id: string
  name: string
}

export default function ValidationOeuvresPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [works, setWorks] = useState<Work[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [disciplineFilter, setDisciplineFilter] = useState("all")

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [worksData, disciplinesData, usersData] = await Promise.all([
          apiClient.getWorks(),
          apiClient.getDisciplines(),
          apiClient.getUsers()
        ])
        
        // Enrichir les œuvres avec les disciplines et auteurs
        const enrichedWorks = worksData.map(work => ({
          ...work,
          discipline: disciplinesData.find(d => d.id === work.disciplineId),
          author: usersData.find((u: any) => u.id === work.authorId),
          status: work.status || 'pending',
          createdAt: work.createdAt || new Date().toISOString(),
          updatedAt: work.updatedAt || new Date().toISOString()
        }))
        
        setWorks(enrichedWorks)
        setDisciplines(disciplinesData)
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fonctions de gestion
  const handleApproveWork = async (workId: string) => {
    try {
      setWorks(prev => 
        prev.map(w => 
          w.id === workId 
            ? { ...w, status: 'approved' as const, updatedAt: new Date().toISOString() }
            : w
        )
      )
      
      toast.success("Œuvre approuvée avec succès")
    } catch (error) {
      toast.error("Erreur lors de l'approbation")
    }
  }

  const handleRejectWork = async (workId: string) => {
    try {
      setWorks(prev => 
        prev.map(w => 
          w.id === workId 
            ? { ...w, status: 'rejected' as const, updatedAt: new Date().toISOString() }
            : w
        )
      )
      
      toast.success("Œuvre rejetée")
    } catch (error) {
      toast.error("Erreur lors du rejet")
    }
  }

  const handlePublishWork = async (workId: string) => {
    try {
      setWorks(prev => 
        prev.map(w => 
          w.id === workId 
            ? { ...w, status: 'published' as const, updatedAt: new Date().toISOString() }
            : w
        )
      )
      
      toast.success("Œuvre publiée avec succès")
    } catch (error) {
      toast.error("Erreur lors de la publication")
    }
  }

  // Filtrage
  const filteredWorks = works.filter(work => {
    const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         work.isbn.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || work.status === statusFilter
    const matchesDiscipline = disciplineFilter === "all" || work.disciplineId === disciplineFilter
    
    return matchesSearch && matchesStatus && matchesDiscipline
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Brouillon</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>
      case 'published':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><Star className="h-3 w-3 mr-1" />Publié</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  const getBookImageUrl = (title: string, discipline?: string): string => {
    const availableImages = [
      '/01.png', '/02.png', '/10001.png', '/10002.png', 
      '/10011.png', '/10012.png', '/10013.png'
    ]
    
    if (discipline) {
      const disciplineImages: { [key: string]: string[] } = {
        'Mathématiques': ['/10001.png'],
        'Français': ['/01.png', '/02.png'],
        'Sciences': ['/10002.png', '/10011.png', '/10012.png', '/10013.png'],
        'Histoire': ['/communication-book.jpg'],
        'Géographie': ['/communication-book.jpg'],
        'Anglais': ['/french-textbook-coffret-ce2.jpg']
      }
      
      const disciplineImageList = disciplineImages[discipline]
      if (disciplineImageList && disciplineImageList.length > 0) {
        const randomIndex = Math.floor(Math.random() * disciplineImageList.length)
        return disciplineImageList[randomIndex]
      }
    }
    
    const randomIndex = Math.floor(Math.random() * availableImages.length)
    return availableImages[randomIndex]
  }

  if (userLoading || isLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <BookOpen className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des œuvres...</p>
          </div>
        </div>
      </DynamicDashboardLayout>
    )
  }

  if (!user || user.role !== 'PDG') {
    return (
      <DynamicDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Accès non autorisé</p>
        </div>
      </DynamicDashboardLayout>
    )
  }

  return (
    <DynamicDashboardLayout title="Validation des Œuvres">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Validation des Œuvres</h1>
            <p className="text-muted-foreground">
              Gérez et validez les œuvres publiées par les auteurs
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              <BookOpen className="h-3 w-3 mr-1" />
              {filteredWorks.length} œuvre{filteredWorks.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{works.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {works.filter(w => w.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {works.filter(w => w.status === 'approved').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publiées</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {works.filter(w => w.status === 'published').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {works.filter(w => w.status === 'rejected').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre ou ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvées</SelectItem>
              <SelectItem value="published">Publiées</SelectItem>
              <SelectItem value="rejected">Rejetées</SelectItem>
              <SelectItem value="draft">Brouillons</SelectItem>
            </SelectContent>
          </Select>
          <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Discipline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les disciplines</SelectItem>
              {disciplines.map(discipline => (
                <SelectItem key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Liste des œuvres */}
        {filteredWorks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune œuvre trouvée</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== "all" || disciplineFilter !== "all"
                  ? "Essayez de modifier vos critères de recherche"
                  : "Aucune œuvre dans le système"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredWorks.map((work) => (
              <Card key={work.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Image du livre */}
                    <div className="flex-shrink-0">
                      <div className="relative w-20 h-28">
                        <Image
                          src={getBookImageUrl(work.title, work.discipline?.name)}
                          alt={work.title}
                          fill
                          className="object-contain rounded-lg border"
                          sizes="80px"
                        />
                      </div>
                    </div>
                    
                    {/* Informations de l'œuvre */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{work.title}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(work.status)}
                            <Badge variant="outline" className="text-xs">
                              ISBN: {work.isbn}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{work.discipline?.name || 'Discipline inconnue'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>Auteur: {work.author?.name || 'Non assigné'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>Prix: {work.price.toLocaleString()} F CFA</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>Stock: {work.stock}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Créé {formatDistanceToNow(new Date(work.createdAt), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                      
                      {work.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleApproveWork(work.id)}
                            className="bg-green-600 hover:bg-green-700 w-full"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approuver
                          </Button>
                          <Button
                            onClick={() => handleRejectWork(work.id)}
                            variant="destructive"
                            size="sm"
                            className="w-full"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </>
                      )}
                      
                      {work.status === 'approved' && (
                        <Button
                          onClick={() => handlePublishWork(work.id)}
                          className="bg-blue-600 hover:bg-blue-700 w-full"
                          size="sm"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Publier
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DynamicDashboardLayout>
  )
}
