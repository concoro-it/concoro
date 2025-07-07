import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI for embeddings
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('Missing Google API Key for embeddings');
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || '');

/**
 * Generate embeddings for a text using Google's embedding model
 * @param text The text to embed
 * @returns Array of embedding values
 */
export async function embedText(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const embeddingResult = await model.embedContent(text);
    return embeddingResult.embedding.values;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
} 