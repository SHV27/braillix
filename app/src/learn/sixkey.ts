/**
 * Six-key braille entry — the Perkins chord, on an ordinary keyboard.
 *
 * This is what makes the practice loop braille-first rather than a quiz wearing a braille costume.
 * A student answers by *writing braille*, the same physical motion they use on a Perkins brailler
 * or a braille display's keys: press the dots you want together, release, and the cell is written.
 *
 *   S D F   =  dots 3 2 1   (left hand)
 *   J K L   =  dots 4 5 6   (right hand)
 *   space   =  a blank cell
 *   backspace deletes the last cell
 *
 * Modelled as a pure reducer so the chord logic can be tested without a keyboard, a browser or a
 * render. The subtle part is that a chord commits on the release of the LAST key, not the first —
 * fingers never leave a keyboard perfectly together, and committing early turns "dots 1-2-5" into
 * three separate cells.
 */

import { BLANK, dotsToMask, maskToDots, type DotMask } from '../core/braille';

/** Which dot each key writes. The standard Perkins home-row layout. */
export const KEY_TO_DOT: Readonly<Record<string, number>> = {
  s: 3,
  d: 2,
  f: 1,
  j: 4,
  k: 5,
  l: 6,
};

export interface SixKeyState {
  /** Keys currently held down. */
  readonly held: readonly string[];
  /** Dots accumulated during the current chord — dots stay set even as fingers lift. */
  readonly chord: DotMask;
  /** Cells written so far. */
  readonly cells: readonly DotMask[];
}

export const EMPTY: SixKeyState = { held: [], chord: BLANK, cells: [] };

export function isSixKey(key: string): boolean {
  return key.toLowerCase() in KEY_TO_DOT;
}

/** A key went down: remember it, and add its dot to the chord being built. */
export function keyDown(state: SixKeyState, key: string): SixKeyState {
  const lower = key.toLowerCase();
  const dot = KEY_TO_DOT[lower];
  if (dot === undefined) return state;
  if (state.held.includes(lower)) return state; // auto-repeat, not a new press

  return {
    ...state,
    held: [...state.held, lower],
    chord: state.chord | dotsToMask([dot]),
  };
}

/**
 * A key came up. The cell is written only when the LAST finger lifts, so a chord released
 * unevenly still produces one cell rather than three.
 */
export function keyUp(state: SixKeyState, key: string): SixKeyState {
  const lower = key.toLowerCase();
  if (!state.held.includes(lower)) return state;

  const held = state.held.filter((k) => k !== lower);
  if (held.length > 0) return { ...state, held };

  // Last finger up: commit whatever the chord accumulated.
  const chord = state.chord;
  if (chord === BLANK) return { held: [], chord: BLANK, cells: state.cells };
  return { held: [], chord: BLANK, cells: [...state.cells, chord] };
}

/** Space writes a blank cell — meaningful in Nemeth, where spaces separate terms. */
export function writeSpace(state: SixKeyState): SixKeyState {
  return { ...state, cells: [...state.cells, BLANK] };
}

/** Backspace removes the last cell written. */
export function backspace(state: SixKeyState): SixKeyState {
  return { ...state, cells: state.cells.slice(0, -1) };
}

export function clear(): SixKeyState {
  return EMPTY;
}

/**
 * All keys released without any chord — used when focus is lost mid-press, so a half-finished
 * chord does not commit itself the next time a key happens to be released.
 */
export function releaseAll(state: SixKeyState): SixKeyState {
  return { ...state, held: [], chord: BLANK };
}

/** A human description of the chord in progress, for the on-screen hint and screen readers. */
export function describeChord(state: SixKeyState): string {
  if (state.chord === BLANK) return '';
  return `dots ${maskToDots(state.chord).join('-')}`;
}
