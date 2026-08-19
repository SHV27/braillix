/**
 * The single application store.
 *
 * Five facts have exactly one owner here, per CLAUDE.md Law 5:
 *   · the display profile (how many cells, how they are wired)
 *   · the current translation and its semantic tree
 *   · the run of braille currently being read (whole expression, or one node of it)
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
import { initSre, type SpeechLocale } from './core/sre-service';
import { translateLatex, type Translation } from './core/translate';
import type { DotMask } from './core/braille';
import {
  breadcrumb,
  buildTree,
  describeNode,
  firstChild,
  parentOf,
  renderNode,
  sibling,
  speakNode,
  type SemNode,
  type SemTree,
} from './core/tree';
import { cancelSpeech, speak, speechAvailable, voiceFor, whenVoicesReady } from './ui/speech';

/* ------------------------------------------------------------------ capabilities */

export type CapabilityState = 'checking' | 'ready' | 'unavailable' | 'degraded';

export interface Capability {
  readonly state: CapabilityState;
  /** What this is, in the user's words. */
  readonly label: string;
  /** Why it is not ready. Present whenever state is not 'ready'. */
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

export type ViewId = 'read' | 'atlas';

/**
 * How the display is being driven.
 *   'whole'   — the entire expression, character by character. What a conventional display does.
 *   'explore' — one node of the semantic tree at a time, its children folded to ⠿.
 */
export type ReadMode = 'whole' | 'explore';

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

  /* --- the reader --- */
  mode: ReadMode;
  setMode: (mode: ReadMode) => void;
  tree: SemTree | null;
  cursorId: string | null;
  /** Cell indices within `activeCells` that stand for a folded child, left to right. */
  foldedChildCells: readonly number[];
  breadcrumb: string;
  nodeLabel: string;
  /** Why the current node is NOT folded, when it is not. Null when it is folded. */
  foldReason: string | null;
  /** True when the reader asked to see the current node in full. */
  expanded: boolean;
  toggleExpanded: () => void;
  goSibling: (direction: -1 | 1) => void;
  goChild: () => void;
  goParent: () => void;
  /** Enter the folded child shown at `cellIndex`, if there is one. */
  enterFoldAt: (cellIndex: number) => void;
  canGo: { left: boolean; right: boolean; in: boolean; out: boolean };

  /** The braille run currently on the display — whole expression or one node. */
  activeCells: readonly DotMask[];

  windowStart: number;
  cursor: number | null;
  setWindowStart: (start: number) => void;
  setCursor: (cursor: number | null) => void;

  /** What the display shows right now. Derived only here. */
  frame: Frame;
  plan: RefreshPlan | null;
  planSummary: string;

  capabilities: CapabilityMap;
  setCapability: (id: CapabilityId, capability: Capability) => void;

  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  sayCurrent: () => void;

  /** Announcement for the ARIA live region — every state change says what happened. */
  announcement: string;

  bootstrap: () => Promise<void>;
}

/** Not part of the reactive state: it is a belief about physical hardware, not a view model. */
const displayState = new DisplayState();

const NO_CELLS: DotMask[] = [];

export const useBraillix = create<BraillixState>((set, get) => {
  /** Recompute the frame and the motor plan. The one place either is derived. */
  function project(
    patch: Partial<Pick<BraillixState, 'profile' | 'activeCells' | 'windowStart' | 'cursor'>> = {},
  ) {
    const state = { ...get(), ...patch };
    const frame = renderFrame(state.profile, {
      cells: state.activeCells,
      windowStart: state.windowStart,
      cursor: state.cursor,
    });
    const plan = displayState.plan(frame.cam);
    displayState.commit(plan); // the simulator always accepts, so belief == reality here
    return { ...patch, frame, plan, planSummary: describePlan(plan) };
  }

  function currentNode(): SemNode | null {
    const { tree, cursorId } = get();
    if (!tree || !cursorId) return null;
    return tree.nodes.get(cursorId) ?? null;
  }

  function movement(tree: SemTree | null, cursorId: string | null) {
    if (!tree || !cursorId) return { left: false, right: false, in: false, out: false };
    return {
      left: sibling(tree, cursorId, -1) !== null,
      right: sibling(tree, cursorId, 1) !== null,
      in: firstChild(tree, cursorId) !== null,
      out: parentOf(tree, cursorId) !== null,
    };
  }

  /** Render the node the cursor is on and put it on the display. Announces and speaks it. */
  async function showNode(node: SemNode, options: { announce?: boolean } = {}): Promise<void> {
    const { tree, translation, expanded, settings } = get();
    if (!tree || !translation) return;

    const rendering = await renderNode(translation.enriched, node, { fold: !expanded });
    const cells = rendering.cells;
    const foldedChildCells = rendering.childCellIndex;
    const foldReason = rendering.folded ? null : (rendering.reason ?? null);

    if (get().cursorId !== node.id) return; // the reader moved on while we were translating

    const label = describeNode(tree, node);
    const crumbs = breadcrumb(tree, node.id);
    const announcement =
      options.announce === false
        ? get().announcement
        : `${label}. ${cells.length} cell${cells.length === 1 ? '' : 's'}.`;

    set({
      nodeLabel: label,
      breadcrumb: crumbs,
      foldedChildCells,
      foldReason,
      canGo: movement(tree, node.id),
      announcement,
      ...project({ activeCells: cells, windowStart: 0, cursor: null }),
    });

    if (settings.speechOn && options.announce !== false) {
      const spoken = await speakNode(node, settings.speechLocale);
      if (get().cursorId === node.id) speak(`${label}. ${spoken}`, settings.speechLocale, settings.speechRate);
    }
  }

  function moveTo(node: SemNode | null): void {
    if (!node) return;
    set({ cursorId: node.id });
    void showNode(node);
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
      displayState.invalidate(); // the display changed shape — we know nothing about it now
      set({
        announcement: `Display is now ${count} cell${count === 1 ? '' : 's'}.`,
        ...project({ profile: next }),
      });
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
        if (get().latex !== latex) return; // a newer keystroke already won

        const tree = buildTree(translation.enriched);
        const rootId = tree?.rootId ?? null;

        set({
          translating: false,
          translation,
          tree,
          cursorId: rootId,
          breadcrumb: tree && rootId ? breadcrumb(tree, rootId) : '',
          nodeLabel: tree && rootId ? describeNode(tree, tree.nodes.get(rootId)!) : '',
          canGo: movement(tree, rootId),
          foldedChildCells: [],
          foldReason: null,
          announcement: translation.issues.some((i) => i.kind === 'parse')
            ? 'That expression could not be read.'
            : `${translation.cells.length} braille cells.`,
          ...project({ activeCells: translation.cells, windowStart: 0, cursor: null }),
        });

        // In explore mode the display should show the root node, folded — not the whole run.
        if (get().mode === 'explore' && tree && rootId) {
          void showNode(tree.nodes.get(rootId)!, { announce: false });
        }
      });
    },

    /* --- the reader --- */
    mode: 'whole',
    setMode: (mode) => {
      cancelSpeech();
      set({ mode });
      const { tree, translation, cursorId } = get();
      if (mode === 'explore' && tree && cursorId) {
        void showNode(tree.nodes.get(cursorId)!);
      } else if (translation) {
        set({
          foldedChildCells: [],
          foldReason: null,
          announcement: `Reading the whole expression — ${translation.cells.length} cells.`,
          ...project({ activeCells: translation.cells, windowStart: 0, cursor: null }),
        });
      }
    },

    tree: null,
    cursorId: null,
    foldedChildCells: [],
    foldReason: null,
    breadcrumb: '',
    nodeLabel: '',
    expanded: false,
    toggleExpanded: () => {
      set({ expanded: !get().expanded });
      const node = currentNode();
      if (node && get().mode === 'explore') void showNode(node);
    },

    goSibling: (direction) => {
      const { tree, cursorId } = get();
      if (!tree || !cursorId) return;
      moveTo(sibling(tree, cursorId, direction));
    },
    goChild: () => {
      const { tree, cursorId } = get();
      if (!tree || !cursorId) return;
      moveTo(firstChild(tree, cursorId));
    },
    goParent: () => {
      const { tree, cursorId } = get();
      if (!tree || !cursorId) return;
      moveTo(parentOf(tree, cursorId));
    },
    enterFoldAt: (cellIndex) => {
      const { tree, cursorId, foldedChildCells } = get();
      if (!tree || !cursorId) return;
      const which = foldedChildCells.indexOf(cellIndex);
      if (which === -1) return;
      const childId = tree.nodes.get(cursorId)?.childIds[which];
      if (childId) moveTo(tree.nodes.get(childId) ?? null);
    },
    canGo: { left: false, right: false, in: false, out: false },

    activeCells: NO_CELLS,

    windowStart: 0,
    cursor: null,
    setWindowStart: (start) => set(project({ windowStart: start })),
    setCursor: (cursor) => {
      const state = get();
      const total = state.activeCells.length;
      if (cursor === null || total === 0) {
        set(project({ cursor: null }));
        return;
      }
      const clamped = Math.min(Math.max(cursor, 0), total - 1);
      const windowStart = windowFollowingCursor(state.windowStart, clamped, state.profile.cellCount, total);
      set(project({ cursor: clamped, windowStart }));
    },

    frame: renderFrame(initialProfile, { cells: NO_CELLS }),
    plan: null,
    planSummary: '',

    capabilities: INITIAL_CAPABILITIES,
    setCapability: (id, capability) =>
      set((state) => ({ capabilities: { ...state.capabilities, [id]: capability } })),

    settings: { speechOn: true, speechLocale: 'en', speechRate: 1 },
    updateSettings: (patch) => {
      cancelSpeech();
      set((state) => ({ settings: { ...state.settings, ...patch } }));
      if (patch.speechLocale) {
        const voice = voiceFor(patch.speechLocale);
        get().setCapability('speech', {
          state: voice.available ? 'ready' : 'degraded',
          label: 'Speech',
          reason: voice.available
            ? `${patch.speechLocale === 'hi' ? 'Hindi' : 'English'} · ${voice.name ?? 'system voice'}`
            : `no ${patch.speechLocale === 'hi' ? 'Hindi' : 'English'} voice installed on this machine`,
          fix: voice.available ? undefined : 'Install the language pack in Windows settings, or switch language.',
        });
      }
    },
    sayCurrent: () => {
      const { settings, mode, translation, tree, cursorId } = get();
      if (!settings.speechOn) return;
      if (mode === 'explore' && tree && cursorId) {
        const node = tree.nodes.get(cursorId);
        if (node) {
          void speakNode(node, settings.speechLocale).then((text) =>
            speak(`${describeNode(tree, node)}. ${text}`, settings.speechLocale, settings.speechRate),
          );
        }
        return;
      }
      if (translation && tree) {
        const root = tree.nodes.get(tree.rootId);
        if (root) {
          void speakNode(root, settings.speechLocale).then((text) =>
            speak(text, settings.speechLocale, settings.speechRate),
          );
        }
      }
    },

    announcement: '',

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

      if (speechAvailable()) {
        await whenVoicesReady();
        const voice = voiceFor(get().settings.speechLocale);
        setCapability('speech', {
          state: voice.available ? 'ready' : 'degraded',
          label: 'Speech',
          reason: voice.available ? (voice.name ?? 'system voice') : 'no matching voice installed',
          fix: voice.available ? undefined : 'Braille is unaffected. Install a voice in your OS settings.',
        });
      } else {
        setCapability('speech', {
          state: 'unavailable',
          label: 'Speech',
          reason: 'this browser has no speech synthesis',
          fix: 'Braille and on-screen reading are unaffected.',
        });
      }

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
