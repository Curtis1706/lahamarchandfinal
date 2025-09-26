// Test de l'endpoint de debug
const testDebugEndpoint = async () => {
  try {
    console.log("🧪 Test de l'endpoint de debug...");
    
    const response = await fetch('http://localhost:3000/api/debug-works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: "data" })
    });

    console.log("Status:", response.status);
    const result = await response.json();
    console.log("Result:", result);

  } catch (error) {
    console.error("Error:", error.message);
  }
};

testDebugEndpoint();


