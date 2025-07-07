# 🔍 Pinecone Vector Database Debugging Guide

## Problem
Genio AI is not retrieving information from the Pinecone Vector database ("concorsi" index).

## Diagnostic Steps

### 1. Run the Pinecone Connection Test

```bash
# Navigate to your project root
cd /path/to/your/concoro/project

# Run the diagnostic script
npx ts-node src/scripts/testPinecone.ts
```

### 2. Check Environment Variables

Ensure you have the following environment variables set in your `.env` file:

```bash
# Required for Pinecone
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_INDEX=concorsi

# Required for Google AI embeddings
GOOGLE_API_KEY=your-google-api-key-here
# OR
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key-here
```

### 3. Common Issues and Solutions

#### Issue 1: "Missing Pinecone API Key"
**Solution**: Add your Pinecone API key to the `.env` file
```bash
PINECONE_API_KEY=pc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Issue 2: "Index 'concorsi' not found"
**Possible causes**:
- Index name is incorrect
- Index doesn't exist in your Pinecone project
- Wrong Pinecone project/environment

**Solution**: 
1. Check your Pinecone dashboard
2. Verify the index name is exactly "concorsi"
3. Ensure the index is deployed and ready

#### Issue 3: "No matches found for the test query"
**Possible causes**:
- Index is empty (no vectors uploaded)
- Different embedding model used for indexing vs querying
- Wrong vector dimensions

**Solution**:
1. Check if your index has data in the Pinecone dashboard
2. Verify embedding model compatibility (should be `embedding-001`)
3. Check vector dimensions (usually 768 for Google's embedding-001)

#### Issue 4: "No concorso_id found in metadata"
**Possible causes**:
- Data was indexed without `concorso_id` metadata
- Wrong metadata field name
- Data structure mismatch

**Solution**:
1. Check how your data was originally indexed
2. Verify metadata includes `concorso_id` field
3. Re-index data if necessary with correct metadata structure

### 4. Expected Metadata Structure

Your Pinecone vectors should have metadata like this:
```json
{
  "concorso_id": "unique-concorso-identifier",
  "Titolo": "Concorso title",
  "Ente": "Organization name",
  "AreaGeografica": "Geographic area"
}
```

### 5. Manual Testing

You can also test Pinecone queries manually:

```typescript
import { pinecone } from '../lib/pinecone';
import { embedText } from '../lib/embeddings';

async function manualTest() {
  const query = "ingegnere informatico Roma";
  const embedding = await embedText(query);
  
  const result = await pinecone.query({
    topK: 3,
    vector: embedding,
    includeMetadata: true,
  });
  
  console.log('Results:', result);
}
```

### 6. Check Browser Console

When testing in the browser:
1. Open Developer Tools
2. Check the Console tab
3. Look for Pinecone-related error messages
4. The enhanced logging will show detailed debug information

### 7. Next Steps

If the diagnostic test reveals issues:

1. **API Key Issues**: Verify your Pinecone API key is correct and has proper permissions
2. **Index Issues**: Check your Pinecone dashboard to ensure the "concorsi" index exists and is deployed
3. **Data Issues**: Verify your index has data and proper metadata structure
4. **Embedding Issues**: Ensure you're using the same embedding model for indexing and querying

## Contact Support

If you continue to have issues, gather the following information:
- Output from the diagnostic script
- Your Pinecone dashboard index details
- Environment variable configuration (without exposing actual keys)
- Browser console errors

This will help troubleshoot the specific issue with your Pinecone Vector database integration. 