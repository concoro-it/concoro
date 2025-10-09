/**
 * Removes all emojis from a given text string including number emojis and variation selectors
 * @param text - The text to clean
 * @returns The text without emojis
 */
export function removeEmojis(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') return '';
  
  // More comprehensive emoji removal including:
  // - Standard emojis
  // - Number emojis (0️⃣-9️⃣)
  // - Keycap sequences
  // - Variation selectors (FE0F, FE0E)
  // - Zero-width joiners
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation selectors
    .replace(/[\u{E0020}-\u{E007F}]/gu, '') // Tag characters
    .replace(/[\u{20E3}]/gu, '') // Combining enclosing keycap
    .replace(/[\u{200D}]/gu, '') // Zero-width joiner
    .replace(/[0-9]\u{FE0F}?\u{20E3}/gu, '') // Number keycaps like 1️⃣
    .replace(/[#*0-9]\u{FE0F}?\u{20E3}/gu, ''); // Hash/asterisk keycaps
}

/**
 * Converts markdown bold text (**text**) to h2 elements when they appear at the start of a line
 * and regular bold for inline bold text. Also converts markdown lists to HTML ul/li.
 * Detects lines starting with number emojis (1️⃣, 2️⃣, etc.) as section titles.
 * @param text - The text to format
 * @returns HTML string with h2 elements, bold tags, and lists
 */
export function convertMarkdownBoldToH2(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') return '';
  
  // Remove ALL ** characters first
  let cleanText = text.replace(/\*\*/g, '');
  
  // Split by line breaks to process each line
  const lines = cleanText.split('\n');
  const result: string[] = [];
  let currentList: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this is a list item (starts with * or -)
    if (line.match(/^[*-]\s+(.+)/)) {
      const listItemMatch = line.match(/^[*-]\s+(.+)/);
      if (listItemMatch) {
        currentList.push(`<li>${listItemMatch[1]}</li>`);
      }
      continue;
    }
    
    // If we have accumulated list items and this line is not a list item, close the list
    if (currentList.length > 0) {
      result.push(`<ul class="list-disc pl-6 mb-4 space-y-2">${currentList.join('')}</ul>`);
      currentList = [];
    }
    
    // Check if line starts with number emoji (1️⃣, 2️⃣, etc.) or just number + text - treat as h2 title
    if (line.match(/^[0-9]\s+/) || line.match(/^[0-9][\u{FE0F}\u{20E3}]+\s*(.+)/u) || line.match(/^\d+\s+[A-Za-z]/)) {
      // Remove the number and emoji, keep only the text
      const titleText = removeEmojis(line).trim().replace(/^\d+\s*/, '');
      // Remove "Call to Action" from conclusion titles
      const cleanTitle = titleText.replace(/\s*\/\s*Call to Action/gi, '');
      result.push(`<h2 class="text-xl md:text-xl font-bold text-gray-900 mb-6 mt-8 leading-tight">${cleanTitle}</h2>`);
      continue;
    }
    
    // Check if this line looks like a title (starts with capital letter, short line, etc.)
    if (line.length > 0 && line.length < 50 && /^[A-Z]/.test(line) && !line.includes('.') && !line.includes(',')) {
      // Remove "Call to Action" from conclusion titles
      const cleanTitle = line.replace(/\s*\/\s*Call to Action/gi, '').trim();
      result.push(`<h2 class="text-xl md:text-xl font-bold text-gray-900 mb-6 mt-8 leading-tight">${cleanTitle}</h2>`);
      continue;
    }
    
    // Regular line
    if (line) {
      result.push(line);
    } else {
      result.push(''); // Preserve empty lines for paragraph breaks
    }
  }
  
  // Close any remaining list
  if (currentList.length > 0) {
    result.push(`<ul class="list-disc pl-6 mb-4 space-y-2">${currentList.join('')}</ul>`);
  }
  
  // Convert the result array to properly formatted HTML with paragraphs
  const htmlResult = result.map((line, index) => {
    // Skip empty lines
    if (!line.trim()) return '';
    
    // If it's already an HTML element (h2, ul), return as is
    if (line.startsWith('<h2') || line.startsWith('<ul')) {
      return line;
    }
    
    // Otherwise, wrap in paragraph tags
    return `<p class="mb-4 text-gray-700 leading-relaxed">${line}</p>`;
  }).filter(line => line).join('\n');
  
  return htmlResult;
}
