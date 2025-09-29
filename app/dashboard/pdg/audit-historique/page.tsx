"use client";
import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  History, 
  Search, 
  Filter,
  Eye,
  Calendar,
  User,
  Activity,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

// Types pour l'audit
interface AuditLog {
  id: string
  action: string
  description: string
  user: {
    id: string
    name: string
    role: string
  }
  target?: {
    type: string
    id: string
    name: string
  }
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  category: 'user' | 'order' | 'work' | 'discipline' | 'system' | 'financial'
}

export default function AuditHistoriquePage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")

  // Charger les données d'audit
  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        setIsLoading(true)
        
        // Simuler des logs d'audit
        const mockAuditLogs: AuditLog[] = [
          {
            id: 'audit-1',
            action: 'USER_CREATED',
            description: 'Nouvel utilisateur créé',
            user: { id: 'user-1', name: 'PDG Admin', role: 'PDG' },
            target: { type: 'user', id: 'user-2', name: 'Marie Koffi' },
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            level: 'success',
            category: 'user'
          },
          {
            id: 'audit-2',
            action: 'ORDER_CONFIRMED',
            description: 'Commande confirmée et expédiée',
            user: { id: 'user-1', name: 'PDG Admin', role: 'PDG' },
            target: { type: 'order', id: 'order-1', name: 'CMD-2024-001' },
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            level: 'success',
            category: 'order'
          },
          {
            id: 'audit-3',
            action: 'WORK_APPROVED',
            description: 'Œuvre approuvée pour publication',
            user: { id: 'user-1', name: 'PDG Admin', role: 'PDG' },
            target: { type: 'work', id: 'work-1', name: 'Mathématiques CE1' },
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            level: 'success',
            category: 'work'
          },
          {
            id: 'audit-4',
            action: 'DISCIPLINE_CREATED',
            description: 'Nouvelle discipline ajoutée',
            user: { id: 'user-1', name: 'PDG Admin', role: 'PDG' },
            target: { type: 'discipline', id: 'disc-1', name: 'Sciences Physiques' },
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            level: 'info',
            category: 'discipline'
          },
          {
            id: 'audit-5',
            action: 'USER_SUSPENDED',
            description: 'Utilisateur suspendu temporairement',
            user: { id: 'user-1', name: 'PDG Admin', role: 'PDG' },
            target: { type: 'user', id: 'user-3', name: 'Jean Adou' },
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            level: 'warning',
            category: 'user'
          },
          {
            id: 'audit-6',
            action: 'PAYMENT_RECEIVED',
            description: 'Paiement reçu pour commande',
            user: { id: 'user-1', name: 'PDG Admin', role: 'PDG' },
            target: { type: 'order', id: 'order-2', name: 'CMD-2024-002' },
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            level: 'success',
            category: 'financial'
          },
          {
            id: 'audit-7',
            action: 'SYSTEM_BACKUP',
            description: 'Sauvegarde automatique du système',
            user: { id: 'system', name: 'Système', role: 'SYSTEM' },
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            level: 'info',
            category: 'system'
          },
          {
            id: 'audit-8',
            action: 'WORK_REJECTED',
            description: 'Œuvre rejetée pour non-conformité',
            user: { id: 'user-1', name: 'PDG Admin', role: 'PDG' },
            target: { type: 'work', id: 'work-2', name: 'Histoire CM1' },
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            level: 'warning',
            category: 'work'
          }
        ]
        
        setAuditLogs(mockAuditLogs)
      } catch (error) {
        console.error("Error fetching audit data:", error)
        toast.error("Erreur lors du chargement des données d'audit")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuditData()
  }, [])

  // Filtrage
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.target?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter
    const matchesLevel = levelFilter === "all" || log.level === levelFilter
    const matchesUser = userFilter === "all" || log.user.id === userFilter
    
    return matchesSearch && matchesCategory && matchesLevel && matchesUser
  })

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Succès</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Avertissement</Badge>
      case 'error':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Erreur</Badge>
      case 'info':
      default:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Information</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'order':
        return <Activity className="h-4 w-4" />
      case 'work':
        return <Shield className="h-4 w-4" />
      case 'discipline':
        return <Shield className="h-4 w-4" />
      case 'system':
        return <Shield className="h-4 w-4" />
      case 'financial':
        return <Shield className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <History className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de l'historique...</p>
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
            <h1 className="text-3xl font-bold">Audit & Historique</h1>
            <p className="text-muted-foreground">
              Suivez toutes les actions importantes sur la plateforme
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              <History className="h-3 w-3 mr-1" />
              {filteredLogs.length} événement{filteredLogs.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Événements</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditLogs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Succès</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {auditLogs.filter(l => l.level === 'success').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avertissements</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {auditLogs.filter(l => l.level === 'warning').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {auditLogs.filter(l => l.level === 'error').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans l'historique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="user">Utilisateurs</SelectItem>
              <SelectItem value="order">Commandes</SelectItem>
              <SelectItem value="work">Œuvres</SelectItem>
              <SelectItem value="discipline">Disciplines</SelectItem>
              <SelectItem value="system">Système</SelectItem>
              <SelectItem value="financial">Financier</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="warning">Avertissement</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
              <SelectItem value="info">Information</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des logs d'audit */}
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun événement trouvé</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || categoryFilter !== "all" || levelFilter !== "all"
                  ? "Essayez de modifier vos critères de recherche"
                  : "Aucun événement dans l'historique"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getLevelIcon(log.level)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{log.description}</h3>
                        {getLevelBadge(log.level)}
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>Par: {log.user.name} ({log.user.role})</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {getCategoryIcon(log.category)}
                            <span>Catégorie: {log.category}</span>
                          </div>
                        </div>
                        
                        {log.target && (
                          <div className="flex items-center space-x-1">
                            <Shield className="h-4 w-4" />
                            <span>Cible: {log.target.name} ({log.target.type})</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(new Date(log.timestamp), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
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
