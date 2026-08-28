export interface ParsedWhatsAppMessage {
  senderName: string;
  timestamp: string; // ISO 8601 string
  content: string;
}

export interface ParseResult {
  messages: ParsedWhatsAppMessage[];
  totalParsed: number;
  senders: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// WhatsApp system noise indicators
const SYSTEM_NOISE_PATTERNS = [
  /messages and calls are end-to-end encrypted/i,
  /messages to this chat and calls are now secured/i,
  /<media omitted>/i,
  /image omitted/i,
  /video omitted/i,
  /audio omitted/i,
  /document omitted/i,
  /sticker omitted/i,
  /contact card omitted/i,
  /location: https:\/\/maps/i,
  /this message was deleted/i,
  /you deleted this message/i,
  /changed the subject to/i,
  /changed this group's icon/i,
  /changed the group description/i,
  /added you/i,
  /added .+/i,
  /left$/i,
  /removed .+/i,
  /security code changed/i,
  /created group/i,
  /joined using this group's invite link/i,
];

/**
 * Normalizes unicode whitespace characters that WhatsApp exports include (e.g. \u202f, \u00a0)
 */
function normalizeText(text: string): string {
  return text
    .replace(/[\u202f\u00a0\u2000-\u200b]/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Robust date parser for various WhatsApp date/time formats:
 * - DD/MM/YY or DD/MM/YYYY or MM/DD/YY
 * - HH:MM or HH:MM:SS with optional AM/PM
 */
function parseWhatsAppDate(dateStr: string, timeStr: string): string {
  try {
    const cleanDate = dateStr.trim();
    const cleanTime = timeStr.trim();

    // Split date parts (supports / or - or .)
    const dateParts = cleanDate.split(/[\/\-\.]/).map((p) => parseInt(p, 10));
    if (dateParts.length !== 3) {
      return new Date().toISOString();
    }

    let [p1, p2, p3] = dateParts;
    let year = p3;
    let month = p2;
    let day = p1;

    // Handle 2-digit years
    if (year < 100) {
      year += year < 70 ? 2000 : 1900;
    }

    // Heuristic: If p1 > 12, p1 is day, p2 is month (DD/MM/YYYY)
    // If p2 > 12, p1 is month, p2 is day (MM/DD/YYYY)
    if (p1 > 12) {
      day = p1;
      month = p2;
    } else if (p2 > 12) {
      month = p1;
      day = p2;
    }

    // Parse time (e.g. "14:32", "2:32 PM", "02:32:15 PM")
    const isPM = /pm/i.test(cleanTime);
    const isAM = /am/i.test(cleanTime);
    const timeDigits = cleanTime.replace(/[^\d:]/g, '').split(':').map((t) => parseInt(t, 10));

    let hours = timeDigits[0] || 0;
    const minutes = timeDigits[1] || 0;
    const seconds = timeDigits[2] || 0;

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }

    const d = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    if (isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    return d.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

/**
 * Checks if text is system noise
 */
function isSystemNoise(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  return SYSTEM_NOISE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Parses raw WhatsApp .txt export into structured messages.
 * Handles both Android and iOS export patterns and multiline continuations.
 */
export function parseWhatsAppChat(rawText: string): ParseResult {
  if (!rawText || typeof rawText !== 'string') {
    return { messages: [], totalParsed: 0, senders: [] };
  }

  const normalized = normalizeText(rawText);
  const lines = normalized.split('\n');

  const parsedMessages: ParsedWhatsAppMessage[] = [];
  let currentMessage: ParsedWhatsAppMessage | null = null;

  // Regex patterns:
  // 1. Android/Standard: "DD/MM/YY, HH:MM - Sender: Message" or "M/D/YY, H:MM AM/PM - Sender: Message"
  // Group 1: Date, Group 2: Time, Group 3: Sender, Group 4: Message Content
  const androidRegex = /^(\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s+-\s+([^:]+?):\s*(.*)$/;

  // 2. iOS format: "[DD/MM/YY, HH:MM:SS] Sender: Message" or "[DD/MM/YYYY, H:MM:SS AM/PM] Sender: Message"
  const iosRegex = /^\[(\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]\s+([^:]+?):\s*(.*)$/;

  // 3. Android System line (without sender colon): "DD/MM/YY, HH:MM - Message"
  const androidSystemRegex = /^(\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s+-\s+(.*)$/;

  // 4. iOS System line: "[DD/MM/YY, HH:MM:SS] Message"
  const iosSystemRegex = /^\[(\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]\s+(.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Check Android match
    const androidMatch = line.match(androidRegex);
    if (androidMatch) {
      if (currentMessage && !isSystemNoise(currentMessage.content)) {
        parsedMessages.push(currentMessage);
      }

      const [, dateStr, timeStr, sender, content] = androidMatch;
      currentMessage = {
        senderName: sender.trim(),
        timestamp: parseWhatsAppDate(dateStr, timeStr),
        content: content.trim(),
      };
      continue;
    }

    // Check iOS match
    const iosMatch = line.match(iosRegex);
    if (iosMatch) {
      if (currentMessage && !isSystemNoise(currentMessage.content)) {
        parsedMessages.push(currentMessage);
      }

      const [, dateStr, timeStr, sender, content] = iosMatch;
      currentMessage = {
        senderName: sender.trim(),
        timestamp: parseWhatsAppDate(dateStr, timeStr),
        content: content.trim(),
      };
      continue;
    }

    // Check if line is a system notice with date prefix (skip it and close current message)
    if (androidSystemRegex.test(line) || iosSystemRegex.test(line)) {
      if (currentMessage && !isSystemNoise(currentMessage.content)) {
        parsedMessages.push(currentMessage);
      }
      currentMessage = null;
      continue;
    }

    // Multi-line continuation: append to currentMessage
    if (currentMessage) {
      currentMessage.content += '\n' + line;
    }
  }

  // Push final message
  if (currentMessage && !isSystemNoise(currentMessage.content)) {
    parsedMessages.push(currentMessage);
  }

  // Filter out any empty messages or noise
  const filteredMessages = parsedMessages.filter(
    (m) => m.content.trim().length > 0 && !isSystemNoise(m.content)
  );

  const uniqueSenders = Array.from(new Set(filteredMessages.map((m) => m.senderName)));

  let dateRange: { start: string; end: string } | undefined;
  if (filteredMessages.length > 0) {
    dateRange = {
      start: filteredMessages[0].timestamp,
      end: filteredMessages[filteredMessages.length - 1].timestamp,
    };
  }

  return {
    messages: filteredMessages,
    totalParsed: filteredMessages.length,
    senders: uniqueSenders,
    dateRange,
  };
}
