"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  ShoppingCart, 
  User, 
  Package,
  ArrowLeft,
  Loader2
} from "lucide-react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import Image from "next/image"

interface Work {
  id: string
  title: string
  isbn: string
  price: number
  tva: number
  stock: number
  discipline: {
    id: string
    name: string
  }
  author: {
    id: string
    name: string
  } | null
  discount?: {
    id: string
    type: string
    reduction: number
  } | null
  finalPrice?: number
}

interface Client {
  id: string
  name: string
  type: string
  email: string
  phone: string
  address: string
  city: string
}

interface CartItem {
  workId: string
  work: Work
  quantity: number
  price: number
}

export default function CreerCommandePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [works, setWorks] = useState<Work[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [disciplineFilter, setDisciplineFilter] = useState("all")
  const [disciplines, setDisciplines] = useState<string[]>([])
  
  // Informations client
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [showClientDialog, setShowClientDialog] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Charger le catalogue et les clients en parallèle
      const [catalogResponse, clientsResponse] = await Promise.all([
        fetch('/api/representant/catalog'),
        fetch('/api/representant/clients')
      ])

      if (catalogResponse.ok) {
        const catalogData = await catalogResponse.json()
        setWorks(catalogData.works || [])
        const uniqueDisciplines = [...new Set(catalogData.works?.map((w: Work) => w.discipline.name) || [])]
        setDisciplines(uniqueDisciplines)
      }

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClients(clientsData.clients || [])
      }
    } catch (error: any) {
      console.error("Error loading data:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      setSelectedClientId(clientId)
      setClientName(client.name)
      setClientEmail(client.email)
      setClientPhone(client.phone)
      setClientAddress(client.address)
    }
  }

  const addToCart = (work: Work) => {
    const existingItem = cart.find(item => item.workId === work.id)
    
    if (existingItem) {
      // Augmenter la quantité
      if (existingItem.quantity >= work.stock) {
        toast({
          title: "Stock insuffisant",
          description: `Stock disponible: ${work.stock}`,
          variant: "destructive"
        })
        return
      }
      setCart(cart.map(item => 
        item.workId === work.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      // Ajouter un nouvel item
      const price = work.finalPrice || work.price || 0
      setCart([...cart, {
        workId: work.id,
        work,
        quantity: 1,
        price
      }])
    }
    toast({
      title: "Ajouté au panier",
      description: `${work.title} ajouté`
    })
  }

  const removeFromCart = (workId: string) => {
    setCart(cart.filter(item => item.workId !== workId))
  }

  const updateQuantity = (workId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(workId)
      return
    }
    
    const item = cart.find(item => item.workId === workId)
    if (item && quantity > item.work.stock) {
      toast({
        title: "Stock insuffisant",
        description: `Stock disponible: ${item.work.stock}`,
        variant: "destructive"
      })
      return
    }

    setCart(cart.map(item => 
      item.workId === workId 
        ? { ...item, quantity }
        : item
    ))
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getTotalTVA = () => {
    return cart.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity
      return sum + (itemSubtotal * (item.work.tva || 0.18))
    }, 0)
  }

  const getTotal = () => {
    return getSubtotal() + getTotalTVA()
  }

  const handleSubmit = async () => {
    // Validation
    if (cart.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un livre à la commande",
        variant: "destructive"
      })
      return
    }

    if (!clientName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner ou renseigner un client",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)

      const orderData = {
        items: cart.map(item => ({
          workId: item.workId,
          quantity: item.quantity,
          price: item.price,
          workPrice: item.work.price
        })),
        clientId: selectedClientId || null,
        clientName,
        clientEmail,
        clientPhone,
        clientAddress,
        notes
      }

      const response = await fetch('/api/representant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la commande")
      }

      toast({
        title: "Succès",
        description: "Commande créée avec succès et envoyée pour validation"
      })

      // Rediriger vers la liste des commandes
      router.push('/dashboard/representant/commandes')
    } catch (error: any) {
      console.error("Error creating order:", error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la commande",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredWorks = works.filter(work => {
    const matchesSearch = 
      work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.author?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.discipline.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDiscipline = disciplineFilter === "all" || work.discipline.name === disciplineFilter
    
    return matchesSearch && matchesDiscipline
  })

  const getBookImageUrl = (work: Work) => {
    return `/placeholder.jpg`
  }

  return (
    <DynamicDashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/representant/commandes')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Créer une commande</h1>
            <p className="text-gray-600">Enregistrez une commande au nom d'un client</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale - Catalogue et Panier */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations client */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du client</CardTitle>
                <CardDescription>Sélectionnez un client existant ou renseignez les informations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Client existant</Label>
                  <Select value={selectedClientId} onValueChange={handleSelectClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nouveau client</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Nom du client *</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nom complet"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Téléphone</Label>
                    <Input
                      id="clientPhone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+229 XX XX XX XX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientAddress">Adresse</Label>
                    <Input
                      id="clientAddress"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Catalogue */}
            <Card>
              <CardHeader>
                <CardTitle>Catalogue des livres</CardTitle>
                <CardDescription>Sélectionnez les livres à ajouter à la commande</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtres */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un livre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les disciplines</SelectItem>
                      {disciplines.map(discipline => (
                        <SelectItem key={discipline} value={discipline}>
                          {discipline}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Liste des livres */}
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                    {filteredWorks.map((work) => {
                      const inCart = cart.find(item => item.workId === work.id)
                      const cartQuantity = inCart?.quantity || 0
                      
                      return (
                        <Card key={work.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="h-24 w-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center relative flex-shrink-0">
                                <Image
                                  src={getBookImageUrl(work)}
                                  alt={work.title}
                                  fill
                                  className="object-cover rounded-lg"
                                  sizes="96px"
                                />
                                {work.discount && (
                                  <Badge className="absolute top-1 left-1 bg-red-500 text-white text-xs">
                                    -{work.discount.type === 'Pourcentage' 
                                      ? `${work.discount.reduction}%` 
                                      : `${work.discount.reduction} F CFA`}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm line-clamp-2">{work.title}</h3>
                                <p className="text-xs text-gray-600">Par {work.author?.name || "Auteur inconnu"}</p>
                                <p className="text-xs text-gray-500">ISBN: {work.isbn}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <div>
                                    {work.discount && work.price ? (
                                      <>
                                        <p className="text-xs text-gray-500 line-through">
                                          {work.price.toLocaleString()} F CFA
                                        </p>
                                        <p className="text-sm font-bold text-green-600">
                                          {work.finalPrice?.toLocaleString()} F CFA
                                        </p>
                                      </>
                                    ) : (
                                      <p className="text-sm font-bold text-green-600">
                                        {work.price ? `${work.price.toLocaleString()} F CFA` : 'Prix non défini'}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {inCart ? (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => updateQuantity(work.id, cartQuantity - 1)}
                                          className="h-7 w-7 p-0"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-sm font-medium w-8 text-center">{cartQuantity}</span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => updateQuantity(work.id, cartQuantity + 1)}
                                          disabled={cartQuantity >= work.stock}
                                          className="h-7 w-7 p-0"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => addToCart(work)}
                                        disabled={work.stock === 0 || !work.price}
                                        className="h-7 text-xs"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Ajouter
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Stock: {work.stock} disponible{work.stock > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Panier */}
            {cart.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Panier ({cart.length} article{cart.length > 1 ? 's' : ''})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.workId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.work.title}</p>
                          <p className="text-xs text-gray-500">
                            {item.price.toLocaleString()} F CFA × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.workId, item.quantity - 1)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.workId, item.quantity + 1)}
                              disabled={item.quantity >= item.work.stock}
                              className="h-7 w-7 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm font-bold w-24 text-right">
                            {(item.price * item.quantity).toLocaleString()} F CFA
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.workId)}
                            className="h-7 w-7 p-0 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne latérale - Récapitulatif */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    placeholder="Notes pour cette commande..."
                  />
                </div>

                {/* Détails des prix */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-medium">{getSubtotal().toLocaleString()} F CFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA (18%)</span>
                    <span className="font-medium">{getTotalTVA().toLocaleString()} F CFA</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{getTotal().toLocaleString()} F CFA</span>
                    </div>
                  </div>
                </div>

                {/* Bouton de création */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || cart.length === 0 || !clientName.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Créer la commande
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  La commande sera envoyée au PDG pour validation
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DynamicDashboardLayout>
  )
}

