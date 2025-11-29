"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useCart } from "@/hooks/use-cart"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingCart, 
  Loader2, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  Package
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface CartItem {
  id: string
  title: string
  isbn: string
  price: number
  tva: number
  stock: number
  image?: string
  quantity: number
}

export default function CheckoutPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const { cart, clearCart } = useCart()
  const router = useRouter()
  
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Informations de livraison
  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: ""
  })
  
  // Méthode de paiement
  const [paymentMethod, setPaymentMethod] = useState("")
  
  // Code promo
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string
    discountAmount: number
    libelle: string
  } | null>(null)
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  
  // Charger les items du panier avec quantités initiales
  useEffect(() => {
    if (cart.length > 0) {
      // Grouper les items par ID et initialiser les quantités à 1
      const itemsMap = new Map<string, CartItem>()
      
      cart.forEach((item) => {
        if (itemsMap.has(item.id)) {
          // Si l'item existe déjà, incrémenter la quantité
          const existing = itemsMap.get(item.id)!
          itemsMap.set(item.id, { ...existing, quantity: existing.quantity + 1 })
        } else {
          // Nouvel item
          itemsMap.set(item.id, {
            id: item.id,
            title: item.title,
            isbn: item.isbn,
            price: item.price || 0,
            tva: item.tva || 0.18,
            stock: item.stock || 0,
            image: (item as any).image || "/placeholder-book.jpg",
            quantity: 1
          })
        }
      })
      
      setCartItems(Array.from(itemsMap.values()))
    } else {
      // Si le panier est vide, rediriger vers le catalogue
      router.push("/dashboard/client/catalogue")
    }
  }, [cart, router])
  
  // Pré-remplir les informations utilisateur
  useEffect(() => {
    if (user) {
      setDeliveryInfo(prev => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      }))
    }
  }, [user])
  
  // Fonctions pour gérer les quantités
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setCartItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          // Vérifier le stock disponible
          if (newQuantity > item.stock) {
            toast.error(`Stock insuffisant. Disponible: ${item.stock}`)
            return item
          }
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    )
  }
  
  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
    toast.success("Article retiré du panier")
  }
  
  // Calculs
  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }
  
  const getTotalTVA = () => {
    return cartItems.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity
      return sum + (itemSubtotal * item.tva)
    }, 0)
  }
  
  const getDiscount = () => {
    if (appliedPromo) {
      return appliedPromo.discountAmount
    }
    return 0
  }
  
  const getTotal = () => {
    const subtotal = getSubtotal()
    const tva = getTotalTVA()
    const discount = getDiscount()
    return Math.max(0, subtotal + tva - discount)
  }
  
  // Valider le code promo
  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Veuillez saisir un code promo")
      return
    }
    
    setIsValidatingPromo(true)
    
    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: promoCode.trim(),
          items: cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        })
      })
      
      const data = await response.json()
      
      if (data.valid && data.promotion) {
        setAppliedPromo({
          code: data.promotion.code,
          discountAmount: data.promotion.discountAmount,
          libelle: data.promotion.libelle
        })
        toast.success(`Code promo "${data.promotion.code}" appliqué !`)
      } else {
        setAppliedPromo(null)
        toast.error(data.error || "Code promo invalide")
      }
    } catch (error: any) {
      console.error("Erreur lors de la validation du code promo:", error)
      toast.error("Erreur lors de la validation du code promo")
      setAppliedPromo(null)
    } finally {
      setIsValidatingPromo(false)
    }
  }
  
  // Retirer le code promo
  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoCode("")
    toast.success("Code promo retiré")
  }
  
  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }
  
  // Validation du formulaire
  const validateForm = () => {
    if (cartItems.length === 0) {
      toast.error("Votre panier est vide")
      return false
    }
    
    if (!deliveryInfo.fullName.trim()) {
      toast.error("Veuillez saisir votre nom complet")
      return false
    }
    
    if (!deliveryInfo.email.trim() || !deliveryInfo.email.includes("@")) {
      toast.error("Veuillez saisir une adresse email valide")
      return false
    }
    
    if (!deliveryInfo.phone.trim()) {
      toast.error("Veuillez saisir votre numéro de téléphone")
      return false
    }
    
    if (!deliveryInfo.address.trim()) {
      toast.error("Veuillez saisir votre adresse de livraison")
      return false
    }
    
    if (!deliveryInfo.city.trim()) {
      toast.error("Veuillez saisir votre ville")
      return false
    }
    
    if (!paymentMethod) {
      toast.error("Veuillez sélectionner une méthode de paiement")
      return false
    }
    
    // Vérifier le stock pour tous les items
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        toast.error(`Stock insuffisant pour "${item.title}". Disponible: ${item.stock}`)
        return false
      }
    }
    
    return true
  }
  
  // Créer la commande
  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour passer une commande")
      return
    }
    
    if (!validateForm()) {
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Préparer les items pour l'API
      const orderItems = cartItems.map(item => ({
        workId: item.id,
        quantity: item.quantity,
        price: item.price
      }))
      
      // Créer la commande avec le code promo si appliqué
      const order = await apiClient.createOrder({
        userId: user.id,
        items: orderItems,
        promoCode: appliedPromo?.code || null,
        discountAmount: appliedPromo?.discountAmount || 0
      })
      
      // Vider le panier
      clearCart(false)
      
      toast.success("Commande créée avec succès !")
      
      // Rediriger vers la page des commandes
      router.push(`/dashboard/client/commandes?newOrder=${order.id}`)
      
    } catch (error: any) {
      console.error("Erreur lors de la création de la commande:", error)
      toast.error(error.message || "Erreur lors de la création de la commande")
    } finally {
      setIsProcessing(false)
    }
  }
  
  if (userLoading) {
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
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground mb-4">Vous devez être connecté pour accéder au checkout</p>
          <Link href="/auth/signin">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </DynamicDashboardLayout>
    )
  }
  
  if (cartItems.length === 0) {
    return (
      <DynamicDashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Votre panier est vide</p>
          <Link href="/dashboard/client/catalogue">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au catalogue
            </Button>
          </Link>
        </div>
      </DynamicDashboardLayout>
    )
  }
  
  return (
    <DynamicDashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-muted-foreground">Finalisez votre commande</p>
          </div>
          <Link href="/dashboard/client/catalogue">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au catalogue
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale - Formulaire */}
          <div className="lg:col-span-2 space-y-6">
            {/* Articles du panier */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Articles ({getTotalItems()})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    {/* Image */}
                    <div className="relative w-20 h-28 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder-book.jpg"}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    
                    {/* Détails */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">ISBN: {item.isbn}</p>
                      <p className="text-lg font-bold text-primary mb-3">
                        {item.price.toLocaleString()} F CFA
                      </p>
                      
                      {/* Contrôles de quantité */}
                      <div className="flex items-center gap-3">
                        <Label className="text-sm">Quantité:</Label>
                        <div className="flex items-center gap-2 border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Stock: {item.stock}
                        </Badge>
                      </div>
                      
                      {/* Sous-total pour cet item */}
                      <p className="text-sm text-muted-foreground mt-2">
                        Sous-total: {(item.price * item.quantity).toLocaleString()} F CFA
                      </p>
                    </div>
                    
                    {/* Bouton supprimer */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* Informations de livraison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Informations de livraison
                </CardTitle>
                <CardDescription>
                  Remplissez vos informations pour la livraison
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      <User className="h-4 w-4 inline mr-2" />
                      Nom complet *
                    </Label>
                    <Input
                      id="fullName"
                      value={deliveryInfo.fullName}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Votre nom complet"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="h-4 w-4 inline mr-2" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={deliveryInfo.email}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="votre@email.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="h-4 w-4 inline mr-2" />
                      Téléphone *
                    </Label>
                    <Input
                      id="phone"
                      value={deliveryInfo.phone}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+241 XX XX XX XX"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={deliveryInfo.city}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Libreville"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse complète *</Label>
                  <Textarea
                    id="address"
                    value={deliveryInfo.address}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rue, quartier, numéro..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      value={deliveryInfo.postalCode}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="Code postal (optionnel)"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes de livraison (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={deliveryInfo.notes}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Instructions spéciales pour la livraison..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Méthode de paiement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Méthode de paiement
                </CardTitle>
                <CardDescription>
                  Sélectionnez votre méthode de paiement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une méthode de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Espèces à la livraison</SelectItem>
                    <SelectItem value="card">Carte bancaire</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            {/* Code promo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Code promo
                </CardTitle>
                <CardDescription>
                  Entrez un code promo pour bénéficier d'une réduction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {appliedPromo ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-green-800">Code appliqué : {appliedPromo.code}</p>
                        <p className="text-sm text-green-600">{appliedPromo.libelle}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePromo}
                        className="text-red-600 hover:text-red-700"
                      >
                        Retirer
                      </Button>
                    </div>
                    <p className="text-lg font-bold text-green-800">
                      Réduction : -{appliedPromo.discountAmount.toLocaleString()} F CFA
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Entrez votre code promo"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleValidatePromo()
                        }
                      }}
                      disabled={isValidatingPromo}
                    />
                    <Button
                      onClick={handleValidatePromo}
                      disabled={isValidatingPromo || !promoCode.trim()}
                    >
                      {isValidatingPromo ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Validation...
                        </>
                      ) : (
                        "Appliquer"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Colonne latérale - Récapitulatif */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Détails des prix */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-medium">{getSubtotal().toLocaleString()} F CFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA (18%)</span>
                    <span className="font-medium">{getTotalTVA().toLocaleString()} F CFA</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Réduction ({appliedPromo.code})</span>
                      <span className="font-medium">-{getDiscount().toLocaleString()} F CFA</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{getTotal().toLocaleString()} F CFA</span>
                  </div>
                </div>
                
                <Separator />
                
                {/* Informations de commande */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Articles</span>
                    <span className="font-medium">{getTotalItems()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className="font-medium">À calculer</span>
                  </div>
                </div>
                
                <Separator />
                
                {/* Bouton de commande */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || cartItems.length === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Passer la commande
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  En passant cette commande, vous acceptez nos conditions générales de vente
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DynamicDashboardLayout>
  )
}

