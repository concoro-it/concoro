#!/usr/bin/env ts-node

import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPineconeConnection() {
  console.log('🚀 Starting Pinecone Connection Test...\n');

  // 1. Check Environment Variables
  console.log('1️⃣ Checking Environment Variables:');
  console.log('   PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('   PINECONE_INDEX:', process.env.PINECONE_INDEX || 'concorsi (default)');
  console.log('   GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('   NEXT_PUBLIC_GOOGLE_API_KEY:', process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? '✅ Set' : '❌ Missing');

  if (!process.env.PINECONE_API_KEY) {
    console.error('\n❌ PINECONE_API_KEY is missing. Please set it in your .env file');
    return;
  }

  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) {
    console.error('\n❌ Google API Key is missing. Please set GOOGLE_API_KEY or NEXT_PUBLIC_GOOGLE_API_KEY in your .env file');
    return;
  }

  try {
    // 2. Initialize Pinecone Client
    console.log('\n2️⃣ Initializing Pinecone Client...');
    const pineconeClient = new Pinecone({ 
      apiKey: process.env.PINECONE_API_KEY 
    });
    console.log('   ✅ Pinecone client initialized');

    // 3. Get Index
    const indexName = process.env.PINECONE_INDEX || 'concorsi';
    console.log(`\n3️⃣ Connecting to Index: ${indexName}...`);
    const index = pineconeClient.Index(indexName);
    console.log('   ✅ Index connection established');

    // 4. Initialize Google AI for embeddings
    console.log('\n4️⃣ Initializing Google AI for embeddings...');
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    console.log('   ✅ Google AI initialized');

    // 5. Test embedding generation
    console.log('\n5️⃣ Testing embedding generation...');
    const testQuery = "ingegnere informatico Roma concorso pubblico";
    console.log(`   Query: "${testQuery}"`);
    
    const embeddingResult = await embeddingModel.embedContent(testQuery);
    const embedding = embeddingResult.embedding.values;
    
    console.log(`   ✅ Embedding generated: ${embedding.length} dimensions`);
    console.log(`   Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

    // 6. Test Pinecone query
    console.log('\n6️⃣ Testing Pinecone query...');
    const queryResult = await index.query({
      topK: 5,
      vector: embedding,
      includeMetadata: true,
    });

    console.log('   📊 Query Results:');
    console.log(`   - Matches found: ${queryResult.matches?.length || 0}`);
    console.log(`   - Namespace: ${queryResult.namespace || 'default'}`);
    
    if (queryResult.matches && queryResult.matches.length > 0) {
      console.log('\n   🔍 Match Details:');
      queryResult.matches.forEach((match, index) => {
        console.log(`     ${index + 1}. ID: ${match.id}`);
        console.log(`        Score: ${match.score?.toFixed(4)}`);
        console.log(`        Metadata:`, JSON.stringify(match.metadata, null, 8));
      });

      // Check for concorso_id in metadata
      const concorsoIds = queryResult.matches
        .map(match => match.metadata?.concorso_id)
        .filter(Boolean);
      
      console.log(`\n   📋 Extracted concorso_ids: [${concorsoIds.join(', ')}]`);
      
      if (concorsoIds.length === 0) {
        console.warn('   ⚠️  WARNING: No concorso_id found in metadata!');
        console.log('   💡 This might indicate:');
        console.log('      - Data was indexed without concorso_id metadata');
        console.log('      - Wrong metadata field name');
        console.log('      - Index contains different data structure');
      }
    } else {
      console.warn('   ⚠️  No matches found for the test query');
      console.log('   💡 This might indicate:');
      console.log('      - Index is empty');
      console.log('      - Data has different embedding model');
      console.log('      - Query doesn\'t match indexed content');
    }

    // 7. Check index stats (if available)
    console.log('\n7️⃣ Attempting to get index stats...');
    try {
      const stats = await index.describeIndexStats();
      console.log('   📈 Index Statistics:');
      console.log(`      - Total records: ${stats.totalRecordCount || 'Unknown'}`);
      console.log(`      - Dimension: ${stats.dimension || 'Unknown'}`);
      console.log(`      - Index fullness: ${stats.indexFullness || 'Unknown'}`);
      if (stats.namespaces) {
        console.log('      - Namespaces:', Object.keys(stats.namespaces));
      }
    } catch (statsError) {
      console.log('   ⚠️  Could not retrieve index stats');
    }

    console.log('\n🎉 Pinecone connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during Pinecone test:', error);
    
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
    
    console.log('\n💡 Troubleshooting tips:');
    console.log('   - Verify your PINECONE_API_KEY is correct');
    console.log('   - Check if the index name "concorsi" exists in your Pinecone project');
    console.log('   - Ensure the index has the correct dimensions (usually 768 for embedding-001)');
    console.log('   - Verify your Pinecone project has the index deployed');
  }
}

// Run the test
if (require.main === module) {
  testPineconeConnection().catch(console.error);
}

export { testPineconeConnection }; 