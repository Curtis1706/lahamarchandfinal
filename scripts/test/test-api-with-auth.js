const fetch = require('node-fetch')

async function testAPIWithAuth() {
  console.log('🧪 Test de l\'API avec authentification...')

  try {
    // Test 1: Vérifier que l'API répond
    console.log('\n1. Test de l\'endpoint /api/stock...')
    
    const response = await fetch('http://localhost:3000/api/stock?type=works', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)

    if (response.status === 401) {
      console.log('✅ API protégée - authentification requise (attendu)')
    } else if (response.status === 200) {
      const data = await response.json()
      console.log('✅ API accessible - données reçues:', data.length, 'éléments')
    } else {
      const errorText = await response.text()
      console.log('❌ Erreur inattendue:', errorText)
    }

    // Test 2: Vérifier les autres endpoints
    console.log('\n2. Test des autres endpoints...')
    
    const endpoints = [
      '/api/stock?type=movements',
      '/api/stock?type=alerts',
      '/api/stock?type=stats',
      '/api/stock?type=pending'
    ]

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(`http://localhost:3000${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        console.log(`   ${endpoint}: ${res.status}`)
      } catch (error) {
        console.log(`   ${endpoint}: Erreur - ${error.message}`)
      }
    }

    console.log('\n🎉 Test terminé!')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

testAPIWithAuth()
