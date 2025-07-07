import { config } from 'dotenv';
import { initializeFirebaseAdmin } from '../lib/firebase-admin';

// Load environment variables
config();

async function checkConcorsiStatus() {
  console.log('🔍 Checking status values in Firestore concorsi...\n');

  try {
    const db = initializeFirebaseAdmin();
    
    // Get a few concorsi documents to check their status values
    const snapshot = await db.collection('concorsi').limit(10).get();
    
    if (snapshot.empty) {
      console.log('❌ No concorsi found in Firestore');
      return;
    }

    console.log(`📊 Found ${snapshot.size} concorsi. Checking status values:\n`);

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   Title: ${data.Titolo?.substring(0, 60)}...`);
      console.log(`   Status: "${data.Stato}" (type: ${typeof data.Stato})`);
      console.log(`   Ente: ${data.Ente}`);
      console.log(`   DataChiusura: ${data.DataChiusura}`);
      console.log('');
    });

    // Check specific IDs from our Pinecone test
    const testIds = [
      'e8a09f347eb540aba633d473b2b822c9',
      'b4b7fc85ef9543cbb79c53528f2bdb7d',
      'a3ca52668aae44a88926c035e262b418'
    ];

    console.log('🎯 Checking specific concorsi IDs from Pinecone test:\n');
    
    for (const id of testIds) {
      try {
        const docRef = db.collection('concorsi').doc(id);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
          const data = docSnap.data();
          console.log(`✅ Found ${id}:`);
          console.log(`   Title: ${data?.Titolo?.substring(0, 60)}...`);
          console.log(`   Status: "${data?.Stato}" (type: ${typeof data?.Stato})`);
          console.log(`   Ente: ${data?.Ente}`);
        } else {
          console.log(`❌ Document ${id} not found in Firestore`);
        }
        console.log('');
      } catch (error) {
        console.error(`❌ Error checking ${id}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ Error connecting to Firestore:', error);
  }
}

// Run the check
if (require.main === module) {
  checkConcorsiStatus().catch(console.error);
}

export { checkConcorsiStatus }; 