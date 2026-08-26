import { encryptKey, decryptKey, maskKey } from '../lib/crypto';
import { buildSystemPrompt, formatTranscript } from '../lib/ai/provider';

async function runTests() {
  console.log('🧪 Starting Phase 1 Unit & Logic Verification...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Test Crypto AES-256-GCM Encryption & Decryption
  console.log('1. Crypto & Vault-level Security Tests:');
  const sampleKey = 'gsk_super_secret_groq_api_key_12345';
  const encrypted = encryptKey(sampleKey);
  const decrypted = decryptKey(encrypted);

  assert(encrypted && encrypted !== sampleKey, 'Encrypted string is non-empty and ciphered');
  assert(decrypted === sampleKey, 'Decrypted key matches original secret key exactly');
  assert(maskKey(sampleKey) === 'gsk_••••••••2345', 'Mask key formats prefix and suffix correctly');

  // 2. Test System Prompt Construction with SIH Project Brief
  console.log('\n2. AI System Prompt & Project Brief Grounding:');
  const brief = 'AI-driven logistics for disaster relief in flooded regions of Kerala';
  const promptWithBrief = buildSystemPrompt(brief);
  const promptWithoutBrief = buildSystemPrompt(null);

  assert(promptWithBrief.includes('7th member of a Smart India Hackathon (SIH) team'), 'System prompt assigns 7th Member persona');
  assert(promptWithBrief.includes('flooded regions of Kerala'), 'System prompt injects team project brief context');
  assert(promptWithoutBrief.includes('Smart India Hackathon (SIH) Project'), 'System prompt has fallback hackathon context');

  // 3. Test Transcript Formatting
  console.log('\n3. Transcript Formatter (Text & Voice Call Recaps):');
  const testMessages = [
    { sender: 'Aarav', content: 'We need to decide the database for offline caching', type: 'text' },
    { sender: 'Pooja', content: 'We agreed on IndexedDB during our voice call', type: 'transcript' },
  ];
  const transcript = formatTranscript(testMessages);

  assert(transcript.includes('Aarav: We need to decide'), 'Includes standard text chat message');
  assert(transcript.includes('🎙️ [Call Recap] Pooja: We agreed on IndexedDB'), 'Includes formatted voice call recap message');

  // 4. Test Summary JSON Parsing logic
  console.log('\n4. Summary JSON Schema & Action Items with Assignees:');
  const mockLLMOutput = JSON.stringify({
    summary: 'Team finalized offline caching architecture.',
    decisions: ['Use IndexedDB for local offline state sync'],
    openQuestions: ['Will background sync work on iOS Safari?'],
    actionItems: [
      { text: 'Write service worker sync handler', assignee: 'Pooja', done: false },
      { text: 'Design offline banner component', assignee: 'Aarav', done: true }
    ]
  });

  const parsed = JSON.parse(mockLLMOutput);
  assert(parsed.decisions.length === 1 && parsed.decisions[0].includes('IndexedDB'), 'Extracts decisions array');
  assert(parsed.openQuestions.length === 1, 'Extracts open questions');
  assert(parsed.actionItems.length === 2 && parsed.actionItems[0].assignee === 'Pooja', 'Extracts action items with explicit assignees');

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
