"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"


interface Remise {
  id: string
  client: string
  livre: string
  quantiteMin: number
  remise: number
  statut: "Actif" | "Inactif"
  creeLe: string
  creePar: string
  description: string
  type: string
  image?: string
}

interface Livre {
  id: string
  title: string
  isbn: string
  price: number
  files?: string | any
  image?: string
}

export default function RemisesPage() {
  const [remises, setRemises] = useState<Remise[]>([])
  const [livres, setLivres] = useState<Livre[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingLivres, setLoadingLivres] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRemise, setEditingRemise] = useState<Remise | null>(null)
  const [clientFilter, setClientFilter] = useState("Tous les clients")
  const [statusFilter, setStatusFilter] = useState("Tous les statuts")

  // Charger les remises depuis l'API
  useEffect(() => {
    loadRemises()
    loadLivres()
  }, [])

  const loadRemises = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pdg/remises')
      if (!response.ok) throw new Error('Erreur lors du chargement des remises')
      const data = await response.json()
      setRemises(data)
    } catch (error) {
      console.error('Error loading remises:', error)
      toast.error('Erreur lors du chargement des remises')
    } finally {
      setLoading(false)
    }
  }

  const loadLivres = async () => {
    try {
      setLoadingLivres(true)
      // Charger tous les livres (PUBLISHED et ON_SALE) sans limite de pagination
      const response = await fetch('/api/works?limit=1000')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur lors du chargement des livres')
      }
      
      const data = await response.json()
      console.log('📚 Données reçues de l\'API works:', data)
      
      // L'API retourne un objet avec works, pagination, stats
      const works = data.works || data || []
      console.log(`📚 ${works.length} livre(s) trouvé(s)`)
      
      if (works.length === 0) {
        console.warn('⚠️ Aucun livre trouvé dans la base de données')
        toast.info('Aucun livre disponible pour le moment')
        setLivres([])
        return
      }
      
      // Filtrer pour ne garder que les livres PUBLISHED ou ON_SALE
      const availableWorks = works.filter((work: any) => 
        work.status === 'PUBLISHED' || work.status === 'ON_SALE'
      )
      
      console.log(`📚 ${availableWorks.length} livre(s) disponible(s) (PUBLISHED ou ON_SALE)`)
      
      // Formater les livres avec extraction de l'image
      const formattedLivres = availableWorks.map((work: any) => {
        let coverImage = "/placeholder.jpg"
        if (work.files) {
          try {
            const filesData = typeof work.files === 'string' ? JSON.parse(work.files) : work.files
            if (filesData.coverImage) {
              coverImage = filesData.coverImage
            }
          } catch (e) {
            console.error("Erreur lors du parsing des fichiers:", e)
          }
        }
        
        return {
          id: work.id,
          title: work.title || "Sans titre",
          isbn: work.isbn || "",
          price: work.price || 0,
          image: coverImage
        }
      })
      
      if (formattedLivres.length === 0) {
        toast.warning('Aucun livre publié ou en vente disponible')
      }
      
      setLivres(formattedLivres)
      console.log('✅ Livres chargés avec succès:', formattedLivres.length)
    } catch (error: any) {
      console.error('❌ Error loading livres:', error)
      toast.error(error.message || 'Erreur lors du chargement des livres')
      setLivres([])
    } finally {
      setLoadingLivres(false)
    }
  }

  const [livreFilter, setLivreFilter] = useState("Tous les livres")
  const [itemsPerPage, setItemsPerPage] = useState("20")

  const [formData, setFormData] = useState({
    livre: "",
    livreId: "",
    typeClient: "",
    quantiteMinimale: "",
    type: "Pourcentage",
    remise: "",
    statut: "Actif",
    description: "",
  })

  const handleRefresh = () => {
    console.log("[v0] Refreshing remises...")
  }

  const filteredRemises = remises.filter((remise) => {
    const matchesSearch = remise.livre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "Tous les statuts" || remise.statut === statusFilter
    const matchesClient = clientFilter === "Tous les clients" || remise.client === clientFilter
    const matchesLivre = livreFilter === "Tous les livres" || remise.livre === livreFilter
    return matchesSearch && matchesStatus && matchesClient && matchesLivre
  })

  const handleSubmit = async () => {
    // Validation
    if (!formData.livre || formData.livre === "") {
      toast.error("Veuillez sélectionner un livre")
      return
    }
    
    if (!formData.typeClient) {
      toast.error("Veuillez sélectionner un type de client")
      return
    }
    
    if (!formData.remise || parseFloat(formData.remise) <= 0) {
      toast.error("Veuillez saisir une valeur de remise valide")
      return
    }
    
    if (!formData.quantiteMinimale || parseInt(formData.quantiteMinimale) < 1) {
      toast.error("La quantité minimale doit être au moins 1")
      return
    }

    try {
      const selectedLivre = livres.find(l => l.id === formData.livreId)
      const livreImage = selectedLivre?.image || "/placeholder.jpg"

      const response = await fetch('/api/pdg/remises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client: formData.typeClient,
          livre: formData.livre,
          quantiteMin: formData.quantiteMinimale,
          remise: formData.remise,
          statut: formData.statut,
          description: formData.description,
          type: formData.type,
          image: livreImage
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création de la remise')
      }

      toast.success('Remise créée avec succès')
      setShowAddModal(false)
      setFormData({
        livre: "",
        livreId: "",
        typeClient: "",
        quantiteMinimale: "",
        type: "Pourcentage",
        remise: "",
        statut: "Actif",
        description: "",
      })
      
      // Recharger la liste des remises
      loadRemises()
    } catch (error: any) {
      console.error('Error creating remise:', error)
      toast.error(error.message || 'Erreur lors de la création de la remise')
    }
  }

  const handleClose = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setEditingRemise(null)
    setFormData({
      livre: "",
      livreId: "",
      typeClient: "",
      quantiteMinimale: "",
      type: "Pourcentage",
      remise: "",
      statut: "Actif",
      description: "",
    })
  }

  const handleEdit = (remise: Remise) => {
    // Trouver le livre correspondant
    const livre = livres.find(l => l.title === remise.livre)
    
    setEditingRemise(remise)
    setFormData({
      livre: remise.livre,
      livreId: livre?.id || "",
      typeClient: remise.client,
      quantiteMinimale: remise.quantiteMin.toString(),
      type: remise.type,
      remise: remise.remise.toString(),
      statut: remise.statut,
      description: remise.description || "",
    })
    setShowEditModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette remise ?')) {
      return
    }

    try {
      const response = await fetch(`/api/pdg/remises?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression de la remise')
      }

      toast.success('Remise supprimée avec succès')
      loadRemises()
    } catch (error: any) {
      console.error('Error deleting remise:', error)
      toast.error(error.message || 'Erreur lors de la suppression de la remise')
    }
  }

  const handleUpdate = async () => {
    // Validation
    if (!formData.livre || formData.livre === "") {
      toast.error("Veuillez sélectionner un livre")
      return
    }
    
    if (!formData.typeClient) {
      toast.error("Veuillez sélectionner un type de client")
      return
    }
    
    if (!formData.remise || parseFloat(formData.remise) <= 0) {
      toast.error("Veuillez saisir une valeur de remise valide")
      return
    }
    
    if (!formData.quantiteMinimale || parseInt(formData.quantiteMinimale) < 1) {
      toast.error("La quantité minimale doit être au moins 1")
      return
    }

    if (!editingRemise) {
      toast.error("Aucune remise à modifier")
      return
    }

    try {
      const selectedLivre = livres.find(l => l.id === formData.livreId)
      const livreImage = selectedLivre?.image || editingRemise.image || "/placeholder.jpg"

      const response = await fetch('/api/pdg/remises', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingRemise.id,
          client: formData.typeClient,
          livre: formData.livre,
          quantiteMin: formData.quantiteMinimale,
          remise: formData.remise,
          statut: formData.statut,
          description: formData.description,
          type: formData.type,
          image: livreImage
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la modification de la remise')
      }

      toast.success('Remise modifiée avec succès')
      setShowEditModal(false)
      setEditingRemise(null)
      setFormData({
        livre: "",
        livreId: "",
        typeClient: "",
        quantiteMinimale: "",
        type: "Pourcentage",
        remise: "",
        statut: "Actif",
        description: "",
      })
      
      // Recharger la liste des remises
      loadRemises()
    } catch (error: any) {
      console.error('Error updating remise:', error)
      toast.error(error.message || 'Erreur lors de la modification de la remise')
    }
  }

  const getRemiseDisplay = (remise: Remise) => {
    if (remise.type === "Pourcentage") {
      return `${remise.remise}%`
    }
    return `${remise.remise} F CFA`
  }

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Les remises</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Remises
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" className="bg-indigo-600 text-white hover:bg-indigo-700">
                  Importer ↑
                </Button>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                Remise +
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous les clients">Tous les clients</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Représentant">Représentant</SelectItem>
                  <SelectItem value="Partenaire">Partenaire</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous les statuts">Tous les statuts</SelectItem>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
              <Select value={livreFilter} onValueChange={setLivreFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous les livres">Tous les livres</SelectItem>
                  {livres.map((livre) => (
                    <SelectItem key={livre.id} value={livre.title}>
                      {livre.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input
                  placeholder=""
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">CLIENT</th>
                  <th className="text-left p-4 font-medium text-gray-700">LIVRE(S)</th>
                  <th className="text-left p-4 font-medium text-gray-700">QUANTITÉ (MIN)</th>
                  <th className="text-left p-4 font-medium text-gray-700">REMISE</th>
                  <th className="text-left p-4 font-medium text-gray-700">STATUT</th>
                  <th className="text-left p-4 font-medium text-gray-700">CRÉÉ LE</th>
                  <th className="text-left p-4 font-medium text-gray-700">CRÉÉ PAR</th>
                  <th className="text-left p-4 font-medium text-gray-700">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      Chargement des remises...
                    </td>
                  </tr>
                ) : filteredRemises.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      Aucune remise trouvée
                    </td>
                  </tr>
                ) : (
                  filteredRemises.map((remise) => (
                    <tr key={remise.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-gray-900">{remise.client}</span>
                        </div>
                        {remise.description && (
                          <div className="text-sm text-gray-500 mt-1">{remise.description}</div>
                        )}
                        <div className="text-sm text-gray-500">Type: {remise.type}</div>
                      </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={remise.image || "/placeholder.svg"}
                          alt={remise.livre}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <span className="text-blue-600 font-medium">{remise.livre}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{remise.quantiteMin}</td>
                    <td className="p-4 text-gray-600">{getRemiseDisplay(remise)}</td>
                    <td className="p-4">
                      <Badge className="bg-green-100 text-green-800 border-green-200">{remise.statut}</Badge>
                    </td>
                    <td className="p-4 text-gray-600">{remise.creeLe}</td>
                    <td className="p-4 text-gray-600">{remise.creePar}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(remise)}
                          className="p-1 text-orange-500 hover:bg-orange-50 rounded transition-colors"
                          title="Modifier la remise"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(remise.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer la remise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de 1 à {Math.min(parseInt(itemsPerPage), filteredRemises.length)} sur {filteredRemises.length} élément{filteredRemises.length > 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Premier
              </Button>
              <Button variant="outline" size="sm" disabled>
                Précédent
              </Button>
              <Button variant="outline" size="sm" className="bg-indigo-600 text-white">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                4
              </Button>
              <Button variant="outline" size="sm">
                5
              </Button>
              <Button variant="outline" size="sm">
                Suivant
              </Button>
              <Button variant="outline" size="sm">
                Dernier
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Ajouter une remise</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="livre">Livre :</Label>
                <Select 
                  value={formData.livreId} 
                  onValueChange={(value) => {
                    const selectedLivre = livres.find(l => l.id === value)
                    setFormData({ 
                      ...formData, 
                      livreId: value,
                      livre: selectedLivre?.title || ""
                    })
                  }}
                  disabled={loadingLivres}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={
                      loadingLivres 
                        ? "Chargement des livres..." 
                        : livres.length === 0 
                          ? "Aucun livre disponible" 
                          : "Sélectionnez un livre"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {livres.length === 0 ? (
                      <SelectItem value="no-books" disabled>
                        {loadingLivres ? "Chargement..." : "Aucun livre disponible"}
                      </SelectItem>
                    ) : (
                      livres.map((livre) => (
                        <SelectItem key={livre.id} value={livre.id}>
                          {livre.title} {livre.isbn ? `(${livre.isbn})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!loadingLivres && livres.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    ⚠️ Aucun livre publié disponible. Veuillez publier des livres d'abord.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="typeClient">Type de client :</Label>
                  <Select
                    value={formData.typeClient}
                    onValueChange={(value) => setFormData({ ...formData, typeClient: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choisissez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Client">Client</SelectItem>
                      <SelectItem value="Représentant">Représentant</SelectItem>
                      <SelectItem value="Partenaire">Partenaire</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    La remise s'appliquera aux commandes de ce type de client
                  </p>
                </div>
                <div>
                  <Label htmlFor="quantiteMinimale">Quantité minimale :</Label>
                  <Input
                    id="quantiteMinimale"
                    type="number"
                    value={formData.quantiteMinimale}
                    onChange={(e) => setFormData({ ...formData, quantiteMinimale: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">Type :</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pourcentage">Pourcentage</SelectItem>
                      <SelectItem value="Montant">Montant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="remise">Remise :</Label>
                  <div className="relative mt-1">
                    <Input
                      id="remise"
                      type="number"
                      step={formData.type === "Pourcentage" ? "0.01" : "1"}
                      min="0"
                      max={formData.type === "Pourcentage" ? "100" : undefined}
                      value={formData.remise}
                      onChange={(e) => setFormData({ ...formData, remise: e.target.value })}
                      className="pr-12"
                      placeholder={formData.type === "Pourcentage" ? "0.00" : "0"}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {formData.type === "Pourcentage" ? "%" : "F CFA"}
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="statut">Statut :</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description :</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                Enregistrer
                <div className="w-4 h-4 border border-white rounded-sm"></div>
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
              >
                Fermer ×
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingRemise && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Modifier la remise</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="edit-livre">Livre :</Label>
                <Select 
                  value={formData.livreId} 
                  onValueChange={(value) => {
                    const selectedLivre = livres.find(l => l.id === value)
                    setFormData({ 
                      ...formData, 
                      livreId: value,
                      livre: selectedLivre?.title || ""
                    })
                  }}
                  disabled={loadingLivres}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={
                      loadingLivres 
                        ? "Chargement des livres..." 
                        : livres.length === 0 
                          ? "Aucun livre disponible" 
                          : "Sélectionnez un livre"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {livres.length === 0 ? (
                      <SelectItem value="no-books" disabled>
                        {loadingLivres ? "Chargement..." : "Aucun livre disponible"}
                      </SelectItem>
                    ) : (
                      livres.map((livre) => (
                        <SelectItem key={livre.id} value={livre.id}>
                          {livre.title} {livre.isbn ? `(${livre.isbn})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!loadingLivres && livres.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    ⚠️ Aucun livre publié disponible. Veuillez publier des livres d'abord.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-typeClient">Type de client :</Label>
                  <Select
                    value={formData.typeClient}
                    onValueChange={(value) => setFormData({ ...formData, typeClient: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choisissez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Client">Client</SelectItem>
                      <SelectItem value="Représentant">Représentant</SelectItem>
                      <SelectItem value="Partenaire">Partenaire</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    La remise s'appliquera aux commandes de ce type de client
                  </p>
                </div>
                <div>
                  <Label htmlFor="edit-quantiteMinimale">Quantité minimale :</Label>
                  <Input
                    id="edit-quantiteMinimale"
                    type="number"
                    min="1"
                    value={formData.quantiteMinimale}
                    onChange={(e) => setFormData({ ...formData, quantiteMinimale: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-type">Type :</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pourcentage">Pourcentage</SelectItem>
                      <SelectItem value="Montant">Montant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-remise">Remise :</Label>
                  <div className="relative mt-1">
                    <Input
                      id="edit-remise"
                      type="number"
                      step={formData.type === "Pourcentage" ? "0.01" : "1"}
                      min="0"
                      max={formData.type === "Pourcentage" ? "100" : undefined}
                      value={formData.remise}
                      onChange={(e) => setFormData({ ...formData, remise: e.target.value })}
                      className="pr-12"
                      placeholder={formData.type === "Pourcentage" ? "0.00" : "0"}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {formData.type === "Pourcentage" ? "%" : "F CFA"}
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-statut">Statut :</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description :</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button onClick={handleUpdate} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                Enregistrer les modifications
                <div className="w-4 h-4 border border-white rounded-sm"></div>
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
              >
                Annuler ×
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

