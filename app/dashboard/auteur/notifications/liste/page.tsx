"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  RefreshCw,
  Maximize2,
  Edit,
  Trash2,
  Play,
  ChevronsUpDown,
} from "lucide-react"
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"

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

const mockNotifications: Notification[] = [
  {
    code: "WELCOME_CLIENT",
    titre: "Bienvenue",
    statut: "Actif",
    dateCreation: "ven. 2 août 2024 14:10",
    dateModification: "2024-09-11T12:56:57+01:00",
    creePar: "Super administrateur (FASSINOU)",
    texte:
      "Bienvenue ! Votre compte a été créé avec succès. Vous pouvez maintenant commencer à explorer toutes les fonctionnalités de l'application.",
    actions: ["play", "edit", "delete"],
  },
  {
    code: "784149",
    titre: "test",
    statut: "Actif",
    dateCreation: "mer. 24 juil. 2024 17:48",
    dateModification: "Pas de modification",
    creePar: "Super administrateur (FASSINOU)",
    texte: "test",
    actions: ["play", "edit", "delete"],
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    titre: "",
    note: "",
  })

  const handleRefresh = () => {
    console.log("[v0] Refreshing notifications...")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleAddNotification = () => {
    console.log("[v0] Adding notification:", formData)
    setShowAddModal(false)
    setFormData({ code: "", titre: "", note: "" })
  }

  return (
    <DynamicDashboardLayout title="Notifications" breadcrumb="Auteur - Notifications">
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Gestions des notifications</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Notifications
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-slate-600 rounded-lg"
                title="Actualiser"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleFullscreen}
                className="p-2 hover:bg-slate-600 rounded-lg"
                title="Plein écran"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
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

            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Afficher</span>
                <Select defaultValue="5">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm">éléments</span>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Rechercher:</span>
                  <Input className="w-64" placeholder="" />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Code",
                    "Titre",
                    "Statut",
                    "Date de création",
                    "Date de modification",
                    "Créé par",
                    "Texte",
                    "Actions",
                  ].map((col, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-1">
                        <span>{col}</span>
                        {col !== "Actions" && (
                          <ChevronsUpDown className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.map((notification, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notification.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notification.titre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={
                          notification.statut === "Actif"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {notification.statut}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notification.dateCreation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notification.dateModification}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {notification.creePar}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {notification.texte}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Play className="w-4 h-4" />
                        </button>
                        <button className="text-yellow-600 hover:text-yellow-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de 1 à 2 sur 2 éléments
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  Premier
                </Button>
                <Button variant="outline" size="sm">
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-600 text-white"
                >
                  1
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
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="Code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titre">Titre</Label>
                <Input
                  id="titre"
                  value={formData.titre}
                  onChange={(e) =>
                    setFormData({ ...formData, titre: e.target.value })
                  }
                  placeholder="title"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder="note"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Fermer
            </Button>
            <Button
              onClick={handleAddNotification}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DynamicDashboardLayout>
  )
}
