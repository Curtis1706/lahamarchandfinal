"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown } from "lucide-react"

interface Country {
  code: string
  name: string
  dialCode: string
  flag: React.ReactNode
}

const countries: Country[] = [
  {
    code: "BJ",
    name: "Bénin",
    dialCode: "+229",
    flag: (
      <div className="w-4 h-3 relative flex">
        <div className="w-1/3 h-full bg-green-500"></div>
        <div className="w-2/3 h-full">
          <div className="w-full h-1/2 bg-yellow-400"></div>
          <div className="w-full h-1/2 bg-red-500"></div>
        </div>
      </div>
    ),
  },
  {
    code: "GA",
    name: "Gabon",
    dialCode: "+241",
    flag: (
      <div className="w-4 h-3 relative">
        <div className="w-full h-1 bg-green-500"></div>
        <div className="w-full h-1 bg-yellow-400"></div>
        <div className="w-full h-1 bg-blue-600"></div>
      </div>
    ),
  },
]

interface CountrySelectorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  selectedCountry?: Country
  onCountryChange?: (country: Country) => void
}

export function CountrySelector({
  value,
  onChange,
  placeholder,
  selectedCountry: propSelectedCountry,
  onCountryChange,
}: CountrySelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(propSelectedCountry || countries[0])
  const [open, setOpen] = useState(false)

  // Extraire le numéro sans l'indicatif pour l'affichage interne si nécessaire
  // Mais ici, on va gérer la valeur passée pour qu'elle soit "propre"
  const displayValue = value ? value.replace(selectedCountry.dialCode, "").replace(/\s+/g, '') : ""

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    onCountryChange?.(country)
    
    // Si on change de pays, on met à jour la valeur parente avec le nouvel indicatif
    if (displayValue && onChange) {
      onChange(country.dialCode + displayValue)
    }
    
    setOpen(false)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "") // Garder uniquement les chiffres
    if (onChange) {
      onChange(selectedCountry.dialCode + rawVal)
    }
  }

  const currentCountry = propSelectedCountry || selectedCountry

  return (
    <div className="relative">
      <div className="flex">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-12 px-3 bg-gray-50 border-0 rounded-l-xl rounded-r-none border-r border-gray-200 hover:bg-gray-100"
            >
              {currentCountry.flag}
              <span className="text-sm ml-2">{currentCountry.dialCode}</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <div className="max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                >
                  {country.flag}
                  <span className="flex-1 text-sm">{country.name}</span>
                  <span className="text-gray-500 text-sm">{country.dialCode}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Input
          type="tel"
          value={displayValue}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className="flex-1 h-12 bg-gray-50 border-0 rounded-r-xl rounded-l-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
