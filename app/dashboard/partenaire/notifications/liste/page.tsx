"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  RefreshCw,
  Maximize2,
  Eye,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"

interface Notification {
  id: string
  type: "commande" | "livraison" | "stock" | "nouveaute" | "systeme"
  titre: string
  message: string
  statut: "non_lue" | "lue"
  dateCreation: string
  priorite: "haute" | "moyenne" | "basse"
  actionRequise: boolean
  lien?: string
}

// Mock data pour les notifications automatiques du partenaire
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "commande",
    titre: "Commande validée par le PDG",
    message: "Votre commande 2025COM28 a été validée par le PDG et sera traitée sous 24h.",
    statut: "non_lue",
    dateCreation: "2025-01-16T10:30:00",
    priorite: "haute",
    actionRequise: false,
    lien: "/dashboard/partenaire/commandes"
  },
  {
    id: "2",
    type: "livraison",
    titre: "Livraison en cours",
    message: "Votre commande 2025COM27 est en cours de livraison. Livreur: Jean KOUAME (+22912345678)",
    statut: "non_lue",
    dateCreation: "2025-01-15T14:20:00",
    priorite: "haute",
    actionRequise: false,
    lien: "/dashboard/partenaire/commandes"
  },
  {
    id: "3",
    type: "stock",
    titre: "Stock faible détecté",
    message: "Le stock de 'Réussir en Dictée CE1-CE2' est faible (5 exemplaires restants).",
    statut: "lue",
    dateCreation: "2025-01-14T09:15:00",
    priorite: "moyenne",
    actionRequise: true,
    lien: "/dashboard/partenaire/stock/niveau"
  },
  {
    id: "4",
    type: "nouveaute",
    titre: "Nouveaux titres disponibles",
    message: "3 nouveaux titres sont disponibles dans votre discipline: 'Mathématiques CE2', 'Français CM1', 'Sciences CE1'.",
    statut: "lue",
    dateCreation: "2025-01-13T16:45:00",
    priorite: "basse",
    actionRequise: false,
    lien: "/dashboard/partenaire/livres/liste"
  },
  {
    id: "5",
    type: "systeme",
    titre: "Mise à jour du système",
    message: "Une nouvelle fonctionnalité de suivi des ventes a été ajoutée à votre tableau de bord.",
    statut: "lue",
    dateCreation: "2025-01-12T11:00:00",
    priorite: "basse",
    actionRequise: false
  }
]

export default function NotificationsPage() {
  const { user } = useCurrentUser()
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>(mockNotifications)
  const [selectedType, setSelectedType] = useState("tous")
  const [selectedStatus, setSelectedStatus] = useState("tous")
  const [selectedPriority, setSelectedPriority] = useState("tous")
  const [searchTerm, setSearchTerm] = useState("")
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  // Calculer les statistiques
  const totalNotifications = notifications.length
  const nonLues = notifications.filter(n => n.statut === "non_lue").length
  const actionRequise = notifications.filter(n => n.actionRequise).length
  const hautePriorite = notifications.filter(n => n.priorite === "haute").length

  // Filtrer les notifications
  useEffect(() => {
    let filtered = notifications

    if (searchTerm) {
      filtered = filtered.filter(notif => 
        notif.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedType !== "tous") {
      filtered = filtered.filter(notif => notif.type === selectedType)
    }

    if (selectedStatus !== "tous") {
      filtered = filtered.filter(notif => notif.statut === selectedStatus)
    }

    if (selectedPriority !== "tous") {
      filtered = filtered.filter(notif => notif.priorite === selectedPriority)
    }

    setFilteredNotifications(filtered)
  }, [searchTerm, selectedType, selectedStatus, selectedPriority, notifications])

  // Marquer comme lue
  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === notificationId 
        ? { ...notif, statut: "lue" as const }
        : notif
    ))
  }

  // Voir les détails
  const viewDetails = (notification: Notification) => {
    setSelectedNotification(notification)
    setShowDetailModal(true)
    if (notification.statut === "non_lue") {
      markAsRead(notification.id)
    }
  }

  // Obtenir l'icône selon le type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "commande": return <ShoppingCart className="w-4 h-4" />
      case "livraison": return <Package className="w-4 h-4" />
      case "stock": return <AlertCircle className="w-4 h-4" />
      case "nouveaute": return <TrendingUp className="w-4 h-4" />
      case "systeme": return <Bell className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  // Obtenir la couleur selon le type
  const getTypeColor = (type: string) => {
    switch (type) {
      case "commande": return "bg-blue-100 text-blue-800"
      case "livraison": return "bg-green-100 text-green-800"
      case "stock": return "bg-yellow-100 text-yellow-800"
      case "nouveaute": return "bg-purple-100 text-purple-800"
      case "systeme": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // Obtenir la couleur selon la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "haute": return "bg-red-100 text-red-800"
      case "moyenne": return "bg-yellow-100 text-yellow-800"
      case "basse": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div>
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Notifications automatiques - {user?.name}</h2>
            <p className="text-sm text-slate-300 mt-1">Alertes système pour commandes, livraisons et stock</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Notifications en temps réel
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="p-2 hover:bg-slate-600 rounded-lg"
                title="Actualiser"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total notifications</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{totalNotifications}</div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Non lues</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{nonLues}</div>
            <div className="w-12 h-12 bg-red-100 rounded-lg mx-auto flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Action requise</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{actionRequise}</div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Haute priorité</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{hautePriorite}</div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {/* Header Section */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Centre de notifications</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Notifications automatiques</span>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Type:</span>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les types</SelectItem>
                    <SelectItem value="commande">Commandes</SelectItem>
                    <SelectItem value="livraison">Livraisons</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="nouveaute">Nouveautés</SelectItem>
                    <SelectItem value="systeme">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">Statut:</span>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les statuts</SelectItem>
                    <SelectItem value="non_lue">Non lues</SelectItem>
                    <SelectItem value="lue">Lues</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">Priorité:</span>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Toutes priorités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes priorités</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="basse">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">Rechercher:</span>
                <Input 
                  className="w-full" 
                  placeholder="Titre ou message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-600">Résultats: {filteredNotifications.length}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Aucune notification trouvée
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((notification) => (
                    <tr key={notification.id} className={`hover:bg-gray-50 ${notification.statut === "non_lue" ? "bg-blue-50" : ""}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {notification.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {notification.titre}
                          </div>
                          {notification.statut === "non_lue" && (
                            <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate">
                          {notification.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getPriorityColor(notification.priorite)}>
                          {notification.priorite}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={notification.statut === "non_lue" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                          {notification.statut === "non_lue" ? "Non lue" : "Lue"}
                        </Badge>
                        {notification.actionRequise && (
                          <div className="mt-1">
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              Action requise
                            </Badge>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(notification.dateCreation).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => viewDetails(notification)}
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {notification.lien && (
                            <button 
                              className="text-green-600 hover:text-green-800"
                              onClick={() => window.location.href = notification.lien!}
                              title="Aller à la page"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de 1 à {filteredNotifications.length} sur {filteredNotifications.length} éléments
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Premier
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Précédent
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-600 text-white">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Suivant
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Dernier
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && getTypeIcon(selectedNotification.type)}
              Détails de la notification
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Titre</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedNotification.titre}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Message</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedNotification.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Type</Label>
                  <Badge className={`mt-1 ${getTypeColor(selectedNotification.type)}`}>
                    {selectedNotification.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Priorité</Label>
                  <Badge className={`mt-1 ${getPriorityColor(selectedNotification.priorite)}`}>
                    {selectedNotification.priorite}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Date de création</Label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(selectedNotification.dateCreation).toLocaleString('fr-FR')}
                </p>
              </div>
              {selectedNotification.actionRequise && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-800 font-medium">Action requise</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDetailModal(false)}
              className="text-gray-600 border-gray-600 hover:bg-gray-50"
            >
              Fermer
            </Button>
            {selectedNotification?.lien && (
              <Button
                onClick={() => {
                  window.location.href = selectedNotification.lien!
                  setShowDetailModal(false)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Aller à la page
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
