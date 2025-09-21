import { signIn } from "next-auth/react"

// Test de connexion
async function testLogin() {
  console.log("🔐 Test de connexion...")
  
  try {
    const result = await signIn("credentials", {
      email: "client@lahamarchand.com",
      password: "password123",
      redirect: false,
    })
    
    console.log("Résultat de connexion:", result)
    
    // Test de l'API dashboard
    const response = await fetch('/api/client/dashboard', {
      credentials: 'include'
    })
    
    console.log("Status API dashboard:", response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log("Données dashboard:", data)
    } else {
      const error = await response.json()
      console.error("Erreur API dashboard:", error)
    }
    
  } catch (error) {
    console.error("Erreur de test:", error)
  }
}

// Exporter pour utilisation dans la console du navigateur
if (typeof window !== 'undefined') {
  (window as any).testLogin = testLogin
}

export { testLogin }



