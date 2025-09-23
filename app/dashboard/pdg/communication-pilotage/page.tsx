"use client"

import { useState, useEffect } from "react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  MessageSquare, 
  Send, 
  Users, 
  Bell,
  Mail,
  Megaphone,
  Target,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle
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

// Types pour les communications
interface Communication {
  id: string
  title: string
  message: string
  type: 'announcement' | 'notification' | 'promotion' | 'policy'
  targetAudience: string[]
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled'
  createdAt: string
  scheduledFor?: string
  sentAt?: string
  recipients: number
  readCount: number
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function CommunicationPilotagePage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [communications, setCommunications] = useState<Communication[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newCommunication, setNewCommunication] = useState({
    title: '',
    message: '',
    type: 'announcement' as const,
    targetAudience: [] as string[],
    scheduledFor: ''
  })

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const usersData = await apiClient.getUsers()
        
        // Simuler des communications
        const mockCommunications: Communication[] = [
          {
            id: 'comm-1',
            title: 'Nouvelle politique de prix',
            message: 'Nous informons tous les partenaires de la mise à jour de notre politique de prix pour l\'année 2024.',
            type: 'policy',
            targetAudience: ['PARTENAIRE', 'REPRESENTANT'],
            status: 'sent',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            recipients: 45,
            readCount: 38
          },
          {
            id: 'comm-2',
            title: 'Promotion rentrée scolaire',
            message: 'Profitez de notre offre spéciale rentrée avec 15% de réduction sur tous les manuels scolaires.',
            type: 'promotion',
            targetAudience: ['CLIENT'],
            status: 'scheduled',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            recipients: 0,
            readCount: 0
          },
          {
            id: 'comm-3',
            title: 'Mise à jour système',
            message: 'Le système sera en maintenance le dimanche prochain de 2h à 6h.',
            type: 'announcement',
            targetAudience: ['CONCEPTEUR', 'AUTEUR', 'REPRESENTANT', 'PARTENAIRE', 'CLIENT'],
            status: 'sent',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            recipients: 156,
            readCount: 142
          }
        ]
        
        setCommunications(mockCommunications)
        setUsers(usersData)
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
  const handleCreateCommunication = async () => {
    try {
      const communication: Communication = {
        id: `comm-${Date.now()}`,
        title: newCommunication.title,
        message: newCommunication.message,
        type: newCommunication.type,
        targetAudience: newCommunication.targetAudience,
        status: newCommunication.scheduledFor ? 'scheduled' : 'draft',
        createdAt: new Date().toISOString(),
        scheduledFor: newCommunication.scheduledFor || undefined,
        recipients: 0,
        readCount: 0
      }
      
      setCommunications(prev => [communication, ...prev])
      setIsCreateDialogOpen(false)
      setNewCommunication({
        title: '',
        message: '',
        type: 'announcement',
        targetAudience: [],
        scheduledFor: ''
      })
      
      toast.success("Communication créée avec succès")
    } catch (error) {
      toast.error("Erreur lors de la création")
    }
  }

  const handleSendCommunication = async (communicationId: string) => {
    try {
      setCommunications(prev => 
        prev.map(comm => 
          comm.id === communicationId 
            ? { 
                ...comm, 
                status: 'sent' as const,
                sentAt: new Date().toISOString(),
                recipients: Math.floor(Math.random() * 200) + 50,
                readCount: 0
              }
            : comm
        )
      )
      
      toast.success("Communication envoyée avec succès")
    } catch (error) {
      toast.error("Erreur lors de l'envoi")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Brouillon</Badge>
      case 'scheduled':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Calendar className="h-3 w-3 mr-1" />Programmée</Badge>
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Envoyée</Badge>
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Annulée</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-blue-600" />
      case 'notification':
        return <Bell className="h-5 w-5 text-green-600" />
      case 'promotion':
        return <Target className="h-5 w-5 text-purple-600" />
      case 'policy':
        return <MessageSquare className="h-5 w-5 text-orange-600" />
      default:
        return <MessageSquare className="h-5 w-5 text-gray-600" />
    }
  }

  const getAudienceText = (audience: string[]) => {
    const roleNames: { [key: string]: string } = {
      'CONCEPTEUR': 'Concepteurs',
      'AUTEUR': 'Auteurs',
      'REPRESENTANT': 'Représentants',
      'PARTENAIRE': 'Partenaires',
      'CLIENT': 'Clients'
    }
    
    return audience.map(role => roleNames[role] || role).join(', ')
  }

  if (userLoading || isLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <MessageSquare className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des communications...</p>
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
    <DynamicDashboardLayout title="Communication & Pilotage">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Communication & Pilotage</h1>
            <p className="text-muted-foreground">
              Gérez les communications et annonces officielles
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" />
                  Nouvelle communication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle communication</DialogTitle>
                  <DialogDescription>
                    Envoyez des annonces, notifications ou promotions
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Titre</label>
                    <Input
                      value={newCommunication.title}
                      onChange={(e) => setNewCommunication({ ...newCommunication, title: e.target.value })}
                      placeholder="Titre de la communication"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={newCommunication.type} onValueChange={(value: any) => setNewCommunication({ ...newCommunication, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">Annonce</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="policy">Politique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Audience cible</label>
                    <Select onValueChange={(value) => {
                      if (!newCommunication.targetAudience.includes(value)) {
                        setNewCommunication({
                          ...newCommunication,
                          targetAudience: [...newCommunication.targetAudience, value]
                        })
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ajouter un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONCEPTEUR">Concepteurs</SelectItem>
                        <SelectItem value="AUTEUR">Auteurs</SelectItem>
                        <SelectItem value="REPRESENTANT">Représentants</SelectItem>
                        <SelectItem value="PARTENAIRE">Partenaires</SelectItem>
                        <SelectItem value="CLIENT">Clients</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newCommunication.targetAudience.map(role => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role}
                          <button
                            onClick={() => setNewCommunication({
                              ...newCommunication,
                              targetAudience: newCommunication.targetAudience.filter(r => r !== role)
                            })}
                            className="ml-1 text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={newCommunication.message}
                      onChange={(e) => setNewCommunication({ ...newCommunication, message: e.target.value })}
                      placeholder="Contenu de la communication"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Programmer l'envoi (optionnel)</label>
                    <Input
                      type="datetime-local"
                      value={newCommunication.scheduledFor}
                      onChange={(e) => setNewCommunication({ ...newCommunication, scheduledFor: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateCommunication}>
                      Créer la communication
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Badge variant="outline" className="text-sm">
              <MessageSquare className="h-3 w-3 mr-1" />
              {communications.length} communication{communications.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{communications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Envoyées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {communications.filter(c => c.status === 'sent').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programmées</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {communications.filter(c => c.status === 'scheduled').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {communications.filter(c => c.status === 'draft').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des communications */}
        {communications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune communication</h3>
              <p className="text-muted-foreground text-center">
                Créez votre première communication pour commencer
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {communications.map((communication) => (
              <Card key={communication.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(communication.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{communication.title}</h3>
                          {getStatusBadge(communication.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {communication.message}
                        </p>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>Audience: {getAudienceText(communication.targetAudience)}</span>
                            </div>
                            
                            {communication.status === 'sent' && (
                              <>
                                <div className="flex items-center space-x-1">
                                  <Mail className="h-4 w-4" />
                                  <span>{communication.recipients} destinataires</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{communication.readCount} lus</span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {communication.status === 'sent' && communication.sentAt
                                ? `Envoyé ${formatDistanceToNow(new Date(communication.sentAt), { addSuffix: true, locale: fr })}`
                                : communication.status === 'scheduled' && communication.scheduledFor
                                ? `Programmé pour ${formatDistanceToNow(new Date(communication.scheduledFor), { addSuffix: true, locale: fr })}`
                                : `Créé ${formatDistanceToNow(new Date(communication.createdAt), { addSuffix: true, locale: fr })}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                      
                      {communication.status === 'draft' && (
                        <Button
                          onClick={() => handleSendCommunication(communication.id)}
                          className="bg-green-600 hover:bg-green-700 w-full"
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer
                        </Button>
                      )}
                      
                      {communication.status === 'scheduled' && (
                        <Button
                          onClick={() => handleSendCommunication(communication.id)}
                          className="bg-blue-600 hover:bg-blue-700 w-full"
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer maintenant
                        </Button>
                      )}
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
