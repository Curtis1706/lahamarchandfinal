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
  Play,
  ChevronsUpDown,
  Loader2,
  CheckCircle,
} from "lucide-react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  date: string
  read: boolean
  priority: "high" | "medium" | "low"
  icon?: string
  data?: any
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    titre: "",
    note: "",
  })
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getRepresentantNotifications()
      setNotifications(response.notifications || [])
    } catch (error: any) {
      console.error("Error loading notifications:", error)
      toast.error("Erreur lors du chargement des notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadNotifications()
    toast.success("Notifications actualisées")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleAddNotification = () => {
    console.log("[v0] Adding notification:", formData)
    setShowAddModal(false)
    setFormData({ code: "", titre: "", note: "" })
    toast.info("Fonctionnalité à implémenter")
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.markRepresentantNotificationAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      toast.success("Notification marquée comme lue")
    } catch (error: any) {
      console.error("Error marking notification as read:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return notif.title.toLowerCase().includes(search) || 
             notif.message.toLowerCase().includes(search)
    }
    return true
  })

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: fr })
    } catch {
      return dateString
    }
  }

  return (
    <DynamicDashboardLayout title="Notifications" breadcrumb="Représentant - Notifications">
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Gestions des notifications</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Notifications
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-slate-600 rounded-lg"
                title="Actualiser"
                disabled={isLoading}
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleFullscreen}
                className="p-2 hover:bg-slate-600 rounded-lg"
                title="Plein écran"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header Section */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Liste des notifications</h3>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Ajouter
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <div className="ml-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Rechercher:</span>
                  <Input 
                    className="w-64" 
                    placeholder="Rechercher..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "ID",
                      "Titre",
                      "Message",
                      "Type",
                      "Priorité",
                      "Date",
                      "Statut",
                      "Actions",
                    ].map((col, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="flex items-center gap-1">
                          <span>{col}</span>
                          {col !== "Actions" && (
                            <ChevronsUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotifications.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aucune notification trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <tr key={notification.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {notification.id.substring(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {notification.icon && <span className="mr-2">{notification.icon}</span>}
                          {notification.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {notification.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{notification.type}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              notification.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : notification.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {notification.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(notification.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              notification.read
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {notification.read ? "Lue" : "Non lue"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Marquer comme lue"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <Play className="w-4 h-4 text-green-600" />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de 1 à {filteredNotifications.length} sur {notifications.length} éléments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="Code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titre">Titre</Label>
                <Input
                  id="titre"
                  value={formData.titre}
                  onChange={(e) =>
                    setFormData({ ...formData, titre: e.target.value })
                  }
                  placeholder="title"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder="note"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Fermer
            </Button>
            <Button
              onClick={handleAddNotification}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DynamicDashboardLayout>
  )
}
