const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    const key = process.env.GEMINI_API_KEY?.trim();
    console.log("Testing with Key starting with:", key?.substring(0, 10));

    if (!key) {
        console.error("No API Key found in .env.local");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        
        console.log("Testing gemini-1.5-flash...");
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const resultFlash = await modelFlash.generateContent("Hola, responde con un 'OK' si recibes esto.");
        console.log("Flash response:", resultFlash.response.text());

    } catch (error) {
        console.error("Error with Flash:", error.message);
        
        try {
            console.log("Testing gemini-pro...");
            const genAI = new GoogleGenerativeAI(key);
            const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
            const resultPro = await modelPro.generateContent("Hola, responde con un 'OK' si recibes esto.");
            console.log("Pro response:", resultPro.response.text());
        } catch (error2) {
            console.error("Error with Pro:", error2.message);
        }
    }
}

testGemini();
