export const TONES = [
  'professional',
  'friendly',
  'sassy',
  'chill',
  'uplifting',
  'concise',
  'blunt',
  'detailed',
] as const;

export type Tone = (typeof TONES)[number];

const TONE_DESCRIPTIONS: Record<Tone, string> = {
  professional: 'formal, clear, and business-appropriate',
  friendly: 'warm, encouraging, and positive',
  sassy: 'witty, confident, and playful with a bit of attitude',
  chill: 'relaxed, casual, and laid-back',
  uplifting: 'motivational and positive — constructive even when pointing out issues',
  concise: 'minimal and to the point, no fluff',
  blunt: 'direct and brutally honest, no sugarcoating',
  detailed: 'thorough and explanatory, covers all relevant aspects',
};

/** Produces a human-readable summary of all tones for use in tool descriptions. */
export function toneInstruction(): string {
  return Object.entries(TONE_DESCRIPTIONS)
    .map(([tone, desc]) => `"${tone}" = ${desc}`)
    .join('; ');
}
