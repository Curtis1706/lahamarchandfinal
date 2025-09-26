// Test de l'endpoint simple
const testSimpleEndpoint = async () => {
  try {
    console.log("🧪 Test de l'endpoint simple...");
    
    const response = await fetch('http://localhost:3000/api/test-works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Test Simple",
        status: "DRAFT"
      })
    });

    console.log("Status:", response.status);
    const result = await response.json();
    console.log("Result:", result);

  } catch (error) {
    console.error("Error:", error.message);
  }
};

testSimpleEndpoint();



