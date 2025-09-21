// Fichier partagé pour les disciplines temporaires
export const tempDisciplines = [
  { id: '1', name: 'Mathématiques' },
  { id: '2', name: 'Français' },
  { id: '3', name: 'Physique' },
  { id: '4', name: 'Chimie' },
  { id: '5', name: 'Histoire' },
  { id: '6', name: 'Géographie' },
  { id: '7', name: 'Biologie' },
  { id: '8', name: 'Philosophie' },
  { id: '9', name: 'Littérature' },
  { id: '10', name: 'Sciences' }
]

// Fonction pour trouver une discipline par ID
export function findDisciplineById(id: string) {
  return tempDisciplines.find(d => d.id === id)
}

// Fonction pour trouver une discipline par nom
export function findDisciplineByName(name: string) {
  return tempDisciplines.find(d => d.name === name)
}


