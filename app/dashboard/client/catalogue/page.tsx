"use client"

import { useState, useEffect } from "react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useCart } from "@/hooks/use-cart"
import { useOrders } from "@/hooks/use-orders"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Book, ShoppingCart, Filter, Image as ImageIcon, X, Trash2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

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
  image?: string
}

// Fonction pour générer une image de livre basée sur le titre
const getBookImageUrl = (title: string, discipline?: string): string => {
  // Images disponibles dans le dossier public
  const availableImages = [
    '/01.png',
    '/02.png', 
    '/10001.png',
    '/10002.png',
    '/10011.png',
    '/10012.png',
    '/10013.png'
  ]
  
  // Mapping des disciplines vers les images spécifiques
  const disciplineImages: { [key: string]: string[] } = {
    'Mathématiques': ['/10001.png'], // S'exercer en Mathématiques CP
    'Français': ['/01.png', '/02.png'], // S'exercer en Dictée
    'Sciences': ['/10002.png', '/10011.png', '/10012.png', '/10013.png'], // S'exercer en SVT
    'Histoire': ['/communication-book.jpg'],
    'Géographie': ['/communication-book.jpg'],
    'Anglais': ['/french-textbook-coffret-ce2.jpg']
  }
  
  // Cherche une correspondance par discipline
  if (discipline) {
    const disciplineImageList = disciplineImages[discipline]
    if (disciplineImageList && disciplineImageList.length > 0) {
      // Retourne une image aléatoire de la discipline
      const randomIndex = Math.floor(Math.random() * disciplineImageList.length)
      return disciplineImageList[randomIndex]
    }
  }
  
  // Images par défaut basées sur des mots-clés du titre
  if (title.toLowerCase().includes('math') || title.toLowerCase().includes('mathématiques')) {
    return '/10001.png' // S'exercer en Mathématiques CP
  }
  if (title.toLowerCase().includes('français') || title.toLowerCase().includes('french') || title.toLowerCase().includes('dictée')) {
    // Retourne aléatoirement entre les deux images de dictée
    return Math.random() > 0.5 ? '/01.png' : '/02.png'
  }
  if (title.toLowerCase().includes('svt') || title.toLowerCase().includes('sciences')) {
    // Retourne aléatoirement entre les images SVT
    const svtImages = ['/10002.png', '/10011.png', '/10012.png', '/10013.png']
    const randomIndex = Math.floor(Math.random() * svtImages.length)
    return svtImages[randomIndex]
  }
  if (title.toLowerCase().includes('histoire') || title.toLowerCase().includes('history')) {
    return '/communication-book.jpg'
  }
  if (title.toLowerCase().includes('anglais') || title.toLowerCase().includes('english')) {
    return '/french-textbook-coffret-ce2.jpg'
  }
  
  // Retourne une image aléatoire des images disponibles
  const randomIndex = Math.floor(Math.random() * availableImages.length)
  return availableImages[randomIndex]
}

export default function ClientCataloguePage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const { cart, addToCart, removeFromCart, getTotalPrice, isInCart, clearCart } = useCart()
  const { addOrder } = useOrders()
  const router = useRouter()
  const [works, setWorks] = useState<WorkWithDiscipline[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all")
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [worksData, disciplinesData] = await Promise.all([
          apiClient.getWorks(),
          apiClient.getDisciplines()
        ])
        setWorks(worksData)
        setDisciplines(disciplinesData)
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast.error("Erreur lors du chargement du catalogue")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredWorks = works.filter(work => {
    const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDiscipline = selectedDiscipline === "all" || work.disciplineId === selectedDiscipline
    return matchesSearch && matchesDiscipline
  })

  // Fonction pour créer directement la commande
  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast.error("Votre panier est vide")
      return
    }

    if (!user) {
      toast.error("Vous devez être connecté pour passer commande")
      return
    }

    setIsProcessingOrder(true)

    try {
      // Créer la commande avec des données par défaut
      const orderItems = cart.map(item => ({
        id: item.id,
        title: item.title,
        isbn: item.isbn,
        price: item.price || 0,
        quantity: 1,
        image: item.image || "/placeholder.jpg"
      }))

      const newOrder = await addOrder({
        total: getTotalPrice(),
        itemCount: cart.length,
        paymentMethod: "À confirmer",
        deliveryAddress: "Adresse à confirmer",
        items: orderItems,
        customerInfo: {
          fullName: user.name || "Client",
          email: user.email || "",
          phone: "À confirmer",
          address: "À confirmer",
          city: "À confirmer"
        }
      })

      // Vider le panier silencieusement (pas de toast)
      clearCart(false)
      
      // Rediriger vers les commandes
      router.push(`/dashboard/client/commandes?newOrder=${newOrder.id}`)
      
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error)
      toast.error("Erreur lors de la création de la commande")
    } finally {
      setIsProcessingOrder(false)
    }
  }


  if (userLoading || isLoading) {
    return (
      <DynamicDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DynamicDashboardLayout>
    )
  }

  if (!user) {
    return (
      <DynamicDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vous devez être connecté pour accéder au catalogue.</p>
        </div>
      </DynamicDashboardLayout>
    )
  }

  return (
    <DynamicDashboardLayout>
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Catalogue des Livres</h1>
              <p className="text-muted-foreground">
                Découvrez notre collection de livres scolaires et éducatifs
              </p>
            </div>
            
            {/* Panier fonctionnel */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="relative flex items-center space-x-2 hover:bg-blue-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Panier</span>
                  {cart.length > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {cart.length}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Mon Panier ({cart.length} article{cart.length > 1 ? 's' : ''})</span>
                  </DialogTitle>
                  <DialogDescription>
                    Gérez les articles de votre panier
                  </DialogDescription>
                </DialogHeader>
                
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Votre panier est vide</h3>
                    <p className="text-muted-foreground">
                      Ajoutez des livres à votre panier pour commencer vos achats
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="relative w-16 h-20 bg-gray-100 rounded">
                          <Image
                            src={getBookImageUrl(item.title, item.discipline?.name)}
                            alt={item.title}
                            fill
                            className="object-cover rounded"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                          <p className="text-xs text-muted-foreground">ISBN: {item.isbn}</p>
                          <p className="text-sm font-semibold text-blue-600">
                            {item.price?.toFixed(2)} €
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">
                        Total: {getTotalPrice().toFixed(2)} €
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => clearCart()}>
                          Vider le panier
                        </Button>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={handleCreateOrder}
                          disabled={isProcessingOrder}
                        >
                          {isProcessingOrder ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Création en cours...
                            </>
                          ) : (
                            "Passer commande"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un livre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les disciplines</SelectItem>
                {disciplines.map((discipline) => (
                  <SelectItem key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste des livres */}
        {filteredWorks.length === 0 ? (
          <div className="text-center py-12">
            <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun livre trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedDiscipline !== "all" 
                ? "Essayez de modifier vos critères de recherche"
                : "Le catalogue est actuellement vide"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorks.map((work) => {
              const workInCart = isInCart(work.id)
              const discipline = disciplines.find(d => d.id === work.disciplineId)
              
              return (
                <Card key={work.id} className="flex flex-col h-full overflow-hidden">
                  {/* Image de couverture */}
                  <div className="relative h-48 w-full bg-gradient-to-br from-blue-50 to-indigo-100">
                    <Image
                      src={getBookImageUrl(work.title, discipline?.name)}
                      alt={work.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-2 right-2">
                      {discipline && (
                        <Badge variant="secondary" className="bg-white/90 text-gray-800">
                          {discipline.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">
                      {work.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      ISBN: {work.isbn}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Stock:</span> {work.stock} exemplaires
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">TVA:</span> {(work.tva * 100).toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Statut:</span>{" "}
                        <Badge variant={work.status === 'PUBLISHED' ? 'default' : 'secondary'} className="text-xs">
                          {work.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                        </Badge>
                      </p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-4">
                    <div className="flex items-center justify-between w-full">
                      <div className="text-2xl font-bold text-primary">
                        {work.price ? `${work.price.toFixed(2)} €` : "Prix non défini"}
                      </div>
                      {workInCart ? (
                        <Button
                          variant="outline"
                          onClick={() => removeFromCart(work.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Retirer du panier
                        </Button>
                      ) : (
                        <Button
                          onClick={() => addToCart({
                            ...work,
                            image: getBookImageUrl(work.title, discipline?.name)
                          })}
                          disabled={!work.price}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Ajouter au panier
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

      </div>
    </DynamicDashboardLayout>
  )
}
