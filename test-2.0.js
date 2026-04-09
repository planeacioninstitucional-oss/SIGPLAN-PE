const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const key = "AIzaSyAilXRlpS5CjbDqOBgF5Cikg_b4NDJ-XkU";
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    try {
        const result = await model.generateContent("Dime 'Hola' si funcionas.");
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
