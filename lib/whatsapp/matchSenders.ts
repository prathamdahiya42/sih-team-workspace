export interface TeamRosterMember {
  id: string; // user_id / profile id
  full_name?: string | null;
  email?: string | null;
  display_name?: string | null;
}

export interface MatchResult {
  mapping: Record<string, string | null>; // senderName -> userId or null
  matchedCount: number;
  unmatchedSenders: string[];
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Fuzzy matches WhatsApp sender names to team members in the roster.
 * - Exact match (case-insensitive) -> match
 * - Partial / first-name token match (e.g. "Rohan K." vs "Rohan Kumar") -> match if unambiguous
 * - Email prefix match (e.g. "rohan" vs "rohan@xyz.com") -> match if unambiguous
 */
export function matchWhatsAppSenders(
  senders: string[],
  roster: TeamRosterMember[]
): MatchResult {
  const mapping: Record<string, string | null> = {};
  const unmatchedSenders: string[] = [];
  let matchedCount = 0;

  for (const sender of senders) {
    const rawSender = sender.trim();
    const normalizedSender = normalizeName(rawSender);
    const senderTokens = normalizedSender.split(' ').filter(Boolean);

    let matchedUserId: string | null = null;

    // 1. Exact match against full_name or display_name
    for (const member of roster) {
      const memberFullName = member.full_name ? normalizeName(member.full_name) : '';
      const memberDisplayName = member.display_name ? normalizeName(member.display_name) : '';
      const memberEmailPrefix = member.email ? normalizeName(member.email.split('@')[0]) : '';

      if (
        (memberFullName && memberFullName === normalizedSender) ||
        (memberDisplayName && memberDisplayName === normalizedSender) ||
        (memberEmailPrefix && memberEmailPrefix === normalizedSender)
      ) {
        matchedUserId = member.id;
        break;
      }
    }

    // 2. If not matched, try token/prefix matching if unambiguous
    if (!matchedUserId && senderTokens.length > 0) {
      const candidateMatches: string[] = [];

      for (const member of roster) {
        const memberFullName = member.full_name ? normalizeName(member.full_name) : '';
        const memberTokens = memberFullName.split(' ').filter(Boolean);
        const memberEmailPrefix = member.email ? normalizeName(member.email.split('@')[0]) : '';

        // Check if first token matches
        const firstTokenMatches =
          senderTokens[0] &&
          (memberTokens[0] === senderTokens[0] || memberEmailPrefix === senderTokens[0]);

        // Check if sender name is a substring of member name (e.g. "Rohan K" in "Rohan Kumar")
        const isPrefixMatch =
          memberFullName.startsWith(normalizedSender) ||
          (senderTokens.length > 1 &&
            memberTokens[0] === senderTokens[0] &&
            memberTokens[1]?.startsWith(senderTokens[1][0]));

        if (firstTokenMatches || isPrefixMatch) {
          candidateMatches.push(member.id);
        }
      }

      // Only accept if strictly unambiguous (exactly 1 candidate)
      if (candidateMatches.length === 1) {
        matchedUserId = candidateMatches[0];
      }
    }

    mapping[rawSender] = matchedUserId;

    if (matchedUserId) {
      matchedCount++;
    } else {
      unmatchedSenders.push(rawSender);
    }
  }

  return {
    mapping,
    matchedCount,
    unmatchedSenders,
  };
}
