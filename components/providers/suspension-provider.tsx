"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { SuspensionModal } from "@/components/suspension-modal"

export function SuspensionProvider({ children }: { children: React.ReactNode }) {
    const [showModal, setShowModal] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const handleSuspension = () => {
            setShowModal(true)
        }

        // Écouter l'événement de suspension
        window.addEventListener('account-suspended', handleSuspension)

        return () => {
            window.removeEventListener('account-suspended', handleSuspension)
        }
    }, [])

    const handleClose = async () => {
        setShowModal(false)

        // Déconnecter l'utilisateur
        await signOut({ redirect: false })

        // Rediriger vers la page de connexion
        router.push('/auth/login')
    }

    return (
        <>
            {children}
            <SuspensionModal isOpen={showModal} onClose={handleClose} />
        </>
    )
}
