"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface SuspensionModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SuspensionModal({ isOpen, onClose }: SuspensionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[140px] h-[140px] p-6 gap-0 rounded-xl flex flex-col items-center justify-center text-center">
                {/* Icône */}
                <div className="mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                </div>

                {/* Titre */}
                <DialogTitle className="text-lg font-semibold text-gray-900 mb-2">
                    Compte suspendu
                </DialogTitle>

                {/* Description */}
                <DialogDescription className="text-sm text-gray-600 mb-6 leading-relaxed">
                    Votre compte a été temporairement suspendu. Veuillez contacter le support.
                </DialogDescription>

                {/* Bouton */}
                <Button
                    onClick={onClose}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                >
                    J'ai compris
                </Button>
            </DialogContent>
        </Dialog>
    )
}
