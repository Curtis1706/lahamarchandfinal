"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
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
            <DialogContent className="w-[90vw] max-w-[340px] p-0 gap-0 rounded-2xl overflow-hidden">
                {/* Header avec gradient */}
                <div
                    className="pt-8 pb-6 px-6 text-center text-white"
                    style={{
                        background: "linear-gradient(135deg, #00d4ff 0%, #5b9bd5 25%, #8b5fbf 50%, #b83dba 75%, #e91e63 100%)"
                    }}
                >
                    <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <DialogTitle className="text-xl font-bold text-white mb-2">
                        Compte suspendu
                    </DialogTitle>
                </div>

                {/* Body */}
                <div className="px-6 py-6 bg-white">
                    <DialogDescription className="text-center text-gray-700 text-base leading-relaxed mb-6">
                        Votre compte a été temporairement suspendu.
                        <br />
                        Veuillez contacter le support pour plus d'information.
                    </DialogDescription>

                    {/* Bouton avec gradient */}
                    <Button
                        onClick={onClose}
                        className="w-full h-12 text-white font-semibold rounded-xl border-0"
                        style={{
                            background: "linear-gradient(90deg, #00d4ff 0%, #5b9bd5 25%, #8b5fbf 50%, #b83dba 75%, #e91e63 100%)"
                        }}
                    >
                        J'ai compris
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
