"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RefreshCw, Maximize2, Download } from "lucide-react"
import { toast } from "sonner"

interface LogEntry {
  id: string
  timestamp: string
  action: string
  performedBy: string
  userId: string | null
  details: any
  formattedLine: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLogType, setSelectedLogType] = useState("Log connexion")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedFile, setSelectedFile] = useState("Sélectionnez un fichier")

  useEffect(() => {
    loadLogs()
  }, [selectedLogType, selectedDate])

  const loadLogs = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        logType: selectedLogType,
        date: selectedDate,
        limit: '1000' // Charger plus de logs pour l'affichage
      })

      const response = await fetch(`/api/pdg/parametres/logs?${params}`)
      if (!response.ok) throw new Error("Erreur lors du chargement")

      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error("Error loading logs:", error)
      toast.error("Erreur lors du chargement des logs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadLogs()
  }

  const handleExport = () => {
    const logContent = logs.map(log => log.formattedLine).join('\n')
    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${selectedDate}_${selectedLogType.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success("Logs exportés avec succès")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <>
      {/* En-tête */}
      <div className="bg-slate-700 text-white px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Logs</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-300">
              Tableau de bord - Logs
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Card with refresh and expand buttons */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Logs</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                title="Agrandir"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </Button>
              {logs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  title="Exporter"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </Button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1">
                <Select value={selectedLogType} onValueChange={setSelectedLogType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les logs</SelectItem>
                    <SelectItem value="Log connexion">Log connexion</SelectItem>
                    <SelectItem value="Log système">Log système</SelectItem>
                    <SelectItem value="Log erreurs">Log erreurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="flex-1">
                <Select value={selectedFile} onValueChange={setSelectedFile}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sélectionnez un fichier">Sélectionnez un fichier</SelectItem>
                    <SelectItem value={`log_${selectedDate.replace(/-/g, '')}.txt`}>
                      log_{selectedDate.replace(/-/g, '')}.txt
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Log content area */}
            <div className="border border-gray-300 rounded-md h-96 bg-gray-50 overflow-y-auto">
              <div className="p-4 text-sm text-gray-500 font-mono">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    Chargement des logs...
                  </div>
                ) : logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    Aucun log trouvé pour cette date et ce type
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="text-xs hover:bg-gray-100 p-1 rounded">
                        <span className="text-gray-600">{log.timestamp}</span>
                        {' '}
                        <span className="text-blue-600">[{log.action}]</span>
                        {' '}
                        <span className="text-gray-800">{log.performedBy}</span>
                        {log.userId && (
                          <>
                            {' '}
                            <span className="text-purple-600">(User: {log.userId})</span>
                          </>
                        )}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <>
                            {' '}
                            <span className="text-gray-500">- {JSON.stringify(log.details)}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Log stats */}
            {logs.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                <p>Total: {logs.length} entrée(s) de log</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
