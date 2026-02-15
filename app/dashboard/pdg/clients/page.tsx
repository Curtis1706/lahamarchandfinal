"use client"

import React, { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, Edit, Trash2, Search, User, Filter, 
  Download, ChevronDown, ChevronRight, Eye, RefreshCw, X
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { CreateUserForm } from "../gestion-utilisateurs/page"

// Adapter l'interface User pour inclure les propriétés spécifiques client
interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  status?: string
  createdAt?: string
  updatedAt?: string
  department?: {
    id: string
    name: string
  }
  // Propriétés spécifiques client
  clientType?: string | null
  clients?: {
    type: string
    dette: number
    statut: string
    city?: string
  }[]
  image?: string
}

export default function ClientsPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    type: "all",
    department: "all",
    zone: "all",
    vip: "all",
    status: "all"
  })

  // États pour les données nécessaires
  const [disciplines, setDisciplines] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [availableZones, setAvailableZones] = useState<string[]>([])

  // Chargement des données
  const loadClients = async () => {
    try {
      setIsLoading(true)
      // Charger clients, disciplines et départements en parallèle
      const [usersData, disciplinesData, departmentsData] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getDisciplines(), 
        apiClient.getDepartments()
      ])

      const validUsers: User[] = []
      const zones = new Set<string>()

      if (Array.isArray(usersData)) {
        // Filtrer uniquement les CLIENTS
        const clients = usersData.filter((u: any) => u.role === 'CLIENT')
        clients.forEach((c: any) => {
             validUsers.push(c)
             // Collecter les zones (villes)
             if (c.clients && c.clients[0]?.city) {
                 zones.add(c.clients[0].city)
             }
        })
      }
      
      setUsers(validUsers)
      setAvailableZones(Array.from(zones))
      setDisciplines(Array.isArray(disciplinesData) ? disciplinesData : [])
      setDepartments(Array.isArray(departmentsData) ? departmentsData : [])

    } catch (error: any) {
      toast.error("Erreur lors du chargement des clients: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const handleCreateUser = async (userData: any) => {
      try {
        // Force le rôle à CLIENT si ce n'est pas déjà le cas dans le formulaire réutilisé
        const payload = { ...userData, role: 'CLIENT' }
        const response = await apiClient.createUser(payload)
        
        // Mise à jour optimiste ou rechargement
        const newUser: User = (typeof response === 'object' && response !== null && 'user' in response)
          ? response.user as User
          : response as User
          
        setUsers(prev => [newUser, ...prev])
        setIsCreateDialogOpen(false)
        toast.success("Client créé avec succès")
        loadClients() // Recharger pour avoir toutes les infos à jour
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la création")
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

  const resetFilters = () => {
      setFilters({
        type: "all",
        department: "all",
        zone: "all",
        vip: "all",
        status: "all"
      })
      setSearchTerm("")
      setIsFilterOpen(false)
  }

  // Filtrage complet
  const filteredUsers = users.filter(user => {
    // 1. Recherche Textuelle
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.phone && user.phone.includes(searchLower))
    
    if (!matchesSearch) return false

    // 2. Filtres Avancés
    // Type
    const clientType = user.clientType || user.clients?.[0]?.type
    if (filters.type !== "all" && clientType !== filters.type) return false

    // Département
    if (filters.department !== "all" && user.department?.id !== filters.department) return false

    // Zone (City)
    const clientCity = user.clients?.[0]?.city
    if (filters.zone !== "all" && clientCity !== filters.zone) return false

    // Statut
    if (filters.status !== "all" && user.status !== filters.status) return false
    
    // VIP (Mock logic as field doesn't exist yet)
    if (filters.vip !== "all") {
        // If filtering by VIP, currently no logic matches so return false (or true if everyone is VIP?)
        // Let's assume no one is VIP for now unless we add a specific check
        return false 
    }

    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  // Helpers d'affichage
  const getClientTypeBadge = (clientType?: string | null) => {
    const type = clientType || 'particulier'
    let colorClass = "bg-gray-100 text-gray-800"
    
    switch(type) {
      case 'particulier': colorClass = "bg-indigo-100 text-indigo-800"; break; 
      case 'boutique': colorClass = "bg-purple-100 text-purple-800"; break;
      case 'grossiste': colorClass = "bg-blue-100 text-blue-800"; break; 
      case 'ecole_contractuelle': colorClass = "bg-indigo-600 text-white"; break; 
      case 'ecole_non_contractuelle': colorClass = "bg-indigo-500 text-white"; break; 
      case 'auteur': colorClass = "bg-indigo-400 text-white"; break;
      default: colorClass = "bg-gray-100 text-gray-800";
    }

    const label = type.replace(/_/g, ' ').toUpperCase()
    return <Badge className={`${colorClass} hover:${colorClass} border-none`}>{label}</Badge>
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-"
    return format(new Date(dateString), "EEE d MMM yyyy HH:mm", { locale: fr })
  }

  const formatPhone = (phone: string | null | undefined) => {
      if (!phone) return "-"
      const cleanPhone = phone.replace(/[^\d+]/g, '')
      if (cleanPhone.startsWith('229')) return '+' + cleanPhone
      if (cleanPhone.startsWith('+')) return cleanPhone
      return '+' + cleanPhone 
    }

  if (userLoading || isLoading) {
    return (
       <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-500">Chargement des clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen"> 
      
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Les clients</h1>

        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            {/* Top Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2">
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                        <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                            Filtre <Filter className="w-4 h-4 ml-2" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[800px] p-6" align="start">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Type de client :</Label>
                                <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tous les clients" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les clients</SelectItem>
                                        <SelectItem value="particulier">Particulier</SelectItem>
                                        <SelectItem value="boutique">Boutique</SelectItem>
                                        <SelectItem value="grossiste">Grossiste</SelectItem>
                                        <SelectItem value="ecole_contractuelle">École Contractuelle</SelectItem>
                                        <SelectItem value="ecole_non_contractuelle">École Non Contractuelle</SelectItem>
                                        <SelectItem value="partenaire">Partenaire</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Département :</Label>
                                <Select value={filters.department} onValueChange={(v) => setFilters({...filters, department: v})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tous les départements" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les départements</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Zone :</Label>
                                <Select value={filters.zone} onValueChange={(v) => setFilters({...filters, zone: v})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Toutes les zones" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes les zones</SelectItem>
                                        {availableZones.map(zone => (
                                            <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>VIP :</Label>
                                    <Select value={filters.vip} onValueChange={(v) => setFilters({...filters, vip: v})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tous" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous</SelectItem>
                                            <SelectItem value="yes">Oui</SelectItem>
                                            <SelectItem value="no">Non</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Statut :</Label>
                                    <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tous les statuts" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous les statuts</SelectItem>
                                            <SelectItem value="ACTIVE">Actif</SelectItem>
                                            <SelectItem value="INACTIVE">Inactif</SelectItem>
                                            <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button 
                                className="bg-indigo-600 text-white hover:bg-indigo-700" 
                                onClick={() => setIsFilterOpen(false)}
                            >
                                Appliquer
                            </Button>
                            <Button 
                                variant="outline" 
                                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                onClick={resetFilters}
                            >
                                Remise à zéro <X className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            
            <div className="flex gap-2">
                <Button className="bg-indigo-500 text-white hover:bg-indigo-600">
                    Importer <Download className="w-4 h-4 ml-2" />
                </Button>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                            Client <Plus className="w-4 h-4 ml-2" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Créer un nouveau client</DialogTitle>
                            <DialogDescription>
                                Ajoutez un nouveau client à la plateforme
                            </DialogDescription>
                        </DialogHeader>
                        {/* Reuse Existing Form */}
                        <CreateUserForm
                            disciplines={disciplines}
                            departments={departments}
                            onSubmit={handleCreateUser}
                            onCancel={() => setIsCreateDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Afficher</span>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">éléments</span>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rechercher:</span>
                <Input 
                className="max-w-xs h-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            </div>

            {/* Clients Table */}
            <div className="rounded-lg border overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
                <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>NOM</TableHead>
                    <TableHead>TÉLÉPHONE</TableHead>
                    <TableHead>TYPE</TableHead>
                    <TableHead>DÉPARTEMENT</TableHead>
                    <TableHead>STATUT</TableHead>
                    <TableHead>CRÉÉ LE</TableHead>
                    <TableHead>CRÉÉ PAR</TableHead>
                    <TableHead>DETTE</TableHead>
                    <TableHead>ACTIONS</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedUsers.length === 0 ? (
                    <TableRow>
                         <TableCell colSpan={10} className="text-center py-8 text-gray-500">Aucun client trouvé</TableCell>
                    </TableRow>
                ) : (
                    paginatedUsers.map((client) => {
                    // Simuler/Extraire les infos du client
                    const clientInfo = client.clients && client.clients[0]
                    const clientType = clientInfo?.type || client.clientType
                    const clientDette = clientInfo?.dette || 0
                    
                    return (
                        <React.Fragment key={client.id}>
                        <TableRow className="hover:bg-gray-50 border-b border-gray-100 text-sm">
                            <TableCell className="p-2">
                            <button
                                className={`flex items-center justify-center h-5 w-5 rounded-full ${expandedUsers.has(client.id) ? 'bg-green-500 text-white' : 'bg-green-500 text-white'}`}
                                onClick={() => toggleUserExpansion(client.id)}
                            >
                                {expandedUsers.has(client.id) ? <span className="font-bold text-xs">-</span> : <Plus className="h-3 w-3" />}
                            </button>
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {client.image ? <img src={client.image} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-gray-500" />}
                                </div>
                                {client.name}
                            </div>
                            </TableCell>
                            <TableCell className="text-gray-500">{formatPhone(client.phone)}</TableCell>
                            <TableCell>{getClientTypeBadge(clientType)}</TableCell>
                            <TableCell className="uppercase text-gray-500">{client.department?.name || "-"}</TableCell>
                            <TableCell>
                            <Badge className={client.status === 'ACTIVE' ? "bg-green-500 hover:bg-green-600 text-white border-none rounded" : "bg-red-500 text-white border-none rounded"}>
                                {client.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-gray-500 text-xs">{formatDate(client.createdAt)}</TableCell>
                            <TableCell className="text-gray-500 text-xs"></TableCell>
                            <TableCell className="text-gray-500">{clientDette}</TableCell>
                            <TableCell>
                            <div className="flex items-center gap-2">
                                <button className="text-yellow-400 hover:text-yellow-500"><Edit className="h-4 w-4" /></button>
                                <button className="text-blue-400 hover:text-blue-500"><RefreshCw className="h-4 w-4" /></button>
                                <button className="text-green-500 hover:text-green-600"><Eye className="h-4 w-4" /></button>
                                <button className="text-red-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                            </div>
                            </TableCell>
                        </TableRow>
                        
                        {expandedUsers.has(client.id) && (
                            <TableRow className="bg-gray-50/30">
                            <TableCell colSpan={10} className="p-0 border-b">
                                <div className="p-4 pl-12 grid gap-y-2 text-sm max-w-lg">
                                    <div className="grid grid-cols-3 gap-4">
                                        <span className="text-gray-500">Modifié le</span>
                                        <span className="col-span-2 text-gray-900">{client.updatedAt ? formatDate(client.updatedAt) : "Invalid date"}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <span className="text-gray-500">Email</span>
                                        <span className="col-span-2 text-gray-900">{client.email}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <span className="text-gray-500">Zone</span>
                                        <span className="col-span-2 text-gray-900"></span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <span className="text-gray-500">Qte en dépôt</span>
                                        <span className="col-span-2 text-gray-900">0</span>
                                    </div>
                                </div>
                            </TableCell>
                            </TableRow>
                        )}
                        </React.Fragment>
                    )
                    }))}
                </TableBody>
            </Table>
            
            <div className="p-4 border-t text-xs text-gray-500 flex justify-between items-center">
                <span>Affichage de {paginatedUsers.length > 0 ? startIndex + 1 : 0} à {Math.min(startIndex + itemsPerPage, filteredUsers.length)} sur {filteredUsers.length} éléments</span>
                
                <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Premier</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Précédent</Button>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs bg-gray-100">{currentPage}</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Suivant</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => totalPages)}>Dernier</Button>
                </div>
            </div>
            </div>
        </div>
      </div>
    </div>
  )
}
