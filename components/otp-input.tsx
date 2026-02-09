"use client"

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface OTPInputProps {
    length?: number
    value: string
    onChange: (value: string) => void
    onComplete?: (value: string) => void
    disabled?: boolean
    error?: boolean
}

export function OTPInput({
    length = 6,
    value,
    onChange,
    onComplete,
    disabled = false,
    error = false
}: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(""))
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Synchroniser avec la valeur externe
    useEffect(() => {
        if (value.length === 0) {
            setOtp(Array(length).fill(""))
        } else {
            const digits = value.split("").slice(0, length)
            setOtp([...digits, ...Array(length - digits.length).fill("")])
        }
    }, [value, length])

    const handleChange = (index: number, digit: string) => {
        // Accepter uniquement les chiffres
        if (digit && !/^\d$/.test(digit)) return

        const newOtp = [...otp]
        newOtp[index] = digit

        setOtp(newOtp)
        const otpValue = newOtp.join("")
        onChange(otpValue)

        // Auto-focus sur le suivant
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        // Appeler onComplete si tous les chiffres sont remplis
        if (otpValue.length === length && onComplete) {
            onComplete(otpValue)
        }
    }

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        // Backspace : supprimer et revenir en arrière
        if (e.key === "Backspace") {
            e.preventDefault()
            const newOtp = [...otp]

            if (otp[index]) {
                // Si le champ actuel a une valeur, la supprimer
                newOtp[index] = ""
                setOtp(newOtp)
                onChange(newOtp.join(""))
            } else if (index > 0) {
                // Sinon, aller au champ précédent et le supprimer
                newOtp[index - 1] = ""
                setOtp(newOtp)
                onChange(newOtp.join(""))
                inputRefs.current[index - 1]?.focus()
            }
        }

        // Flèche gauche
        if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }

        // Flèche droite
        if (e.key === "ArrowRight" && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData("text/plain").trim()

        // Vérifier que c'est bien des chiffres
        if (!/^\d+$/.test(pastedData)) return

        const digits = pastedData.split("").slice(0, length)
        const newOtp = [...digits, ...Array(length - digits.length).fill("")]

        setOtp(newOtp)
        const otpValue = newOtp.join("")
        onChange(otpValue)

        // Focus sur le dernier champ rempli
        const lastFilledIndex = Math.min(digits.length - 1, length - 1)
        inputRefs.current[lastFilledIndex]?.focus()

        // Appeler onComplete si tous les chiffres sont remplis
        if (otpValue.length === length && onComplete) {
            onComplete(otpValue)
        }
    }

    const handleFocus = (index: number) => {
        // Sélectionner le contenu au focus
        inputRefs.current[index]?.select()
    }

    return (
        <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
                <Input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={() => handleFocus(index)}
                    disabled={disabled}
                    className={cn(
                        "w-12 h-12 text-center text-lg font-bold",
                        error && "border-red-500 focus-visible:ring-red-500",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label={`Digit ${index + 1}`}
                />
            ))}
        </div>
    )
}
