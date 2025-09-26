// Test simple de l'API
const testSimpleAPI = async () => {
  try {
    console.log("🧪 Test simple de l'API...");
    
    const response = await fetch('http://localhost:3000/api/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Test Simple",
        isbn: "978-123-456-789-0",
        price: 1000,
        stock: 10,
        minStock: 5,
        maxStock: 100,
        disciplineId: "cmfu9p18l0001ul7o4a8t1mia",
        authorId: "cmfu9p1np000jul7o1w45bn30",
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

testSimpleAPI();


