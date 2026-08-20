/**
 * "Is everything working on this laptop?"
 *
 * A teacher cannot be expected to read a status strip and infer whether the thing will hold up in
 * front of a class. So this is one button that goes and *finds out* — by doing the work, not by
 * reading a flag. The maths engine check translates a real expression and compares it with a known
 * answer; the offline check actually fetches the locale file; the storage check actually writes.
 *
 * Every check reports the same three things: what it is, what happened, and what to do about it if
 * it is not right. That is CLAUDE.md Law 3 as a screen rather than as a badge.
 */

import { translateLatex, cellsToUnicode } from './translate';
import { toLatex } from './mathinput';
import { devanagariToBraille } from './bharati';
import { LOCAL_MODEL_PATH } from '../config';

export type CheckState = 'pass' | 'warn' | 'fail';

export type CheckId =
  | 'engine'
  | 'nemeth'
  | 'bharati'
  | 'offline'
  | 'storage'
  | 'recognition'
  | 'speech'
  | 'usb';

export interface CheckResult {
  readonly id: CheckId;
  readonly state: CheckState;
  /** What actually happened, in a form worth pasting into a message to whoever helps them. */
  readonly detail: string;
  /** Only when the state is not 'pass'. */
  readonly fix?: string;
}

/**
 * A known answer, so the engine check is a *check* and not a shrug.
 *
 * `1/2` in Nemeth is: open fraction ⠹, dropped 1 ⠂, fraction line ⠌, dropped 2 ⠆, close ⠼. It is in
 * docs/ACCURACY.md, it is in the published table, and it is five cells that a braille reader can
 * verify with their fingers.
 */
const KNOWN_FRACTION = '⠹⠂⠌⠆⠼';
/** ⠛⠼⠊⠞ — "gaṇit", the word mathematics, in Bharati Braille. */
const KNOWN_HINDI = '⠛⠼⠊⠞';

async function checkEngine(): Promise<CheckResult> {
  try {
    const result = await translateLatex(toLatex('1/2').latex);
    const braille = cellsToUnicode(result.cells);
    if (result.degraded === 'literal') {
      return {
        id: 'engine',
        state: 'fail',
        detail: 'The maths engine did not start, so the cells would show ordinary braille, not Nemeth.',
        fix: 'Reload the page. If it persists, run `npm install` again — public/sre/mathmaps may be missing.',
      };
    }
    if (braille !== KNOWN_FRACTION) {
      return {
        id: 'engine',
        state: 'fail',
        detail: `One half translated to ${braille || '(nothing)'}, and it should be ${KNOWN_FRACTION}.`,
        fix: 'Do not use this build in a lesson. Reinstall Braillix and run the check again.',
      };
    }
    return { id: 'engine', state: 'pass', detail: `One half is ${braille}, exactly as the Nemeth table says.` };
  } catch (error) {
    return {
      id: 'engine',
      state: 'fail',
      detail: error instanceof Error ? error.message : String(error),
      fix: 'Reload the page. If it persists, run `npm install` again.',
    };
  }
}

async function checkNemeth(): Promise<CheckResult> {
  // A second expression, chosen because it exercises the parts that are easy to get wrong:
  // a superscript, the return to the baseline, and the two-cell equals with its spaces.
  const result = await translateLatex(toLatex('x^2 + 3x + 2 = 0').latex);
  const braille = cellsToUnicode(result.cells);
  const expected = '⠭⠘⠆⠐⠬⠒⠭⠬⠆⠀⠨⠅⠀⠼⠴';
  return braille === expected
    ? { id: 'nemeth', state: 'pass', detail: `A quadratic is ${braille.length} cells, and every one matches.` }
    : {
        id: 'nemeth',
        state: 'fail',
        detail: `A quadratic translated to ${braille}, and it should be ${expected}.`,
        fix: 'Do not use this build in a lesson. Reinstall Braillix.',
      };
}

function checkBharati(): CheckResult {
  const braille = devanagariToBraille('गणित').cells.map((mask) => String.fromCodePoint(0x2800 + mask)).join('');
  return braille === KNOWN_HINDI
    ? { id: 'bharati', state: 'pass', detail: `गणित is ${braille}, as the Bharati table says.` }
    : {
        id: 'bharati',
        state: 'fail',
        detail: `गणित translated to ${braille}, and it should be ${KNOWN_HINDI}.`,
        fix: 'Reinstall Braillix. Hindi words would be wrong on the display until this passes.',
      };
}

/**
 * Is the maths engine's locale data being served from this machine?
 *
 * This is the check that matters most in a school hall: if these files are missing, the engine
 * quietly reaches for a CDN, and the first time anybody notices is when the Wi-Fi is down.
 */
async function checkOffline(): Promise<CheckResult> {
  try {
    const url = new URL('sre/mathmaps/nemeth.json', document.baseURI).href;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const size = (await response.text()).length;
    return {
      id: 'offline',
      state: 'pass',
      detail: `The Nemeth tables are on this machine (${Math.round(size / 1024)} KB). No network is needed.`,
    };
  } catch (error) {
    return {
      id: 'offline',
      state: 'fail',
      detail: `The local Nemeth tables could not be read (${error instanceof Error ? error.message : String(error)}).`,
      fix: 'Run `npm install` again. Without them Braillix needs the internet, which a classroom may not have.',
    };
  }
}

function checkStorage(): CheckResult {
  try {
    const key = 'braillix.selfcheck';
    localStorage.setItem(key, '1');
    const read = localStorage.getItem(key);
    localStorage.removeItem(key);
    if (read !== '1') throw new Error('the value did not come back');
    return { id: 'storage', state: 'pass', detail: 'Worksheets and student records will be kept on this laptop.' };
  } catch {
    return {
      id: 'storage',
      state: 'warn',
      detail: 'This browser will not let Braillix save anything.',
      fix: 'Leave private browsing, or allow site data. Everything else works; nothing will be remembered.',
    };
  }
}

async function checkRecognition(): Promise<CheckResult> {
  try {
    const url = new URL(`${LOCAL_MODEL_PATH}formulanet/config.json`, document.baseURI).href;
    const response = await fetch(url);
    const body = response.ok ? await response.text() : '';
    return body.trimStart().startsWith('{')
      ? { id: 'recognition', state: 'pass', detail: 'Handwriting can be read on this device, with no network.' }
      : {
          id: 'recognition',
          state: 'warn',
          detail: 'The handwriting model is not installed.',
          fix: 'Run `npm run fetch:model` once (76 MB). Everything else works without it — type the maths instead.',
        };
  } catch {
    return {
      id: 'recognition',
      state: 'warn',
      detail: 'Could not tell whether the handwriting model is installed.',
      fix: 'Run `npm run fetch:model` once (76 MB) if you want to photograph equations.',
    };
  }
}

function checkSpeech(voice: { available: boolean; name?: string }, language: string): CheckResult {
  return voice.available
    ? { id: 'speech', state: 'pass', detail: `${language} speech: ${voice.name ?? 'a system voice'}.` }
    : {
        id: 'speech',
        state: 'warn',
        detail: `This machine has no ${language} voice installed.`,
        fix: 'The braille and the written transcript are unaffected. Install the language pack in Windows settings to hear it.',
      };
}

function checkUsb(supported: boolean): CheckResult {
  return supported
    ? { id: 'usb', state: 'pass', detail: 'A pod can be connected over USB from this browser.' }
    : {
        id: 'usb',
        state: 'warn',
        detail: 'This browser cannot open a USB port.',
        fix: 'Use Chrome or Edge on a laptop to connect a pod by cable, or connect over Wi-Fi instead.',
      };
}

export interface SelfCheckInput {
  readonly voice: { available: boolean; name?: string };
  readonly language: string;
  readonly usbSupported: boolean;
}

/**
 * Run everything. Never throws: a check that cannot run reports that it could not run.
 */
export async function runSelfCheck(input: SelfCheckInput): Promise<CheckResult[]> {
  const [engine, nemeth, offline, recognition] = await Promise.all([
    checkEngine(),
    checkNemeth(),
    checkOffline(),
    checkRecognition(),
  ]);
  return [
    engine,
    nemeth,
    checkBharati(),
    offline,
    checkStorage(),
    recognition,
    checkSpeech(input.voice, input.language),
    checkUsb(input.usbSupported),
  ];
}

/** The whole report as plain text, for pasting into a message to whoever helps this school. */
export function reportToText(results: readonly CheckResult[], names: Record<CheckId, string>): string {
  const lines = ['Braillix self-check', new Date().toISOString(), ''];
  for (const result of results) {
    lines.push(`[${result.state.toUpperCase()}] ${names[result.id]}: ${result.detail}`);
    if (result.fix) lines.push(`        fix: ${result.fix}`);
  }
  return lines.join('\n');
}
