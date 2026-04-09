const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const key = "AIzaSyAilXRlpS5CjbDqOBgF5Cikg_b4NDJ-XkU";
    const genAI = new GoogleGenerativeAI(key);
    
    try {
        // Since listModels is not directly on genAI in some versions or requires different auth
        // We will try to just call listModels via a raw fetch if needed, 
        // but first let's try the common models again with a very simple prompt.
        
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
        
        for (const m of models) {
            console.log(`Checking model: ${m}...`);
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("hi");
                console.log(`Success with ${m}: ${result.response.text()}`);
                return;
            } catch (e) {
                console.log(`Failed ${m}: ${e.message}`);
            }
        }
    } catch (err) {
        console.error("Global error:", err.message);
    }
}

listModels();
