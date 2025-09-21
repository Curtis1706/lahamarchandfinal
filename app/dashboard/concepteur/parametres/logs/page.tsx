"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { RefreshCw, Maximize2 } from "lucide-react"

export default function LogsPage() {
  const [selectedLogType, setSelectedLogType] = useState("Log connexion")
  const [selectedDate, setSelectedDate] = useState("21/09/2025")
  const [selectedFile, setSelectedFile] = useState("Sélectionnez un fichier")

  const handleRefresh = () => {
    // Refresh functionality
  }

  return (
    <DashboardLayout title="Logs" breadcrumb="Tableau de bord"  onRefresh={handleRefresh}>
      <div className="p-6">
        {/* Card with refresh and expand buttons */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Logs</h2>
            <div className="flex items-center space-x-2">
              <button onClick={handleRefresh} className="p-2 hover:bg-gray-100 rounded-lg" title="Actualiser">
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg" title="Agrandir">
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1">
                <select
                  value={selectedLogType}
                  onChange={(e) => setSelectedLogType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Log connexion">Log connexion</option>
                  <option value="Log système">Log système</option>
                  <option value="Log erreurs">Log erreurs</option>
                </select>
              </div>

              <div className="flex-1">
                <input
                  type="date"
                  value="2025-09-21"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex-1">
                <select
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Sélectionnez un fichier">Sélectionnez un fichier</option>
                  <option value="log_20250921.txt">log_20250921.txt</option>
                  <option value="log_20250920.txt">log_20250920.txt</option>
                </select>
              </div>
            </div>

            {/* Log content area */}
            <div className="border border-gray-300 rounded-md h-96 bg-gray-50 overflow-y-auto">
              <div className="p-4 text-sm text-gray-500 font-mono">
                {/* Empty log area - matches the reference image */}
                <div className="h-full flex items-center justify-center text-gray-400">
                  Sélectionnez un fichier de log pour afficher son contenu
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
