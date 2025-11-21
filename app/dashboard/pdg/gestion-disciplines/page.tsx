"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Table,
  BarChart3
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Types pour les disciplines
interface Discipline {
  id: string
  name: string
  description?: string
  isActive: boolean
  concepteurCount?: number
  auteurCount?: number
  workCount?: number
  createdAt: string
  updatedAt: string
  _count?: {
    works: number
    projects: number
    users: number
  }
}

interface Concepteur {
  id: string
  name: string
  email: string
  disciplineId: string
}

interface Auteur {
  id: string
  name: string
  email: string
  disciplineId: string | null
}

export default function GestionDisciplinesPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [concepteurs, setConcepteurs] = useState<Concepteur[]>([])
  const [auteurs, setAuteurs] = useState<Auteur[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignAuthorsDialogOpen, setIsAssignAuthorsDialogOpen] = useState(false)
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null)
  const [selectedDisciplineForAuthors, setSelectedDisciplineForAuthors] = useState<Discipline | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [disciplinesData, usersData] = await Promise.all([
          apiClient.getDisciplines({ includeInactive: true }),
          apiClient.getUsers()
        ])
        
        console.log("🔍 Disciplines reçues:", disciplinesData)
        
        // Enrichir les disciplines avec les statistiques
        const enrichedDisciplines = disciplinesData.map(discipline => ({
          ...discipline,
          concepteurCount: usersData.filter((u: any) => u.disciplineId === discipline.id && u.role === 'CONCEPTEUR').length,
          auteurCount: usersData.filter((u: any) => u.disciplineId === discipline.id && u.role === 'AUTEUR').length,
          workCount: discipline._count?.works || 0,
          isActive: discipline.isActive !== undefined ? discipline.isActive : true,
          createdAt: discipline.createdAt || new Date().toISOString(),
          updatedAt: discipline.updatedAt || new Date().toISOString()
        }))
        
        setDisciplines(enrichedDisciplines)
        setConcepteurs(usersData.filter((u: any) => u.role === 'CONCEPTEUR'))
        setAuteurs(usersData.filter((u: any) => u.role === 'AUTEUR'))
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
  const handleCreateDiscipline = async (disciplineData: any) => {
    try {
      const newDiscipline = await apiClient.createDiscipline(disciplineData)
      setDisciplines(prev => [newDiscipline, ...prev])
      setIsCreateDialogOpen(false)
      toast.success("Discipline créée avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création")
    }
  }

  const handleUpdateDiscipline = async (disciplineId: string, updates: any) => {
    try {
      const updatedDiscipline = await apiClient.updateDiscipline(disciplineId, updates)
      setDisciplines(prev => 
        prev.map(d => 
          d.id === disciplineId 
            ? { ...d, ...updatedDiscipline }
            : d
        )
      )
      setIsEditDialogOpen(false)
      setEditingDiscipline(null)
      toast.success("Discipline modifiée avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la modification")
    }
  }

  const handleDeleteDiscipline = async (disciplineId: string) => {
    try {
      await apiClient.deleteDiscipline(disciplineId)
      setDisciplines(prev => prev.filter(d => d.id !== disciplineId))
      toast.success("Discipline supprimée avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  const handleToggleStatus = async (disciplineId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    await handleUpdateDiscipline(disciplineId, { isActive: newStatus })
  }

  const handleEditDiscipline = (discipline: Discipline) => {
    setEditingDiscipline(discipline)
    setIsEditDialogOpen(true)
  }

  const handleAssignAuthors = (discipline: Discipline) => {
    setSelectedDisciplineForAuthors(discipline)
    setIsAssignAuthorsDialogOpen(true)
  }

  const handleAssignAuthorToDiscipline = async (authorId: string, disciplineId: string) => {
    try {
      await apiClient.updateUser(authorId, { disciplineId })
      toast.success("Auteur assigné avec succès")
      
      // Recharger les données
      const [disciplinesData, usersData] = await Promise.all([
        apiClient.getDisciplines({ includeInactive: true }),
        apiClient.getUsers()
      ])
      
      const enrichedDisciplines = disciplinesData.map(discipline => ({
        ...discipline,
        concepteurCount: usersData.filter((u: any) => u.disciplineId === discipline.id && u.role === 'CONCEPTEUR').length,
        auteurCount: usersData.filter((u: any) => u.disciplineId === discipline.id && u.role === 'AUTEUR').length,
        workCount: discipline._count?.works || 0,
        isActive: discipline.isActive !== undefined ? discipline.isActive : true,
        createdAt: discipline.createdAt || new Date().toISOString(),
        updatedAt: discipline.updatedAt || new Date().toISOString()
      }))
      
      setDisciplines(enrichedDisciplines)
      setAuteurs(usersData.filter((u: any) => u.role === 'AUTEUR'))
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'assignation")
    }
  }

  const handleRemoveAuthorFromDiscipline = async (authorId: string) => {
    try {
      await apiClient.updateUser(authorId, { disciplineId: null })
      toast.success("Auteur retiré de la discipline")
      
      // Recharger les données
      const [disciplinesData, usersData] = await Promise.all([
        apiClient.getDisciplines({ includeInactive: true }),
        apiClient.getUsers()
      ])
      
      const enrichedDisciplines = disciplinesData.map(discipline => ({
        ...discipline,
        concepteurCount: usersData.filter((u: any) => u.disciplineId === discipline.id && u.role === 'CONCEPTEUR').length,
        auteurCount: usersData.filter((u: any) => u.disciplineId === discipline.id && u.role === 'AUTEUR').length,
        workCount: discipline._count?.works || 0,
        isActive: discipline.isActive !== undefined ? discipline.isActive : true,
        createdAt: discipline.createdAt || new Date().toISOString(),
        updatedAt: discipline.updatedAt || new Date().toISOString()
      }))
      
      setDisciplines(enrichedDisciplines)
      setAuteurs(usersData.filter((u: any) => u.role === 'AUTEUR'))
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  // Filtrage
  const filteredDisciplines = disciplines.filter(discipline => {
    const matchesSearch = discipline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (discipline.description && discipline.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = showInactive || discipline.isActive
    return matchesSearch && matchesStatus
  })

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <GraduationCap className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des disciplines...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'PDG') {
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
            <h1 className="text-3xl font-bold">Gestion des Disciplines</h1>
            <p className="text-muted-foreground">
              Gérez les disciplines disponibles, leurs concepteurs et leurs auteurs
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle discipline
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle discipline</DialogTitle>
                  <DialogDescription>
                    Ajoutez une nouvelle discipline au système
                  </DialogDescription>
                </DialogHeader>
                <CreateDisciplineForm 
                  onSubmit={handleCreateDiscipline}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            
            {/* Dialog de modification */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier la discipline</DialogTitle>
                  <DialogDescription>
                    Modifiez les informations de la discipline
                  </DialogDescription>
                </DialogHeader>
                {editingDiscipline && (
                  <EditDisciplineForm 
                    discipline={editingDiscipline}
                    onSubmit={(data) => handleUpdateDiscipline(editingDiscipline.id, data)}
                    onCancel={() => {
                      setIsEditDialogOpen(false)
                      setEditingDiscipline(null)
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
            
            {/* Dialog pour assigner des auteurs */}
            <Dialog open={isAssignAuthorsDialogOpen} onOpenChange={setIsAssignAuthorsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Gérer les auteurs - {selectedDisciplineForAuthors?.name}</DialogTitle>
                  <DialogDescription>
                    Assignez ou retirez des auteurs de cette discipline
                  </DialogDescription>
                </DialogHeader>
                {selectedDisciplineForAuthors && (
                  <AssignAuthorsForm
                    discipline={selectedDisciplineForAuthors}
                    auteurs={auteurs}
                    onAssign={(authorId) => handleAssignAuthorToDiscipline(authorId, selectedDisciplineForAuthors.id)}
                    onRemove={(authorId) => handleRemoveAuthorFromDiscipline(authorId)}
                    onClose={() => {
                      setIsAssignAuthorsDialogOpen(false)
                      setSelectedDisciplineForAuthors(null)
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
            
            <Badge variant="outline" className="text-sm">
              <GraduationCap className="h-3 w-3 mr-1" />
              {filteredDisciplines.length} discipline{filteredDisciplines.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{disciplines.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actives</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {disciplines.filter(d => d.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concepteurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {disciplines.reduce((sum, d) => sum + (d.concepteurCount || 0), 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auteurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {disciplines.reduce((sum, d) => sum + (d.auteurCount || 0), 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Œuvres</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {disciplines.reduce((sum, d) => sum + (d.workCount || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recherche et filtres */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une discipline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showInactive ? "default" : "outline"}
            onClick={() => setShowInactive(!showInactive)}
            size="sm"
          >
            {showInactive ? "Masquer inactives" : "Afficher inactives"}
          </Button>
        </div>

        {/* Onglets pour différentes vues */}
        <Tabs defaultValue="cards" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cards" className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>Vue cartes</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center space-x-2">
              <Table className="h-4 w-4" />
              <span>Tableau de répartition</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6">
            {/* Liste des disciplines en cartes */}
            {filteredDisciplines.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune discipline trouvée</h3>
                  <p className="text-muted-foreground text-center">
                    {searchTerm
                      ? "Essayez de modifier votre recherche"
                      : "Aucune discipline dans le système"
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDisciplines.map((discipline) => (
                  <Card key={discipline.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-lg">{discipline.name}</CardTitle>
                        </div>
                        <Badge variant={discipline.isActive ? "default" : "secondary"}>
                          {discipline.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {discipline.description && (
                        <CardDescription>{discipline.description}</CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        {/* Statistiques */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {discipline.concepteurCount || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Concepteurs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {discipline.auteurCount || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Auteurs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {discipline.workCount || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Œuvres</div>
                          </div>
                        </div>

                        {/* Concepteurs associés */}
                        {discipline.concepteurCount && discipline.concepteurCount > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Concepteurs associés</h4>
                            <div className="space-y-1">
                              {concepteurs
                                .filter(c => c.disciplineId === discipline.id)
                                .slice(0, 3)
                                .map(concepteur => (
                                  <div key={concepteur.id} className="text-sm text-muted-foreground">
                                    • {concepteur.name}
                                  </div>
                                ))}
                              {(discipline.concepteurCount || 0) > 3 && (
                                <div className="text-sm text-muted-foreground">
                                  +{(discipline.concepteurCount || 0) - 3} autres...
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Auteurs assignés */}
                        {discipline.auteurCount && discipline.auteurCount > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Auteurs associés</h4>
                            <div className="space-y-1">
                              {auteurs
                                .filter(a => a.disciplineId === discipline.id)
                                .slice(0, 3)
                                .map(auteur => (
                                  <div key={auteur.id} className="text-sm text-muted-foreground">
                                    • {auteur.name}
                                  </div>
                                ))}
                              {(discipline.auteurCount || 0) > 3 && (
                                <div className="text-sm text-muted-foreground">
                                  +{(discipline.auteurCount || 0) - 3} autres...
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignAuthors(discipline)}
                              title="Gérer les auteurs"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Auteurs
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDiscipline(discipline)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(discipline.id, discipline.isActive)}
                            >
                              {discipline.isActive ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activer
                                </>
                              )}
                            </Button>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer la discipline</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer la discipline "{discipline.name}" ? 
                                  Cette action est irréversible et affectera tous les concepteurs associés.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteDiscipline(discipline.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            {/* Tableau de répartition des concepteurs par discipline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Répartition des concepteurs et auteurs par discipline</span>
                </CardTitle>
                <CardDescription>
                  Vue d'ensemble de la distribution des concepteurs et auteurs dans chaque discipline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TableComponent>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Discipline</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Concepteurs</TableHead>
                      <TableHead>Auteurs</TableHead>
                      <TableHead>Projets</TableHead>
                      <TableHead>Œuvres</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisciplines.map((discipline) => (
                      <TableRow key={discipline.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{discipline.name}</div>
                            {discipline.description && (
                              <div className="text-sm text-muted-foreground">
                                {discipline.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={discipline.isActive ? "default" : "secondary"}>
                            {discipline.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{discipline.concepteurCount || 0}</div>
                            {discipline.concepteurCount && discipline.concepteurCount > 0 && (
                              <div className="text-sm text-muted-foreground">
                                {concepteurs
                                  .filter(c => c.disciplineId === discipline.id)
                                  .slice(0, 2)
                                  .map(c => c.name)
                                  .join(", ")}
                                {(discipline.concepteurCount || 0) > 2 && "..."}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{discipline.auteurCount || 0}</div>
                            {discipline.auteurCount && discipline.auteurCount > 0 && (
                              <div className="text-sm text-muted-foreground">
                                {auteurs
                                  .filter(a => a.disciplineId === discipline.id)
                                  .slice(0, 2)
                                  .map(a => a.name)
                                  .join(", ")}
                                {(discipline.auteurCount || 0) > 2 && "..."}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{discipline._count?.projects || 0}</TableCell>
                        <TableCell>{discipline._count?.works || 0}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignAuthors(discipline)}
                              title="Gérer les auteurs"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDiscipline(discipline)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(discipline.id, discipline.isActive)}
                            >
                              {discipline.isActive ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableComponent>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  )
}

// Composant pour créer une discipline
function CreateDisciplineForm({ onSubmit, onCancel }: {
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la discipline</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Mathématiques, Sciences, Histoire..."
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description de la discipline"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Créer la discipline
        </Button>
      </div>
    </form>
  )
}

// Composant pour modifier une discipline
function EditDisciplineForm({ discipline, onSubmit, onCancel }: {
  discipline: Discipline
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: discipline.name,
    description: discipline.description || '',
    isActive: discipline.isActive
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Nom de la discipline</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Mathématiques, Sciences, Histoire..."
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-description">Description (optionnel)</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description de la discipline"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="edit-active"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="edit-active">Discipline active</Label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Modifier la discipline
        </Button>
      </div>
    </form>
  )
}

// Composant pour assigner des auteurs à une discipline
function AssignAuthorsForm({ 
  discipline, 
  auteurs, 
  onAssign, 
  onRemove, 
  onClose 
}: { 
  discipline: Discipline
  auteurs: Auteur[]
  onAssign: (authorId: string) => void
  onRemove: (authorId: string) => void
  onClose: () => void
}) {
  const [searchTerm, setSearchTerm] = useState("")
  
  const assignedAuthors = auteurs.filter(a => a.disciplineId === discipline.id)
  const unassignedAuthors = auteurs.filter(a => a.disciplineId !== discipline.id || !a.disciplineId)
  
  const filteredAssigned = assignedAuthors.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredUnassigned = unassignedAuthors.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un auteur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {/* Auteurs assignés */}
        <div>
          <h3 className="text-sm font-semibold mb-2">
            Auteurs assignés ({assignedAuthors.length})
          </h3>
          {filteredAssigned.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucun auteur assigné à cette discipline
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredAssigned.map(auteur => (
                <div
                  key={auteur.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">{auteur.name}</div>
                    <div className="text-sm text-muted-foreground">{auteur.email}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemove(auteur.id)}
                  >
                    Retirer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Auteurs non assignés */}
        <div>
          <h3 className="text-sm font-semibold mb-2">
            Auteurs disponibles ({unassignedAuthors.length})
          </h3>
          {filteredUnassigned.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {searchTerm ? "Aucun auteur trouvé" : "Tous les auteurs sont assignés"}
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredUnassigned.map(auteur => (
                <div
                  key={auteur.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">{auteur.name}</div>
                    <div className="text-sm text-muted-foreground">{auteur.email}</div>
                    {auteur.disciplineId && (
                      <div className="text-xs text-orange-600 mt-1">
                        Déjà assigné à une autre discipline
                      </div>
                    )}
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onAssign(auteur.id)}
                  >
                    Assigner
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  )
}
