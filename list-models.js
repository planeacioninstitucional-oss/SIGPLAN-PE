const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
    const key = "AIzaSyAilXRlpS5CjbDqOBgF5Cikg_b4NDJ-XkU";
    const genAI = new GoogleGenerativeAI(key);
    
    try {
        // In @google/generative-ai v0.24.x, listModels is a method of the client?
        // Let's check the prototype or just try to fetch it.
        console.log("Attempting to list models via API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("Available models:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log("No models found or error:", JSON.stringify(data));
        }
        
    } catch (err) {
        console.error("Error:", err.message);
    }
}

run();
