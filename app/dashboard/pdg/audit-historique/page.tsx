"use client";
import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  details?: any
  metadata?: any
}

export default function AuditHistoriquePage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Charger les données d'audit
  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        setIsLoading(true)
        
        const response = await fetch('/api/pdg/audit-logs')
        if (!response.ok) throw new Error('Erreur lors du chargement')
        
        const data = await response.json()
        
        // Formater les données si nécessaire
        const formattedLogs = data.map((log: any) => {
          // Vérifier que la date est valide
          let timestamp = log.createdAt;
          if (timestamp) {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
              timestamp = new Date().toISOString(); // Utiliser la date actuelle si invalide
            }
          } else {
            timestamp = new Date().toISOString(); // Utiliser la date actuelle si manquante
          }
          
          return {
            id: log.id || `log-${Date.now()}-${Math.random()}`,
            action: log.action || 'Action inconnue',
            description: log.description || log.details || log.action || 'Aucune description',
            user: log.user || {
              id: log.userId || 'system',
              name: log.performedBy || 'Système',
              role: 'PDG'
            },
            target: log.target,
            timestamp: timestamp,
            level: log.level || 'info',
            category: log.category || 'system',
            details: log.details,
            metadata: log.metadata
          };
        })
        
        setAuditLogs(formattedLogs)
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
                        <div className="flex items-center space-x-4 flex-wrap">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>Par: {log.user.name} ({log.user.role})</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {getCategoryIcon(log.category)}
                            <span>Catégorie: {
                              log.category === 'user' ? 'Utilisateurs' :
                              log.category === 'order' ? 'Commandes' :
                              log.category === 'work' ? 'Œuvres' :
                              log.category === 'discipline' ? 'Disciplines' :
                              log.category === 'financial' ? 'Financier' : 'Système'
                            }</span>
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
                            {log.timestamp && !isNaN(new Date(log.timestamp).getTime()) 
                              ? formatDistanceToNow(new Date(log.timestamp), { 
                                  addSuffix: true, 
                                  locale: fr 
                                })
                              : 'Date invalide'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log)
                          setIsDetailsOpen(true)
                        }}
                      >
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

        {/* Modal des détails */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de l'événement</DialogTitle>
              <DialogDescription>
                Informations complètes sur cet événement d'audit
              </DialogDescription>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-4">
                {/* Action et description */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">Action:</h3>
                    <Badge>{selectedLog.action}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedLog.description}</p>
                </div>

                {/* Utilisateur */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Effectué par</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nom:</strong> {selectedLog.user.name}</p>
                    <p><strong>Rôle:</strong> {selectedLog.user.role}</p>
                    {selectedLog.user.id && <p><strong>ID:</strong> {selectedLog.user.id}</p>}
                  </div>
                </div>

                {/* Catégorie et niveau */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Classification</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(selectedLog.category)}
                      <span className="text-sm">
                        {selectedLog.category === 'user' ? 'Utilisateurs' :
                         selectedLog.category === 'order' ? 'Commandes' :
                         selectedLog.category === 'work' ? 'Œuvres' :
                         selectedLog.category === 'discipline' ? 'Disciplines' :
                         selectedLog.category === 'financial' ? 'Financier' : 'Système'}
                      </span>
                    </div>
                    {getLevelBadge(selectedLog.level)}
                  </div>
                </div>

                {/* Métadonnées */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Informations détaillées</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {Object.entries(selectedLog.metadata).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <strong className="text-gray-700">{key}:</strong>{' '}
                          <span className="text-gray-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cible */}
                {selectedLog.target && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Élément ciblé</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Type:</strong> {selectedLog.target.type}</p>
                      <p><strong>Nom:</strong> {selectedLog.target.name}</p>
                      {selectedLog.target.id && <p><strong>ID:</strong> {selectedLog.target.id}</p>}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Date et heure</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      {selectedLog.timestamp && !isNaN(new Date(selectedLog.timestamp).getTime()) 
                        ? new Date(selectedLog.timestamp).toLocaleString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        : 'Date invalide'
                      }
                    </p>
                    <p className="text-muted-foreground">
                      ({formatDistanceToNow(new Date(selectedLog.timestamp), { 
                        addSuffix: true, 
                        locale: fr 
                      })})
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}
