/**
 * The single application store.
 *
 * These facts have exactly one owner here, per CLAUDE.md Law 5:
 *   · the display profile (how many cells, how they are wired)
 *   · the current translation and its semantic tree
 *   · the run of braille currently being read (whole expression, or one node of it)
 *   · the link to the display, and through it what the hardware is believed to be showing
 *   · the state of every optional capability
 *
 * Nothing else in the app may recompute any of these.
 */

import { create } from 'zustand';
import { DEFAULT_SIMULATED_CELLS, LOCAL_MODEL_PATH } from './config';
import { renderFrame, windowFollowingCursor, type Frame } from './core/frame';
import { simulatedProfile, type BitOrder, type DisplayProfile } from './core/profile';
import { initSre, type SpeechLocale } from './core/sre-service';
import { translateLatex, type Translation } from './core/translate';
import { BLANK, dotsToMask, type DotMask, type DotNumber } from './core/braille';
import type { RefreshPlan } from './core/scheduler';
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
import { DisplayLink } from './transport/link';
import { HttpPodTransport } from './transport/httppod';
import { WebSerialTransport, webSerialSupported } from './transport/webserial';
import { TransportError, type ButtonEvent, type TransportStatus } from './transport/types';
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
  pod: { state: 'unavailable', label: 'Display', reason: 'simulated', fix: 'Connect real hardware on the Hardware screen.' },
};

/* ------------------------------------------------------------------ view + settings */

export type ViewId = 'read' | 'practice' | 'recognise' | 'hardware' | 'atlas';

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

  /* --- the display --- */
  profile: DisplayProfile;
  setCellCount: (count: number) => void;
  setBitOrder: (order: BitOrder) => void;
  setReversed: (reversed: boolean) => void;

  /* --- the link to hardware --- */
  linkStatus: TransportStatus;
  linkLabel: string;
  linkFirmware: string | null;
  linkError: string | null;
  linkFix: string | null;
  connectUsb: () => Promise<void>;
  connectPods: (hosts: string[]) => Promise<void>;
  switchToSimulator: () => Promise<void>;
  homeDisplay: () => Promise<void>;
  /** Put an arbitrary run of cells on the display — used by calibration and by practice drills. */
  showCells: (cells: readonly DotMask[], announcement: string) => void;
  /** Raise exactly one dot on every cell — the calibration test for cam bit order. */
  testDot: (dot: DotNumber | null) => Promise<void>;
  testingDot: DotNumber | null;

  latex: string;
  translation: Translation | null;
  translating: boolean;
  setLatex: (latex: string) => void;

  /* --- the reader --- */
  mode: ReadMode;
  setMode: (mode: ReadMode) => void;
  tree: SemTree | null;
  cursorId: string | null;
  foldedChildCells: readonly number[];
  foldReason: string | null;
  breadcrumb: string;
  nodeLabel: string;
  expanded: boolean;
  toggleExpanded: () => void;
  goSibling: (direction: -1 | 1) => void;
  goChild: () => void;
  goParent: () => void;
  enterFoldAt: (cellIndex: number) => void;
  canGo: { left: boolean; right: boolean; in: boolean; out: boolean };

  /** The braille run currently on the display — whole expression or one node. */
  activeCells: readonly DotMask[];

  windowStart: number;
  cursor: number | null;
  setWindowStart: (start: number) => void;
  setCursor: (cursor: number | null) => void;

  frame: Frame;
  plan: RefreshPlan | null;
  planSummary: string;

  capabilities: CapabilityMap;
  setCapability: (id: CapabilityId, capability: Capability) => void;

  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  sayCurrent: () => void;

  /**
   * What the speech engine would say for the current node, as text.
   *
   * Shown on screen because a machine without a Hindi voice installed can still demonstrate Hindi
   * output, and because a sighted teacher wants to see what the student is hearing.
   */
  spokenText: string;

  /** Announcement for the ARIA live region — every state change says what happened. */
  announcement: string;

  bootstrap: () => Promise<void>;
}

/**
 * The link is not reactive state: it is a live connection with listeners and a belief about
 * physical hardware. The store holds exactly one, and replaces it when the transport changes.
 */
let link: DisplayLink | null = null;

const NO_CELLS: DotMask[] = [];

export const useBraillix = create<BraillixState>((set, get) => {
  /** Compute the frame for the current state. The one place a Frame is derived. */
  function frameFor(
    patch: Partial<Pick<BraillixState, 'profile' | 'activeCells' | 'windowStart' | 'cursor'>> = {},
  ): Frame {
    const state = { ...get(), ...patch };
    return renderFrame(state.profile, {
      cells: state.activeCells,
      windowStart: state.windowStart,
      cursor: state.cursor,
    });
  }

  /**
   * Send the frame to whatever display is attached and report what it cost.
   *
   * Deliberately fire-and-forget from the caller's point of view: a slow or sulking pod must never
   * make the interface unresponsive, and a failed push shows up as a visible error rather than as
   * a hang.
   */
  function pushFrame(frame: Frame): void {
    if (!link) return;
    void link.push(frame.cam).then((report) => {
      set({
        plan: report.plan,
        planSummary: report.summary,
        linkError: report.error ?? null,
        linkFix: report.fix ?? null,
      });
    });
  }

  /** Apply a patch, recompute the frame, and drive the display. */
  function project(patch: Partial<Pick<BraillixState, 'profile' | 'activeCells' | 'windowStart' | 'cursor'>> = {}) {
    const frame = frameFor(patch);
    pushFrame(frame);
    return { ...patch, frame };
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
    if (get().cursorId !== node.id) return; // the reader moved on while we were translating

    const label = describeNode(tree, node);
    set({
      nodeLabel: label,
      breadcrumb: breadcrumb(tree, node.id),
      foldedChildCells: rendering.childCellIndex,
      foldReason: rendering.folded ? null : (rendering.reason ?? null),
      canGo: movement(tree, node.id),
      announcement:
        options.announce === false
          ? get().announcement
          : `${label}. ${rendering.cells.length} cell${rendering.cells.length === 1 ? '' : 's'}.`,
      ...project({ activeCells: rendering.cells, windowStart: 0, cursor: null }),
    });

    // Always compute the transcript, even with speech switched off — it is shown on screen.
    const spoken = await speakNode(node, settings.speechLocale);
    if (get().cursorId !== node.id) return;
    set({ spokenText: spoken });
    if (settings.speechOn && options.announce !== false) {
      speak(`${label}. ${spoken}`, settings.speechLocale, settings.speechRate);
    }
  }

  function moveTo(node: SemNode | null): void {
    if (!node) return;
    set({ cursorId: node.id });
    void showNode(node);
  }

  /** Pod buttons drive the same navigation as the arrow keys — see docs/PROTOCOL.md §5. */
  function handlePodButton(event: ButtonEvent): void {
    const { mode } = get();
    if (mode !== 'explore') {
      // In whole-expression mode the buttons page the display, which is the conventional behaviour.
      const { windowStart, profile, activeCells } = get();
      if (event.button === 'prev') get().setWindowStart(Math.max(0, windowStart - profile.cellCount));
      if (event.button === 'next') {
        get().setWindowStart(Math.min(windowStart + profile.cellCount, Math.max(0, activeCells.length - 1)));
      }
      if (event.button === 'select') get().sayCurrent();
      return;
    }
    if (event.button === 'prev') get().goSibling(-1);
    else if (event.button === 'next') get().goSibling(1);
    else if (event.long) get().goParent();
    else get().goChild();
  }

  /** Swap in a new display link, adopting the calibration settings the user already chose. */
  async function adopt(next: DisplayLink, capability: Capability): Promise<void> {
    const previous = link;
    link = next;
    if (previous) await previous.close().catch(() => {});

    next.onButton(handlePodButton);
    next.onStatus((status, reason) => {
      set({ linkStatus: status, linkError: reason ?? null });
    });

    const { profile } = get();
    const nextProfile = next.profile(profile);

    set({
      profile: nextProfile,
      linkStatus: next.status,
      linkLabel: next.transport.label,
      linkFirmware: next.chain.firmware ?? null,
      linkError: null,
      linkFix: null,
      announcement: `Display: ${nextProfile.cellCount} cell${nextProfile.cellCount === 1 ? '' : 's'}, ${next.transport.label}.`,
      ...project({ profile: nextProfile }),
    });
    get().setCapability('pod', capability);
  }

  const initialProfile = simulatedProfile(DEFAULT_SIMULATED_CELLS);

  return {
    view: 'read',
    setView: (view) => set({ view }),

    profile: initialProfile,
    setCellCount: (count) => {
      if (!link) return;
      try {
        link.resize(count);
      } catch (err) {
        set({ linkError: err instanceof Error ? err.message : String(err) });
        return;
      }
      const next = link.profile(get().profile);
      set({
        profile: next,
        announcement: `Display is now ${count} cell${count === 1 ? '' : 's'}.`,
        ...project({ profile: next }),
      });
    },
    setBitOrder: (order) => {
      const { profile } = get();
      const next = simulatedProfile(profile.cellCount, { ...profile, bitOrder: order });
      link?.invalidate(); // the wire meaning of every cell changed
      set({ profile: next, ...project({ profile: next }) });
    },
    setReversed: (reversed) => {
      const { profile } = get();
      const next = simulatedProfile(profile.cellCount, { ...profile, reversed });
      link?.invalidate();
      set({ profile: next, ...project({ profile: next }) });
    },

    /* --- the link --- */
    linkStatus: 'disconnected',
    linkLabel: 'simulated',
    linkFirmware: null,
    linkError: null,
    linkFix: null,
    testingDot: null,

    switchToSimulator: async () => {
      const next = await DisplayLink.simulated(get().profile.cellCount);
      await adopt(next, {
        state: 'ready',
        label: 'Display',
        reason: 'simulated — no hardware attached',
      });
    },

    connectUsb: async () => {
      if (!webSerialSupported()) {
        set({
          linkError: 'Web Serial is not supported in this browser',
          linkFix: 'Use Chrome or Edge on a desktop, or connect over Wi-Fi.',
        });
        return;
      }
      const transport = new WebSerialTransport();
      try {
        const chain = await transport.connect();
        await adopt(new DisplayLink(transport, chain), {
          state: 'ready',
          label: 'Display',
          reason: `${chain.cellCount} cells over USB · ${chain.firmware ?? 'unknown firmware'}`,
        });
      } catch (err) {
        set({
          linkError: err instanceof Error ? err.message : String(err),
          linkFix: err instanceof TransportError ? (err.fix ?? null) : null,
        });
      }
    },

    connectPods: async (hosts) => {
      const cleaned = hosts.map((h) => h.trim()).filter(Boolean);
      if (cleaned.length === 0) {
        set({ linkError: 'enter at least one pod address', linkFix: 'For example 192.168.1.42' });
        return;
      }
      try {
        const transport = new HttpPodTransport({ hosts: cleaned });
        const chain = await transport.connect();
        await adopt(new DisplayLink(transport, chain), {
          state: 'ready',
          label: 'Display',
          reason: `${chain.cellCount} cells over Wi-Fi · ${chain.pods.length} pod${chain.pods.length === 1 ? '' : 's'}`,
        });
      } catch (err) {
        set({
          linkError: err instanceof Error ? err.message : String(err),
          linkFix: err instanceof TransportError ? (err.fix ?? null) : null,
        });
      }
    },

    homeDisplay: async () => {
      if (!link) return;
      await link.home();
      set({ announcement: 'Every cell homed to blank.', ...project() });
    },

    /**
     * Calibration: raise exactly one dot on every cell.
     *
     * This is the ten-second answer to the one thing the hardware handoff flags as unconfirmed —
     * whether dot 1 really drives cam track 0. Press "dot 1"; if the physical cell raises a
     * different dot, fix the mapping here rather than re-flashing anything.
     */
    showCells: (cells, announcement) => {
      set({
        testingDot: null,
        announcement,
        ...project({ activeCells: [...cells], windowStart: 0, cursor: null }),
      });
    },

    testDot: async (dot) => {
      const { profile } = get();
      const mask = dot === null ? BLANK : dotsToMask([dot]);
      const cells = new Array<DotMask>(profile.cellCount).fill(mask);
      set({
        testingDot: dot,
        announcement: dot === null ? 'Test pattern cleared.' : `Raising dot ${dot} on every cell.`,
        ...project({ activeCells: cells, windowStart: 0, cursor: null }),
      });
    },

    latex: '',
    translation: null,
    translating: false,
    setLatex: (latex) => {
      set({ latex, translating: true, testingDot: null });
      void translateLatex(latex).then((translation) => {
        if (get().latex !== latex) return; // a newer keystroke already won

        const tree = buildTree(translation.enriched);
        const rootId = tree?.rootId ?? null;

        // If the maths engine died, the cells now carry LITERARY braille, not Nemeth. Say so in
        // the status strip as well as inline — a display quietly showing a different braille code
        // is the most dangerous kind of silent failure this product could have.
        if (translation.degraded === 'literal') {
          get().setCapability('sre', {
            state: 'degraded',
            label: 'Maths engine',
            reason: 'unavailable — cells show Grade-1 literary braille, NOT Nemeth',
            fix: 'Reload; if it persists run `npm install` again to restore public/sre/mathmaps.',
          });
        }

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
      const { tree, cursorId, mode } = get();
      if (mode === 'explore' && tree && cursorId) {
        const node = tree.nodes.get(cursorId);
        if (node) void showNode(node);
      }
    },

    goSibling: (direction) => {
      const { tree, cursorId } = get();
      if (tree && cursorId) moveTo(sibling(tree, cursorId, direction));
    },
    goChild: () => {
      const { tree, cursorId } = get();
      if (tree && cursorId) moveTo(firstChild(tree, cursorId));
    },
    goParent: () => {
      const { tree, cursorId } = get();
      if (tree && cursorId) moveTo(parentOf(tree, cursorId));
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
        const language = patch.speechLocale === 'hi' ? 'Hindi' : 'English';
        get().setCapability('speech', {
          state: voice.available ? 'ready' : 'degraded',
          label: 'Speech',
          reason: voice.available ? `${language} · ${voice.name ?? 'system voice'}` : `no ${language} voice on this machine`,
          fix: voice.available ? undefined : 'Install the language pack in your OS settings, or switch language.',
        });
      }
    },
    sayCurrent: () => {
      const { settings, mode, tree, cursorId } = get();
      if (!settings.speechOn || !tree) return;
      const id = mode === 'explore' && cursorId ? cursorId : tree.rootId;
      const node = tree.nodes.get(id);
      if (!node) return;
      void speakNode(node, settings.speechLocale).then((text) => {
        const prefix = mode === 'explore' ? `${describeNode(tree, node)}. ` : '';
        speak(`${prefix}${text}`, settings.speechLocale, settings.speechRate);
      });
    },

    spokenText: '',
    announcement: '',

    /** Probe every optional capability once, at startup, and report each honestly. */
    bootstrap: async () => {
      const { setCapability } = get();

      // The simulated display is the baseline: the product must be complete with nothing attached.
      if (!link) await get().switchToSimulator();

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

      setCapability(
        'usb',
        webSerialSupported()
          ? { state: 'ready', label: 'USB display', reason: 'Web Serial available' }
          : {
              state: 'unavailable',
              label: 'USB display',
              reason: 'Web Serial is not supported here',
              fix: 'Use Chrome or Edge on a desktop to connect a pod over USB.',
            },
      );

      // Ask the disk rather than assuming. A badge that says 'not installed' about a model that IS
      // installed is exactly the kind of small dishonesty this status strip exists to prevent.
      try {
        const url = new URL(`${LOCAL_MODEL_PATH}formulanet/config.json`, document.baseURI).href;
        const response = await fetch(url);
        const body = response.ok ? await response.text() : '';
        const installed = body.trimStart().startsWith('{');
        setCapability('recognition', {
          state: installed ? 'ready' : 'unavailable',
          label: 'Recognition',
          reason: installed ? 'on this device, offline' : 'on-device model not installed',
          fix: installed ? undefined : 'Run `npm run fetch:model` once (76 MB) to enable reading handwriting.',
        });
      } catch {
        setCapability('recognition', {
          state: 'unavailable',
          label: 'Recognition',
          reason: 'could not check whether the model is installed',
          fix: 'Run `npm run fetch:model` once (76 MB) to enable reading handwriting.',
        });
      }
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
