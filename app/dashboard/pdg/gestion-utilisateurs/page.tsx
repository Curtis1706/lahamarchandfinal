"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Minimize2,
  RefreshCw,
  Maximize2
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Types pour les utilisateurs
interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  disciplineId?: string
  discipline?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt?: string
  status?: 'active' | 'inactive' | 'suspended'
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [itemsPerPage, setItemsPerPage] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        console.log("🔍 Début du chargement des données...")
        
        const [usersData, disciplinesData] = await Promise.all([
          apiClient.getUsers(),
          apiClient.getDisciplines()
        ])
        
        console.log("🔍 Données reçues:", { 
          usersData, 
          usersDataType: typeof usersData,
          usersDataLength: Array.isArray(usersData) ? usersData.length : 'N/A',
          disciplinesData,
          disciplinesDataType: typeof disciplinesData,
          disciplinesDataLength: Array.isArray(disciplinesData) ? disciplinesData.length : 'N/A'
        })
        
        const usersArray = Array.isArray(usersData) ? usersData : []
        const disciplinesArray = Array.isArray(disciplinesData) ? disciplinesData : []
        
        // Enrichir les utilisateurs avec les statistiques d'œuvres pour les auteurs
        const enrichedUsers = await Promise.all(
          usersArray.map(async (user: User) => {
            if (user.role === 'AUTEUR') {
              try {
                const worksResponse = await fetch(`/api/authors/works?authorId=${user.id}`)
                if (worksResponse.ok) {
                  const worksData = await worksResponse.json()
                  const works = worksData.works || []
                  return {
                    ...user,
                    worksCount: works.length,
                    publishedWorksCount: works.filter((w: any) => w.status === 'ON_SALE' || w.status === 'PUBLISHED').length,
                    pendingWorksCount: works.filter((w: any) => w.status === 'PENDING' || w.status === 'DRAFT').length
                  }
                }
              } catch (error) {
                console.error(`Error fetching works for author ${user.id}:`, error)
              }
            }
            return user
          })
        )
        
        setUsers(enrichedUsers)
        setDisciplines(disciplinesArray)
        
        console.log("🔍 État mis à jour:", {
          usersCount: usersArray.length,
          disciplinesCount: disciplinesArray.length,
          firstUser: usersArray[0] || 'Aucun utilisateur',
          firstDiscipline: disciplinesArray[0] || 'Aucune discipline'
        })
      } catch (error: any) {
        console.error("❌ Error fetching data:", error)
        console.error("❌ Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
        toast.error("Erreur lors du chargement des données: " + error.message)
      } finally {
        setIsLoading(false)
        console.log("🔍 Chargement terminé")
      }
    }

    fetchData()
  }, [])

  // Fonctions de gestion
  const handleCreateUser = async (userData: any) => {
    try {
      const response = await apiClient.createUser(userData)
      const newUser = response.user || response
      setUsers(prev => Array.isArray(prev) ? [newUser, ...prev] : [newUser])
      setIsCreateDialogOpen(false)
      
      // Si c'est un compte invité avec mot de passe temporaire, l'afficher
      if (userData.role === 'INVITE' && response.temporaryPassword) {
        toast.success(
          `Compte invité créé avec succès ! Mot de passe temporaire: ${response.temporaryPassword}`,
          { duration: 10000 }
        )
        // Afficher aussi dans une alerte pour que l'utilisateur puisse copier
        alert(`Compte invité créé avec succès !\n\nEmail: ${newUser.email}\nMot de passe temporaire: ${response.temporaryPassword}\n\nVeuillez communiquer ces informations à l'utilisateur.`)
      } else {
        toast.success("Utilisateur créé avec succès")
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création")
    }
  }

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const updatedUser = await apiClient.updateUser(userId, updates)
      setUsers(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, ...updatedUser }
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
      // Empêcher la suppression de l'utilisateur PDG actuel
      if (user && user.id === userId) {
        toast.error("Vous ne pouvez pas supprimer votre propre compte")
        return
      }

      await apiClient.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success("Utilisateur supprimé avec succès")
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    handleUpdateUser(userId, { status: newStatus })
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleSaveUser = async (userData: any) => {
    if (selectedUser) {
      await handleUpdateUser(selectedUser.id, userData)
      setIsEditDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const handleSuspendUser = async (userId: string) => {
    await handleUpdateUser(userId, { status: 'SUSPENDED' })
  }

  const handleActivateUser = async (userId: string) => {
    await handleUpdateUser(userId, { status: 'ACTIVE' })
  }

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  // Filtrage
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = user.name.toLowerCase().includes(searchLower) ||
                         user.email.toLowerCase().includes(searchLower) ||
                         (user.phone && user.phone.toLowerCase().includes(searchLower))
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  }) : []

  // Logs de debug pour le filtrage
  console.log("🔍 Filtrage des utilisateurs:", {
    totalUsers: users.length,
    searchTerm,
    roleFilter,
    statusFilter,
    filteredCount: filteredUsers.length,
    filteredUsers: filteredUsers.map(u => ({ id: u.id, name: u.name, role: u.role, status: u.status }))
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Logs de debug pour la pagination
  console.log("🔍 Pagination des utilisateurs:", {
    totalPages,
    currentPage,
    itemsPerPage,
    startIndex,
    endIndex,
    paginatedCount: paginatedUsers.length,
    paginatedUsers: paginatedUsers.map(u => ({ id: u.id, name: u.name }))
  })

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Actif</Badge>
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactif</Badge>
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Suspendu</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En attente</Badge>
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Approuvé</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejeté</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inconnu</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'PDG':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">PDG</Badge>
      case 'CONCEPTEUR':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Concepteur</Badge>
      case 'AUTEUR':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Auteur</Badge>
      case 'REPRESENTANT':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Représentant</Badge>
      case 'PARTENAIRE':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Partenaire</Badge>
      case 'CLIENT':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Client</Badge>
      case 'LIVREUR':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Livreur</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{role}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
    } catch {
      return dateString
    }
  }

  const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return "Non renseigné"
    
    // Formater le numéro de téléphone béninois
    const cleanPhone = phone.replace(/\D/g, '')
    
    if (cleanPhone.startsWith('229')) {
      // Format international: +229 XX XX XX XX
      const number = cleanPhone.substring(3)
      if (number.length >= 8) {
        return `+229 ${number.substring(0, 2)} ${number.substring(2, 4)} ${number.substring(4, 6)} ${number.substring(6, 8)}`
      }
    } else if (cleanPhone.length >= 8) {
      // Format local: XX XX XX XX
      return `${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 4)} ${cleanPhone.substring(4, 6)} ${cleanPhone.substring(6, 8)}`
    }
    
    return phone // Retourner tel quel si pas de format reconnu
  }

  // Logs de debug pour l'état de chargement
  console.log("🔍 État de chargement:", {
    userLoading,
    isLoading,
    user: user ? { id: user.id, name: user.name, role: user.role } : null,
    usersCount: users.length,
    disciplinesCount: disciplines.length
  })

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des utilisateurs...</p>
          <p className="text-sm text-gray-500 mt-2">
            {userLoading ? "Authentification..." : "Chargement des données..."}
          </p>
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
    <div className="bg-white min-h-screen p-6">
        {/* Titre de section et contrôles de fenêtre */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Liste des utilisateurs</h2>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          </div>

        {/* Bouton Ajouter */}
        <div className="flex justify-end mb-6">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                Ajouter
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
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
        </div>

        {/* Modal d'édition d'utilisateur */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
              <DialogDescription>
                Modifiez les informations de {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <EditUserForm 
                user={selectedUser}
                disciplines={disciplines}
                onSubmit={handleSaveUser}
                onCancel={() => {
                  setIsEditDialogOpen(false)
                  setSelectedUser(null)
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Contrôles du tableau */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Afficher</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700">éléments</span>
        </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Rechercher:</span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
                placeholder=""
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
            />
          </div>
            
          <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Rôle</SelectItem>
              <SelectItem value="PDG">PDG</SelectItem>
                <SelectItem value="AUTEUR">Auteur</SelectItem>
                <SelectItem value="CONCEPTEUR">Concepteur</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
                <SelectItem value="PARTENAIRE">Partenaire</SelectItem>
                <SelectItem value="REPRESENTANT">Représentant</SelectItem>
            </SelectContent>
          </Select>
            
          <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Statut</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Département</SelectItem>
                {disciplines.map(discipline => (
                  <SelectItem key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
                      </div>
                      
        {/* Tableau des utilisateurs */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">
                  <div className="flex items-center">
                    <span className="mr-1">♦</span>
                    Nom complet
                  </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center">
                    <span className="mr-1">♦</span>
                    Téléphone
                        </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center">
                    <span className="mr-1">♦</span>
                    email
                          </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center">
                    <span className="mr-1">♦</span>
                    Rôle
                          </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center">
                    <span className="mr-1">♦</span>
                    Statut
                            </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center">
                    <span className="mr-1">♦</span>
                    Ajoutée le
                          </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center">
                    <span className="mr-1">♦</span>
                    Modifié le
                        </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center">
                    <span className="mr-1">♦</span>
                    Actions
                      </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Aucun utilisateur trouvé</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {users.length === 0 
                          ? "Aucun utilisateur enregistré dans le système"
                          : "Aucun utilisateur ne correspond aux filtres appliqués"
                        }
                      </p>
                      {users.length === 0 && (
                        <Button 
                          className="mt-4"
                          onClick={() => setIsCreateDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Créer le premier utilisateur
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                <>
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 mr-2 bg-green-50 hover:bg-green-100"
                          onClick={() => toggleUserExpansion(user.id)}
                        >
                          {expandedUsers.has(user.id) ? (
                            <span className="text-green-600 font-bold">-</span>
                          ) : (
                            <span className="text-green-600 font-bold">+</span>
                          )}
                        </Button>
                        {user.name}
                    </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{formatPhone(user.phone)}</span>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>{user.updatedAt ? formatDate(user.updatedAt) : formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                          className="h-8 w-8 p-0 bg-green-50 hover:bg-green-100"
                          onClick={() => handleEditUser(user)}
                          title="Modifier l'utilisateur"
                      >
                          <Edit className="h-4 w-4 text-green-600" />
                      </Button>
                        
                        {/* Bouton de suspension/activation */}
                        {user.status === 'ACTIVE' ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0 bg-yellow-50 hover:bg-yellow-100"
                                title="Suspendre l'utilisateur"
                              >
                                <UserX className="h-4 w-4 text-yellow-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Suspendre l'utilisateur</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir suspendre {user.name} ? 
                                  Il ne pourra plus accéder à son compte.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleSuspendUser(user.id)}
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                  Suspendre
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0 bg-green-50 hover:bg-green-100"
                                title="Activer l'utilisateur"
                              >
                                <UserCheck className="h-4 w-4 text-green-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Activer l'utilisateur</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir activer {user.name} ? 
                                  Il pourra de nouveau accéder à son compte.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleActivateUser(user.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Activer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100"
                              title="Supprimer l'utilisateur"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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
                    </TableCell>
                  </TableRow>
                  
                  {/* Détails étendus de l'utilisateur */}
                  {expandedUsers.has(user.id) && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-gray-50 p-0">
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600">Statut Numéro</label>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Vérifié
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600">Téléphone</label>
                              <p className="text-sm text-gray-900">
                                {formatPhone(user.phone)}
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600">Dernière connexion</label>
                              <p className="text-sm text-gray-900">
                                {user.updatedAt ? formatDate(user.updatedAt) : "Jamais connecté"}
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600">Créé par</label>
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                {user.email}
                              </Badge>
                            </div>
                            
                            {user.role === 'AUTEUR' ? (
                              <>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Discipline</label>
                                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                    {user.discipline?.name || "Non assigné"}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Nombre d'œuvres</label>
                                  <p className="text-sm text-gray-900 font-semibold">
                                    {user.worksCount || 0}
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Œuvres publiées</label>
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    {user.publishedWorksCount || 0}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Œuvres en attente</label>
                                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                    {user.pendingWorksCount || 0}
                                  </Badge>
                                </div>
                              </>
                            ) : user.role === 'CONCEPTEUR' ? (
                              <>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Discipline</label>
                                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                    {user.discipline?.name || "Non assigné"}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Compte principal</label>
                                  <p className="text-sm text-gray-900">
                                    {user.role === 'PDG' ? 'Compte administrateur' : 'Compte standard'}
                                  </p>
                                </div>
                              </>
                            ) : user.role === 'REPRESENTANT' ? (
                              <>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Discipline</label>
                                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                    {user.discipline?.name || "Non assigné"}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Compte principal</label>
                                  <p className="text-sm text-gray-900">
                                    Compte standard
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Rôle hiérarchique</label>
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                    Responsable département
                                  </Badge>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Discipline</label>
                                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                    {user.discipline?.name || "Non assigné"}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-600">Compte principal</label>
                                  <p className="text-sm text-gray-900">
                                    {user.role === 'PDG' ? 'Compte administrateur' : 'Compte standard'}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-gray-900">Informations complémentaires</h4>
                                <p className="text-sm text-gray-600">Détails supplémentaires sur cet utilisateur</p>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleUserExpansion(user.id)}
                                >
                                  Réduire
                                </Button>
                              </div>
                            </div>
                    </div>
                  </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length} éléments
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(1)}
            >
              1
            </Button>
            
            {totalPages > 1 && (
              <Button
                variant={currentPage === 2 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(2)}
              >
                2
              </Button>
            )}
            
            {totalPages > 2 && (
              <Button
                variant={currentPage === 3 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(3)}
              >
                3
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
  )
}

// Composant pour modifier un utilisateur
function EditUserForm({ user, disciplines, onSubmit, onCancel }: {
  user: User
  disciplines: Discipline[]
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    status: user.status,
    disciplineId: user.disciplineId || ''
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
        <label className="text-sm font-medium">Téléphone</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+229 40 76 76 76"
          pattern="[+]?[0-9\s\-\(\)]+"
          title="Format: +229 40 76 76 76 ou 22940767676"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Rôle</label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PDG">PDG</SelectItem>
            <SelectItem value="AUTEUR">Auteur</SelectItem>
            <SelectItem value="CONCEPTEUR">Concepteur</SelectItem>
            <SelectItem value="CLIENT">Client</SelectItem>
            <SelectItem value="PARTENAIRE">Partenaire</SelectItem>
            <SelectItem value="REPRESENTANT">Représentant</SelectItem>
            <SelectItem value="LIVREUR">Livreur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Statut</label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
            <SelectItem value="suspended">Suspendu</SelectItem>
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
          Sauvegarder
        </Button>
      </div>
    </form>
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
    phone: '',
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
        <label className="text-sm font-medium">Téléphone {formData.role !== 'INVITE' && '*'}</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+229 40 76 76 76"
          pattern="[+]?[0-9\s\-\(\)]+"
          title="Format: +229 40 76 76 76 ou 22940767676"
          required={formData.role !== 'INVITE'}
        />
        {formData.role === 'INVITE' && (
          <p className="text-xs text-muted-foreground mt-1">Optionnel pour les comptes invités</p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium">
          Mot de passe {formData.role !== 'INVITE' && '*'}
        </label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder={formData.role === 'INVITE' ? "Laisser vide pour générer automatiquement" : "Mot de passe"}
          required={formData.role !== 'INVITE'}
        />
        {formData.role === 'INVITE' && (
          <p className="text-xs text-muted-foreground mt-1">
            Si laissé vide, un mot de passe temporaire sera généré automatiquement
          </p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium">Rôle</label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PDG">PDG</SelectItem>
            <SelectItem value="AUTEUR">Auteur</SelectItem>
            <SelectItem value="CONCEPTEUR">Concepteur</SelectItem>
            <SelectItem value="CLIENT">Client</SelectItem>
            <SelectItem value="PARTENAIRE">Partenaire</SelectItem>
            <SelectItem value="REPRESENTANT">Représentant</SelectItem>
            <SelectItem value="LIVREUR">Livreur</SelectItem>
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
