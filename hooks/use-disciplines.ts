import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export interface Discipline {
  id: string
  name: string
}

export function useDisciplines() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDisciplines = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getDisciplines()
        setDisciplines(data)
      } catch (err) {
        setError('Erreur lors du chargement des disciplines')
        console.error('Error fetching disciplines:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDisciplines()
  }, [])

  return { disciplines, loading, error }
}
