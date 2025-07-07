"use client";

import { useState } from 'react';
import { SendHorizontal, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { AIMessage } from '@/components/ui/ai-message';
import { useAuth } from '@/lib/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import { ConcorsoCard } from '@/components/blog/ConcorsoCard';
import { ChatConcorsoCard } from '@/components/chat/ChatConcorsoCard';

// Types
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Concorso {
  id: string;
  title?: string;
  Titolo?: string;
  ente?: string;
  Ente?: string;
  location?: string;
  AreaGeografica?: string;
  deadline?: any;
  DataChiusura?: any;
  numero_di_posti?: string | number;
  pa_link?: string;
  [key: string]: any;
}

// Function to clean AI response from concorsi data
function cleanAIResponse(content: string): string {
  // Remove common patterns that indicate concorsi data
  let cleaned = content;
  
  // Remove lines that look like concorsi data (containing common fields)
  const concorsiPatterns = [
    /.*\[object Object\].*/gi,
    /.*Ente:.*Località:.*Scadenza:.*/gi,
    /.*Titolo:.*Ente:.*DataChiusura:.*/gi,
    /.*ID:.*Title:.*Ente:.*/gi,
    /.*concorso_id:.*Titolo:.*Ente:.*/gi,
    /.*{.*"id".*"title".*"ente".*}.*/gi,
    /.*{.*"Titolo".*"Ente".*"DataChiusura".*}.*/gi,
    /.*\[.*{.*concorso.*}.*\].*/gi,
    /.*numero_di_posti.*pa_link.*/gi,
    /.*AreaGeografica.*DataChiusura.*/gi,
  ];
  
  concorsiPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Remove JSON-like structures that might contain concorsi data
  cleaned = cleaned.replace(/\{[^{}]*(?:"id"|"Titolo"|"Ente")[^{}]*\}/gi, '');
  
  // Remove array-like structures
  cleaned = cleaned.replace(/\[[^\[\]]*(?:concorso|bando)[^\[\]]*\]/gi, '');
  
  // Remove excessive newlines and whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/\s{3,}/g, ' ');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Suggestion card component
function SuggestionCard({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-slate-50 p-4 rounded-xl text-left hover:bg-slate-100 transition-colors text-sm h-full flex-shrink-0 w-full md:w-auto"
    >
      {text}
    </button>
  );
}

interface GenioProps {
  className?: string;
}

export default function Genio({ className }: GenioProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [concorsi, setConcorsi] = useState<Concorso[]>([]);
  const [showConcorsi, setShowConcorsi] = useState(true);
  const { user } = useAuth();
  
  // Check if we should show welcome screen or chat view
  const showWelcomeScreen = messages.length === 0;
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setError(null); // Clear any previous errors
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          namespace: 'gemini',
          userId: user?.uid
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Invalid response from server');
      }
      
      // Clean the AI response to remove concorsi data
      const cleanedResponse = cleanAIResponse(data.response);
      
      // Update concorsi if available
      let finalResponse = cleanedResponse;
      if (data.concorsi && Array.isArray(data.concorsi) && data.concorsi.length > 0) {
        setConcorsi(data.concorsi);
        setShowConcorsi(true);
        
        // Add a subtle message about found concorsi if the response doesn't already mention them
        if (!cleanedResponse.toLowerCase().includes('concors') && !cleanedResponse.toLowerCase().includes('bandi')) {
          finalResponse = cleanedResponse + '\n\nHo trovato alcuni concorsi per te. Dai un\'occhiata qui sotto! 👇';
        }
      } else {
        setConcorsi([]);
      }
      
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: finalResponse }
      ]);
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore durante la comunicazione con il server.';
      setError(errorMessage);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Mi dispiace, si è verificato un errore. Per favore, riprova tra qualche momento. Se il problema persiste, contatta il supporto.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const toggleConcorsiVisibility = () => {
    setShowConcorsi(!showConcorsi);
  };

  return (
    <div className={`min-h-screen bg-white flex flex-col ${className}`}>
      <div className="flex-grow flex flex-col h-screen max-w-4xl mx-auto w-full px-4 sm:px-6">
        {showWelcomeScreen ? (
          // Welcome Screen
          <div className="flex flex-col items-center justify-center flex-grow">
            <div className="w-full max-w-2xl">
              {/* Header with icon and title */}
              <div className="flex items-start gap-4 mb-0">                
                <div className="flex">
                  <TextShimmer
                    as="h1"
                    className="text-3xl font-bold"
                    duration={2}
                    spread={12}
                  >
                    Benvenuto su Genio
                  </TextShimmer>
                </div>
              </div>
              <div className="flex items-start gap-4 mb-8">                
                <div className="flex w-full">
                  <TextShimmer
                    as="h2"
                    className="text-xl font-bold"
                    duration={20}
                    spread={10}
                  >
                    {`Genio è qui per aiutarti a trovare il concorso giusto per te.`}
                  </TextShimmer>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-8">
                Fatti aiutare da Genio per orientarti nel mondo dei concorsi pubblici. Scopri quali bandi sono adatti a te, come candidarti e come prepararti al meglio.
              </p>
              
              {/* Suggestion cards */}
              <div className="hidden sm:grid sm:grid-cols-2 gap-4 mb-8">
                <SuggestionCard 
                  text="Quali concorsi posso fare con il mio titolo di studio?" 
                  onClick={() => handleSuggestionClick("Quali concorsi posso fare con il mio titolo di studio?")} 
                />
                <SuggestionCard 
                  text="Come posso prepararmi per una prova scritta?" 
                  onClick={() => handleSuggestionClick("Come posso prepararmi per una prova scritta?")} 
                />
                <SuggestionCard 
                  text="Quali sono i concorsi più facili da superare quest'anno?" 
                  onClick={() => handleSuggestionClick("Quali sono i concorsi più facili da superare quest'anno?")} 
                />
                <SuggestionCard 
                  text="Dammi un consiglio per organizzare lo studio." 
                  onClick={() => handleSuggestionClick("Dammi un consiglio per organizzare lo studio.")} 
                />
              </div>
            </div>
          </div>
        ) : (
          // Chat Conversation View
          <div className="flex-grow overflow-y-auto py-4 space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
                <div 
                  className={`max-w-[85%] rounded-xl p-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-50 text-gray-800' 
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <AIMessage content={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="max-w-[85%] rounded-xl p-3 bg-white text-gray-800 shadow-sm">
                  <Spinner size={24} className="text-brand" />
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50/20 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Concorsi Results Section - Outside of chat area */}
        {concorsi.length > 0 && messages.length > 0 && (
          <div className="border-t border-gray-200 pt-4 pb-2">
            <div 
              className="flex items-center justify-between cursor-pointer mb-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={toggleConcorsiVisibility}
            >
              <h3 className="font-semibold text-base text-gray-900">
                Concorsi trovati ({concorsi.length})
              </h3>
              {showConcorsi ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </div>
            
            {showConcorsi && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {concorsi.map((concorso) => (
                  <ChatConcorsoCard 
                    key={concorso.id} 
                    concorso={{
                      id: concorso.id,
                      Titolo: concorso.title || concorso.Titolo || '',
                      Ente: concorso.ente || concorso.Ente,
                      AreaGeografica: concorso.location || concorso.AreaGeografica,
                      DataChiusura: concorso.deadline || concorso.DataChiusura,
                      numero_di_posti: concorso.numero_di_posti,
                      pa_link: concorso.pa_link
                    }}
                    compact={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Sticky Footer with Input */}
        <div className="sticky bottom-0 pb-2 pt-2 bg-white">          
          {/* Input section */}
          <div className="relative mb-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Scrivi una domanda o chiedi un consiglio a Genio..."
              className="w-full p-4 pr-12 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              aria-label="Il tuo messaggio"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-brand text-grey rounded-full hover:bg-opacity-90 disabled:bg-disabled disabled:text-disabled-foreground"
              aria-label="Invia messaggio"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          </div>
          {/* Informational text below input */}
          <div className="text-xs text-gray-500 text-center mb-8 pb-4 px-4">
            {showWelcomeScreen ? (
              "Le chat non vengono utilizzate per migliorare i modelli AI. Genio potrebbe commettere errori, verifica sempre le informazioni."
            ) : (
              <div className="flex flex-col items-center">
                <p>Genio potrebbe commettere errori, verifica sempre le informazioni. Leggi termi e condizioni.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 