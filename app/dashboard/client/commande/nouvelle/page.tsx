"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useOrders } from "@/hooks/use-orders"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Plus,
  Save,
  X,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  ChevronsUpDown,
  Check,
  ArrowLeft,
  Loader2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

function NouvelleCommandePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: userLoading } = useCurrentUser()
  const { refreshOrders } = useOrders()
  const [works, setWorks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [disciplines, setDisciplines] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [cartItems, setCartItems] = useState<Array<{ workId: string; title: string; price: number; quantity: number }>>([])
  const [bookSearchTerm, setBookSearchTerm] = useState("")
  const [isBookComboboxOpen, setIsBookComboboxOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [newOrderData, setNewOrderData] = useState({
    selectedCategory: '',
    selectedDiscipline: '',
    selectedClass: '',
    selectedWork: '',
    quantity: 0,
    promoCode: '',
    orderType: 'rentree-scolaire',
    deliveryDate: undefined as Date | undefined,
    deliveryTimeFrom: '07:00',
    deliveryTimeTo: '19:00',
    deliveryAddress: '',
    paymentMethod: '',
    paymentDueDate: undefined as Date | undefined,
  })

  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number; libelle: string } | null>(null)
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)

  // États pour Airtel Money
  const [transactionId, setTransactionId] = useState("")
  const [paymentProofUrl, setPaymentProofUrl] = useState("")
  const [isUploadingProof, setIsUploadingProof] = useState(false)

  // Récupérer workId depuis les paramètres de requête et pré-sélectionner le livre
  useEffect(() => {
    const workId = searchParams.get('workId')
    if (workId && works.length > 0 && categories.length > 0) {
      const work = works.find(w => w.id === workId)
      if (work) {
        // Trouver la catégorie correspondante depuis work.category (string)
        let categoryValue = ''
        if (work.category) {
          // Chercher la catégorie qui correspond au nom de la catégorie du work
          const matchingCategory = categories.find(cat => {
            const catName = cat.nom || cat.name || ''
            return catName.toLowerCase() === work.category.toLowerCase() ||
              work.category.toLowerCase().includes(catName.toLowerCase()) ||
              catName.toLowerCase().includes(work.category.toLowerCase())
          })
          if (matchingCategory) {
            categoryValue = matchingCategory.nom || matchingCategory.name || matchingCategory.id
          } else {
            // Si pas de correspondance exacte, utiliser directement work.category
            categoryValue = work.category
          }
        }

        // Trouver la classe depuis targetAudience si disponible
        let classValue = ''
        if (work.targetAudience && classes.length > 0) {
          // Chercher la classe qui correspond au targetAudience
          const matchingClass = classes.find(classe => {
            const className = classe.classe || classe.name || ''
            return className.toLowerCase() === work.targetAudience.toLowerCase() ||
              work.targetAudience.toLowerCase().includes(className.toLowerCase()) ||
              className.toLowerCase().includes(work.targetAudience.toLowerCase())
          })
          if (matchingClass) {
            classValue = matchingClass.classe || matchingClass.name || matchingClass.id
          }
        }

        // Pré-sélectionner la catégorie, discipline, classe et livre
        setNewOrderData(prev => ({
          ...prev,
          selectedWork: workId,
          selectedCategory: categoryValue || prev.selectedCategory,
          selectedDiscipline: work.disciplineId || prev.selectedDiscipline,
          selectedClass: classValue || prev.selectedClass,
          quantity: 0 // La quantité reste à 0 pour que le client la choisisse
        }))
      }
    }
  }, [searchParams, works, categories, classes])

  // Charger les données pour le formulaire de création
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setIsLoading(true)
        const [worksData, categoriesResponse, disciplinesData, classesResponse] = await Promise.all([
          apiClient.getWorks({ status: 'PUBLISHED' }),
          fetch("/api/pdg/categories").then(r => {
            if (!r.ok) {
              console.error("❌ Erreur lors du chargement des catégories:", r.status, r.statusText)
              return []
            }
            return r.json()
          }).catch((err) => {
            console.error("❌ Erreur lors du chargement des catégories:", err)
            return []
          }),
          apiClient.getDisciplines(),
          fetch("/api/pdg/classes").then(r => {
            if (!r.ok) {
              console.error("❌ Erreur lors du chargement des classes:", r.status, r.statusText)
              return []
            }
            return r.json()
          }).catch((err) => {
            console.error("❌ Erreur lors du chargement des classes:", err)
            return []
          })
        ])

        // S'assurer que worksData est un tableau
        const worksArray = Array.isArray(worksData) ? worksData : ((worksData as any)?.works || [])
        // Filtrer uniquement les livres PUBLISHED (sécurité supplémentaire)
        const publishedWorks = worksArray.filter((work: any) => work.status === 'PUBLISHED' || !work.status)

        // Traiter les catégories
        const categoriesArray = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse?.error ? [] : categoriesResponse || [])

        // Traiter les classes
        const classesArray = Array.isArray(classesResponse) ? classesResponse : (classesResponse?.error ? [] : classesResponse || [])

        // Déterminer le type de client effectif pour la tarification
        const userClientType = user?.clientType || 'INDIVIDUAL';

        // Ajuster les prix des livres en fonction du type de client
        const worksWithClientPrices = publishedWorks.map((work: any) => {
          let price = work.price || 0;

          if (work.prices && work.prices.length > 0) {
            const clientPrice = work.prices.find((p: any) => p.clientType === userClientType);
            if (clientPrice) {
              price = clientPrice.price;
            } else if (userClientType !== 'INDIVIDUAL') {
              const individualPrice = work.prices.find((p: any) => p.clientType === 'INDIVIDUAL');
              if (individualPrice) {
                price = individualPrice.price;
              }
            }
          }

          return {
            ...work,
            price: price,
            originalPublicPrice: work.price || 0
          };
        });

        setWorks(worksWithClientPrices)
        setCategories(categoriesArray)
        setDisciplines(disciplinesData || [])
        setClasses(classesArray)
      } catch (error) {
        console.error("❌ Error fetching form data:", error)
        setWorks([])
        setCategories([])
        setDisciplines([])
        setClasses([])
        toast.error("Erreur lors du chargement des données")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFormData()
  }, [])

  // Fonctions utilitaires
  const getWorks = () => works && Array.isArray(works) ? works : []

  const getFilteredWorks = () => {
    // La catégorie est obligatoire - si aucune catégorie n'est sélectionnée, aucun livre n'est affiché
    if (!newOrderData.selectedCategory) {
      return []
    }

    let filtered = getWorks()

    // Filtrer par catégorie (obligatoire)
    const selectedCategoryName = categories.find(cat => (cat.nom || cat.name) === newOrderData.selectedCategory)?.nom || newOrderData.selectedCategory
    filtered = filtered.filter(work => {
      const workCategory = work.category || ''
      if (!workCategory) {
        return false
      }
      const matches = workCategory.toLowerCase() === selectedCategoryName.toLowerCase() ||
        workCategory.toLowerCase().includes(selectedCategoryName.toLowerCase())
      return matches
    })

    // Filtrer par matière (discipline) - optionnel
    if (newOrderData.selectedDiscipline) {
      filtered = filtered.filter(work => work.disciplineId === newOrderData.selectedDiscipline)
    }

    // Filtrer par terme de recherche (titre du livre ou ISBN) - optionnel
    if (bookSearchTerm.trim()) {
      const searchLower = bookSearchTerm.toLowerCase().trim()
      filtered = filtered.filter(work =>
        work.title?.toLowerCase().includes(searchLower) ||
        work.isbn?.toLowerCase().includes(searchLower)
      )
    }

    // Filtrer les livres sans stock (stock <= 0)
    filtered = filtered.filter(work => {
      const stock = work.stock ?? 0
      return stock > 0
    })

    return filtered
  }

  const handleAddToCart = () => {
    if (!newOrderData.selectedWork) {
      toast.error("Veuillez sélectionner un livre")
      return
    }

    const quantity = newOrderData.quantity > 0 ? newOrderData.quantity : 1
    if (quantity <= 0) {
      toast.error("La quantité doit être supérieure à 0")
      return
    }

    const work = getWorks().find(w => w.id === newOrderData.selectedWork)
    if (!work) {
      toast.error("Livre introuvable")
      return
    }

    // Vérifier le stock disponible
    const stock = work.stock ?? 0
    if (stock <= 0) {
      toast.error(`${work.title} n'est plus en stock`)
      return
    }

    const existingItem = cartItems.find(item => item.workId === newOrderData.selectedWork)
    if (existingItem) {
      // Vérifier que la quantité totale (existante + nouvelle) ne dépasse pas le stock
      const totalQuantity = existingItem.quantity + quantity
      if (totalQuantity > stock) {
        toast.error(`Stock insuffisant pour ${work.title}. Stock disponible: ${stock}, Quantité demandée: ${totalQuantity}`)
        return
      }

      setCartItems(prev => prev.map(item =>
        item.workId === newOrderData.selectedWork
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
      toast.success(`${work.title} ajouté au panier (quantité: ${quantity})`)
    } else {
      // Vérifier que la quantité demandée ne dépasse pas le stock
      if (quantity > stock) {
        toast.error(`Stock insuffisant pour ${work.title}. Stock disponible: ${stock}, Quantité demandée: ${quantity}`)
        return
      }
      const newItem = {
        workId: work.id,
        title: work.title,
        price: work.price || 0,
        quantity: quantity
      }
      setCartItems(prev => [...prev, newItem])
      toast.success(`${work.title} ajouté au panier`)
    }

    // Réinitialiser les sélections
    setNewOrderData(prev => ({
      ...prev,
      selectedWork: '',
      quantity: 0
    }))
  }

  const handleRemoveFromCart = (workId: string) => {
    setCartItems(prev => prev.filter(item => item.workId !== workId))
  }

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    if (appliedPromo) {
      return Math.max(0, subtotal - appliedPromo.discountAmount)
    }
    return subtotal
  }

  const handleValidatePromo = async () => {
    if (!newOrderData.promoCode.trim()) {
      toast.error("Veuillez saisir un code promo")
      return
    }

    setIsValidatingPromo(true)

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // L'API attend { code, items: [{ price, quantity }] }
        // On mappe cartItems pour correspondre
        body: JSON.stringify({
          code: newOrderData.promoCode.trim(),
          items: cartItems.map(item => ({
            id: item.workId,
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
      console.error("Erreur lors de la validation:", error)
      toast.error("Erreur lors de la validation")
      setAppliedPromo(null)
    } finally {
      setIsValidatingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setNewOrderData(prev => ({ ...prev, promoCode: "" }))
    toast.info("Code promo retiré")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingProof(true)
    const formData = new FormData()
    formData.append('files', file)
    formData.append('type', 'payment_proof')
    formData.append('entityId', user?.id || 'temp')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload')
      }

      const data = await response.json()
      if (data.files && data.files.length > 0) {
        setPaymentProofUrl(data.files[0].path)
        toast.success("Preuve de paiement téléchargée avec succès")
      }
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors du téléchargement de la preuve")
    } finally {
      setIsUploadingProof(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour passer une commande")
      return
    }

    if (cartItems.length === 0) {
      toast.error("Veuillez ajouter au moins un article au panier")
      return
    }

    if (!newOrderData.deliveryAddress || !newOrderData.deliveryDate) {
      toast.error("Veuillez remplir les coordonnées de livraison")
      return
    }

    // Vérifier le stock disponible pour tous les articles du panier
    for (const item of cartItems) {
      const work = getWorks().find(w => w.id === item.workId)
      if (!work) {
        toast.error(`Livre introuvable: ${item.title}`)
        return
      }
      const stock = work.stock ?? 0
      if (stock < item.quantity) {
        toast.error(`Stock insuffisant pour ${item.title}. Stock disponible: ${stock}, Quantité demandée: ${item.quantity}`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      const itemsWithPrice = cartItems.map(item => ({
        workId: item.workId,
        quantity: item.quantity,
        price: item.price
      }))

      const orderData: any = {
        userId: user.id,
        items: itemsWithPrice,
        promoCode: appliedPromo ? appliedPromo.code : undefined,
        discountAmount: appliedPromo ? appliedPromo.discountAmount : 0
      }

      // Ajouter les coordonnées de livraison
      if (newOrderData.deliveryDate) {
        orderData.deliveryDate = newOrderData.deliveryDate.toISOString()
      }
      if (newOrderData.deliveryAddress) {
        orderData.deliveryAddress = newOrderData.deliveryAddress
      }
      if (newOrderData.deliveryTimeFrom && newOrderData.deliveryTimeTo) {
        orderData.deliveryTimeFrom = newOrderData.deliveryTimeFrom
        orderData.deliveryTimeTo = newOrderData.deliveryTimeTo
      }

      // Ajouter le mode de paiement
      if (newOrderData.paymentMethod) {
        orderData.paymentMethod = newOrderData.paymentMethod

        // Champs spécifiques Airtel Money
        if (newOrderData.paymentMethod === 'airtel-money-gabon') {
          // Validation retirée : le paiement se fait après validation par le PDG
          /*
          if (!transactionId) {
            toast.error("Veuillez saisir l'ID de transaction")
            setIsSubmitting(false)
            return
          }
          orderData.transactionId = transactionId
          orderData.paymentProof = paymentProofUrl
          */
        }

        // Champs spécifiques Paiement en Dépôt
        if (newOrderData.paymentMethod === 'depot') {
          if (!newOrderData.paymentDueDate) {
            toast.error("Veuillez sélectionner une date limite de paiement")
            setIsSubmitting(false)
            return
          }
          orderData.paymentDueDate = newOrderData.paymentDueDate.toISOString()
        }
      }

      // Ajouter le type de commande
      if (newOrderData.orderType) {
        orderData.orderType = newOrderData.orderType
      }

      await apiClient.createOrder(orderData)

      // Rafraîchir les commandes
      await refreshOrders()

      toast.success("Commande créée avec succès")

      // Rediriger vers la liste des commandes
      router.push("/dashboard/client/commandes")
    } catch (error: any) {
      console.error("Erreur lors de la création de la commande:", error)
      toast.error(error.message || "Erreur lors de la création de la commande")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (userLoading || isLoading) {
    return (
      <DynamicDashboardLayout title="Nouvelle Commande">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DynamicDashboardLayout>
    )
  }

  if (!user) {
    return (
      <DynamicDashboardLayout title="Nouvelle Commande">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vous devez être connecté pour créer une commande.</p>
          <Link href="/auth/login">
            <Button className="mt-4">Se connecter</Button>
          </Link>
        </div>
      </DynamicDashboardLayout>
    )
  }

  return (
    <DynamicDashboardLayout title="Nouvelle Commande">
      <div className="container mx-auto py-6 space-y-6">
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Nouvelle Commande</h1>
              <p className="text-muted-foreground">
                Créez une nouvelle commande de livres scolaires
              </p>
            </div>
            <Link href="/dashboard/client/commandes">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux commandes
              </Button>
            </Link>
          </div>

          {/* Formulaire de création */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Création de nouvelle commande</CardTitle>
                <div className="text-right">
                  <span className="text-sm font-medium text-muted-foreground">Total: </span>
                  <span className="text-lg font-bold text-indigo-600">
                    {calculateTotal().toLocaleString("fr-FR")} XOF
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Section de sélection des articles */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Sélection des articles</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Choix de la catégorie */}
                  <div className="space-y-2">
                    <Label>Choix de la catégorie *</Label>
                    <Select
                      value={newOrderData.selectedCategory}
                      onValueChange={(value) => {
                        setNewOrderData(prev => ({ ...prev, selectedCategory: value, selectedWork: '' }))
                        setBookSearchTerm("")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.nom || category.name || category.id}>
                              {category.nom || category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500 text-center">Aucune catégorie disponible</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Choix de la matière */}
                  <div className="space-y-2">
                    <Label>Choix de la Matière</Label>
                    <Select
                      value={newOrderData.selectedDiscipline}
                      onValueChange={(value) => {
                        setNewOrderData(prev => ({ ...prev, selectedDiscipline: value, selectedWork: '' }))
                        setBookSearchTerm("")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une matière" />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplines.map((discipline) => (
                          <SelectItem key={discipline.id} value={discipline.id}>
                            {discipline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Choix de la classe */}
                  <div className="space-y-2">
                    <Label>Choix de la classe</Label>
                    <Select
                      value={newOrderData.selectedClass}
                      onValueChange={(value) => setNewOrderData(prev => ({ ...prev, selectedClass: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez la classe" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.length > 0 ? (
                          classes.map((classe) => (
                            <SelectItem key={classe.id} value={classe.classe || classe.name || classe.id}>
                              {classe.classe || classe.name} ({classe.section})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500 text-center">Aucune classe disponible</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Choix du livre */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Choix du livre *</Label>
                    <Popover
                      open={isBookComboboxOpen}
                      onOpenChange={(open) => {
                        setIsBookComboboxOpen(open)
                        if (!open) {
                          setBookSearchTerm("")
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isBookComboboxOpen}
                          className="w-full justify-between"
                          disabled={!newOrderData.selectedCategory}
                        >
                          {newOrderData.selectedWork
                            ? getWorks().find((work) => work.id === newOrderData.selectedWork)?.title || "Sélectionnez un livre"
                            : "Sélectionnez un livre..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false} className="rounded-lg border-none">
                          <CommandInput
                            placeholder="Rechercher un livre..."
                            value={bookSearchTerm}
                            onValueChange={(value: string) => setBookSearchTerm(value)}
                            className="h-9"
                          />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>
                              {bookSearchTerm.trim()
                                ? `Aucun livre trouvé pour "${bookSearchTerm}"`
                                : newOrderData.selectedCategory
                                  ? "Aucun livre disponible"
                                  : "Sélectionnez d'abord une catégorie"}
                            </CommandEmpty>
                            <CommandGroup>
                              {getFilteredWorks().map((work) => (
                                <CommandItem
                                  key={work.id}
                                  value={`${work.title} ${work.isbn || ''}`}
                                  onSelect={() => {
                                    setNewOrderData(prev => ({ ...prev, selectedWork: work.id }))
                                    setBookSearchTerm("")
                                    setIsBookComboboxOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newOrderData.selectedWork === work.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{work.title}</div>
                                    <div className="text-xs text-gray-500">
                                      {(work.price || 0).toLocaleString("fr-FR")} XOF
                                      {work.isbn && ` • ISBN: ${work.isbn}`}
                                      {work.stock !== undefined && (
                                        <span className={cn(
                                          "ml-2",
                                          (work.stock ?? 0) > 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                          • Stock: {work.stock ?? 0}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Quantité */}
                  <div className="space-y-2">
                    <Label>Quantité *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newOrderData.quantity || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        setNewOrderData(prev => ({ ...prev, quantity: value }))
                      }}
                      placeholder="1"
                    />
                  </div>

                  {/* Bouton Ajouter */}
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddToCart}
                      className="bg-indigo-600 hover:bg-indigo-700 w-full"
                      disabled={!newOrderData.selectedWork || !newOrderData.quantity || newOrderData.quantity <= 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>

                {/* Tableau récapitulatif */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Livre</TableHead>
                        <TableHead className="text-right">Prix</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            Aucun article dans le panier
                          </TableCell>
                        </TableRow>
                      ) : (
                        cartItems.map((item) => (
                          <TableRow key={item.workId}>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell className="text-right">{item.price.toLocaleString("fr-FR")} XOF</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right font-medium">
                              {(item.price * item.quantity).toLocaleString("fr-FR")} XOF
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFromCart(item.workId)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Total */}
                <div className="flex justify-end">
                  <div className="text-right">
                    <span className="text-sm font-medium text-muted-foreground">Total: </span>
                    <span className="text-lg font-bold text-indigo-600">
                      {calculateTotal().toLocaleString("fr-FR")} XOF
                    </span>
                  </div>
                </div>
              </div>

              {/* Section détails de la commande */}
              <div className="space-y-4 border-t pt-4">
                <h2 className="text-xl font-semibold">Détails de la commande</h2>

                {/* Code promo */}
                <div className="space-y-2">
                  <Label>Code promo</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="CODE PROMO"
                        value={newOrderData.promoCode}
                        onChange={(e) => setNewOrderData(prev => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
                        disabled={!!appliedPromo || isValidatingPromo}
                      />
                    </div>
                    <div className="flex items-end">
                      {appliedPromo ? (
                        <Button
                          variant="destructive"
                          onClick={handleRemovePromo}
                          type="button"
                        >
                          Retirer
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={handleValidatePromo}
                          disabled={isValidatingPromo || !newOrderData.promoCode.trim()}
                          type="button"
                        >
                          {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Appliquer"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {appliedPromo && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex justify-between items-center">
                      <span>{appliedPromo.libelle} ({appliedPromo.code})</span>
                      <span className="font-bold">-{appliedPromo.discountAmount.toLocaleString("fr-FR")} XOF</span>
                    </div>
                  )}
                </div>

                {/* Type de commande */}
                <div className="space-y-2">
                  <Label>Type de commande</Label>
                  <Select
                    value={newOrderData.orderType}
                    onValueChange={(value) => setNewOrderData(prev => ({ ...prev, orderType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le type de commande" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rentree-scolaire">Commande pour la rentrée scolaire</SelectItem>
                      <SelectItem value="cours-vacances">Cours de vacances</SelectItem>
                      <SelectItem value="periode-cours">Période de cours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Coordonnées de Livraison */}
                <div className="space-y-4">
                  <div className="bg-black text-white px-4 py-2 rounded">
                    <Label className="text-white font-semibold">Coordonnées de Livraison *</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date de livraison */}
                    <div className="space-y-2">
                      <Label>Date de livraison *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newOrderData.deliveryDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newOrderData.deliveryDate ? (
                              format(newOrderData.deliveryDate, "dd/MM/yyyy", { locale: fr })
                            ) : (
                              <span className="text-muted-foreground">Sélectionnez une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newOrderData.deliveryDate}
                            onSelect={(date) => setNewOrderData(prev => ({ ...prev, deliveryDate: date }))}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Plage horaire */}
                    <div className="space-y-2">
                      <Label>Plage horaire</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600">De</Label>
                          <div className="relative">
                            <Input
                              type="time"
                              value={newOrderData.deliveryTimeFrom}
                              onChange={(e) => setNewOrderData(prev => ({ ...prev, deliveryTimeFrom: e.target.value }))}
                              className="pr-8"
                            />
                            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600">à</Label>
                          <div className="relative">
                            <Input
                              type="time"
                              value={newOrderData.deliveryTimeTo}
                              onChange={(e) => setNewOrderData(prev => ({ ...prev, deliveryTimeTo: e.target.value }))}
                              className="pr-8"
                            />
                            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adresse de livraison */}
                  <div className="space-y-2">
                    <Label>Adresse de livraison *</Label>
                    <Textarea
                      placeholder="Adresse complète de livraison"
                      value={newOrderData.deliveryAddress}
                      onChange={(e) => setNewOrderData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Mode de paiement */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mode de paiement</Label>
                    <Select
                      value={newOrderData.paymentMethod}
                      onValueChange={(value) => {
                        setNewOrderData(prev => ({ ...prev, paymentMethod: value }))
                        // Réinitialiser les champs Airtel Money si on change de méthode
                        if (value !== 'airtel-money-gabon') {
                          setTransactionId("")
                          setPaymentProofUrl("")
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez mode de règlement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="airtel-money-gabon">Airtel Money Gabon</SelectItem>
                        <SelectItem value="virement">Virement bancaire</SelectItem>
                        <SelectItem value="carte">Carte bancaire</SelectItem>
                        <SelectItem value="depot">Dépôt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Section Airtel Money - Instructions déplacées après validation */}
                  {newOrderData.paymentMethod === 'airtel-money-gabon' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 text-blue-700 font-medium">
                        <div className="bg-blue-600 text-white p-1 rounded-sm text-xs">INFO</div>
                        <span>Instructions de paiement</span>
                      </div>
                      <p className="text-sm text-blue-800">
                        Les instructions de paiement vous seront communiquées <strong>après validation de votre commande</strong> par notre équipe.
                      </p>
                    </div>
                  )}

                  {/* Section Paiement en Dépôt */}
                  {newOrderData.paymentMethod === 'depot' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 text-blue-700 font-medium">
                        <Clock className="h-5 w-5" />
                        <span>Paiement en dépôt</span>
                      </div>

                      <div className="text-sm text-gray-700 space-y-2 ml-1 pl-4 border-l-2 border-blue-200">
                        <p className="font-medium">Comment ça fonctionne ?</p>
                        <p>• Vous recevez la commande dans votre établissement (école, boutique, etc.)</p>
                        <p>• Vous payez ultérieurement selon la date de rappel choisie</p>
                        <p>• Un rappel vous sera envoyé avant la date limite</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Date limite de paiement *</Label>
                        <div className="text-xs text-muted-foreground mb-2">
                          Pour toute information, veuillez contacter le +22951825358
                        </div>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !newOrderData.paymentDueDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newOrderData.paymentDueDate ? (
                                format(newOrderData.paymentDueDate, "PPP", { locale: fr })
                              ) : (
                                <span>Sélectionnez une date de rappel</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-3 border-b">
                              <p className="text-sm font-medium mb-2">Dates prédéfinies</p>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const date = new Date(2026, 8, 30) // 30 Septembre 2026
                                    setNewOrderData(prev => ({ ...prev, paymentDueDate: date }))
                                  }}
                                  className="text-xs"
                                >
                                  30 Septembre
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const date = new Date(2026, 11, 15) // 15 Décembre 2026
                                    setNewOrderData(prev => ({ ...prev, paymentDueDate: date }))
                                  }}
                                  className="text-xs"
                                >
                                  15 Décembre
                                </Button>
                              </div>
                            </div>
                            <Calendar
                              mode="single"
                              selected={newOrderData.paymentDueDate}
                              onSelect={(date) => setNewOrderData(prev => ({ ...prev, paymentDueDate: date }))}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Link href="/dashboard/client/commandes">
                  <Button variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </Link>
                <Button
                  onClick={handleCreateOrder}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={isSubmitting || cartItems.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Créer la commande
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DynamicDashboardLayout>
  )
}

export default function NouvelleCommandePage() {
  return (
    <Suspense fallback={
      <DynamicDashboardLayout title="Nouvelle Commande">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DynamicDashboardLayout>
    }>
      <NouvelleCommandePageContent />
    </Suspense>
  )
}
