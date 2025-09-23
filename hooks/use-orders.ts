import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useNotifications } from "./use-notifications"

// Types pour les commandes
interface OrderItem {
  id: string
  title: string
  isbn: string
  price: number
  quantity: number
  image: string
}

interface Order {
  id: string
  reference: string
  date: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  itemCount: number
  paymentMethod: string
  deliveryAddress: string
  items: OrderItem[]
  trackingNumber?: string
  estimatedDelivery?: string
  notes?: string
  customerInfo: {
    fullName: string
    email: string
    phone: string
    address: string
    city: string
  }
}

interface UseOrdersResult {
  orders: Order[]
  addOrder: (order: Omit<Order, 'id' | 'reference' | 'date'>) => Order
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  isLoading: boolean
  refreshOrders: () => void
}

export const useOrders = (): UseOrdersResult => {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addNotification } = useNotifications()

  const loadOrders = useCallback(() => {
    // Charger les commandes depuis localStorage
    const storedOrders = localStorage.getItem("client-orders")
    if (storedOrders) {
      try {
        const parsedOrders = JSON.parse(storedOrders)
        setOrders(parsedOrders)
      } catch (error) {
        console.error("Erreur lors du chargement des commandes:", error)
        setOrders([])
      }
    } else {
      setOrders([])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadOrders()
    
    // Écouter les changements dans localStorage pour mettre à jour en temps réel
    const handleStorageChange = () => {
      loadOrders()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Vérifier les changements toutes les 2 secondes
    const interval = setInterval(loadOrders, 2000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [loadOrders])

  // Sauvegarde manuelle seulement pour éviter les boucles infinies

  const addOrder = (orderData: Omit<Order, 'id' | 'reference' | 'date'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      reference: `CMD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      date: new Date().toISOString(),
      status: 'pending',
      trackingNumber: `TRK-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${new Date().getFullYear()}`,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 jours
      notes: "Commande en attente de confirmation"
    }

    // Sauvegarder immédiatement dans localStorage
    const currentOrders = JSON.parse(localStorage.getItem("client-orders") || "[]")
    const updatedOrders = [newOrder, ...currentOrders]
    localStorage.setItem("client-orders", JSON.stringify(updatedOrders))
    
    // Mettre à jour l'état
    setOrders(updatedOrders)
    
    // Marquer cette commande comme nouvelle pour l'affichage
    localStorage.setItem('new-order-id', newOrder.id)
    
    // Ajouter une notification
    addNotification({
      type: 'order',
      title: 'Nouvelle commande créée',
      message: `Votre commande ${newOrder.reference} a été créée avec succès. Total: ${newOrder.total.toLocaleString()} F CFA`,
      data: { orderId: newOrder.id, orderReference: newOrder.reference }
    })
    
    toast.success(`Commande ${newOrder.reference} créée avec succès !`)
    
    return newOrder
  }

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const order = orders.find(o => o.id === orderId)
    
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status }
          : order
      )
    )

    // Ajouter des notifications selon le statut
    if (order) {
      switch (status) {
        case 'confirmed':
          addNotification({
            type: 'success',
            title: 'Commande confirmée',
            message: `Votre commande ${order.reference} a été confirmée et sera traitée sous peu.`,
            data: { orderId, orderReference: order.reference }
          })
          break
        case 'shipped':
          addNotification({
            type: 'delivery',
            title: 'Commande expédiée',
            message: `Votre commande ${order.reference} a été expédiée. Numéro de suivi: ${order.trackingNumber}`,
            data: { orderId, orderReference: order.reference, trackingNumber: order.trackingNumber }
          })
          break
        case 'delivered':
          addNotification({
            type: 'success',
            title: 'Commande livrée',
            message: `Votre commande ${order.reference} a été livrée avec succès. Merci pour votre achat !`,
            data: { orderId, orderReference: order.reference }
          })
          break
        case 'cancelled':
          addNotification({
            type: 'warning',
            title: 'Commande annulée',
            message: `Votre commande ${order.reference} a été annulée.`,
            data: { orderId, orderReference: order.reference }
          })
          break
      }
    }
  }

  const refreshOrders = useCallback(() => {
    loadOrders()
  }, [loadOrders])

  return {
    orders,
    addOrder,
    updateOrderStatus,
    isLoading,
    refreshOrders
  }
}
