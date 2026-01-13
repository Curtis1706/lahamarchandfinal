"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Wallet, TrendingUp, CheckCircle, Clock, FileText } from "lucide-react"
import { toast } from "sonner"

interface GainsData {
  totals: {
    total: number
    available: number
    paid: number
  }
  projects: Array<{
    projectId: string | null
    projectTitle: string
    total: number
    available: number
    paid: number
    lines: Array<{
      id: string
      amount: number
      approved: boolean
      paid: boolean
      approvedAt: string | null
      paidAt: string | null
      createdAt: string
      workTitle: string | null
      workId: string
    }>
  }>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function GainsPage() {
  const { user } = useCurrentUser()
  const [data, setData] = useState<GainsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role === "CONCEPTEUR") {
      loadGains()
    }
  }, [user])

  const loadGains = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/concepteur/gains")
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des gains")
      }
      const gainsData = await response.json()
      setData(gainsData)
    } catch (error: any) {
      console.error("Error loading gains:", error)
      toast.error(error.message || "Erreur lors du chargement des gains")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des gains...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mes Gains</h1>
          <p className="text-gray-600">Gains générés par vos projets validés</p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total des gains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totals.total)}</div>
            <p className="text-xs text-gray-500 mt-1">Tous les gains cumulés</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(data.totals.available)}</div>
            <p className="text-xs text-blue-600 mt-1">Approuvé, en attente de paiement</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Payé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(data.totals.paid)}</div>
            <p className="text-xs text-green-600 mt-1">Déjà payé</p>
          </CardContent>
        </Card>
      </div>

      {/* Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Wallet className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Comment ça marche ?</h4>
              <p className="text-sm text-blue-700 mt-1">
                Les gains sont calculés automatiquement sur les ventes des œuvres liées à vos projets validés.
                Les gains sont d'abord <strong>approuvés</strong> par le PDG, puis <strong>payés</strong> selon les règles définies.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                💡 Pour retirer vos gains, rendez-vous dans la section <strong>Retraits</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des projets */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Gains par projet</h2>

        {data.projects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun gain pour le moment</h3>
              <p className="text-gray-500">
                Les gains apparaîtront ici une fois que vos projets validés généreront des ventes.
              </p>
            </CardContent>
          </Card>
        ) : (
          data.projects.map((project) => (
            <Card key={project.projectId || "no-project"} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() =>
                    setExpandedProject(
                      expandedProject === project.projectId ? null : project.projectId || "no-project"
                    )
                  }
                >
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.projectTitle}</CardTitle>
                    <CardDescription className="mt-1">
                      Total: {formatCurrency(project.total)} • Disponible: {formatCurrency(project.available)} • Payé:{" "}
                      {formatCurrency(project.paid)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={project.total > 0 ? "default" : "outline"}>
                      {project.lines.length} gain{project.lines.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {expandedProject === (project.projectId || "no-project") && (
                <CardContent>
                  <div className="space-y-3 pt-4 border-t">
                    {project.lines.map((line) => (
                      <div
                        key={line.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{line.workTitle || "Œuvre non nommée"}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(line.createdAt).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(line.amount)}</div>
                          <div className="text-xs">
                            {line.paid ? (
                              <Badge variant="default" className="bg-green-600">
                                Payé
                              </Badge>
                            ) : line.approved ? (
                              <Badge variant="secondary">Approuvé</Badge>
                            ) : (
                              <Badge variant="outline">En attente</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

