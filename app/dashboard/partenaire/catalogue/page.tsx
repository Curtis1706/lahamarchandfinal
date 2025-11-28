"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import {
  Search,
  Filter,
  BookOpen,
  ShoppingCart,
  Eye,
  Star,
  Package,
  X,
  Plus,
  Minus
} from "lucide-react"

interface Work {
  id: string
  title: string
  isbn: string
  discipline: string
  author: string
  price: number
  available: boolean
  stock: number
  description: string
  coverImage?: string
}

interface CartItem {
  workId: string
  title: string
  price: number
  quantity: number
}

export default function PartenaireCataloguePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [works, setWorks] = useState<Work[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [disciplineFilter, setDisciplineFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCartDialog, setShowCartDialog] = useState(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)

  useEffect(() => {
    loadCatalogue()
  }, [disciplineFilter, priceFilter])

  const loadCatalogue = async () => {
    try {
      setIsLoading(true)
      
      const data = await apiClient.getPartenaireCatalogue({ 
        discipline: disciplineFilter === 'all' ? undefined : disciplineFilter,
        price: priceFilter === 'all' ? undefined : priceFilter 
      })
      
      setWorks(data.works)
      
    } catch (error: any) {
      console.error('Erreur lors du chargement du catalogue:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement du catalogue",
        variant: "destructive"
      })
      setWorks([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredWorks = works.filter(work => {
    const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         work.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         work.discipline.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDiscipline = disciplineFilter === "all" || work.discipline === disciplineFilter
    const matchesPrice = priceFilter === "all" || 
                        (priceFilter === "low" && work.price < 3500) ||
                        (priceFilter === "medium" && work.price >= 3500 && work.price < 4500) ||
                        (priceFilter === "high" && work.price >= 4500)
    
    return matchesSearch && matchesDiscipline && matchesPrice
  })

  const handleAddToCart = (work: Work) => {
    const existingItem = cart.find(item => item.workId === work.id)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.workId === work.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        workId: work.id,
        title: work.title,
        price: work.price,
        quantity: 1
      }])
    }
    
    toast({
      title: "Ajouté au panier",
      description: `${work.title} a été ajouté à votre commande`,
    })
  }

  const handleRemoveFromCart = (workId: string) => {
    setCart(cart.filter(item => item.workId !== workId))
  }

  const handleUpdateQuantity = (workId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(workId)
      return
    }
    
    setCart(cart.map(item => 
      item.workId === workId 
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Panier vide",
        description: "Votre panier est vide",
        variant: "destructive"
      })
      return
    }

    setIsCreatingOrder(true)
    try {
      const orderItems = cart.map(item => ({
        workId: item.workId,
        quantity: item.quantity,
        price: item.price * item.quantity
      }))

      const result = await apiClient.createPartenaireOrder({ items: orderItems })
      
      toast({
        title: "Commande créée",
        description: "Votre commande a été créée avec succès",
      })
      
      setCart([])
      setShowCartDialog(false)
      router.push('/dashboard/partenaire/commandes')
      
    } catch (error: any) {
      console.error('Erreur lors de la création de la commande:', error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la commande",
        variant: "destructive"
      })
    } finally {
      setIsCreatingOrder(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
        <h1 className="text-2xl font-bold text-gray-900">Catalogue des Œuvres</h1>
        <p className="text-gray-600">Découvrez et commandez les œuvres disponibles</p>
        </div>
        <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
          <DialogTrigger asChild>
            <Button className="relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Panier
              {cart.length > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Panier de commande</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Votre panier est vide</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.workId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.price.toLocaleString()} FCFA / unité</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.workId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.workId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-medium w-24 text-right">
                        {(item.price * item.quantity).toLocaleString()} FCFA
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFromCart(item.workId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    {getCartTotal().toLocaleString()} FCFA
                  </span>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCartDialog(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateOrder} disabled={isCreatingOrder}>
                    {isCreatingOrder ? "Création..." : "Créer la commande"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher une œuvre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les disciplines</SelectItem>
                <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                <SelectItem value="Français">Français</SelectItem>
                <SelectItem value="Sciences">Sciences</SelectItem>
                <SelectItem value="Histoire-Géographie">Histoire-Géographie</SelectItem>
                <SelectItem value="Littérature">Littérature</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les prix</SelectItem>
                <SelectItem value="low">Moins de 3500 FCFA</SelectItem>
                <SelectItem value="medium">3500 - 4500 FCFA</SelectItem>
                <SelectItem value="high">Plus de 4500 FCFA</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grille des œuvres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredWorks.map((work) => (
            <Card key={work.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                {/* Image de couverture */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-blue-600" />
                </div>
                
                {/* Informations de l'œuvre */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg line-clamp-2">{work.title}</h3>
                  <p className="text-sm text-gray-600">Par {work.author}</p>
                  <Badge variant="secondary" className="text-xs">{work.discipline}</Badge>
                  
                  {/* Prix et stock */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold text-green-600">
                      {work.price.toLocaleString()} FCFA
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Package className="h-3 w-3 mr-1" />
                      {work.stock} disponibles
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2 pt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAddToCart(work)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Commander
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Message si aucun résultat */}
      {!isLoading && filteredWorks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune œuvre trouvée</h3>
            <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
