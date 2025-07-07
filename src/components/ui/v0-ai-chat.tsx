"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";
import { toast } from "sonner";
import { marked } from 'marked';

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            // Temporarily shrink to get the right scrollHeight
            textarea.style.height = `${minHeight}px`;

            // Calculate new height
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        // Set initial height
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    // Adjust height on window resize
    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export function VercelV0Chat() {
    const [value, setValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Ciao! Sono il tuo assistente virtuale. Come posso aiutarti oggi?' }
    ]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (chatMessages.length > 0) {
            scrollToBottom();
        }
    }, [chatMessages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleChatSubmit();
            }
        }
    };

    const handleChatSubmit = async () => {
        if (!value.trim() || isLoading) return;

        const userMessage = value.trim();
        setValue("");
        adjustHeight(true);
        
        // Add user message to chat and history
        const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
        setChatMessages(prev => [...prev, newUserMessage]);
        setChatHistory(prev => [...prev, newUserMessage]);
        
        setIsLoading(true);

        try {
            // Add a typing indicator
            setChatMessages(prev => [...prev, { role: 'assistant', content: '...' }]);
            
            // Make the API call with the updated parameters
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    language: 'it',
                    namespace: 'gemini', // Use the gemini namespace instead of concorsi
                    history: chatHistory, // Include chat history for context
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            
            // Create the assistant message
            const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
            
            // Remove the typing indicator and add the real response
            setChatMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length - 1].content === '...') {
                    newMessages.pop();
                }
                return [...newMessages, assistantMessage];
            });
            
            // Update history with assistant response
            setChatHistory(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);
            
            // Remove the typing indicator and add error message
            setChatMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length - 1].content === '...') {
                    newMessages.pop();
                }
                return [...newMessages, { role: 'assistant', content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.' }];
            });
            
            toast.error("Si è verificato un errore durante l'invio del messaggio");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-4xl mx-auto p-4 space-y-8">
            <h1 className="text-4xl font-bold text-gray-900">
                Come posso aiutarti?
            </h1>

            <div className="w-full flex flex-col space-y-4">
                {/* Chat Messages */}
                <div className="space-y-4 mb-4 overflow-y-auto max-h-[400px] pr-2 rounded-lg bg-white/70 p-4 shadow-sm">
                    {chatMessages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                    message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : message.content === '...'
                                            ? 'bg-gray-100 text-gray-800 animate-pulse'
                                            : message.content.startsWith('Error:')
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                {message.role === 'assistant' && message.content !== '...' ? (
                                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0">
                                        <div dangerouslySetInnerHTML={{ __html: marked(message.content) }} />
                                    </div>
                                ) : (
                                    message.content
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="overflow-y-auto">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Scrivi la tua domanda..."
                            className={cn(
                                "w-full px-4 py-3",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-gray-800 text-sm",
                                "focus:outline-none",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-gray-500 placeholder:text-sm",
                                "min-h-[60px]"
                            )}
                            style={{
                                overflow: "hidden",
                            }}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center justify-end p-3">
                        <button
                            type="button"
                            className={cn(
                                "px-3 py-2 rounded-lg text-sm transition-colors border",
                                value.trim() && !isLoading
                                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                    : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                            )}
                            onClick={handleChatSubmit}
                            disabled={!value.trim() || isLoading}
                        >
                            <ArrowUpIcon
                                className={cn(
                                    "w-4 h-4",
                                    value.trim() && !isLoading
                                        ? "text-white"
                                        : "text-gray-400"
                                )}
                            />
                            <span className="sr-only">Send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 