import { GoogleGenAI } from '@google/genai';

export function getGeminiApiKeys(): string[] {
  const keys = [
    process.env.GEMINI_API_KEY_1 || process.env.NEXT_PUBLIC_GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2 || process.env.NEXT_PUBLIC_GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3 || process.env.NEXT_PUBLIC_GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4 || process.env.NEXT_PUBLIC_GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5 || process.env.NEXT_PUBLIC_GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  ].filter(Boolean) as string[];

  return Array.from(new Set(keys)); // Remove duplicates
}

export function getGeminiApiKey(sessionId?: string): string {
  const keys = getGeminiApiKeys();

  if (keys.length === 0) {
    throw new Error('Gemini API keys are not configured.');
  }

  // If a sessionId is provided, use its hash to consistently select the same key.
  if (sessionId) {
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      hash = (hash << 5) - hash + sessionId.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % keys.length;
    return keys[index];
  }

  // If no sessionId is provided, pick a random key for basic load balancing
  return keys[Math.floor(Math.random() * keys.length)];
}

export async function generateContentWithRotation(params: any): Promise<any> {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    throw new Error('Gemini API keys are not configured.');
  }

  // Pick a random starting index to distribute the load
  const startIndex = Math.floor(Math.random() * keys.length);
  let lastError: any;

  for (let i = 0; i < keys.length; i++) {
    const keyIndex = (startIndex + i) % keys.length;
    const apiKey = keys[keyIndex];
    
    try {
      console.log(`=== 🛠️ デバッグ: 現在使用中のAPIキー（頭7文字）: ${apiKey.substring(0, 7)}... ===`);
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error: any) {
      console.warn(`API key rotation: Key at index ${keyIndex} failed. Reason:`, error?.message || error);
      lastError = error;
      
      // If the error is a definitive Bad Request (400) due to prompt issues, retrying might not help
      // But for 429 (Too Many Requests), 500, 503, etc., we should continue to the next key.
      if (error?.status === 400) {
         throw error;
      }
    }
  }

  throw new Error(`All Gemini API keys failed. Last error: ${lastError?.message || 'Unknown error'}`);
}
