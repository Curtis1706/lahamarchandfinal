"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search, UserX, UserCheck, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Download, MoreVertical, BookOpen, Clock, Calendar, ShieldCheck, Mail, Briefcase, Users, Phone, Save, X, RefreshCw, Maximize2, Minimize2 } from "lucide-react"
import { CountrySelector } from "@/components/country-selector"
import { useDisciplines } from "@/hooks/use-disciplines"
import { useDepartments } from "@/hooks/use-departments"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { Discipline as ApiDiscipline } from "@/lib/types/api"
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
  disciplineId?: string | null
  discipline?: {
    id: string
    name: string
  }
  createdAt?: string
  updatedAt?: string
  status?: string
  // Optional work statistics for authors
  worksCount?: number
  publishedWorksCount?: number
  pendingWorksCount?: number
}

// On utilise le type Discipline importé de l'API
type Discipline = ApiDiscipline

export default function GestionUtilisateursPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [users, setUsers] = useState<User[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [departments, setDepartments] = useState<any[]>([])
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

  // Fonction pour charger les données
  const loadUsers = async () => {
    try {
      setIsLoading(true)

      const [usersData, disciplinesData, departmentsData] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getDisciplines(),
        apiClient.getDepartments()
      ])


      const usersArray = Array.isArray(usersData) ? usersData : []
      const disciplinesArray = Array.isArray(disciplinesData) ? disciplinesData : []
      const departmentsArray = Array.isArray(departmentsData) ? departmentsData : []

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
      setDepartments(departmentsArray)

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
    }
  }

  // Charger les données au montage du composant
  useEffect(() => {
    loadUsers()
  }, [])

  // Fonction pour actualiser les données
  const handleRefresh = () => {
    loadUsers()
    toast.success("Données actualisées")
  }

  // Fonctions de gestion
  const handleCreateUser = async (userData: any) => {
    try {
      const response = await apiClient.createUser(userData)
      // Type guard for response
      const newUser: User = (typeof response === 'object' && response !== null && 'user' in response)
        ? response.user as User
        : response as User
      setUsers(prev => Array.isArray(prev) ? [newUser, ...prev] : [newUser])
      setIsCreateDialogOpen(false)

      toast.success("Utilisateur créé avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création")
    }
  }

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const updatedUser = await apiClient.updateUser(userId, updates)
      setUsers(prev =>
        prev.map(u =>
          u.id === userId && typeof updatedUser === 'object' && updatedUser !== null
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
    // Mise à jour optimiste et appel API
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'SUSPENDED' } : u))
    try {
      await handleUpdateUser(userId, { status: 'SUSPENDED' })
    } catch (e) {
       // Revert en cas d'erreur (optionnel, mais propre)
       setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'ACTIVE' } : u))
    }
  }

  const handleActivateUser = async (userId: string) => {
    // Mise à jour optimiste et appel API
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'ACTIVE' } : u))
    try {
      await handleUpdateUser(userId, { status: 'ACTIVE' })
    } catch (e) {
      // Revert en cas d'erreur
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'SUSPENDED' } : u))
    }
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

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Logs de debug pour la pagination

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
      case 'INVITE':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Invité</Badge>
      case 'LIVREUR':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Livreur</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{role}</Badge>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date inconnue"
    try {
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy", { locale: fr })
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
          <Button variant="ghost" size="sm" onClick={handleRefresh} title="Actualiser">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" title="Plein écran">
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
              departments={departments}
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
              departments={departments}
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
              <SelectItem value="ACTIVE">Actif</SelectItem>
              <SelectItem value="SUSPENDED">Suspendu</SelectItem>
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
                  Actions
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
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
                <React.Fragment key={user.id}>
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
                      <TableCell colSpan={7} className="bg-gray-50 p-0">
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
                                    Compte concepteur
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
                </React.Fragment >
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
function EditUserForm({ user, disciplines, departments, onSubmit, onCancel }: {
  user: User
  disciplines: Discipline[]
  departments: any[]
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    status: user.status,
    disciplineId: user.disciplineId || '',
    departmentId: (user as any).departmentId || ''
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
        <CountrySelector 
          value={formData.phone} 
          onChange={(val) => setFormData({ ...formData, phone: val })} 
          placeholder="01 90 01 12 34" 
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
            <SelectItem value="INVITE">Invité</SelectItem>
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
            <SelectItem value="ACTIVE">Actif</SelectItem>
            <SelectItem value="SUSPENDED">Suspendu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lieu géographique (Département) - OBLIGATOIRE */}
      <div>
        <label className="text-sm font-medium">Département (Lieu) *</label>
        <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })} required>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un département" />
          </SelectTrigger>
          <SelectContent>
            {departments.filter(d => d.isActive).map(dept => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Spécialité académique (Discipline) - Pour concepteurs/auteurs */}
      {(formData.role === 'CONCEPTEUR' || formData.role === 'AUTEUR') && (
        <div>
          <label className="text-sm font-medium">Discipline (Matière) *</label>
          <Select value={formData.disciplineId} onValueChange={(value) => setFormData({ ...formData, disciplineId: value })} required>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une discipline" />
            </SelectTrigger>
            <SelectContent>
              {disciplines.filter(d => d.isActive).map(discipline => (
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
function CreateUserForm({ disciplines, departments, onSubmit, onCancel }: {
  disciplines: Discipline[]
  departments: any[]
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  // departments are passed as props
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CLIENT',
    disciplineId: '',
    departmentId: '',
    clientType: 'particulier' // Valeur par défaut
  })

  // Types de clients disponibles (identiques à l'inscription publique)
  const clientTypes = [
    { value: 'particulier', label: 'Particulier' },
    { value: 'boutique', label: 'Boutique / Revendeur' },
    { value: 'grossiste', label: 'Grossiste' },
    { value: 'ecole_contractuelle', label: 'École Contractuelle' },
    { value: 'ecole_non_contractuelle', label: 'École Non-Contractuelle' },
    { value: 'partenaire', label: 'Partenaire' },
    { value: 'bibliotheque', label: 'Bibliothèque' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Nettoyer les données avant envoi
    const dataToSend = {
      ...formData,
      // Si ce n'est pas un client, on n'envoie pas clientType
      clientType: formData.role === 'CLIENT' ? formData.clientType : undefined,
      // Si ce n'est pas un auteur/concepteur, on n'envoie pas disciplineId
      disciplineId: ['AUTEUR', 'CONCEPTEUR', 'REPRESENTANT'].includes(formData.role) ? formData.disciplineId : undefined
    }
    onSubmit(dataToSend)
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
        <CountrySelector 
          value={formData.phone} 
          onChange={(val) => setFormData({ ...formData, phone: val })} 
          placeholder="01 90 01 12 34" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Rôle</label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PDG">PDG</SelectItem>
              <SelectItem value="AUTEUR">Auteur</SelectItem>
              <SelectItem value="CONCEPTEUR">Concepteur</SelectItem>
              <SelectItem value="CLIENT">Client</SelectItem>
              <SelectItem value="PARTENAIRE">Partenaire</SelectItem>
              <SelectItem value="REPRESENTANT">Représentant</SelectItem>
              <SelectItem value="INVITE">Invité</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type de Client - Visible uniquement si Rôle est CLIENT */}
        {formData.role === 'CLIENT' && (
          <div>
            <label className="text-sm font-medium">Type de Client</label>
            <Select 
              value={formData.clientType} 
              onValueChange={(value) => setFormData({ ...formData, clientType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type de client" />
              </SelectTrigger>
              <SelectContent>
                {clientTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Lieu géographique (Département) - OBLIGATOIRE */}
      <div>
        <label className="text-sm font-medium">Département (Lieu) *</label>
        <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })} required>
          <SelectTrigger>
            <SelectValue placeholder="Choisir un département" />
          </SelectTrigger>
          <SelectContent>
            {departments.filter(d => d.isActive).map(dept => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Spécialité (Discipline) - Pour concepteurs/auteurs/représentants */}
      {['AUTEUR', 'CONCEPTEUR', 'REPRESENTANT'].includes(formData.role) && (
        <div>
          <label className="text-sm font-medium">Discipline (Matière) *</label>
          <Select value={formData.disciplineId} onValueChange={(value) => setFormData({ ...formData, disciplineId: value })} required>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une discipline" />
            </SelectTrigger>
            <SelectContent>
              {disciplines.filter(d => d.isActive).map(discipline => (
                <SelectItem key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
          Fermer <X className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  )
}
