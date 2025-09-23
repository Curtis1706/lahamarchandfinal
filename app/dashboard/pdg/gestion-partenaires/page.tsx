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
  Building2, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  School
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

// Types pour les partenaires et écoles
interface Partner {
  id: string
  name: string
  type: 'school' | 'institution' | 'organization'
  contactPerson: string
  email: string
  phone: string
  address: string
  city: string
  status: 'active' | 'inactive' | 'pending'
  partnershipType: 'exclusive' | 'preferred' | 'standard'
  contractStartDate: string
  contractEndDate?: string
  totalOrders: number
  totalValue: number
  createdAt: string
}

export default function GestionPartenairesPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Simuler des partenaires
        const mockPartners: Partner[] = [
          {
            id: 'partner-1',
            name: 'École Primaire de Cotonou',
            type: 'school',
            contactPerson: 'Mme Adjoa Koffi',
            email: 'contact@ecole-cotonou.bj',
            phone: '+229 21 12 34 56',
            address: 'Quartier Cadjehoun',
            city: 'Cotonou',
            status: 'active',
            partnershipType: 'preferred',
            contractStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            totalOrders: 15,
            totalValue: 1250000,
            createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'partner-2',
            name: 'Collège Saint-Joseph',
            type: 'school',
            contactPerson: 'Père Jean-Baptiste',
            email: 'admin@stjoseph.bj',
            phone: '+229 21 23 45 67',
            address: 'Avenue Clozel',
            city: 'Cotonou',
            status: 'active',
            partnershipType: 'exclusive',
            contractStartDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
            contractEndDate: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000).toISOString(),
            totalOrders: 8,
            totalValue: 680000,
            createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'partner-3',
            name: 'Ministère de l\'Éducation',
            type: 'institution',
            contactPerson: 'Dr. Marie Traoré',
            email: 'marie.traore@education.gouv.bj',
            phone: '+229 21 34 56 78',
            address: 'Ministère de l\'Éducation',
            city: 'Porto-Novo',
            status: 'pending',
            partnershipType: 'standard',
            contractStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            totalOrders: 0,
            totalValue: 0,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'partner-4',
            name: 'Association des Parents d\'Élèves',
            type: 'organization',
            contactPerson: 'M. Koffi Mensah',
            email: 'koffi.mensah@ape.bj',
            phone: '+229 21 45 67 89',
            address: 'Centre Culturel',
            city: 'Abomey-Calavi',
            status: 'active',
            partnershipType: 'standard',
            contractStartDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
            totalOrders: 3,
            totalValue: 180000,
            createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
        
        setPartners(mockPartners)
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
  const handleCreatePartner = async (partnerData: any) => {
    try {
      const newPartner: Partner = {
        ...partnerData,
        id: `partner-${Date.now()}`,
        totalOrders: 0,
        totalValue: 0,
        createdAt: new Date().toISOString()
      }
      
      setPartners(prev => [newPartner, ...prev])
      setIsCreateDialogOpen(false)
      toast.success("Partenaire créé avec succès")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création")
    }
  }

  const handleUpdatePartner = async (partnerId: string, updates: any) => {
    try {
      setPartners(prev => 
        prev.map(p => 
          p.id === partnerId 
            ? { ...p, ...updates }
            : p
        )
      )
      
      toast.success("Partenaire modifié avec succès")
    } catch (error) {
      toast.error("Erreur lors de la modification")
    }
  }

  const handleDeletePartner = async (partnerId: string) => {
    try {
      setPartners(prev => prev.filter(p => p.id !== partnerId))
      toast.success("Partenaire supprimé avec succès")
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleToggleStatus = async (partnerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    handleUpdatePartner(partnerId, { status: newStatus })
  }

  // Filtrage
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || partner.type === typeFilter
    const matchesStatus = statusFilter === "all" || partner.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Actif</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />Inactif</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'school':
        return <School className="h-5 w-5 text-blue-600" />
      case 'institution':
        return <Building2 className="h-5 w-5 text-green-600" />
      case 'organization':
        return <Users className="h-5 w-5 text-purple-600" />
      default:
        return <Building2 className="h-5 w-5 text-gray-600" />
    }
  }

  const getPartnershipTypeBadge = (type: string) => {
    switch (type) {
      case 'exclusive':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Exclusif</Badge>
      case 'preferred':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Privilégié</Badge>
      case 'standard':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Standard</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  if (userLoading || isLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Building2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des partenaires...</p>
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
    <DynamicDashboardLayout title="Gestion des Partenaires">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Partenaires</h1>
            <p className="text-muted-foreground">
              Gérez les écoles, institutions et organisations partenaires
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau partenaire
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau partenaire</DialogTitle>
                  <DialogDescription>
                    Créez un nouveau partenariat avec une école ou institution
                  </DialogDescription>
                </DialogHeader>
                <CreatePartnerForm 
                  onSubmit={handleCreatePartner}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Badge variant="outline" className="text-sm">
              <Building2 className="h-3 w-3 mr-1" />
              {filteredPartners.length} partenaire{filteredPartners.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partners.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Écoles</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {partners.filter(p => p.type === 'school').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {partners.filter(p => p.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {partners.filter(p => p.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="school">Écoles</SelectItem>
              <SelectItem value="institution">Institutions</SelectItem>
              <SelectItem value="organization">Organisations</SelectItem>
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
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des partenaires */}
        {filteredPartners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun partenaire trouvé</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                  ? "Essayez de modifier vos critères de recherche"
                  : "Aucun partenaire dans le système"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPartners.map((partner) => (
              <Card key={partner.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(partner.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{partner.name}</h3>
                          {getStatusBadge(partner.status)}
                          {getPartnershipTypeBadge(partner.partnershipType)}
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>Contact: {partner.contactPerson}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{partner.email}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Phone className="h-4 w-4" />
                              <span>{partner.phone}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{partner.city}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <GraduationCap className="h-4 w-4" />
                              <span>{partner.totalOrders} commandes</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Building2 className="h-4 w-4" />
                              <span>{partner.totalValue.toLocaleString()} F CFA</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Partenariat depuis {formatDistanceToNow(new Date(partner.createdAt), { 
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
                        onClick={() => handleToggleStatus(partner.id, partner.status)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {partner.status === 'active' ? 'Désactiver' : 'Activer'}
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
                            <AlertDialogTitle>Supprimer le partenaire</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer {partner.name} ? 
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeletePartner(partner.id)}
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

// Composant pour créer un partenaire
function CreatePartnerForm({ onSubmit, onCancel }: {
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'school' as const,
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    partnershipType: 'standard' as const,
    contractStartDate: new Date().toISOString().split('T')[0],
    contractEndDate: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nom de l'organisation</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: École Primaire de Cotonou"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Type</label>
        <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="school">École</SelectItem>
            <SelectItem value="institution">Institution</SelectItem>
            <SelectItem value="organization">Organisation</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium">Personne de contact</label>
        <Input
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          placeholder="Nom complet du contact"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="contact@example.com"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Téléphone</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+229 XX XX XX XX"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Adresse</label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Adresse complète"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Ville</label>
        <Input
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="Ville"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Type de partenariat</label>
        <Select value={formData.partnershipType} onValueChange={(value: any) => setFormData({ ...formData, partnershipType: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="preferred">Privilégié</SelectItem>
            <SelectItem value="exclusive">Exclusif</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium">Date de début du contrat</label>
        <Input
          type="date"
          value={formData.contractStartDate}
          onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Date de fin du contrat (optionnel)</label>
        <Input
          type="date"
          value={formData.contractEndDate}
          onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Créer le partenaire
        </Button>
      </div>
    </form>
  )
}
