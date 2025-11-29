import { useState, useEffect } from "react"
import { toast } from "sonner"

// Types locaux pour éviter les problèmes d'import Prisma
interface Work {
  id: string
  title: string
  isbn: string
  price: number
  tva: number
  stock: number
  disciplineId: string
  status: string
}

interface Discipline {
  id: string
  name: string
}

interface WorkWithDiscipline extends Work {
  discipline?: Discipline
  quantity?: number
}

interface CartItem extends WorkWithDiscipline {
  quantity: number
}

interface UseCartResult {
  cart: CartItem[]
  addToCart: (work: WorkWithDiscipline, quantity?: number) => void
  removeFromCart: (workId: string) => void
  updateQuantity: (workId: string, quantity: number) => void
  clearCart: (showMessage?: boolean) => void
  getTotalPrice: () => number
  getTotalItems: () => number
  isInCart: (workId: string) => boolean
}

export const useCart = (): UseCartResult => {
  const [cart, setCart] = useState<CartItem[]>([])

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
    const savedCart = localStorage.getItem("laha-cart")
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Migrer les anciens paniers sans quantité
        const migratedCart = parsedCart.map((item: any) => ({
          ...item,
          quantity: item.quantity || 1
        }))
        setCart(migratedCart)
      } catch (error) {
        console.error("Error loading cart from localStorage:", error)
      }
    }
  }, [])

  // Sauvegarder le panier dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem("laha-cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (work: WorkWithDiscipline, quantity: number = 1) => {
    const existingItem = cart.find(item => item.id === work.id)
    
    if (existingItem) {
      // Si l'article existe déjà, augmenter la quantité
      setCart(cart.map(item => 
        item.id === work.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
      toast.success(`Quantité mise à jour pour "${work.title}"`)
    } else {
      // Ajouter un nouvel article avec quantité
      setCart([...cart, { ...work, quantity }])
      toast.success(`"${work.title}" ajouté au panier`)
    }
  }

  const updateQuantity = (workId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(workId)
      return
    }
    
    const item = cart.find(item => item.id === workId)
    if (item && item.stock && quantity > item.stock) {
      toast.error(`Stock disponible : ${item.stock} exemplaires`)
      return
    }
    
    setCart(cart.map(item => 
      item.id === workId 
        ? { ...item, quantity }
        : item
    ))
  }

  const removeFromCart = (workId: string) => {
    const item = cart.find(item => item.id === workId)
    setCart(cart.filter(item => item.id !== workId))
    if (item) {
      toast.success(`"${item.title}" retiré du panier`)
    }
  }

  const clearCart = (showMessage: boolean = true) => {
    setCart([])
    if (showMessage) {
      toast.success("Panier vidé")
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0)
  }

  const isInCart = (workId: string) => {
    return cart.some(item => item.id === workId)
  }

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isInCart
  }
}
