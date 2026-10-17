import { useSyncExternalStore } from 'react';

// A parental gate (App Store guideline 1.3, Google Families): before anything that leaves the game
// (sharing, email, data export, account deletion) an adult answers a multiplication written in
// words. One gate at a time; screens await requestParentalGate().
export type GateChallenge = { a: number; b: number };

export function createGateChallenge(random: () => number = Math.random): GateChallenge {
  const pick = () => 3 + Math.floor(random() * 7);

  return { a: pick(), b: pick() };
}

export function isGateAnswerRight(challenge: GateChallenge, input: string) {
  return /^\d{1,3}$/.test(input.trim()) && Number(input.trim()) === challenge.a * challenge.b;
}

type GateState = { challenge: GateChallenge; failed: boolean } | null;

let state: GateState = null;
let resolveGate: ((passed: boolean) => void) | null = null;
const listeners = new Set<() => void>();

function setState(next: GateState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function settle(passed: boolean) {
  const resolve = resolveGate;
  resolveGate = null;
  setState(null);
  resolve?.(passed);
}

/** Shows the gate; resolves true once an adult answered, false when cancelled. */
export function requestParentalGate(): Promise<boolean> {
  resolveGate?.(false);

  return new Promise((resolve) => {
    resolveGate = resolve;
    setState({ challenge: createGateChallenge(), failed: false });
  });
}

/** A wrong answer swaps in a new question, so guessing does not get through. */
export function answerParentalGate(input: string) {
  if (!state) {
    return;
  }

  if (isGateAnswerRight(state.challenge, input)) {
    settle(true);
  } else {
    setState({ challenge: createGateChallenge(), failed: true });
  }
}

export function cancelParentalGate() {
  settle(false);
}

export function useParentalGateState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state
  );
}
