/**
 * The keypad — every symbol a school maths line needs, without a keyboard shortcut to remember.
 *
 * The design constraint is stated plainly in RESEARCH.md part two: the person using this has not
 * been trained on it, may not be confident with a computer, and is not going to learn LaTeX to
 * teach a fraction. Everything here inserts at the caret, is reachable by Tab, and is labelled with
 * the thing it makes rather than the code it emits — the button says a/b, not `\frac`.
 *
 * The advanced row is folded away by default. A teacher of class 5 should not have to look at an
 * integral sign to find the plus.
 */

import { useState } from 'react';
import { useT } from './i18n';
import './MathKeypad.css';

export interface KeypadKey {
  /** What the button says. */
  readonly face: string;
  /** What gets inserted at the caret. */
  readonly insert: string;
  /** How many characters to move the caret back afterwards — puts it inside the brackets. */
  readonly back?: number;
  /** Spoken/announced name, and the tooltip. */
  readonly name: string;
  /** Rendered in the maths face rather than the interface face. */
  readonly math?: boolean;
}

export interface KeypadGroup {
  readonly id: string;
  readonly label: string;
  readonly keys: readonly KeypadKey[];
  readonly advanced?: boolean;
}

export interface MathKeypadProps {
  onInsert: (text: string, back: number) => void;
}

export function MathKeypad({ onInsert }: MathKeypadProps) {
  const t = useT();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const groups: KeypadGroup[] = [
    {
      id: 'arith',
      label: t('keypad.arithmetic'),
      keys: [
        { face: '+', insert: ' + ', name: t('keypad.plus') },
        { face: '−', insert: ' - ', name: t('keypad.minus') },
        { face: '×', insert: ' x ', name: t('keypad.times') },
        { face: '÷', insert: ' div ', name: t('keypad.dividedBy') },
        { face: '=', insert: ' = ', name: t('keypad.equals') },
        { face: 'a/b', insert: '/', name: t('keypad.fraction'), math: true },
      ],
    },
    {
      id: 'shape',
      label: t('keypad.shapes'),
      keys: [
        { face: 'x²', insert: '^2', name: t('keypad.squared'), math: true },
        { face: 'xⁿ', insert: '^', name: t('keypad.power'), math: true },
        { face: 'x₁', insert: '_', name: t('keypad.index'), math: true },
        { face: '√', insert: 'sqrt()', back: 1, name: t('keypad.root'), math: true },
        { face: '∛', insert: 'cbrt()', back: 1, name: t('keypad.cubeRoot'), math: true },
        { face: '( )', insert: '()', back: 1, name: t('keypad.brackets') },
      ],
    },
    {
      id: 'compare',
      label: t('keypad.comparison'),
      keys: [
        { face: '<', insert: ' < ', name: t('keypad.lessThan') },
        { face: '>', insert: ' > ', name: t('keypad.greaterThan') },
        { face: '≤', insert: ' <= ', name: t('keypad.atMost') },
        { face: '≥', insert: ' >= ', name: t('keypad.atLeast') },
        { face: '≠', insert: ' != ', name: t('keypad.notEqual') },
        { face: '≈', insert: ' ~= ', name: t('keypad.about') },
      ],
    },
    {
      id: 'symbols',
      label: t('keypad.symbols'),
      keys: [
        { face: 'π', insert: 'pi', name: t('keypad.pi'), math: true },
        { face: 'θ', insert: 'theta', name: t('keypad.theta'), math: true },
        { face: '°', insert: '°', name: t('keypad.degrees') },
        { face: '%', insert: '%', name: t('keypad.percent') },
        { face: '₹', insert: '₹', name: t('keypad.rupees') },
        { face: '∞', insert: 'infinity', name: t('keypad.infinity'), math: true },
      ],
    },
    {
      id: 'functions',
      label: t('keypad.functions'),
      advanced: true,
      keys: [
        { face: 'sin', insert: 'sin ', name: 'sine', math: true },
        { face: 'cos', insert: 'cos ', name: 'cosine', math: true },
        { face: 'tan', insert: 'tan ', name: 'tangent', math: true },
        { face: 'log', insert: 'log ', name: 'logarithm', math: true },
        { face: 'ln', insert: 'ln ', name: 'natural logarithm', math: true },
        { face: '|x|', insert: 'abs()', back: 1, name: t('keypad.absolute'), math: true },
      ],
    },
    {
      id: 'senior',
      label: t('keypad.senior'),
      advanced: true,
      keys: [
        { face: 'Σ', insert: 'sum_{i=1}^{n} ', name: t('keypad.sum'), math: true },
        { face: '∫', insert: 'int_{0}^{1} ', name: t('keypad.integral'), math: true },
        { face: 'lim', insert: 'lim_{x -> 0} ', name: t('keypad.limit'), math: true },
        { face: '{ }', insert: '{}', back: 1, name: t('keypad.set') },
        { face: '[ ]', insert: '[]', back: 1, name: t('keypad.squareBrackets') },
        { face: '∠', insert: 'angle ', name: t('keypad.angle'), math: true },
      ],
    },
  ];

  const visible = groups.filter((group) => showAdvanced || !group.advanced);

  return (
    <div className="keypad">
      <div className="keypad__grid">
        {visible.map((group) => (
          <section key={group.id} className="keypad__group" aria-labelledby={`kp-${group.id}`}>
            {/* A span, not a heading: these label a group of controls, and putting them in the
                heading outline would make a screen reader's document map read like a table of
                contents for a calculator. */}
            <span id={`kp-${group.id}`} className="keypad__label">
              {group.label}
            </span>
            <div className="keypad__keys">
              {group.keys.map((key) => (
                <button
                  key={key.face}
                  type="button"
                  className={`key${key.math ? ' key--math' : ''}`}
                  title={key.name}
                  aria-label={key.name}
                  data-testid={`key-${key.face}`}
                  onClick={() => onInsert(key.insert, key.back ?? 0)}
                >
                  {key.face}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        className="keypad__more"
        aria-expanded={showAdvanced}
        data-testid="keypad-advanced"
        onClick={() => setShowAdvanced((current) => !current)}
      >
        {showAdvanced ? t('keypad.fewer') : t('keypad.more')}
      </button>
    </div>
  );
}

/**
 * Insert at the caret of a text field and leave the caret where the next keystroke belongs.
 *
 * Appending to the end instead — which is what a naive implementation does — makes the keypad
 * useless the moment someone corrects the middle of a line, and that is the moment they lose trust
 * in it.
 */
export function insertAtCaret(field: HTMLTextAreaElement | HTMLInputElement, text: string, back: number): string {
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? start;
  const next = field.value.slice(0, start) + text + field.value.slice(end);
  const caret = start + text.length - back;

  // The value is owned by React; setting it here only keeps the caret from jumping to the end
  // before the re-render lands.
  field.value = next;
  field.setSelectionRange(caret, caret);
  field.focus();
  return next;
}
