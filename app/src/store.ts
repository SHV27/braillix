/**
 * The single application store.
 *
 * Four facts have exactly one owner here, per CLAUDE.md Law 5:
 *   · the display profile (how many cells, how they are wired)
 *   · the current translation
 *   · what the hardware is believed to be showing (`DisplayState`)
 *   · the state of every optional capability
 *
 * Nothing else in the app may recompute any of these.
 */

import { create } from 'zustand';
import { DEFAULT_SIMULATED_CELLS } from './config';
import { DisplayState, describePlan, type RefreshPlan } from './core/scheduler';
import { renderFrame, windowFollowingCursor, type Frame } from './core/frame';
import { simulatedProfile, type BitOrder, type DisplayProfile } from './core/profile';
import { initSre } from './core/sre-service';
import { translateLatex, type Translation } from './core/translate';
import type { SpeechLocale } from './core/sre-service';

/* ------------------------------------------------------------------ capabilities */

export type CapabilityState = 'checking' | 'ready' | 'unavailable' | 'degraded';

export interface Capability {
  readonly state: CapabilityState;
  /** What this is, in the user's words. */
  readonly label: string;
  /** Why it is not ready. Required whenever state is not 'ready'. */
  readonly reason?: string;
  /** Something the user can actually do about it. */
  readonly fix?: string;
}

export type CapabilityId = 'sre' | 'speech' | 'recognition' | 'usb' | 'pod';

export type CapabilityMap = Record<CapabilityId, Capability>;

const INITIAL_CAPABILITIES: CapabilityMap = {
  sre: { state: 'checking', label: 'Maths engine' },
  speech: { state: 'checking', label: 'Speech' },
  recognition: { state: 'checking', label: 'Recognition' },
  usb: { state: 'checking', label: 'USB display' },
  pod: { state: 'unavailable', label: 'Wi-Fi pod', reason: 'not connected', fix: 'Connect from the Hardware screen.' },
};

/* ------------------------------------------------------------------ view + settings */

export type ViewId = 'read' | 'hardware' | 'atlas';

export interface Settings {
  speechOn: boolean;
  speechLocale: SpeechLocale;
  speechRate: number;
}

/* ------------------------------------------------------------------ the store */

interface BraillixState {
  view: ViewId;
  setView: (view: ViewId) => void;

  profile: DisplayProfile;
  setCellCount: (count: number) => void;
  setBitOrder: (order: BitOrder) => void;
  setReversed: (reversed: boolean) => void;

  latex: string;
  translation: Translation | null;
  translating: boolean;
  setLatex: (latex: string) => void;

  windowStart: number;
  cursor: number | null;
  setWindowStart: (start: number) => void;
  setCursor: (cursor: number | null) => void;

  /** What the display is showing right now. Derived only here. */
  frame: Frame;
  /** The motor plan that produced the current frame — the scheduler made visible. */
  plan: RefreshPlan | null;
  planSummary: string;

  capabilities: CapabilityMap;
  setCapability: (id: CapabilityId, capability: Capability) => void;

  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  bootstrap: () => Promise<void>;
}

/** Not part of the reactive state: it is a physical belief about hardware, not a view model. */
const displayState = new DisplayState();

const EMPTY_TRANSLATION_CELLS: number[] = [];

export const useBraillix = create<BraillixState>((set, get) => {
  /** Recompute the frame and the motor plan. The one place either is derived. */
  function project(patch: Partial<Pick<BraillixState, 'profile' | 'translation' | 'windowStart' | 'cursor'>> = {}) {
    const state = { ...get(), ...patch };
    const cells = state.translation?.cells ?? EMPTY_TRANSLATION_CELLS;
    const frame = renderFrame(state.profile, {
      cells,
      windowStart: state.windowStart,
      cursor: state.cursor,
    });
    const plan = displayState.plan(frame.cam);
    displayState.commit(plan); // the simulator always accepts, so belief == reality here
    return { ...patch, frame, plan, planSummary: describePlan(plan) };
  }

  const initialProfile = simulatedProfile(DEFAULT_SIMULATED_CELLS);

  return {
    view: 'read',
    setView: (view) => set({ view }),

    profile: initialProfile,
    setCellCount: (count) => {
      const { profile } = get();
      const next = simulatedProfile(count, {
        bitOrder: profile.bitOrder,
        reversed: profile.reversed,
        homeIndex: profile.homeIndex,
      });
      // The display changed shape — we no longer know what any cell shows.
      displayState.invalidate();
      set(project({ profile: next }));
    },
    setBitOrder: (order) => {
      const { profile } = get();
      displayState.invalidate();
      set(project({ profile: simulatedProfile(profile.cellCount, { ...profile, bitOrder: order }) }));
    },
    setReversed: (reversed) => {
      const { profile } = get();
      displayState.invalidate();
      set(project({ profile: simulatedProfile(profile.cellCount, { ...profile, reversed }) }));
    },

    latex: '',
    translation: null,
    translating: false,
    setLatex: (latex) => {
      set({ latex, translating: true });
      void translateLatex(latex).then((translation) => {
        // Ignore a result that arrived after the user typed something else.
        if (get().latex !== latex) return;
        const cursor = translation.cells.length > 0 ? Math.min(get().cursor ?? 0, translation.cells.length - 1) : null;
        set({
          translating: false,
          ...project({ translation, cursor, windowStart: 0 }),
        });
      });
    },

    windowStart: 0,
    cursor: null,
    setWindowStart: (start) => set(project({ windowStart: start })),
    setCursor: (cursor) => {
      const state = get();
      const total = state.translation?.cells.length ?? 0;
      if (cursor === null || total === 0) {
        set(project({ cursor: null }));
        return;
      }
      const clamped = Math.min(Math.max(cursor, 0), total - 1);
      const windowStart = windowFollowingCursor(state.windowStart, clamped, state.profile.cellCount, total);
      set(project({ cursor: clamped, windowStart }));
    },

    frame: renderFrame(initialProfile, { cells: EMPTY_TRANSLATION_CELLS }),
    plan: null,
    planSummary: '',

    capabilities: INITIAL_CAPABILITIES,
    setCapability: (id, capability) =>
      set((state) => ({ capabilities: { ...state.capabilities, [id]: capability } })),

    settings: { speechOn: true, speechLocale: 'en', speechRate: 1 },
    updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

    /** Probe every optional capability once, at startup, and report each honestly. */
    bootstrap: async () => {
      const { setCapability } = get();

      const sreStatus = await initSre();
      setCapability(
        'sre',
        sreStatus.ok
          ? { state: 'ready', label: 'Maths engine', reason: `Nemeth · SRE ${sreStatus.version ?? ''}`.trim() }
          : {
              state: 'unavailable',
              label: 'Maths engine',
              reason: sreStatus.reason ?? 'failed to start',
              fix: 'Run `npm install` again — the locale files in public/sre/mathmaps may be missing.',
            },
      );

      const speechOk = typeof window !== 'undefined' && 'speechSynthesis' in window;
      setCapability(
        'speech',
        speechOk
          ? { state: 'ready', label: 'Speech', reason: 'browser voices' }
          : {
              state: 'unavailable',
              label: 'Speech',
              reason: 'this browser has no speech synthesis',
              fix: 'Braille and on-screen reading are unaffected.',
            },
      );

      const usbOk = typeof navigator !== 'undefined' && 'serial' in navigator;
      setCapability(
        'usb',
        usbOk
          ? { state: 'ready', label: 'USB display', reason: 'Web Serial available' }
          : {
              state: 'unavailable',
              label: 'USB display',
              reason: 'Web Serial is not supported here',
              fix: 'Use Chrome or Edge on a desktop to connect a pod over USB.',
            },
      );

      setCapability('recognition', {
        state: 'unavailable',
        label: 'Recognition',
        reason: 'on-device model not installed',
        fix: 'Run `npm run fetch:model` to enable reading handwriting.',
      });
    },
  };
});

/** Capabilities worth showing in the status strip, worst news first. */
export function rankedCapabilities(map: CapabilityMap): { id: CapabilityId; capability: Capability }[] {
  const rank: Record<CapabilityState, number> = { unavailable: 0, degraded: 1, checking: 2, ready: 3 };
  return (Object.keys(map) as CapabilityId[])
    .map((id) => ({ id, capability: map[id] }))
    .sort((a, b) => rank[a.capability.state] - rank[b.capability.state]);
}
