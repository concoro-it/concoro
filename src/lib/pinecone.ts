import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone client with enhanced error handling
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX || 'concorsi';

console.log('🔧 Pinecone Configuration:', {
  hasApiKey: !!PINECONE_API_KEY,
  indexName: PINECONE_INDEX_NAME,
  environment: process.env.NODE_ENV
});

if (!PINECONE_API_KEY) {
  console.error('❌ Missing Pinecone API Key - Set PINECONE_API_KEY in environment variables');
  console.log('💡 Required environment variables:');
  console.log('   - PINECONE_API_KEY: Your Pinecone API key');
  console.log('   - PINECONE_INDEX: Index name (defaults to "concorsi")');
}

let pineconeClient: Pinecone;
let pinecone: any;

try {
  pineconeClient = new Pinecone({ 
    apiKey: PINECONE_API_KEY || '' 
  });
  
  pinecone = pineconeClient.Index(PINECONE_INDEX_NAME);
  
  console.log('✅ Pinecone client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Pinecone client:', error);
  throw error;
}

export { pineconeClient, pinecone };
export const pineconeIndex = PINECONE_INDEX_NAME; 