const fetch = require('node-fetch')

async function testRegistrationAPI() {
  const baseURL = 'https://lahamarchand-gabon.vercel.app'
  
  const testData = {
    name: 'Harry ALOHOUTADE',
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    role: 'client',
    discipline: ''
  }
  
  try {
    console.log('🧪 Test de l\'API d\'inscription...')
    console.log('📝 Données de test:', testData)
    
    const response = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    console.log('\n📊 Réponse du serveur:')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    
    const responseText = await response.text()
    console.log('Body:', responseText)
    
    if (response.ok) {
      console.log('\n✅ Test réussi!')
      const data = JSON.parse(responseText)
      console.log('Utilisateur créé:', data.user)
    } else {
      console.log('\n❌ Test échoué!')
      console.log('Erreur:', responseText)
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message)
  }
}

testRegistrationAPI()
