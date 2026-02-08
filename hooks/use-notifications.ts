import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useCurrentUser } from "./use-current-user"
import { apiClient } from "@/lib/api-client"

// Types pour les notifications
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'delivery'
  title: string
  message: string
  read: boolean
  createdAt: string
  data?: any // Données additionnelles (ex: ID de commande)
}

interface UseNotificationsResult {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  removeNotification: (notificationId: string) => void
  clearAll: () => void
}

export const useNotifications = (): UseNotificationsResult => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user } = useCurrentUser()

  // Charger les notifications depuis l'API
  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      return
    }

    try {
      // Charger les notifications depuis l'API
      const response = await apiClient.getNotifications(user.id)
            
      // L'API retourne { notifications: [...], unreadCount: number }
      const apiNotifications = response.notifications || response || [];
      
      // Convertir au format attendu par le frontend
      const formattedNotifications: Notification[] = Array.isArray(apiNotifications) ? apiNotifications.map(notif => ({
        id: notif.id,
        type: mapNotificationType(notif.type),
        title: notif.title,
        message: notif.message,
        read: notif.read,
        createdAt: notif.createdAt,
        data: notif.data ? JSON.parse(notif.data) : undefined
      })) : [];
      
      setNotifications(formattedNotifications)
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
      setNotifications([])
    }
  }, [user])

  // Mapper les types de notification de l'API vers le frontend
  const mapNotificationType = (apiType: string): Notification['type'] => {
    switch (apiType) {
      case 'ORDER_UPDATE':
      case 'ORDER_DELIVERED':
        return 'order'
      case 'NEW_BOOK':
        return 'info'
      case 'SUCCESS':
        return 'success'
      case 'WARNING':
        return 'warning'
      case 'ERROR':
        return 'error'
      default:
        return 'info'
    }
  }

  // Plus besoin de sauvegarder dans localStorage car on utilise l'API

  // Charger au montage
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Compter les notifications non lues
  const unreadCount = notifications.filter(n => !n.read).length

  // Marquer une notification comme lue
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  // Ajouter une nouvelle notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Afficher une toast selon le type
    switch (notification.type) {
      case 'success':
        toast.success(notification.title, { description: notification.message })
        break
      case 'warning':
        toast.warning(notification.title, { description: notification.message })
        break
      case 'error':
        toast.error(notification.title, { description: notification.message })
        break
      case 'order':
        toast.info(notification.title, { description: notification.message })
        break
      case 'delivery':
        toast.success(notification.title, { description: notification.message })
        break
      default:
        toast.info(notification.title, { description: notification.message })
    }
  }, [])

  // Supprimer une notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  // Vider toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearAll
  }
}
