import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useNotifications } from "./use-notifications"
import { useCurrentUser } from "./use-current-user"
import { apiClient } from "@/lib/api-client"

export interface OrderItem {
  id: string
  title: string
  quantity: number
  price: number
  image: string
}

export interface Order {
  id: string
  reference: string
  date: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  itemCount: number
  paymentMethod: string
  deliveryAddress: string
  items: OrderItem[]
  customerInfo: {
    fullName: string
    email: string
    address: string
    city: string
  }
  trackingNumber?: string
  estimatedDelivery?: string
  notes?: string
}

export interface UseOrdersResult {
  orders: Order[]
  addOrder: (orderData: Omit<Order, 'id' | 'reference' | 'date'>) => Promise<Order>
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  isLoading: boolean
  refreshOrders: () => void
}

export const useOrders = (): UseOrdersResult => {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addNotification } = useNotifications()
  const { user } = useCurrentUser()

  // Mapper les statuts de l'API vers le frontend
  const mapOrderStatus = (apiStatus: string): string => {
    switch (apiStatus) {
      case 'PENDING':
        return 'pending'
      case 'VALIDATED':
        return 'confirmed'
      case 'PROCESSING':
        return 'processing'
      case 'SHIPPED':
        return 'shipped'
      case 'DELIVERED':
        return 'delivered'
      case 'CANCELLED':
        return 'cancelled'
      default:
        console.warn('Statut de commande non reconnu:', apiStatus)
        return 'pending'
    }
  }

  const loadOrders = useCallback(async () => {
    if (!user) {
      setOrders([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      // Charger les commandes depuis l'API
      const apiOrders = await apiClient.getOrders()
      
      // Filtrer les commandes pour l'utilisateur actuel
      const userOrders = apiOrders.filter(order => order.userId === user.id)
      
      // Convertir au format attendu par le frontend
      const formattedOrders: Order[] = userOrders.map(order => ({
        id: order.id,
        reference: order.id.substring(0, 8).toUpperCase(),
        date: order.createdAt,
        status: mapOrderStatus(order.status) as Order['status'],
        total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        paymentMethod: 'Carte bancaire',
        deliveryAddress: 'Adresse par défaut',
        items: order.items.map(item => ({
          id: item.id,
          title: item.work.title,
          quantity: item.quantity,
          price: item.price,
          image: '/placeholder-book.jpg'
        })),
        customerInfo: {
          fullName: order.user.name,
          email: order.user.email,
          address: 'Adresse par défaut',
          city: 'Libreville'
        }
      }))
      
      setOrders(formattedOrders)
    } catch (error) {
      console.error("Erreur lors du chargement des commandes:", error)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Sauvegarde manuelle seulement pour éviter les boucles infinies

  const addOrder = async (orderData: Omit<Order, 'id' | 'reference' | 'date'>) => {
    if (!user) {
      toast.error("Vous devez être connecté pour créer une commande")
      throw new Error("User not authenticated")
    }

    try {
      // Créer la commande via l'API
      const apiOrderData = {
        userId: user.id,
        items: orderData.items.map(item => {
          // item.id devrait être l'ID de l'œuvre (Work)
          if (!item.id) {
            throw new Error(`ID manquant pour l'article: ${item.title}`)
          }
          return {
            workId: item.id, // ID de l'œuvre (Work)
            quantity: item.quantity || 1,
            price: item.price || 0
          }
        })
      }

      console.log('📦 Données de commande envoyées:', apiOrderData)

      const createdOrder = await apiClient.createOrder(apiOrderData)
      
      // Recharger les commandes pour avoir les données à jour
      await loadOrders()
      
      // Ajouter une notification
      addNotification({
        type: 'order',
        title: 'Commande créée',
        message: `Votre commande a été créée avec succès !`,
        data: { orderId: createdOrder.id }
      })

      toast.success("Commande créée avec succès !")
      
      // Retourner l'ordre formaté pour le frontend
      return {
        id: createdOrder.id,
        reference: createdOrder.id.substring(0, 8).toUpperCase(),
        date: createdOrder.createdAt,
        status: mapOrderStatus(createdOrder.status) as Order['status'],
        total: createdOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: createdOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        paymentMethod: 'Carte bancaire',
        deliveryAddress: 'Adresse par défaut',
        items: createdOrder.items.map(item => ({
          id: item.id,
          title: item.work.title,
          quantity: item.quantity,
          price: item.price,
          image: '/placeholder-book.jpg'
        })),
        customerInfo: {
          fullName: orderData.customerInfo.fullName,
          email: orderData.customerInfo.email,
          address: orderData.customerInfo.address,
          city: orderData.customerInfo.city
        }
      }
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error)
      toast.error("Erreur lors de la création de la commande")
      throw error
    }
  }

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status }
          : order
      )
    )
    toast.success(`Statut de la commande mis à jour : ${status}`)
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