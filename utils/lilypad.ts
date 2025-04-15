// ["qwen2.5:7b","deepseek-r1:7b","llama3.1:8b","llava:7b","mistral:7b","phi4:14b","phi4-mini:3.8b","qwen2.5-coder:7b","deepscaler:1.5b","gemma3:4b","openthinker:7b"]},"message":"Retrieved models successfully","status":200}// lilypadChat.ts

export async function lilypadAgent(model:string, prompt:string) {
  const apiKey = process.env.NEXT_PUBLIC_LILYPAD_API_KEY;

  if (!apiKey) {
    throw new Error("Lilypad API key is missing.");
  }

  const response = await fetch("https://anura-testnet.lilypad.tech/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model, // Replace with actual model name and version
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
    }),
  });

  
  if (!response.ok) {
      throw new Error(`Lilypad API error: ${response.statusText}`);
    }
    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content ?? "No response content.";
    // console.log("res ", data,generatedText)


  return generatedText;
}
