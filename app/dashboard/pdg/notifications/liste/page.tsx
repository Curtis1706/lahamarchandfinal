"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { RefreshCw, Maximize2, Edit, Trash2, Send } from "lucide-react"

interface Notification {
  code: string
  titre: string
  statut: string
  dateCreation: string
  dateModification: string
  creePar: string
  texte: string
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
  },
  {
    code: "784149",
    titre: "test",
    statut: "Actif",
    dateCreation: "mer. 24 juil. 2024 17:48",
    dateModification: "Pas de modification",
    creePar: "Super administrateur (FASSINOU)",
    texte: "test",
  },
]

export default function NotificationsListePage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const handleRefresh = () => {
    // Refresh functionality
  }

  const handleAddNotification = () => {
    setShowModal(true)
  }

  return (
    <DashboardLayout
      title="Gestions des notifications"
      breadcrumb="Tableau de bord - Notifications"
      
      onRefresh={handleRefresh}
    >
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Liste des notifications</h2>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg" title="Réduire">
                <span className="text-gray-600">−</span>
              </button>
              <button onClick={handleRefresh} className="p-2 hover:bg-gray-100 rounded-lg" title="Actualiser">
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg" title="Agrandir">
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Add button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleAddNotification}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Ajouter
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <span className="text-sm text-gray-600">éléments</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Rechercher:</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm w-64"
                  placeholder=""
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                      Code <span className="text-gray-400">↕</span>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                      Titre <span className="text-gray-400">↕</span>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                      Statut <span className="text-gray-400">↕</span>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                      Date de création <span className="text-gray-400">↕</span>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                      Date de modification <span className="text-gray-400">▼</span>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                      Créé par <span className="text-gray-400">↕</span>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Texte</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification, index) => (
                    <tr key={notification.code} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="py-3 px-4 text-sm text-gray-900">{notification.code}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{notification.titre}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          {notification.statut}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{notification.dateCreation}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{notification.dateModification}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {notification.creePar}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{notification.texte}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800" title="Envoyer">
                            <Send className="w-4 h-4" />
                          </button>
                          <button className="text-orange-600 hover:text-orange-800" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800" title="Supprimer">
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
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <div>Affichage de 1 à 2 sur 2 éléments</div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Premier</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Précédent</button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Suivant</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Dernier</button>
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium">Ajouter</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="Code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                  <input
                    type="text"
                    placeholder="title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                  <textarea
                    placeholder="note"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-4 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Fermer ×
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Enregistrer 💾
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
