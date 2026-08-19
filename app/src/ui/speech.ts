/**
 * Speech output.
 *
 * The research is unambiguous: braille readers of mathematics prefer to *hear* the expression
 * while their fingers read it. So speech is not an accessibility afterthought here — it is half
 * of how the product is meant to be used, and it is on by default.
 *
 * Uses the browser's own speech synthesis: free, offline on Windows and macOS, no key, no
 * network. When it is absent we say so in the status strip and carry on (CLAUDE.md Law 3).
 */

import type { SpeechLocale } from '../core/sre-service';

const VOICE_LANG: Record<SpeechLocale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
};

/** Fallbacks in preference order — an Indian English voice first, then any English one. */
const VOICE_FALLBACKS: Record<SpeechLocale, string[]> = {
  en: ['en-IN', 'en-GB', 'en-US', 'en'],
  hi: ['hi-IN', 'hi'],
};

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function pickVoice(locale: SpeechLocale): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  for (const wanted of VOICE_FALLBACKS[locale]) {
    const match = voices.find((voice) => voice.lang.toLowerCase().startsWith(wanted.toLowerCase()));
    if (match) return match;
  }
  return null;
}

/**
 * Report whether a voice exists for a locale. Hindi voices are not installed on every Windows
 * machine, and silently producing nothing would be the worst possible behaviour — so the caller
 * uses this to show an honest badge instead.
 */
export function voiceFor(locale: SpeechLocale): { available: boolean; name?: string } {
  if (!speechAvailable()) return { available: false };
  const voice = pickVoice(locale);
  return voice ? { available: true, name: voice.name } : { available: false };
}

/** Voice lists load asynchronously in some browsers; resolve once they are actually there. */
export function whenVoicesReady(): Promise<void> {
  if (!speechAvailable()) return Promise.resolve();
  if (window.speechSynthesis.getVoices().length > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', done);
      resolve();
    };
    window.speechSynthesis.addEventListener('voiceschanged', done);
    // Never hang on a browser that fires nothing.
    window.setTimeout(done, 1500);
  });
}

export function cancelSpeech(): void {
  if (speechAvailable()) window.speechSynthesis.cancel();
}

/**
 * Say something, interrupting whatever was being said.
 *
 * Interrupting is deliberate: while navigating an expression the reader wants the *current* node
 * spoken, not a backlog of everything they moved through.
 */
export function speak(text: string, locale: SpeechLocale, rate = 1): void {
  if (!speechAvailable() || !text.trim()) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = VOICE_LANG[locale];
  utterance.rate = Math.min(Math.max(rate, 0.5), 2);

  const voice = pickVoice(locale);
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}
