// Test de la route catch-all Better Auth
console.log("🧪 Test de la route catch-all Better Auth")

const testData = {
  email: "test-catchall@example.com",
  password: "test123456",
  name: "Test Catchall User",
  role: "CLIENT"
}

// Tester la route catch-all
fetch('/api/auth/sign-up/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log("📊 Status:", response.status)
  console.log("📊 Headers:", Object.fromEntries(response.headers.entries()))
  return response.json().catch(() => response.text())
})
.then(data => {
  console.log("📊 Response:", data)
})
.catch(error => {
  console.error("💥 Fetch error:", error)
})



