const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: "AIzaSyBQwXEFVguxmLHCz2V60F_v4jI_SN-RT-w" });

async function gemini(prompt:string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });
  console.log(response.text);
  return response.text 
}

// gemini();
module.exports ={
    gemini
}