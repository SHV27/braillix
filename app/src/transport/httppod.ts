/**
 * A brain pod over Wi-Fi — the transport described in §7 of the hardware handoff.
 *
 * Honest about its weakness: this needs the laptop and the pod to be on a network that is
 * cooperating, which the brief says may not be true in the demo room. That is why USB exists and
 * why the simulator is never a second-class citizen. When this fails it says exactly what failed
 * and what to try, rather than leaving a spinner turning.
 */

import { assertValidFrame, encodeShow, type Command } from './codec';
import type { RefreshPlan } from '../core/scheduler';
import {
  TransportBase,
  TransportError,
  parseChainReply,
  type ButtonEvent,
  type ChainInfo,
  type ShowResult,
  type Transport,
} from './types';

const REQUEST_TIMEOUT_MS = 4000;
const BUTTON_POLL_MS = 120;

export interface HttpPodOptions {
  /** One entry per pod, left to right. "192.168.1.42" or "http://192.168.1.42". */
  readonly hosts: readonly string[];
  readonly pollButtons?: boolean;
}

function normaliseBase(host: string): string {
  const trimmed = host.trim().replace(/\/+$/, '');
  if (!trimmed) throw new TransportError('a pod address is required', 'Enter the IP the pod printed on its serial console.');
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

export class HttpPodTransport extends TransportBase implements Transport {
  readonly kind = 'http' as const;

  #bases: string[];
  #chain: ChainInfo | null = null;
  #pollTimer: ReturnType<typeof setInterval> | null = null;
  #lastSeq = new Map<string, number>();
  #pollButtons: boolean;

  constructor(options: HttpPodOptions) {
    super();
    if (options.hosts.length === 0) {
      throw new TransportError('no pod addresses given', 'Add at least one pod address.');
    }
    this.#bases = options.hosts.map(normaliseBase);
    this.#pollButtons = options.pollButtons ?? true;
  }

  get label(): string {
    return this.#bases.length === 1
      ? `pod at ${this.#bases[0].replace(/^https?:\/\//, '')}`
      : `${this.#bases.length} pods over Wi-Fi`;
  }

  async #request(base: string, path: string, body?: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${base}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? undefined : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new TransportError(`${path} returned HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (err instanceof TransportError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new TransportError(
          `${base} did not answer within ${REQUEST_TIMEOUT_MS / 1000} s`,
          'Check that the laptop and the pod are on the same network, or connect over USB instead.',
        );
      }
      throw new TransportError(
        `could not reach ${base}`,
        'Check the address and the network. A pod on a different Wi-Fi network is the usual cause.',
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async connect(): Promise<ChainInfo> {
    this.setStatus('connecting');
    try {
      const pods = [];
      let firmware: string | undefined;

      for (const [index, base] of this.#bases.entries()) {
        const reply = await this.#request(base, '/chain');
        const { pod, firmware: version } = parseChainReply(reply, index, base.replace(/^https?:\/\//, ''));
        pods.push(pod);
        firmware ??= version;
      }

      const cellCount = pods.reduce((sum, pod) => sum + pod.cellAddrs.length, 0);
      this.#chain = { pods, cellCount, firmware };
      this.setStatus('connected');
      if (this.#pollButtons) this.#startPolling();
      return this.#chain;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.setStatus('error', message);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.#stopPolling();
    this.#chain = null;
    this.setStatus('disconnected');
  }

  async apply(plan: RefreshPlan): Promise<ShowResult> {
    const chain = this.#requireChain();
    assertValidFrame(plan.target, chain.cellCount);

    // One pod: send the whole frame (sparse when that is cheaper).
    if (chain.pods.length === 1) {
      const command = encodeShow(plan) as Extract<Command, { cmd: 'show' }>;
      const body = 'positions' in command ? { positions: command.positions } : { updates: command.updates };
      const reply = (await this.#request(this.#bases[0], '/show', body)) as { moved?: number; skipped?: number };
      return { moved: reply.moved ?? plan.cellsMoved, skipped: reply.skipped ?? 0 };
    }

    // Several pods: the laptop stays the single brain and hands each pod its slice, with the same
    // overall layout so the pods can never disagree about the message (handoff §4B).
    let moved = 0;
    let cursor = 0;
    for (const [index, pod] of chain.pods.entries()) {
      const width = pod.cellAddrs.length;
      const slice = plan.target.slice(cursor, cursor + width);
      cursor += width;

      const reply = (await this.#request(this.#bases[index], '/layout', {
        total_pods: chain.pods.length,
        this_pod_index: index,
        cells_on_this_pod: width,
        full_text: '',
        my_slice: slice,
      })) as { moved?: number };
      moved += reply.moved ?? 0;
    }
    return { moved, skipped: Math.max(0, chain.cellCount - moved) };
  }

  async home(): Promise<void> {
    this.#requireChain();
    for (const base of this.#bases) await this.#request(base, '/home', {});
  }

  #requireChain(): ChainInfo {
    if (!this.#chain) throw new TransportError('not connected to a pod', 'Connect from the Hardware screen.');
    return this.#chain;
  }

  /**
   * HTTP has no way to push, so buttons are polled. The `seq` counter in the reply means a press
   * that happens between two polls is still noticed — the alternative is a button that works only
   * if you hold it, which reads as broken hardware.
   */
  #startPolling(): void {
    this.#stopPolling();
    // globalThis rather than window: the conformance suite drives this transport under Node.
    this.#pollTimer = globalThis.setInterval(() => {
      void this.#pollOnce();
    }, BUTTON_POLL_MS);
  }

  #stopPolling(): void {
    if (this.#pollTimer !== null) {
      globalThis.clearInterval(this.#pollTimer);
      this.#pollTimer = null;
    }
  }

  async #pollOnce(): Promise<void> {
    for (const base of this.#bases) {
      try {
        const reply = (await this.#request(base, '/buttons')) as Record<string, unknown>;
        const seq = typeof reply.seq === 'number' ? reply.seq : 0;
        const previous = this.#lastSeq.get(base);
        this.#lastSeq.set(base, seq);
        if (previous === undefined || seq === previous) continue;

        for (const button of ['prev', 'select', 'next'] as const) {
          if (reply[button] === 1 || reply[button] === true) {
            const event: ButtonEvent = { button, long: reply.long === true, seq };
            this.emitButton(event);
          }
        }
      } catch {
        // A dropped poll is not a disconnection — pods on flaky Wi-Fi miss one all the time.
        // Sending the display into an error state over it would be worse than the miss.
      }
    }
  }
}
