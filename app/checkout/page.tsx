"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGuest } from "@/hooks/use-guest"
import { useCart } from "@/hooks/use-cart"
import { GuestBanner } from "@/components/guest-banner"
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
  Package,
  LogIn,
  UserPlus
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

export default function GuestCheckoutPage() {
  const { isGuest } = useGuest()
  const { cart, clearCart, updateQuantity, removeFromCart } = useCart()
  const router = useRouter()
  
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [createAccount, setCreateAccount] = useState(false)
  
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
  
  // Informations pour création de compte (si createAccount = true)
  const [accountInfo, setAccountInfo] = useState({
    password: "",
    confirmPassword: ""
  })
  
  // Méthode de paiement
  const [paymentMethod, setPaymentMethod] = useState("")
  
  // Code promo
  const [promoCodeInput, setPromoCodeInput] = useState("")
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)

  // Charger les items du panier
  useEffect(() => {
    if (cart.length > 0) {
      setCartItems(cart.map(item => ({
        id: item.id,
        title: item.title,
        isbn: item.isbn,
        price: item.price || 0,
        tva: item.tva || 0.18,
        stock: item.stock || 0,
        image: (item as any).image || "/placeholder-book.jpg",
        quantity: item.quantity || 1
      })))
    } else {
      // Si le panier est vide, rediriger vers le catalogue
      router.push("/catalogue")
    }
  }, [cart, router])

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
  
  const getTotal = () => {
    const subtotal = getSubtotal()
    const tax = getTotalTVA()
    return Math.max(0, subtotal + tax - discountAmount)
  }
  
  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  // Valider le formulaire
  const validateForm = () => {
    if (!deliveryInfo.fullName.trim()) {
      toast.error("Le nom complet est requis")
      return false
    }
    if (!deliveryInfo.phone.trim()) {
      toast.error("Le numéro de téléphone est requis")
      return false
    }
    if (!deliveryInfo.address.trim()) {
      toast.error("L'adresse est requise")
      return false
    }
    if (!paymentMethod) {
      toast.error("Veuillez sélectionner une méthode de paiement")
      return false
    }
    
    if (createAccount) {
      if (!deliveryInfo.email.trim()) {
        toast.error("L'email est requis pour créer un compte")
        return false
      }
      if (!accountInfo.password) {
        toast.error("Le mot de passe est requis")
        return false
      }
      if (accountInfo.password !== accountInfo.confirmPassword) {
        toast.error("Les mots de passe ne correspondent pas")
        return false
      }
      if (accountInfo.password.length < 6) {
        toast.error("Le mot de passe doit contenir au moins 6 caractères")
        return false
      }
    }
    
    return true
  }

  // Appliquer le code promo
  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) {
      toast.error("Veuillez entrer un code promo.")
      return
    }
    setIsApplyingPromo(true)
    try {
      const response = await fetch(`/api/promo/validate/public?code=${promoCodeInput}&totalAmount=${getSubtotal()}&itemCount=${getTotalItems()}`)
      const data = await response.json()

      if (response.ok) {
        setAppliedPromoCode(data.promoCode)
        setDiscountAmount(data.discount)
        toast.success(data.message)
      } else {
        setAppliedPromoCode(null)
        setDiscountAmount(0)
        toast.error(data.error || "Erreur lors de l'application du code promo.")
      }
    } catch (error) {
      console.error("Error applying promo code:", error)
      toast.error("Une erreur inattendue est survenue.")
    } finally {
      setIsApplyingPromo(false)
    }
  }

  const handleRemovePromoCode = () => {
    setPromoCodeInput("")
    setAppliedPromoCode(null)
    setDiscountAmount(0)
    toast.info("Code promo retiré.")
  }

  // Passer la commande
  const handlePlaceOrder = async () => {
    if (!validateForm()) return
    
    setIsProcessing(true)
    
    try {
      // Si création de compte, créer d'abord le compte
      let userId = null
      if (createAccount) {
        try {
          const signupResponse = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: deliveryInfo.fullName,
              email: deliveryInfo.email,
              phone: deliveryInfo.phone,
              password: accountInfo.password,
              role: 'CLIENT'
            })
          })
          
          if (signupResponse.ok) {
            const signupData = await signupResponse.json()
            userId = signupData.user?.id
            toast.success("Compte créé avec succès !")
            // Rediriger vers la page de connexion pour se connecter
            router.push(`/auth/login?callbackUrl=/dashboard/client/checkout`)
            return
          } else {
            const errorData = await signupResponse.json()
            toast.error(errorData.error || "Erreur lors de la création du compte")
            return
          }
        } catch (error) {
          console.error("Error creating account:", error)
          toast.error("Erreur lors de la création du compte")
          return
        }
      }

      // Créer la commande en tant qu'invité (sans userId)
      const orderItems = cartItems.map(item => ({
        workId: item.id,
        quantity: item.quantity,
        price: item.price
      }))
      
      const orderResponse = await fetch('/api/orders/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          deliveryInfo: {
            fullName: deliveryInfo.fullName,
            email: deliveryInfo.email || null,
            phone: deliveryInfo.phone,
            address: deliveryInfo.address,
            city: deliveryInfo.city,
            postalCode: deliveryInfo.postalCode,
            notes: deliveryInfo.notes
          },
          paymentMethod: paymentMethod,
          promoCode: appliedPromoCode,
          discount: discountAmount
        })
      })

      if (orderResponse.ok) {
        const orderData = await orderResponse.json()
        clearCart(false)
        toast.success("Commande passée avec succès !")
        router.push(`/commande-confirmee?id=${orderData.order.id}`)
      } else {
        const errorData = await orderResponse.json()
        toast.error(errorData.error || "Erreur lors de la création de la commande")
      }
    } catch (error: any) {
      console.error("Error placing order:", error)
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setIsProcessing(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <>
        <GuestBanner />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Votre panier est vide</p>
            <Link href="/catalogue">
              <Button variant="outline" className="mt-4">
                Retour au catalogue
              </Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <GuestBanner />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/catalogue">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au catalogue
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">Finaliser la commande</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale - Formulaire */}
            <div className="lg:col-span-2 space-y-6">
              {/* Articles du panier */}
              <Card>
                <CardHeader>
                  <CardTitle>Articles ({getTotalItems()})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden">
                        <Image
                          src={item.image || "/placeholder-book.jpg"}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-gray-500">ISBN: {item.isbn}</p>
                        <p className="text-sm font-medium text-green-600">
                          {item.price.toLocaleString()} F CFA × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
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
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Nom complet *</Label>
                    <Input
                      id="fullName"
                      value={deliveryInfo.fullName}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, fullName: e.target.value })}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      value={deliveryInfo.phone}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                      placeholder="+229 40 76 76 76"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email {createAccount ? '*' : '(optionnel)'}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={deliveryInfo.email}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, email: e.target.value })}
                      placeholder="jean.dupont@example.com"
                      required={createAccount}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Adresse *</Label>
                    <Textarea
                      id="address"
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                      placeholder="Rue, numéro, quartier..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        value={deliveryInfo.city}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                        placeholder="Cotonou"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        value={deliveryInfo.postalCode}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, postalCode: e.target.value })}
                        placeholder="01 BP"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes de livraison (optionnel)</Label>
                    <Textarea
                      id="notes"
                      value={deliveryInfo.notes}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, notes: e.target.value })}
                      placeholder="Instructions spéciales pour la livraison..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Option création de compte */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Créer un compte (optionnel)
                  </CardTitle>
                  <CardDescription>
                    Créez un compte pour suivre vos commandes et bénéficier de promotions personnalisées
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="createAccount"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="createAccount">Je souhaite créer un compte</Label>
                  </div>
                  
                  {createAccount && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label htmlFor="password">Mot de passe *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={accountInfo.password}
                          onChange={(e) => setAccountInfo({ ...accountInfo, password: e.target.value })}
                          placeholder="Minimum 6 caractères"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={accountInfo.confirmPassword}
                          onChange={(e) => setAccountInfo({ ...accountInfo, confirmPassword: e.target.value })}
                          placeholder="Répétez le mot de passe"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Méthode de paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Méthode de paiement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une méthode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="VIREMENT">Virement bancaire</SelectItem>
                      <SelectItem value="ESPECES">Espèces (à la livraison)</SelectItem>
                      <SelectItem value="CARTE_BANCAIRE">Carte bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Code Promo */}
              <Card>
                <CardHeader>
                  <CardTitle>Code Promo</CardTitle>
                  <CardDescription>
                    Appliquez un code promo pour bénéficier d'une réduction.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appliedPromoCode ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-700 font-medium">
                        Code promo appliqué : <span className="font-bold">{appliedPromoCode}</span>
                      </p>
                      <Button variant="ghost" size="sm" onClick={handleRemovePromoCode}>
                        Retirer
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Entrez votre code promo"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        className="flex-1"
                        disabled={isApplyingPromo}
                      />
                      <Button onClick={handleApplyPromoCode} disabled={isApplyingPromo}>
                        {isApplyingPromo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Appliquer"
                        )}
                      </Button>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <p className="text-sm text-green-600">
                      Réduction appliquée : -{discountAmount.toLocaleString()} F CFA
                    </p>
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
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>{getSubtotal().toLocaleString()} F CFA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TVA (18%)</span>
                      <span>{getTotalTVA().toLocaleString()} F CFA</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="text-muted-foreground">Réduction</span>
                        <span className="font-medium">-{discountAmount.toLocaleString()} F CFA</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{getTotal().toLocaleString()} F CFA</span>
                    </div>
                  </div>
                  
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {createAccount ? "Créer le compte et passer la commande" : "Passer la commande"}
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500">
                    En passant cette commande, vous acceptez nos conditions générales de vente.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


