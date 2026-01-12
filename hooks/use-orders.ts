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
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>
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
      // Utiliser /api/client/orders qui filtre automatiquement par userId côté serveur
      const response = await fetch('/api/client/orders', {
        credentials: 'include', // Important: inclure les cookies de session pour l'authentification
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("❌ Erreur API client/orders:", response.status, errorData)
        throw new Error(errorData.error || 'Erreur lors du chargement des commandes')
      }
      
      const data = await response.json()
      const userOrders = data.orders || [] // L'API filtre déjà par userId
      
      console.log("📦 Commandes reçues de /api/client/orders:", userOrders.length, userOrders)
      
      // Convertir au format attendu par le frontend
      const formattedOrders: Order[] = userOrders.map((order: any) => {
        // Générer une référence depuis l'ID (format: CMK + 8 premiers caractères)
        const reference = order.id ? `CMK${order.id.substring(0, 8).toUpperCase()}` : ''
        
        // Extraire l'adresse de livraison si elle est dans paymentReference (JSON)
        let deliveryAddress = order.deliveryAddress || null
        if (!deliveryAddress && order.paymentReference) {
          try {
            const parsed = JSON.parse(order.paymentReference)
            deliveryAddress = parsed.address || null
          } catch (e) {
            // Pas du JSON, ignorer
          }
        }
        
        return {
          id: order.id,
          reference,
          date: order.date || order.createdAt,
          status: mapOrderStatus(order.status) as Order['status'],
          total: order.total || (order.items ? order.items.reduce((sum: number, item: any) => sum + ((item.price || item.unitPrice || 0) * (item.quantity || 0)), 0) : 0),
          itemCount: order.itemCount || order.itemsCount || (order.items ? order.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) : 0),
          paymentMethod: order.paymentMethod || 'Non spécifié',
          deliveryAddress: deliveryAddress || 'Adresse non spécifiée',
          items: (order.items || []).map((item: any) => ({
            id: item.workId || item.work?.id || item.id,
            title: item.work?.title || item.title,
            quantity: item.quantity,
            price: item.price || item.unitPrice || item.work?.price || 0,
            image: item.work?.image || item.image || '/placeholder-book.jpg',
            isbn: item.work?.isbn || item.isbn
          })),
          customerInfo: {
            fullName: order.user?.name || user?.name || '',
            email: order.user?.email || user?.email || '',
            address: deliveryAddress || '',
            city: 'Libreville'
          }
        }
      })
      
      console.log("✅ Commandes formatées:", formattedOrders.length, formattedOrders)
      setOrders(formattedOrders)
    } catch (error) {
      console.error("❌ Erreur lors du chargement des commandes:", error)
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

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      // Mapper le statut frontend vers le statut backend
      const backendStatus = status === 'cancelled' ? 'CANCELLED' : status.toUpperCase()
      
      // Appeler l'API pour mettre à jour le statut dans la base de données
      const response = await fetch('/api/client/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          action: status === 'cancelled' ? 'cancel' : undefined,
          status: backendStatus
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du statut')
      }

      // Recharger les commandes depuis l'API pour avoir les données à jour
      await loadOrders()

      toast.success(`Commande ${status === 'cancelled' ? 'annulée' : 'mise à jour'} avec succès`)
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du statut:", error)
      toast.error(error.message || "Erreur lors de la mise à jour du statut de la commande")
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