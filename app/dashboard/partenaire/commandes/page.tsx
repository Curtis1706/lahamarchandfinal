"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Filter,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Package,
  User,
  LogOut,
  Bell,
  ChevronDown,
  X,
  Printer,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
} from "lucide-react"
import Link from "next/link"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"
import { useCurrentUser } from "@/hooks/use-current-user"

// Mock data pour les commandes du partenaire
const mockOrders = [
  {
    id: "2025COM28",
    clientName: "ECOLE CONTRACTUELLE",
    clientPhone: "+22994551975",
    nbLivres: 5,
    dateLivraison: "22/08/2025",
    type: "Commande",
    statut: "En attente validation PDG",
    livraison: "En attente",
    reception: "Aucune réception",
    paiement: "Enregistrée",
    montant: 125000,
    items: [
      { livre: "Réussir en Dictée CE1-CE2", quantite: 3, prix: 2500 },
      { livre: "Coffret Français CE2", quantite: 2, prix: 3500 }
    ],
    createdAt: "2025-01-15",
    validatedAt: null,
    canEdit: true,
    canDelete: true,
  },
  {
    id: "2025COM27",
    clientName: "EPP AZALO",
    clientPhone: "+22997648441",
    nbLivres: 5,
    dateLivraison: "25/07/2025",
    type: "Commande",
    statut: "Validée par PDG",
    livraison: "Livraison partielle",
    reception: "Aucune réception",
    paiement: "Enregistrée",
    montant: 150000,
    items: [
      { livre: "Réussir en Mathématiques CE1", quantite: 5, prix: 2800 }
    ],
    createdAt: "2025-01-10",
    validatedAt: "2025-01-12",
    canEdit: false,
    canDelete: false,
  }
]

// Mock data pour les livres disponibles
const mockBooks = [
  { id: "1", title: "Réussir en Dictée Orthographe CE1-CE2", price: 2500, category: "Primaire", discipline: "Français", class: "CE1-CE2" },
  { id: "2", title: "Coffret Réussir en Français CE2", price: 3500, category: "Primaire", discipline: "Français", class: "CE2" },
  { id: "3", title: "Réussir en Mathématiques CE1", price: 2800, category: "Primaire", discipline: "Mathématiques", class: "CE1" },
]

// Mock data pour les clients
const mockClients = [
  { id: "1", name: "ECOLE CONTRACTUELLE", phone: "+22994551975", address: "Cotonou, Bénin" },
  { id: "2", name: "EPP AZALO", phone: "+22997648441", address: "Porto-Novo, Bénin" },
]

export default function CommandesPage() {
  const { user } = useCurrentUser()
  const [orders, setOrders] = useState(mockOrders)
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("tous")
  const [selectedType, setSelectedType] = useState("tous")
  
  // État pour la création de commande
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedDiscipline, setSelectedDiscipline] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedBook, setSelectedBook] = useState("")
  const [quantity, setQuantity] = useState(0)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [orderType, setOrderType] = useState("commande")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [promoCode, setPromoCode] = useState("")

  // Filtrer les commandes
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "tous" || order.statut.includes(selectedStatus)
    const matchesType = selectedType === "tous" || order.type.toLowerCase() === selectedType.toLowerCase()
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Calculer le total de la commande
  const orderTotal = orderItems.reduce((sum, item) => sum + (item.prix * item.quantite), 0)

  // Ajouter un article à la commande
  const addOrderItem = () => {
    if (selectedBook && quantity > 0) {
      const book = mockBooks.find(b => b.id === selectedBook)
      if (book) {
        const newItem = {
          livre: book.title,
          quantite: quantity,
          prix: book.price
        }
        setOrderItems([...orderItems, newItem])
        setSelectedBook("")
        setQuantity(0)
      }
    }
  }

  // Supprimer un article de la commande
  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  // Créer une nouvelle commande
  const createOrder = () => {
    if (selectedClient && orderItems.length > 0 && deliveryDate && deliveryAddress && paymentMethod) {
      const client = mockClients.find(c => c.id === selectedClient)
      const newOrder = {
        id: `2025COM${Date.now().toString().slice(-2)}`,
        clientName: client?.name || "",
        clientPhone: client?.phone || "",
        nbLivres: orderItems.reduce((sum, item) => sum + item.quantite, 0),
        dateLivraison: deliveryDate,
        type: orderType,
        statut: "En attente validation PDG",
        livraison: "En attente",
        reception: "Aucune réception",
        paiement: "Enregistrée",
        montant: orderTotal,
        items: orderItems,
        createdAt: new Date().toISOString().split('T')[0],
        validatedAt: null,
        canEdit: true,
        canDelete: true,
      }
      
      setOrders([newOrder, ...orders])
      
      // Reset form
      setSelectedClient("")
      setOrderItems([])
      setDeliveryDate("")
      setDeliveryAddress("")
      setPaymentMethod("")
      setShowCreateOrderModal(false)
      
      // Afficher notification de succès
      alert("Commande créée avec succès ! Elle sera validée par le PDG.")
    }
  }

  // Supprimer une commande (seulement si en attente)
  const deleteOrder = (orderId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      setOrders(orders.filter(order => order.id !== orderId))
    }
  }

  return (
    <DynamicDashboardLayout title='Mes commandes' breadcrumb='Partenaire - Commandes'>
       <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Gestion des commandes - {user?.name}</h2>
            <p className="text-sm text-slate-300 mt-1">Validation PDG requise pour toutes les commandes</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Commandes soumises et validées
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total commandes</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente PDG</p>
                <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.statut.includes("attente")).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Validées</p>
                <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.statut.includes("Validée")).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total montant</p>
                <p className="text-2xl font-bold text-gray-900">{orders.reduce((sum, o) => sum + o.montant, 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">F CFA</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {/* Toolbar */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>

                <Dialog open={showCreateOrderModal} onOpenChange={setShowCreateOrderModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle commande
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Création de nouvelle commande</DialogTitle>
                      <p className="text-sm text-gray-600">Cette commande nécessitera la validation du PDG</p>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Client Selection */}
                      <div>
                        <Label>Sélectionner le client *</Label>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un client" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockClients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name} ({client.phone})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Form Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Choix de la catégorie</Label>
                          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Primaire">Primaire</SelectItem>
                              <SelectItem value="Secondaire">Secondaire</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Choix de la Matière</Label>
                          <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez une matière" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Français">Français</SelectItem>
                              <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Choix de la classe</Label>
                          <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez la classe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CE1">CE1</SelectItem>
                              <SelectItem value="CE2">CE2</SelectItem>
                              <SelectItem value="CE1-CE2">CE1-CE2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Choix du livre</Label>
                          <Select value={selectedBook} onValueChange={setSelectedBook}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un livre" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockBooks.map(book => (
                                <SelectItem key={book.id} value={book.id}>
                                  {book.title} - {book.price.toLocaleString()} F CFA
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Quantité</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                          />
                        </div>

                        <div className="flex items-end">
                          <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            onClick={addOrderItem}
                            disabled={!selectedBook || quantity <= 0}
                          >
                            Ajouter <ChevronDown className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>

                      {/* Order Table */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left p-3">Livre</th>
                                <th className="text-left p-3">Prix</th>
                                <th className="text-left p-3">Quantité</th>
                                <th className="text-left p-3">Montant</th>
                                <th className="text-left p-3">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderItems.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-gray-500">
                                    Aucune commande ajoutée
                                  </td>
                                </tr>
                              ) : (
                                orderItems.map((item, index) => (
                                  <tr key={index}>
                                    <td className="p-3">{item.livre}</td>
                                    <td className="p-3">{item.prix.toLocaleString()} F CFA</td>
                                    <td className="p-3">{item.quantite}</td>
                                    <td className="p-3">{(item.prix * item.quantite).toLocaleString()} F CFA</td>
                                    <td className="p-3">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => removeOrderItem(index)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-semibold">Total: {orderTotal.toLocaleString()} F CFA</p>
                      </div>

                      {/* Bottom Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Code promo</Label>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="CODE PROMO" 
                              className="flex-1" 
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                            />
                            <Button className="bg-indigo-600 hover:bg-indigo-700">Appliquer</Button>
                          </div>
                        </div>

                        <div>
                          <Label>Type de commande</Label>
                          <Select value={orderType} onValueChange={setOrderType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Commande pour la rentrée scolaire" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="commande">Commande</SelectItem>
                              <SelectItem value="precommande">Précommande</SelectItem>
                              <SelectItem value="depot">Dépôt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Delivery coordination section */}
                      <div className="bg-black text-white p-4 rounded-lg">
                        <h3 className="font-semibold text-center">Coordonnées de Livraison</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Date de livraison *</Label>
                          <Input 
                            type="date" 
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Plage horaire</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">De</span>
                            <Input type="time" defaultValue="07:00" className="flex-1" />
                            <span className="text-sm">à</span>
                            <Input type="time" defaultValue="19:00" className="flex-1" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Adresse de livraison *</Label>
                        <Textarea
                          className="w-full p-3 border rounded-lg resize-none"
                          rows={3}
                          placeholder="Adresse de livraison"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Sélectionnez Mode de paiement *</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez mode de règlement" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mtn-benin">MTN Benin (Mobile Money)</SelectItem>
                            <SelectItem value="autre-reseau">Autre réseau (Moov, Celtiis, ...)</SelectItem>
                            <SelectItem value="depot-stock">Dépôt de stock</SelectItem>
                            <SelectItem value="momopay">MomoPay (Paiement comptant)</SelectItem>
                            <SelectItem value="carte-bancaire">Carte bancaire</SelectItem>
                            <SelectItem value="cheque-virement">Chèque/Virement</SelectItem>
                            <SelectItem value="reapprovisionnement">Réapprovisionnement</SelectItem>
                            <SelectItem value="proform">Proform</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-4 pt-4">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 flex-1"
                          onClick={createOrder}
                          disabled={!selectedClient || orderItems.length === 0 || !deliveryDate || !deliveryAddress || !paymentMethod}
                        >
                          Soumettre pour validation PDG <Package className="w-4 h-4 ml-2" />
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => setShowCreateOrderModal(false)}
                        >
                          Fermer <X className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Filtres de consultation</h3>
              <p className="text-sm text-gray-600">Filtrez vos commandes selon leurs statuts</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="attente">En attente validation PDG</SelectItem>
                  <SelectItem value="Validée">Validée par PDG</SelectItem>
                  <SelectItem value="refusée">Refusée</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les types</SelectItem>
                  <SelectItem value="commande">Commande</SelectItem>
                  <SelectItem value="precommande">Précommande</SelectItem>
                  <SelectItem value="depot">Dépôt</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center">
                <Input 
                  placeholder="Rechercher par référence ou client..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex items-center">
                <Button className="bg-indigo-600 hover:bg-indigo-700 w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Appliquer filtres
                </Button>
              </div>
            </div>
          </div>

          {/* Table Controls */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="25">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Résultats: {filteredOrders.length}</span>
              </div>
            </div>
          </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Référence</th>
                <th className="text-left p-4">Client</th>
                <th className="text-left p-4">Nbr. livre</th>
                <th className="text-left p-4">Montant</th>
                <th className="text-left p-4">Date livraison</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Livraison</th>
                <th className="text-left p-4">Paiement</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          order.statut.includes("attente") ? "bg-yellow-500" :
                          order.statut.includes("Validée") ? "bg-green-500" : "bg-red-500"
                        }`}></div>
                        <span className="font-medium">{order.id}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{order.clientName}</p>
                        <p className="text-sm text-gray-500">{order.clientPhone}</p>
                      </div>
                    </td>
                    <td className="p-4">{order.nbLivres}</td>
                    <td className="p-4 font-medium">{order.montant.toLocaleString()} F CFA</td>
                    <td className="p-4">{order.dateLivraison}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.type === "Commande" ? "bg-blue-100 text-blue-800" :
                        order.type === "Précommande" ? "bg-purple-100 text-purple-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.statut.includes("attente") ? "bg-yellow-100 text-yellow-800" :
                        order.statut.includes("Validée") ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {order.statut}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.livraison.includes("partielle") ? "bg-blue-100 text-blue-800" :
                        order.livraison.includes("attente") ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.livraison}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.paiement === "Enregistrée" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.paiement}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        {order.canEdit && (
                          <button 
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        {order.canDelete && (
                          <button 
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Supprimer"
                            onClick={() => deleteOrder(order.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Plus d'options"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Affichage de 1 à {filteredOrders.length} sur {filteredOrders.length} éléments
            </p>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Premier
              </Button>
              <Button variant="outline" size="sm" disabled>
                Précédent
              </Button>
              <Button variant="outline" size="sm" className="bg-indigo-600 text-white">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Suivant
              </Button>
              <Button variant="outline" size="sm" disabled>
                Dernier
              </Button>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
              EXCEL
            </Button>
            <Button variant="outline">
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </DynamicDashboardLayout>
  )
}
