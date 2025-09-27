"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Users,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  UserPlus,
  UserCheck,
  UserX
} from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface Author {
  id: string
  name: string
  email: string
  phone?: string
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE'
  discipline?: {
    id: string
    name: string
  }
  worksCount: number
  pendingWorksCount: number
  createdAt: string
  lastActivity?: string
}

export default function AuteursPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [filteredAuthors, setFilteredAuthors] = useState<Author[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [disciplineFilter, setDisciplineFilter] = useState("all")
  const [showAddAuthorModal, setShowAddAuthorModal] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)
  const [disciplines, setDisciplines] = useState<any[]>([])

  // Form data for new author
  const [newAuthorData, setNewAuthorData] = useState({
    name: "",
    email: "",
    phone: "",
    disciplineId: "",
    password: ""
  })

  // Load data
  useEffect(() => {
    loadAuthors()
    loadDisciplines()
  }, [])

  // Filter authors
  useEffect(() => {
    let filtered = authors

    if (searchTerm) {
      filtered = filtered.filter(author =>
        author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(author => author.status === statusFilter)
    }

    if (disciplineFilter !== "all") {
      filtered = filtered.filter(author => author.discipline?.id === disciplineFilter)
    }

    setFilteredAuthors(filtered)
  }, [authors, searchTerm, statusFilter, disciplineFilter])

  const loadAuthors = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getRepresentantAuthors({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        disciplineId: disciplineFilter !== 'all' ? disciplineFilter : undefined
      })
      setAuthors(data)
    } catch (error: any) {
      toast.error("Erreur lors du chargement des auteurs")
    } finally {
      setIsLoading(false)
    }
  }

  const loadDisciplines = async () => {
    try {
      const data = await apiClient.getDisciplines()
      setDisciplines(data)
    } catch (error: any) {
      toast.error("Erreur lors du chargement des disciplines")
    }
  }

  const handleAddAuthor = async () => {
    try {
      if (!newAuthorData.name || !newAuthorData.email || !newAuthorData.password) {
        toast.error("Veuillez remplir tous les champs obligatoires")
        return
      }

      await apiClient.createRepresentantAuthor(newAuthorData)
      
      toast.success("Auteur créé avec succès")
      setShowAddAuthorModal(false)
      setNewAuthorData({ name: "", email: "", phone: "", disciplineId: "", password: "" })
      loadAuthors()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de l'auteur")
    }
  }

  const handleValidateAuthor = async (authorId: string, status: 'ACTIVE' | 'INACTIVE') => {
    try {
      await apiClient.validateRepresentantAuthor(authorId, status)
      
      toast.success(`Auteur ${status === 'ACTIVE' ? 'validé' : 'rejeté'}`)
      setShowValidationModal(false)
      setSelectedAuthor(null)
      loadAuthors()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case 'INACTIVE':
        return <Badge className="bg-red-100 text-red-800">Inactif</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des auteurs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Auteurs</h1>
          <p className="text-gray-600">Gérez les auteurs rattachés à votre zone</p>
        </div>
        <Dialog open={showAddAuthorModal} onOpenChange={setShowAddAuthorModal}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter un Auteur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter un Nouvel Auteur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={newAuthorData.name}
                  onChange={(e) => setNewAuthorData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de l'auteur"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAuthorData.email}
                  onChange={(e) => setNewAuthorData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={newAuthorData.phone}
                  onChange={(e) => setNewAuthorData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+229 40 76 76 76"
                />
              </div>
              <div>
                <Label htmlFor="discipline">Discipline</Label>
                <Select value={newAuthorData.disciplineId} onValueChange={(value) => setNewAuthorData(prev => ({ ...prev, disciplineId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une discipline" />
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
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAuthorData.password}
                  onChange={(e) => setNewAuthorData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mot de passe temporaire"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddAuthorModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddAuthor}>
                  Créer l'Auteur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Auteurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auteurs Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authors.filter(a => a.status === 'ACTIVE').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authors.filter(a => a.status === 'PENDING').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Œuvres en Attente</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authors.reduce((sum, a) => sum + a.pendingWorksCount, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un auteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="ACTIVE">Actif</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="INACTIVE">Inactif</SelectItem>
          </SelectContent>
        </Select>
        <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
          <SelectTrigger className="w-full sm:w-48">
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

      {/* Authors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAuthors.map((author) => (
          <Card key={author.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{author.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Mail className="h-3 w-3 mr-1" />
                    {author.email}
                  </CardDescription>
                </div>
                {getStatusBadge(author.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {author.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-3 w-3 mr-2" />
                    {author.phone}
                  </div>
                )}
                {author.discipline && (
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="h-3 w-3 mr-2" />
                    {author.discipline.name}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-3 w-3 mr-2" />
                  Inscrit le {new Date(author.createdAt).toLocaleDateString('fr-FR')}
                </div>
                
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span>Œuvres: {author.worksCount}</span>
                  <span className="text-orange-600">En attente: {author.pendingWorksCount}</span>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />
                    Voir
                  </Button>
                  {author.status === 'PENDING' && (
                    <>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedAuthor(author)
                          setShowValidationModal(true)
                        }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valider
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAuthors.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun auteur trouvé</h3>
          <p className="text-gray-600">Commencez par ajouter un auteur à votre zone.</p>
        </div>
      )}

      {/* Validation Modal */}
      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider l'Auteur</DialogTitle>
          </DialogHeader>
          {selectedAuthor && (
            <div className="space-y-4">
              <p>Voulez-vous valider l'auteur <strong>{selectedAuthor.name}</strong> ?</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowValidationModal(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleValidateAuthor(selectedAuthor.id, 'INACTIVE')}
                >
                  Rejeter
                </Button>
                <Button 
                  onClick={() => handleValidateAuthor(selectedAuthor.id, 'ACTIVE')}
                >
                  Valider
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
