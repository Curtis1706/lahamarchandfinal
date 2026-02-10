import { redirect } from 'next/navigation'

export default function ClientsPage() {
    // Rediriger vers la page de gestion des utilisateurs qui englobe les clients
    redirect('/dashboard/pdg/gestion-utilisateurs')
}
