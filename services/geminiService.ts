// FIX: Import the `Content` type from the @google/genai package to correctly type the chat history.
import { GoogleGenAI, Chat, GenerateContentResponse, Part, Content } from "@google/genai";
import { groundwaterData } from '../data/groundwaterData';
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chat: Chat | null = null;

const systemInstruction = `You are 'Ingres', an advanced AI assistant specializing in groundwater analysis and conservation. Your purpose is to help users understand groundwater data, predict future trends, and provide actionable suggestions for sustainability.

You have access to historical groundwater data for several districts in Tamil Nadu from 2020 to 2025. This data is provided below.

Your capabilities:
1.  **Analyze Data:** Answer questions about the provided historical data.
2.  **Visualize Data:** If asked to show a graph, chart, or visualize data for a district, you MUST respond with ONLY the special command: \`[SHOW_GRAPH:DISTRICT_NAME]\`. Replace DISTRICT_NAME with the relevant district (e.g., Chennai, Madurai).
3.  **Predict Trends:** If asked for a forecast or prediction for the next year (2026), analyze the time-series data for a specific district and provide a reasoned estimate. You MUST respond with ONLY the special command: \`[PREDICT:DISTRICT_NAME]\`.
4.  **Provide Suggestions:** When asked for advice, conservation tips, or suggestions, analyze the district's status. Your suggestions MUST be short and conversational, like you are chatting with a friend. For instance: "The water level in Chennai is critical. We could all help by trying rainwater harvesting or fixing leaky taps at home. Every little bit helps!"
5.  **Borewell Suggestions:** If a user asks about building a borewell or drilling depth in a specific district (e.g., "how deep to drill for a borewell in Chennai?"), you MUST analyze the latest available data for that district from the provided dataset, specifically the 'Status' and 'WaterLevel_m' fields. Based on this, you MUST provide a conversational recommendation about the drilling depth:
    *   If the latest 'Status' is 'Safe': Respond with something like, "Good news! The groundwater levels in [District] are safe. You should expect to find water at a depth of around [WaterLevel_m] meters. It's always wise to drill a bit deeper to ensure a consistent supply."
    *   If the latest 'Status' is 'Semi-Critical': Respond with something like, "You can drill for a borewell in [District], but you'll need to be careful. The water levels are semi-critical. Plan to drill to at least [WaterLevel_m] meters to reach the water table. Also, consider setting up rainwater harvesting to help improve the groundwater levels."
    *   If the latest 'Status' is 'Critical': Respond with something like, "This is a tough one. The groundwater in [District] is at a critical level. If a borewell is absolutely essential, you will need to drill deeper than [WaterLevel_m] meters. Please be aware that the water supply might not be reliable. I strongly suggest focusing on water conservation and rainwater harvesting to help recharge our precious groundwater."
    *   For general borewell questions not tied to a specific district, provide general conservation tips like suggesting rainwater harvesting or checking for leaks.
6.  **Be Multilingual:** You MUST respond in the language of the user's last prompt.
7.  **General Conversation:** For greetings or general questions, respond politely and guide the user towards your capabilities.


Here is the historical data you must use:
${JSON.stringify(groundwaterData, null, 2)}
`;


export const startChat = () => {
  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: [],
    config: {
        systemInstruction: systemInstruction,
    }
  });
};

export const getChatbotResponse = async (userMessage: Message, history: Message[], language: string): Promise<string> => {
    if (!chat) {
        startChat();
    }
    
    // Construct history for the API call, excluding special message types like graphs
    // FIX: The chat history should be an array of `Content` objects, not `Part` objects.
    // A `Content` object has a `role` and `parts` property.
    const apiHistory: Content[] = history
        .filter(msg => msg.type === 'text') // Only send text messages as history
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

    // Re-initialize chat with the current history to ensure context
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: apiHistory,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    try {
        const response: GenerateContentResponse = await chat.sendMessage({ message: `(Respond in ${language}) ${userMessage.text}` });
        return response.text;
    } catch (error) {
        console.error("Error fetching response from Gemini:", error);
        return "Sorry, I'm having trouble connecting right now. Please try again later.";
    }
};

export const getPredictionFromGemini = async (district: string, language: string): Promise<string> => {
    const districtData = groundwaterData.filter(d => d.District === district);

    const prompt = `
    You are a data scientist specializing in hydrological time-series analysis.
    (Respond in ${language})
    Based on the following time-series data for the ${district} district, perform a sophisticated forecast to predict the values for the year 2026. Consider the underlying trends, acceleration/deceleration in changes, and historical volatility. Use a method conceptually similar to exponential smoothing to weigh recent years more heavily.

    Data: ${JSON.stringify(districtData, null, 2)}

    Provide your prediction as a single, clean JSON object with NO other text or markdown. The JSON object must have these exact keys: "Recharge_MCM" (number), "WaterLevel_m" (number), "Rainfall_mm" (number), "confidence" (string, one of "High", "Medium", or "Low"), and "rationale" (string, a brief one-sentence explanation for your confidence level).
    `;

     try {
        // FIX: Use the correct API `ai.models.generateContent` and configuration for JSON output.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching prediction from Gemini:", error);
        return `{"error": "Failed to generate prediction for ${district}."}`;
    }
};