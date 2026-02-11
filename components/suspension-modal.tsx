"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SuspensionModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SuspensionModal({ isOpen, onClose }: SuspensionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Compte suspendu
                    </DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        Votre compte a été temporairement suspendu.
                        <br />
                        Veuillez contacter le support pour plus d'information.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center mt-4">
                    <Button
                        onClick={onClose}
                        className="w-full sm:w-auto px-8"
                    >
                        J'ai compris
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
