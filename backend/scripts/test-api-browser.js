// Test simple pour vérifier la réponse de l'API
console.log("🧪 Test de l'API d'inscription")

const testData = {
  email: "test@example.com",
  password: "test123456",
  name: "Test User",
  role: "CLIENT"
}

fetch('/api/auth/sign-up/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log("📊 Status:", response.status)
  return response.json()
})
.then(data => {
  console.log("📊 Response:", data)
  console.log("📊 Error structure:", data.error)
  console.log("📊 Data structure:", data.data)
})
.catch(error => {
  console.error("💥 Fetch error:", error)
})



