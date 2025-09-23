"use client"

import { useState, useEffect } from "react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Users,
  BookOpen,
  CheckCircle,
  XCircle
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
  workCount?: number
  createdAt: string
}

interface Concepteur {
  id: string
  name: string
  email: string
  disciplineId: string
}

export default function GestionDisciplinesPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [concepteurs, setConcepteurs] = useState<Concepteur[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [disciplinesData, usersData] = await Promise.all([
          apiClient.getDisciplines(),
          apiClient.getUsers()
        ])
        
        // Enrichir les disciplines avec les statistiques
        const enrichedDisciplines = disciplinesData.map(discipline => ({
          ...discipline,
          concepteurCount: usersData.filter((u: any) => u.disciplineId === discipline.id && u.role === 'CONCEPTEUR').length,
          workCount: Math.floor(Math.random() * 20), // Simuler le nombre d'œuvres
          isActive: true,
          createdAt: new Date().toISOString()
        }))
        
        setDisciplines(enrichedDisciplines)
        setConcepteurs(usersData.filter((u: any) => u.role === 'CONCEPTEUR'))
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
      setDisciplines(prev => 
        prev.map(d => 
          d.id === disciplineId 
            ? { ...d, ...updates }
            : d
        )
      )
      
      toast.success("Discipline modifiée avec succès")
    } catch (error) {
      toast.error("Erreur lors de la modification")
    }
  }

  const handleDeleteDiscipline = async (disciplineId: string) => {
    try {
      setDisciplines(prev => prev.filter(d => d.id !== disciplineId))
      toast.success("Discipline supprimée avec succès")
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleToggleStatus = async (disciplineId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    handleUpdateDiscipline(disciplineId, { isActive: newStatus })
  }

  // Filtrage
  const filteredDisciplines = disciplines.filter(discipline => 
    discipline.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (userLoading || isLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <GraduationCap className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des disciplines...</p>
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
    <DynamicDashboardLayout title="Gestion des Disciplines">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Disciplines</h1>
            <p className="text-muted-foreground">
              Gérez les disciplines disponibles et leurs concepteurs
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
            <Badge variant="outline" className="text-sm">
              <GraduationCap className="h-3 w-3 mr-1" />
              {filteredDisciplines.length} discipline{filteredDisciplines.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une discipline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste des disciplines */}
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {discipline.concepteurCount || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Concepteurs</div>
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

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(discipline.id, discipline.isActive)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {discipline.isActive ? 'Désactiver' : 'Activer'}
                      </Button>
                      
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
      </div>
    </DynamicDashboardLayout>
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
      <div>
        <label className="text-sm font-medium">Nom de la discipline</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Mathématiques, Sciences, Histoire..."
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Description (optionnel)</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description de la discipline"
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
