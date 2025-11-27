"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Maximize2, Edit, Power, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface NotificationChain {
  id: string
  client: string
  titre: string
  date: string
  statut: "Actif" | "Désactivé"
  creeeLe: string
  creePar: string
  sendSMS?: boolean
  sendEmail?: boolean
  daysBefore?: number
  message?: string
  orderReference?: string | null
}

export default function NotificationChainePage() {
  const [chains, setChains] = useState<NotificationChain[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showChainModal, setShowChainModal] = useState(false)
  const [editingChain, setEditingChain] = useState<NotificationChain | null>(null)
  const [clientFilter, setClientFilter] = useState("tous-clients")
  const [statusFilter, setStatusFilter] = useState("tous-statuts")
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string; phone: string }>>([])
  const [formData, setFormData] = useState({
    titre: "",
    client: "tous-clients",
    date: "",
    heure: "08:00",
    envoyeUnSMS: "Oui",
    envoyeUnMail: "Oui",
    nombreDeJoursAvant: "1",
    statut: "Actif",
    message: "",
  })

  useEffect(() => {
    loadChains()
    loadClients()
  }, [currentPage, itemsPerPage, clientFilter, statusFilter, searchTerm])

  const loadChains = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })

      if (clientFilter !== "tous-clients") {
        params.append("clientId", clientFilter)
      }
      if (statusFilter !== "tous-statuts") {
        params.append("status", statusFilter)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/pdg/notifications/chaine?${params}`)
      if (!response.ok) throw new Error("Erreur lors du chargement")

      const data = await response.json()
      setChains(data.chains || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalItems(data.pagination?.total || 0)
    } catch (error) {
      console.error("Error loading chains:", error)
      toast.error("Erreur lors du chargement des chaînes de notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const response = await fetch("/api/pdg/users?role=CLIENT")
      if (response.ok) {
        const data = await response.json()
        setClients(data.users || [])
      }
    } catch (error) {
      console.error("Error loading clients:", error)
    }
  }

  const handleCreateChain = async () => {
    try {
      if (!formData.titre || !formData.date || !formData.message) {
        toast.error("Veuillez remplir tous les champs requis")
        return
      }

      const url = editingChain 
        ? `/api/pdg/notifications/chaine`
        : `/api/pdg/notifications/chaine`
      
      const method = editingChain ? "PUT" : "POST"
      const body = editingChain 
        ? { id: editingChain.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de l'enregistrement")
      }

      toast.success(editingChain ? "Chaîne mise à jour avec succès" : "Chaîne créée avec succès")
      setShowChainModal(false)
      resetForm()
      loadChains()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = (chain: NotificationChain) => {
    setEditingChain(chain)
    // Extraire la date et l'heure depuis le format affiché
    const dateMatch = chain.date.match(/(\d{1,2})\s+\w+\s+(\d{4})\s+(\d{2}):(\d{2})/)
    const dateStr = dateMatch ? `${dateMatch[2]}-${getMonthNumber(dateMatch[1])}-${dateMatch[1]}` : ""
    const timeStr = dateMatch ? `${dateMatch[3]}:${dateMatch[4]}` : "08:00"
    
    setFormData({
      titre: chain.titre,
      client: chain.client !== "Tous les clients" ? chain.client.split("(")[0].trim() : "tous-clients",
      date: dateStr,
      heure: timeStr,
      envoyeUnSMS: chain.sendSMS ? "Oui" : "Non",
      envoyeUnMail: chain.sendEmail ? "Oui" : "Non",
      nombreDeJoursAvant: chain.daysBefore?.toString() || "1",
      statut: chain.statut,
      message: chain.message || "",
    })
    setShowChainModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette chaîne ?")) {
      return
    }

    try {
      const response = await fetch(`/api/pdg/notifications/chaine?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      toast.success("Chaîne supprimée avec succès")
      loadChains()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  const handleToggleStatus = async (chain: NotificationChain) => {
    try {
      const newStatus = chain.statut === "Actif" ? "Désactivé" : "Actif"
      const response = await fetch("/api/pdg/notifications/chaine", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: chain.id,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }

      toast.success(`Chaîne ${newStatus === "Actif" ? "activée" : "désactivée"} avec succès`)
      loadChains()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour")
    }
  }

  const resetForm = () => {
    setFormData({
      titre: "",
      client: "tous-clients",
      date: "",
      heure: "08:00",
      envoyeUnSMS: "Oui",
      envoyeUnMail: "Oui",
      nombreDeJoursAvant: "1",
      statut: "Actif",
      message: "",
    })
    setEditingChain(null)
  }

  const getMonthNumber = (monthName: string) => {
    const months: Record<string, string> = {
      "janv": "01", "févr": "02", "mars": "03", "avr": "04",
      "mai": "05", "juin": "06", "juil": "07", "août": "08",
      "sept": "09", "oct": "10", "nov": "11", "déc": "12"
    }
    return months[monthName] || "01"
  }

  const handleRefresh = () => {
    loadChains()
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Chaîne</h2>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <span className="text-sm text-slate-300">
              Tableau de bord - Chaîne
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header Section */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous-clients">Tous les clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.phone || client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous-statuts">Tous les statuts</SelectItem>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="desactive">Désactivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => { resetForm(); setShowChainModal(true); }} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Chaîne +
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Afficher</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => {
                    setItemsPerPage(parseInt(v))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm">éléments</span>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Rechercher:</span>
                  <Input
                    className="w-64"
                    placeholder="Titre, message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CLIENT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TITRE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DATE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CRÉÉ LE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CRÉÉ PAR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : chains.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Aucune chaîne de notifications trouvée
                    </td>
                  </tr>
                ) : (
                  chains.map((chain) => (
                    <tr key={chain.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${chain.statut === "Actif" ? "bg-green-500" : "bg-gray-400"}`}></div>
                          {chain.client}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{chain.titre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{chain.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={chain.statut === "Actif" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {chain.statut}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{chain.creeeLe}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{chain.creePar}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-yellow-600 hover:text-yellow-800"
                            onClick={() => handleEdit(chain)}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(chain.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            className={`${chain.statut === "Actif" ? "text-green-600 hover:text-green-800" : "text-gray-600 hover:text-gray-800"}`}
                            onClick={() => handleToggleStatus(chain)}
                          >
                            <Power className="w-4 h-4" />
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
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de {startIndex} à {endIndex} sur {totalItems} éléments
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Premier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={currentPage === 1 ? "bg-blue-600 text-white" : ""}
                >
                  {currentPage}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Dernier
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chain Modal */}
      <Dialog open={showChainModal} onOpenChange={(open) => { setShowChainModal(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChain ? "Modifier la chaîne" : "Créer une chaîne de notification"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre :</Label>
                <Input
                  id="titre"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Titre de la chaîne"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client :</Label>
                <Select value={formData.client} onValueChange={(value) => setFormData({ ...formData, client: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous-clients">Tous les clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.phone || client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date :</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heure">Heure :</Label>
                <Input
                  id="heure"
                  type="time"
                  value={formData.heure}
                  onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms">Envoyé un SMS :</Label>
                <Select
                  value={formData.envoyeUnSMS}
                  onValueChange={(value) => setFormData({ ...formData, envoyeUnSMS: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mail">Envoyé un Mail :</Label>
                <Select
                  value={formData.envoyeUnMail}
                  onValueChange={(value) => setFormData({ ...formData, envoyeUnMail: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jours">Nombre de jours avant :</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="jours"
                    type="number"
                    value={formData.nombreDeJoursAvant}
                    onChange={(e) => setFormData({ ...formData, nombreDeJoursAvant: e.target.value })}
                    className="w-16"
                    min="0"
                  />
                  <span className="text-sm text-gray-600">jour(s)</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="statut">Statut :</Label>
                <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Désactivé">Désactivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message à envoyer :</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Message"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowChainModal(false); resetForm(); }}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Fermer
            </Button>
            <Button onClick={handleCreateChain} className="bg-indigo-600 hover:bg-indigo-700">
              {editingChain ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
