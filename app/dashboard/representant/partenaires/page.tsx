"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import {
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Building2,
  Phone,
  Mail,
  Calendar,
  Package,
  User,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"

interface Partner {
  id: string
  name: string
  type: string
  contact: string
  email: string
  phone: string
  address: string
  website: string
  description: string
  status: string
  totalOrders: number
  user: {
    id: string
    name: string
    email: string
    phone: string
    status: string
    createdAt: string
  }
  createdAt: string
  updatedAt: string
}

export default function RepresentantPartenairesPage() {
  const { toast } = useToast()
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false)
  const [newPartnerData, setNewPartnerData] = useState({
    name: "",
    type: "Librairie",
    contact: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    userData: {
      name: "",
      email: "",
      phone: ""
    }
  })

  // Charger les partenaires
  useEffect(() => {
    loadPartners()
  }, [statusFilter, typeFilter])

  const loadPartners = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getRepresentantPartners({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchTerm || undefined
      })
      setPartners(data)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des partenaires",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPartner = async () => {
    try {
      if (!newPartnerData.name || !newPartnerData.contact || !newPartnerData.userData.name || !newPartnerData.userData.email) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive"
        })
        return
      }

      const newPartner = await apiClient.createRepresentantPartner(newPartnerData)
      toast({
        title: "Succès",
        description: "Partenaire créé avec succès. En attente de validation par le PDG."
      })
      
      setShowAddPartnerModal(false)
      setNewPartnerData({
        name: "",
        type: "Librairie",
        contact: "",
        email: "",
        phone: "",
        address: "",
        website: "",
        description: "",
        userData: {
          name: "",
          email: "",
          phone: ""
        }
      })
      loadPartners()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du partenaire",
        variant: "destructive"
      })
    }
  }

  const handleSearch = () => {
    loadPartners()
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

  const getTypeBadge = (type: string) => {
    const colors = {
      'Librairie': 'bg-blue-100 text-blue-800',
      'École': 'bg-green-100 text-green-800',
      'Institution': 'bg-purple-100 text-purple-800',
      'Association': 'bg-orange-100 text-orange-800',
      'Maison d\'édition': 'bg-pink-100 text-pink-800'
    }
    return <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{type}</Badge>
  }

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Partenaires</h1>
          <p className="text-gray-600">Gérez vos partenaires et suivez leurs activités</p>
        </div>
        <Dialog open={showAddPartnerModal} onOpenChange={setShowAddPartnerModal}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Partenaire
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau partenaire</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Informations du partenaire */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-3">Informations du partenaire</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom de l'organisation *</Label>
                    <Input
                      id="name"
                      value={newPartnerData.name}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, name: e.target.value })}
                      placeholder="Nom de l'organisation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={newPartnerData.type}
                      onValueChange={(value) => setNewPartnerData({ ...newPartnerData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Librairie">Librairie</SelectItem>
                        <SelectItem value="École">École</SelectItem>
                        <SelectItem value="Institution">Institution</SelectItem>
                        <SelectItem value="Association">Association</SelectItem>
                        <SelectItem value="Maison d'édition">Maison d'édition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contact">Personne de contact *</Label>
                    <Input
                      id="contact"
                      value={newPartnerData.contact}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, contact: e.target.value })}
                      placeholder="Nom du contact"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newPartnerData.email}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, email: e.target.value })}
                      placeholder="contact@organisation.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={newPartnerData.phone}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, phone: e.target.value })}
                      placeholder="+229 XX XX XX XX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Site web</Label>
                    <Input
                      id="website"
                      value={newPartnerData.website}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, website: e.target.value })}
                      placeholder="https://www.organisation.com"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={newPartnerData.address}
                    onChange={(e) => setNewPartnerData({ ...newPartnerData, address: e.target.value })}
                    placeholder="Adresse complète"
                  />
                </div>
                <div className="mt-4">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newPartnerData.description}
                    onChange={(e) => setNewPartnerData({ ...newPartnerData, description: e.target.value })}
                    placeholder="Description de l'organisation"
                  />
                </div>
              </div>

              {/* Informations du compte utilisateur */}
              <div>
                <h3 className="text-lg font-medium mb-3">Compte utilisateur</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userName">Nom de l'utilisateur *</Label>
                    <Input
                      id="userName"
                      value={newPartnerData.userData.name}
                      onChange={(e) => setNewPartnerData({ 
                        ...newPartnerData, 
                        userData: { ...newPartnerData.userData, name: e.target.value }
                      })}
                      placeholder="Nom de l'utilisateur"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userEmail">Email de l'utilisateur *</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newPartnerData.userData.email}
                      onChange={(e) => setNewPartnerData({ 
                        ...newPartnerData, 
                        userData: { ...newPartnerData.userData, email: e.target.value }
                      })}
                      placeholder="utilisateur@organisation.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userPhone">Téléphone de l'utilisateur</Label>
                    <Input
                      id="userPhone"
                      value={newPartnerData.userData.phone}
                      onChange={(e) => setNewPartnerData({ 
                        ...newPartnerData, 
                        userData: { ...newPartnerData.userData, phone: e.target.value }
                      })}
                      placeholder="+229 XX XX XX XX"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddPartnerModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddPartner}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un partenaire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="INACTIVE">Inactif</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="Librairie">Librairie</SelectItem>
                <SelectItem value="École">École</SelectItem>
                <SelectItem value="Institution">Institution</SelectItem>
                <SelectItem value="Association">Association</SelectItem>
                <SelectItem value="Maison d'édition">Maison d'édition</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des partenaires */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des partenaires ({filteredPartners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{partner.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {partner.email || partner.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(partner.type)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{partner.contact}</div>
                        {partner.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {partner.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(partner.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(partner.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Package className="h-3 w-3 mr-1" />
                        {partner.totalOrders}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
