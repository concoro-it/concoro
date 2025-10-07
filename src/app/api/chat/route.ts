import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  UserData, 
  JobDetails,
  buildGenioPrompt, 
  formatChatHistory,
  fetchConcorsiFromPinecone,
  getConcorsiFromFirestore,
  getUserProfile
} from '@/lib/prompts/genio-server';
import { Message } from '@/types/chat';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

// Initialize Google AI
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    // Validate environment variables
    if (!GOOGLE_API_KEY) {
      console.error('Missing Google API Key');
      return NextResponse.json({ error: 'Google API configuration is missing' }, { status: 500 });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const {
      message,
      language = 'it',
      concorso_id,
      jobDetails,
      history = [],
      userId
    } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Initialize Firestore
    try {
      initializeFirebaseAdmin();
    } catch (firestoreError) {
      console.error('Firebase initialization error:', firestoreError);
      // Continue without user data, don't fail the entire request
    }

    // Fetch user data from Firestore
    let userData: UserData | undefined;
    if (userId) {
      try {
        userData = await getUserProfile(userId);
        if (userData) {
          
        } else {
          
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Continue without throwing, just log the error details for debugging
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
        }
        // Continue without user data
      }
    }

    // Get relevant concorsi
    let jobDetailsArray: JobDetails[] = [];
    const context = '';
    
    try {
      // If jobDetails is provided directly, use it
      if (jobDetails) {
        jobDetailsArray = Array.isArray(jobDetails) ? jobDetails : [jobDetails];
      } 
      // Otherwise, fetch based on message content
      else {
        try {
          // First get concorsi IDs from Pinecone
          const relevantConcorsiIds = await fetchConcorsiFromPinecone(message);
          if (relevantConcorsiIds.length > 0) {
            // Then get full details from Firestore
            jobDetailsArray = await getConcorsiFromFirestore(relevantConcorsiIds);
          }
        } catch (fetchError) {
          console.error('Error fetching concorsi from Pinecone/Firestore:', fetchError);
          // Continue with empty jobDetailsArray
        }
      }
      
      // Add specific concorso if ID is provided
      if (concorso_id && !jobDetailsArray.some(job => job.concorso_id === concorso_id || job.id === concorso_id)) {
        try {
          const specificConcorsi = await getConcorsiFromFirestore([concorso_id]);
          if (specificConcorsi.length > 0) {
            jobDetailsArray = [...jobDetailsArray, ...specificConcorsi];
          }
        } catch (concorsoError) {
          console.error('Error fetching specific concorso:', concorsoError);
        }
      }
      
    } catch (error) {
      console.error('Error fetching concorsi:', error);
      // Continue with empty jobDetailsArray
    }

    // Setup chat model and generate response
    try {
      const chatModel = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });
      const chat = chatModel.startChat({
        history: formatChatHistory(history as Message[]),
        generationConfig: { temperature: 0.2 }, // Slightly more creative
      });

      // Build and send prompt
      const systemPrompt = buildGenioPrompt({
        message,
        language,
        jobDetailsArray,
        userData,
        context,
      });

      
      const result = await chat.sendMessage(systemPrompt);
      const response = await result.response;
      const text = response.text();

      return NextResponse.json({ 
        response: text,
        concorsi: jobDetailsArray.map(job => ({
          id: job.concorso_id || job.id,
          title: job.Titolo || job.Title || job.TitoloOriginale,
          ente: job.Ente,
          location: job.job_location || job.AreaGeografica,
          deadline: job.DataChiusura ? (job.DataChiusura.toDate ? job.DataChiusura.toDate().toLocaleDateString('it-IT') : new Date(job.DataChiusura).toLocaleDateString('it-IT')) : 'N/A',
          pa_link: job.pa_link
        }))
      });
    } catch (error) {
      console.error('Error with chat model:', error);
      // Return a friendly error to the client
      return NextResponse.json({ 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error in chat route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}