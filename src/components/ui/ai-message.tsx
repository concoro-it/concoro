import { marked } from 'marked';
import { cn } from '@/lib/utils';

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface AIMessageProps {
  content: string;
  className?: string;
}

export function AIMessage({ content, className }: AIMessageProps) {
  return (
    <div 
      className={cn(
        "prose prose-sm max-w-none",
        // Headers
        "prose-headings:font-semibold prose-headings:text-gray-900",
        "prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3",
        // Paragraphs and lists
        "prose-p:leading-relaxed prose-p:mb-2 prose-p:last:mb-0",
        "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ul]:space-y-1",
        "[&_li]:mb-1",
        // Bold text
        "prose-strong:font-semibold prose-strong:text-gray-900",
        // Blockquotes
        "prose-blockquote:border-l-2 prose-blockquote:border-gray-300",
        "prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700",
        // Custom spacing
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      dangerouslySetInnerHTML={{ __html: marked(content) }}
    />
  );
} 