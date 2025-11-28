"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  RefreshCw,
  Download,
  Calendar,
  User,
  Tag,
  DollarSign,
  Package,
  TrendingUp
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { apiClient } from "@/lib/api-client"

interface Work {
  id: string
  title: string
  description: string
  isbn: string
  price: number
  stock: number
  status: string
  discipline: {
    id: string
    name: string
  }
  author: {
    id: string
    name: string
    email: string
  }
  project: {
    id: string
    title: string
  } | null
  totalOrders: number
  submittedAt: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export default function MesOeuvresPage() {
  const { user } = useCurrentUser()
  const [works, setWorks] = useState<Work[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [disciplineFilter, setDisciplineFilter] = useState("all")
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [disciplines, setDisciplines] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (user && user.role === "CONCEPTEUR") {
      loadWorks()
      loadDisciplines()
    }
  }, [user, statusFilter, disciplineFilter])

  const loadWorks = async () => {
    try {
      setIsLoading(true)
      const filters: any = {}
      if (statusFilter !== "all") filters.status = statusFilter
      if (disciplineFilter !== "all") filters.disciplineId = disciplineFilter

      const data = await apiClient.getConcepteurWorks(filters)
      setWorks(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error("Error loading works:", error)
      toast.error(error.message || "Erreur lors du chargement des œuvres")
    } finally {
      setIsLoading(false)
    }
  }

  const loadDisciplines = async () => {
    try {
      const data = await apiClient.getDisciplines()
      setDisciplines(data || [])
    } catch (error) {
      console.error("Error loading disciplines:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "Brouillon", className: "bg-gray-100 text-gray-800" },
      PENDING: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
      PUBLISHED: { label: "Publié", className: "bg-green-100 text-green-800" },
      REJECTED: { label: "Rejeté", className: "bg-red-100 text-red-800" },
      ON_SALE: { label: "En vente", className: "bg-blue-100 text-blue-800" },
      OUT_OF_STOCK: { label: "Rupture de stock", className: "bg-orange-100 text-orange-800" },
      DISCONTINUED: { label: "Discontinué", className: "bg-gray-100 text-gray-800" },
      SUSPENDED: { label: "Suspendu", className: "bg-red-100 text-red-800" }
    }
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" }
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
  }

  const filteredWorks = works.filter(work => {
    const matchesSearch = 
      work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.author.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const stats = {
    total: works.length,
    published: works.filter(w => w.status === "PUBLISHED" || w.status === "ON_SALE").length,
    pending: works.filter(w => w.status === "PENDING").length,
    draft: works.filter(w => w.status === "DRAFT").length,
    totalOrders: works.reduce((sum, w) => sum + (w.totalOrders || 0), 0)
  }

  if (!user || user.role !== "CONCEPTEUR") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Accès non autorisé</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <BookOpen className="h-8 w-8" />
            <span>Œuvres des projets</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Consultez les œuvres soumises dans le cadre de vos projets
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total œuvres</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publiées</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher par titre, ISBN, auteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="PUBLISHED">Publié</SelectItem>
                <SelectItem value="ON_SALE">En vente</SelectItem>
                <SelectItem value="REJECTED">Rejeté</SelectItem>
              </SelectContent>
            </Select>
            <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
            <Button variant="outline" onClick={loadWorks}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des œuvres */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredWorks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune œuvre trouvée</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== "all" || disciplineFilter !== "all"
                ? "Aucune œuvre ne correspond à vos critères de recherche"
                : "Vous n'avez pas encore créé d'œuvre"}
            </p>
            {!searchTerm && statusFilter === "all" && disciplineFilter === "all" && (
              <Button onClick={() => window.location.href = "/dashboard/concepteur/nouvelle-oeuvre"}>
                <Plus className="h-4 w-4 mr-2" />
                Créer ma première œuvre
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorks.map((work) => (
            <Card key={work.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{work.title}</CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusBadge(work.status)}
                      <Badge variant="outline">{work.discipline.name}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Tag className="h-4 w-4 mr-2" />
                    <span>ISBN: {work.isbn}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-4 w-4 mr-2" />
                    <span>Auteur: {work.author.name}</span>
                  </div>
                  {work.project && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span>Projet: {work.project.title}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{work.price.toLocaleString()} F CFA</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Package className="h-4 w-4 mr-1" />
                      <span>Stock: {work.stock}</span>
                    </div>
                  </div>
                  {work.totalOrders > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      {work.totalOrders} commande{work.totalOrders > 1 ? 's' : ''}
                    </div>
                  )}
                  {work.publishedAt && (
                    <div className="text-xs text-muted-foreground">
                      Publié le {format(new Date(work.publishedAt), "dd MMM yyyy", { locale: fr })}
                    </div>
                  )}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedWork(work)
                        setShowDetailModal(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/concepteur/livres/liste?edit=${work.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de détails */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'œuvre</DialogTitle>
            <DialogDescription>
              Informations complètes sur l'œuvre
            </DialogDescription>
          </DialogHeader>
          {selectedWork && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Titre</Label>
                  <p className="font-medium">{selectedWork.title}</p>
                </div>
                <div>
                  <Label>ISBN</Label>
                  <p>{selectedWork.isbn}</p>
                </div>
                <div>
                  <Label>Statut</Label>
                  <div>{getStatusBadge(selectedWork.status)}</div>
                </div>
                <div>
                  <Label>Discipline</Label>
                  <p>{selectedWork.discipline.name}</p>
                </div>
                <div>
                  <Label>Auteur</Label>
                  <p>{selectedWork.author.name} ({selectedWork.author.email})</p>
                </div>
                <div>
                  <Label>Prix</Label>
                  <p className="font-semibold">{selectedWork.price.toLocaleString()} F CFA</p>
                </div>
                <div>
                  <Label>Stock</Label>
                  <p>{selectedWork.stock}</p>
                </div>
                <div>
                  <Label>Commandes</Label>
                  <p>{selectedWork.totalOrders}</p>
                </div>
                {selectedWork.project && (
                  <div>
                    <Label>Projet associé</Label>
                    <p>{selectedWork.project.title}</p>
                  </div>
                )}
                {selectedWork.submittedAt && (
                  <div>
                    <Label>Soumis le</Label>
                    <p>{format(new Date(selectedWork.submittedAt), "dd MMM yyyy, HH:mm", { locale: fr })}</p>
                  </div>
                )}
                {selectedWork.publishedAt && (
                  <div>
                    <Label>Publié le</Label>
                    <p>{format(new Date(selectedWork.publishedAt), "dd MMM yyyy, HH:mm", { locale: fr })}</p>
                  </div>
                )}
                <div>
                  <Label>Créé le</Label>
                  <p>{format(new Date(selectedWork.createdAt), "dd MMM yyyy, HH:mm", { locale: fr })}</p>
                </div>
                <div>
                  <Label>Modifié le</Label>
                  <p>{format(new Date(selectedWork.updatedAt), "dd MMM yyyy, HH:mm", { locale: fr })}</p>
                </div>
              </div>
              {selectedWork.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                    {selectedWork.description}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Fermer
            </Button>
            {selectedWork && (
              <Button onClick={() => window.location.href = `/dashboard/concepteur/livres/liste?edit=${selectedWork.id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

