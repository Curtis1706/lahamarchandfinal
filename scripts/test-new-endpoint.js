// Test du nouvel endpoint
const testNewEndpoint = async () => {
  try {
    console.log("🧪 Test du nouvel endpoint /api/create-work...");
    
    const response = await fetch('http://localhost:3000/api/create-work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Test Nouvel Endpoint",
        isbn: `978-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        price: 1000,
        stock: 10,
        minStock: 5,
        maxStock: 100,
        disciplineId: "cmfu9p18l0001ul7o4a8t1mia", // Histoire
        authorId: "cmfu9p1np000jul7o1w45bn30", // Dr. Paul Nguema
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

testNewEndpoint();



