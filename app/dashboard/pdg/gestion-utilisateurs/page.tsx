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
  Users, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Shield,
  Crown
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
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

// Types pour les utilisateurs
interface User {
  id: string
  name: string
  email: string
  role: string
  disciplineId?: string
  discipline?: {
    id: string
    name: string
  }
  createdAt: string
  status: 'active' | 'inactive' | 'suspended'
}

interface Discipline {
  id: string
  name: string
}

export default function GestionUtilisateursPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [users, setUsers] = useState<User[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [usersData, disciplinesData] = await Promise.all([
          apiClient.getUsers(),
          apiClient.getDisciplines()
        ])
        
        setUsers(usersData)
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
  const handleCreateUser = async (userData: any) => {
    try {
      const newUser = await apiClient.createUser(userData)
      setUsers(prev => [newUser, ...prev])
      setIsCreateDialogOpen(false)
      toast.success("Utilisateur créé avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création")
    }
  }

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      // Simuler la mise à jour
      setUsers(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, ...updates }
            : u
        )
      )
      
      toast.success("Utilisateur modifié avec succès")
    } catch (error) {
      toast.error("Erreur lors de la modification")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success("Utilisateur supprimé avec succès")
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    handleUpdateUser(userId, { status: newStatus })
  }

  // Filtrage
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />Actif</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><UserX className="h-3 w-3 mr-1" />Inactif</Badge>
      case 'suspended':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><UserX className="h-3 w-3 mr-1" />Suspendu</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'PDG':
        return <Crown className="h-5 w-5 text-yellow-600" />
      case 'CONCEPTEUR':
        return <GraduationCap className="h-5 w-5 text-blue-600" />
      case 'AUTEUR':
        return <Users className="h-5 w-5 text-green-600" />
      case 'REPRESENTANT':
        return <UserCheck className="h-5 w-5 text-purple-600" />
      case 'PARTENAIRE':
        return <Users className="h-5 w-5 text-orange-600" />
      case 'CLIENT':
        return <Users className="h-5 w-5 text-gray-600" />
      default:
        return <Users className="h-5 w-5 text-gray-600" />
    }
  }

  if (userLoading || isLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Users className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des utilisateurs...</p>
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
    <DynamicDashboardLayout title="Gestion des Utilisateurs">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
            <p className="text-muted-foreground">
              Gérez tous les utilisateurs de la plateforme
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouvel utilisateur à la plateforme
                  </DialogDescription>
                </DialogHeader>
                <CreateUserForm 
                  disciplines={disciplines}
                  onSubmit={handleCreateUser}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Badge variant="outline" className="text-sm">
              <Users className="h-3 w-3 mr-1" />
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concepteurs</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'CONCEPTEUR').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auteurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'AUTEUR').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'CLIENT').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="PDG">PDG</SelectItem>
              <SelectItem value="CONCEPTEUR">Concepteurs</SelectItem>
              <SelectItem value="AUTEUR">Auteurs</SelectItem>
              <SelectItem value="REPRESENTANT">Représentants</SelectItem>
              <SelectItem value="PARTENAIRE">Partenaires</SelectItem>
              <SelectItem value="CLIENT">Clients</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
              <SelectItem value="suspended">Suspendus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des utilisateurs */}
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun utilisateur trouvé</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                  ? "Essayez de modifier vos critères de recherche"
                  : "Aucun utilisateur dans le système"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getRoleIcon(user.role)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{user.name}</h3>
                          {getStatusBadge(user.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4" />
                            <span>Rôle: {user.role}</span>
                          </div>
                          
                          {user.discipline && (
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>Discipline: {user.discipline.name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Créé {formatDistanceToNow(new Date(user.createdAt), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.status)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {user.status === 'active' ? 'Suspendre' : 'Activer'}
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
                            <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer {user.name} ? 
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteUser(user.id)}
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

// Composant pour créer un utilisateur
function CreateUserForm({ disciplines, onSubmit, onCancel }: {
  disciplines: Discipline[]
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CLIENT',
    disciplineId: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nom complet</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nom complet"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@example.com"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Mot de passe</label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Mot de passe"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Rôle</label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CLIENT">Client</SelectItem>
            <SelectItem value="CONCEPTEUR">Concepteur</SelectItem>
            <SelectItem value="AUTEUR">Auteur</SelectItem>
            <SelectItem value="REPRESENTANT">Représentant</SelectItem>
            <SelectItem value="PARTENAIRE">Partenaire</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {formData.role === 'CONCEPTEUR' && (
        <div>
          <label className="text-sm font-medium">Discipline</label>
          <Select value={formData.disciplineId} onValueChange={(value) => setFormData({ ...formData, disciplineId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une discipline" />
            </SelectTrigger>
            <SelectContent>
              {disciplines.map(discipline => (
                <SelectItem key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Créer l'utilisateur
        </Button>
      </div>
    </form>
  )
}
