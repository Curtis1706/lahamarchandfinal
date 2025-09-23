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
}

interface UseCartResult {
  cart: WorkWithDiscipline[]
  addToCart: (work: WorkWithDiscipline) => void
  removeFromCart: (workId: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  isInCart: (workId: string) => boolean
}

export const useCart = (): UseCartResult => {
  const [cart, setCart] = useState<WorkWithDiscipline[]>([])

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
    const savedCart = localStorage.getItem("laha-cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error("Error loading cart from localStorage:", error)
      }
    }
  }, [])

  // Sauvegarder le panier dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem("laha-cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (work: WorkWithDiscipline) => {
    if (!cart.find(item => item.id === work.id)) {
      setCart([...cart, work])
      toast.success(`"${work.title}" ajouté au panier`)
    } else {
      toast.info("Ce livre est déjà dans votre panier")
    }
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
    return cart.reduce((total, item) => total + (item.price || 0), 0)
  }

  const getTotalItems = () => {
    return cart.length
  }

  const isInCart = (workId: string) => {
    return cart.some(item => item.id === workId)
  }

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isInCart
  }
}
