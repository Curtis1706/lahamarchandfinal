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
            <DialogContent className="w-[140px] h-[140px] p-3 gap-0 rounded-lg flex flex-col items-center justify-center text-center">
                {/* Icône */}
                <div className="mb-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                </div>

                {/* Titre */}
                <DialogTitle className="text-xs font-semibold text-gray-900 mb-1">
                    Compte suspendu
                </DialogTitle>

                {/* Description */}
                <DialogDescription className="text-[10px] text-gray-600 mb-2 leading-tight">
                    Contactez le support
                </DialogDescription>

                {/* Bouton */}
                <Button
                    onClick={onClose}
                    className="w-full h-6 text-[10px] bg-gray-900 hover:bg-gray-800 text-white px-2"
                >
                    OK
                </Button>
            </DialogContent>
        </Dialog>
    )
}
