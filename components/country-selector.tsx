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
    code: "BF",
    name: "Burkina Faso",
    dialCode: "+226",
    flag: (
      <div className="w-4 h-3 relative">
        <div className="w-full h-1/2 bg-red-500"></div>
        <div className="w-full h-1/2 bg-green-500"></div>
      </div>
    ),
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    dialCode: "+225",
    flag: (
      <div className="w-4 h-3 relative flex">
        <div className="w-1/3 h-full bg-orange-500"></div>
        <div className="w-1/3 h-full bg-white border-x border-gray-200"></div>
        <div className="w-1/3 h-full bg-green-500"></div>
      </div>
    ),
  },
  {
    code: "CG",
    name: "Congo",
    dialCode: "+242",
    flag: (
      <div className="w-4 h-3 relative">
        <div className="w-full h-1 bg-green-500"></div>
        <div className="w-full h-1 bg-yellow-400"></div>
        <div className="w-full h-1 bg-red-500"></div>
      </div>
    ),
  },
  {
    code: "CM",
    name: "Cameroun",
    dialCode: "+237",
    flag: (
      <div className="w-4 h-3 relative flex">
        <div className="w-1/3 h-full bg-green-500"></div>
        <div className="w-1/3 h-full bg-red-500"></div>
        <div className="w-1/3 h-full bg-yellow-400"></div>
      </div>
    ),
  },
  {
    code: "GN",
    name: "Guinée",
    dialCode: "+224",
    flag: (
      <div className="w-4 h-3 relative flex">
        <div className="w-1/3 h-full bg-red-500"></div>
        <div className="w-1/3 h-full bg-yellow-400"></div>
        <div className="w-1/3 h-full bg-green-500"></div>
      </div>
    ),
  },
  {
    code: "ML",
    name: "Mali",
    dialCode: "+223",
    flag: (
      <div className="w-4 h-3 relative flex">
        <div className="w-1/3 h-full bg-green-500"></div>
        <div className="w-1/3 h-full bg-yellow-400"></div>
        <div className="w-1/3 h-full bg-red-500"></div>
      </div>
    ),
  },
  {
    code: "NE",
    name: "Niger",
    dialCode: "+227",
    flag: (
      <div className="w-4 h-3 relative">
        <div className="w-full h-1 bg-orange-500"></div>
        <div className="w-full h-1 bg-white border-y border-gray-200"></div>
        <div className="w-full h-1 bg-green-500"></div>
      </div>
    ),
  },
  {
    code: "SN",
    name: "Sénégal",
    dialCode: "+221",
    flag: (
      <div className="w-4 h-3 relative flex">
        <div className="w-1/3 h-full bg-green-500"></div>
        <div className="w-1/3 h-full bg-yellow-400"></div>
        <div className="w-1/3 h-full bg-red-500"></div>
      </div>
    ),
  },
  {
    code: "TG",
    name: "Togo",
    dialCode: "+228",
    flag: (
      <div className="w-4 h-3 relative">
        <div className="w-full h-1 bg-green-500"></div>
        <div className="w-full h-1 bg-yellow-400"></div>
        <div className="w-full h-1 bg-green-500"></div>
        <div className="w-full h-1 bg-yellow-400"></div>
        <div className="w-full h-1 bg-green-500"></div>
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

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    onCountryChange?.(country)
    setOpen(false)
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
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-12 bg-gray-50 border-0 rounded-r-xl rounded-l-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
