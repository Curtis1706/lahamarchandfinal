"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  GraduationCap
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

// Fonction utilitaire pour formater le numéro de téléphone
const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return "Non renseigné"
  
  // Nettoyer le numéro (supprimer les espaces, tirets, parenthèses)
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  
  // Si c'est un numéro béninois sans indicatif
  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
    return `+229 ${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 4)} ${cleanPhone.slice(4, 6)} ${cleanPhone.slice(6, 8)}`
  }
  
  // Si c'est un numéro béninois avec indicatif
  if (cleanPhone.length === 12 && cleanPhone.startsWith('229')) {
    const number = cleanPhone.slice(3)
    return `+229 ${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4, 6)} ${number.slice(6, 8)}`
  }
  
  // Retourner tel quel si le format n'est pas reconnu
  return phone
}

// Types pour les utilisateurs en attente
interface PendingUser {
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
  updatedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

interface Discipline {
  id: string
  name: string
}

export default function ConcepteurValidationPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("PENDING")
  
  // Compteurs pour les statistiques
  const [approvedCount, setApprovedCount] = useState(0)
  const [rejectedCount, setRejectedCount] = useState(0)

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [pendingUsersData, disciplinesData, approvedUsersData, rejectedUsersData] = await Promise.all([
          apiClient.getPendingUsers('PENDING'),
          apiClient.getDisciplines(),
          apiClient.getPendingUsers('APPROVED'),
          apiClient.getPendingUsers('REJECTED')
        ])
        
        setPendingUsers(Array.isArray(pendingUsersData) ? pendingUsersData : [])
        setDisciplines(Array.isArray(disciplinesData) ? disciplinesData : [])
        setApprovedCount(Array.isArray(approvedUsersData) ? approvedUsersData.length : 0)
        setRejectedCount(Array.isArray(rejectedUsersData) ? rejectedUsersData.length : 0)
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
  const handleApproveUser = async (userId: string) => {
    try {
      await apiClient.validateUser(userId, 'APPROVED')
      
      // Mettre à jour la liste locale et les compteurs
      setPendingUsers(prev => 
        prev.filter(u => u.id !== userId)
      )
      setApprovedCount(prev => prev + 1)
      
      toast.success("Utilisateur approuvé avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'approbation")
    }
  }

  const handleRejectUser = async (userId: string) => {
    try {
      await apiClient.validateUser(userId, 'REJECTED')
      
      // Mettre à jour la liste locale et les compteurs
      setPendingUsers(prev => 
        prev.filter(u => u.id !== userId)
      )
      setRejectedCount(prev => prev + 1)
      
      toast.success("Utilisateur rejeté")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du rejet")
    }
  }

  // Filtrage
  const filteredUsers = Array.isArray(pendingUsers) ? pendingUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm))
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  }) : []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>
      case 'REJECTED':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Actif</Badge>
      case 'INACTIVE':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Inactif</Badge>
      case 'SUSPENDED':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Suspendu</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CONCEPTEUR':
        return <GraduationCap className="h-5 w-5 text-blue-600" />
      case 'AUTEUR':
        return <Users className="h-5 w-5 text-green-600" />
      case 'REPRESENTANT':
        return <UserCheck className="h-5 w-5 text-purple-600" />
      case 'PARTENAIRE':
        return <Users className="h-5 w-5 text-orange-600" />
      default:
        return <Users className="h-5 w-5 text-gray-600" />
    }
  }

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des inscriptions...</p>
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
            <h1 className="text-3xl font-bold">Validation des Inscriptions</h1>
            <p className="text-muted-foreground">
              Gérez les inscriptions des concepteurs et autres utilisateurs
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              <Users className="h-3 w-3 mr-1" />
              {filteredUsers.length} inscription{filteredUsers.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pendingUsers.filter(u => u.status === 'PENDING').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {approvedCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {rejectedCount}
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
                {pendingUsers.filter(u => u.role === 'CONCEPTEUR').length}
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
              <SelectItem value="CONCEPTEUR">Concepteurs</SelectItem>
              <SelectItem value="AUTEUR">Auteurs</SelectItem>
              <SelectItem value="REPRESENTANT">Représentants</SelectItem>
              <SelectItem value="PARTENAIRE">Partenaires</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="APPROVED">Approuvés</SelectItem>
              <SelectItem value="REJECTED">Rejetés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions en lot */}
        {filteredUsers.length > 0 && filteredUsers.some(u => u.status === 'PENDING') && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                {filteredUsers.filter(u => u.status === 'PENDING').length} inscription(s) en attente
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  filteredUsers
                    .filter(u => u.status === 'PENDING')
                    .forEach(user => handleApproveUser(user.id))
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Tout approuver
              </Button>
              <Button
                onClick={() => {
                  filteredUsers
                    .filter(u => u.status === 'PENDING')
                    .forEach(user => handleRejectUser(user.id))
                }}
                variant="destructive"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Tout rejeter
              </Button>
            </div>
          </div>
        )}

        {/* Liste des utilisateurs */}
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune inscription trouvée</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                  ? "Essayez de modifier vos critères de recherche"
                  : "Aucune inscription en attente de validation"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((pendingUser) => (
              <Card key={pendingUser.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getRoleIcon(pendingUser.role)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{pendingUser.name}</h3>
                          {getStatusBadge(pendingUser.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{pendingUser.email}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{formatPhone(pendingUser.phone)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Rôle: {pendingUser.role}</span>
                          </div>
                          
                          {pendingUser.discipline && (
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>Discipline: {pendingUser.discipline.name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Inscrit {formatDistanceToNow(new Date(pendingUser.createdAt), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Boutons d'action */}
                    <div className="flex flex-col space-y-2 ml-4 flex-shrink-0">
                      {pendingUser.status === 'PENDING' ? (
                        <>
                          <Button
                            onClick={() => handleApproveUser(pendingUser.id)}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
                            size="sm"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Approuver
                          </Button>
                          <Button
                            onClick={() => handleRejectUser(pendingUser.id)}
                            variant="destructive"
                            size="sm"
                            className="min-w-[100px]"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {pendingUser.status === 'APPROVED' ? 'Approuvé' : 'Rejeté'}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
  )
}
