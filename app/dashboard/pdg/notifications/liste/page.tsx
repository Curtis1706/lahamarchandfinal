"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Edit,
  Trash2,
  Play,
  ChevronsUpDown,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  code: string
  titre: string
  statut: "Actif" | "Inactif"
  dateCreation: string
  dateModification: string
  creePar: string
  texte: string
  actions: string[]
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    code: "",
    titre: "",
    note: "",
  })

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pdg/notifications-templates')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les notifications",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des notifications",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadNotifications()
  }

  const handleAddNotification = async () => {
    try {
      const response = await fetch('/api/pdg/notifications-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code,
          titre: formData.titre,
          texte: formData.note,
          statut: "Actif"
        }),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Notification créée avec succès"
        })
        setShowAddModal(false)
        setFormData({ code: "", titre: "", note: "" })
        loadNotifications()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer la notification",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating notification:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la notification",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (code: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")) {
      return
    }

    try {
      const response = await fetch(`/api/pdg/notifications-templates?code=${code}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Notification supprimée avec succès"
        })
        loadNotifications()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la notification",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      })
    }
  }

  const filteredNotifications = notifications.filter((notif) =>
    notif.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Gestions des notifications</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Notifications
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header Section */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Liste des notifications</h3>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Ajouter
              </Button>
            </div>

            {/* Table Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <Select defaultValue="20">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Code <ChevronsUpDown className="inline w-4 h-4 ml-1" />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Titre <ChevronsUpDown className="inline w-4 h-4 ml-1" />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Statut <ChevronsUpDown className="inline w-4 h-4 ml-1" />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Date création <ChevronsUpDown className="inline w-4 h-4 ml-1" />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Date modification <ChevronsUpDown className="inline w-4 h-4 ml-1" />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Créé par <ChevronsUpDown className="inline w-4 h-4 ml-1" />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Chargement des notifications...
                    </td>
                  </tr>
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Aucune notification trouvée
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((notif, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{notif.code}</td>
                      <td className="py-3 px-4 text-sm font-medium">{notif.titre}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={notif.statut === "Actif" ? "default" : "secondary"}
                          className={
                            notif.statut === "Actif"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {notif.statut}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {notif.dateCreation}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {notif.dateModification}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {notif.creePar}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Play className="w-4 h-4 text-green-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Edit className="w-4 h-4 text-orange-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(notif.code)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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
          <div className="p-6 border-t flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Affichage de 1 à {filteredNotifications.length} sur {notifications.length} éléments
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Premier</Button>
              <Button variant="outline" size="sm">Précédent</Button>
              <Button variant="outline" size="sm" className="bg-indigo-600 text-white">
                1
              </Button>
              <Button variant="outline" size="sm">Suivant</Button>
              <Button variant="outline" size="sm">Dernier</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ajouter */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter une notification</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Code</Label>
              <Input
                placeholder="Ex: WELCOME_USER"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div>
              <Label>Titre</Label>
              <Input
                placeholder="Titre de la notification"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              />
            </div>

            <div>
              <Label>Note / Message</Label>
              <Textarea
                placeholder="Contenu de la notification"
                rows={5}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Fermer
            </Button>
            <Button
              onClick={handleAddNotification}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={!formData.titre || !formData.note}
            >
              Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}