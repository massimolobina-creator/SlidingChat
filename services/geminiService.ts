import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Simulates a translation service
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Translate the following text to ${targetLanguage}. Return ONLY the translated text, no explanations. Text: "${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Fallback to original
  }
};

// Transcribes audio to text for bot interaction
export const transcribeAudio = async (audioDataUrl: string): Promise<string> => {
  try {
    // Data URL format: data:audio/webm;base64,....
    const mimeType = audioDataUrl.split(';')[0].split(':')[1];
    const data = audioDataUrl.split(',')[1];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: "Transcribe the spoken audio into text. Return ONLY the transcription, nothing else." }
        ]
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Transcription error:", error);
    return "";
  }
};

// Simulates a reply from a nearby user
export const generateBotReply = async (
  history: { role: string; text: string }[], 
  botName: string, 
  botLanguage: string,
  userLanguage: string
): Promise<{ original: string; translated: string }> => {
  try {
    const prompt = `
      You are roleplaying as a user named "${botName}" on a messaging app called SlidingChat. 
      Your native language is "${botLanguage}".
      You are chatting with someone nearby. 
      Keep your responses short, casual, and friendly (like WhatsApp/Telegram messages).
      Do not be overly formal.
      
      The user just sent the last message in the history.
      Reply in your native language ("${botLanguage}").
    `;

    // Format history for context (simplification)
    const chatContext = history.map(h => `${h.role}: ${h.text}`).join('\n');

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `${prompt}\n\nChat History:\n${chatContext}\n\n${botName}:`,
    });

    const replyOriginal = response.text?.trim() || "...";

    // Now translate the reply to the user's language so they can understand it instantly
    const replyTranslated = await translateText(replyOriginal, userLanguage);

    return {
      original: replyOriginal,
      translated: replyTranslated
    };

  } catch (error) {
    console.error("Bot generation error:", error);
    return { original: "...", translated: "..." };
  }
};