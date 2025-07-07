import { config } from 'dotenv';

// Load environment variables
config();

const API_BASE_URL = 'http://localhost:3000';

interface ChatResponse {
  response: string;
  concorsi?: Array<{
    id: string;
    title: string;
    ente: string;
    location: string;
    deadline: string;
    pa_link?: string;
  }>;
  error?: string;
}

async function testGenioChat() {
  console.log('🧪 Testing Genio Chat Functionality...\n');

  const testQueries = [
    "Ciao, cercami concorsi per ingegneri informatici a Roma",
    "Quali sono i requisiti per diventare dirigente in un comune?",
    "Ci sono concorsi per medici aperti in questo momento?",
    "Come posso prepararmi per un concorso amministrativo?"
  ];

  let testNumber = 1;

  for (const query of testQueries) {
    console.log(`${testNumber}️⃣ Testing Query: "${query}"`);
    console.log('-'.repeat(60));

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          language: 'it',
          history: [],
          userId: 'test-user-123' // Test user ID
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      if (data.error) {
        console.log('❌ Error:', data.error);
      } else {
        console.log('✅ Response received:');
        console.log('📝 Text:', data.response.substring(0, 200) + (data.response.length > 200 ? '...' : ''));
        
        if (data.concorsi && data.concorsi.length > 0) {
          console.log(`🎯 Found ${data.concorsi.length} concorsi:`);
          data.concorsi.slice(0, 3).forEach((concorso, index) => {
            console.log(`   ${index + 1}. ${concorso.title || 'No title'}`);
            console.log(`      Ente: ${concorso.ente || 'N/A'}`);
            console.log(`      Location: ${concorso.location || 'N/A'}`);
            console.log(`      Deadline: ${concorso.deadline || 'N/A'}`);
          });
          if (data.concorsi.length > 3) {
            console.log(`   ... and ${data.concorsi.length - 3} more`);
          }
        } else {
          console.log('🔍 No concorsi found in response');
        }
      }

    } catch (error) {
      console.log('❌ Test failed:');
      if (error instanceof Error) {
        console.log('   Error:', error.message);
      } else {
        console.log('   Unknown error:', error);
      }
    }

    console.log(''); // Empty line for separation
    testNumber++;
  }

  console.log('🏁 Genio chat testing completed!');
}

// Run the test
if (require.main === module) {
  testGenioChat().catch(console.error);
}

export { testGenioChat }; 