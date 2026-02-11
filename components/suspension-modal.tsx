"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface SuspensionModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SuspensionModal({ isOpen, onClose }: SuspensionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] max-w-[340px] p-8 gap-0 rounded-2xl bg-white">
                <div className="flex flex-col items-center text-center">
                    {/* Icône cercle rouge avec X */}
                    <div className="mb-6">
                        <div className="w-16 h-16 rounded-full border-3 border-red-500 flex items-center justify-center">
                            <X className="w-8 h-8 text-red-500 stroke-[3]" />
                        </div>
                    </div>

                    {/* Titre (invisible mais requis pour accessibilité) */}
                    <DialogTitle className="sr-only">
                        Compte suspendu
                    </DialogTitle>

                    {/* Message */}
                    <DialogDescription className="text-gray-600 text-sm leading-relaxed mb-6 px-2">
                        Votre compte est temporairement désactivé.
                        <br />
                        Veuillez contacter le support pour plus d'information
                    </DialogDescription>

                    {/* Bouton bleu */}
                    <Button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                        Ok j'ai compris
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
