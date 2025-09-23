import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

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

  // Charger les notifications depuis localStorage
  const loadNotifications = useCallback(() => {
    const storedNotifications = localStorage.getItem("client-notifications")
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications)
        setNotifications(parsedNotifications)
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error)
        setNotifications([])
      }
    }
  }, [])

  // Sauvegarder les notifications dans localStorage
  useEffect(() => {
    localStorage.setItem("client-notifications", JSON.stringify(notifications))
  }, [notifications])

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
