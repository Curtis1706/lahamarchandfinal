"use client"

import { RefreshCw, Maximize2, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DashboardLayout from "@/components/dashboard-layout-client"

export default function ProfilPage() {
  return (
    <DashboardLayout title="">
      {/* Barre entête bleu foncé */}


      {/* Bloc principal */}
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header blanc */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mes informations</h3>
              <div className="flex gap-2">
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Réduire"
                >
                  <span className="block w-4 h-[2px] bg-gray-600"></span>
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Actualiser"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Plein écran"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <Button className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Supprimer mon compte
            </Button>
          </div>

          {/* Formulaire */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ligne 1 */}
              <div>
                <Label>Type de client :</Label>
                <Input value="Ecole contractuelle" disabled />
              </div>
              <div>
                <Label>Directeur :</Label>
                <Input />
              </div>

              {/* Ligne 2 */}
              <div>
                <Label>Dénomination :</Label>
                <Input value="ECOLE CONTRACTUELLE" />
              </div>
              <div>
                <Label>Email :</Label>
                <Input value="juvenal@urban-technology.net" />
              </div>

              {/* Ligne 3 */}
              <div>
                <Label>Département :</Label>
                <Input value="ATLANTIQUE" />
              </div>
              <div>
                <Label>N° IFU :</Label>
                <Input value="94551975" />
              </div>

              {/* Ligne 4 */}
              <div>
                <Label>Téléphone :</Label>
                <div className="flex">
                  <span className="px-3 flex items-center border border-r-0 rounded-l-md bg-gray-100 text-sm">
                    +229
                  </span>
                  <Input value="94 55 19 75" className="rounded-l-none" />
                </div>
              </div>
              <div>
                <Label>Fondé :</Label>
                <Input />
              </div>

              {/* Ligne 5 */}
              <div>
                <Label>Adresse :</Label>
                <textarea className="w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <Label>Image de profil :</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm">
                    Choisir un fichier
                  </Button>
                  <span className="text-sm text-gray-500">
                    Aucun fichier choisi
                  </span>
                </div>
              </div>

              {/* Ligne 6 */}
              <div className="col-span-2">
                <Label>
                  Contrat signé
                  <span className="text-red-500 text-xs ml-1">
                    (Document ou Image)
                  </span>
                </Label>
                <div className="flex items-center gap-3 mt-1">
                  <Button variant="outline" size="sm">
                    Choisir un fichier
                  </Button>
                  <span className="text-sm text-gray-500">
                    Aucun fichier choisi
                  </span>
                </div>
              </div>
            </div>

            {/* Boutons bas */}
            <div className="flex justify-end pt-8 gap-3">
              <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
