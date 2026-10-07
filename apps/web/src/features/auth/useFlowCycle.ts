import { useEffect, useState } from 'react';

export const FLOW_STEPS = 3;
/** How long each step of the story stays on screen. */
export const FLOW_STEP_MS = 4200;
const INTRO_MS = 900;
const RESET_MS = 700;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Drives the auth-screen flow diagram.
 * `level` = how much of the diagram is drawn: -1 nothing, 0 root only, 1..3 branches.
 * Sequence: -1 → 0 → 1 → 2 → 3 → 0 (retract) → 1 → … Reduced-motion users get the final state, static.
 */
export function useFlowCycle(paused: boolean) {
  const reduced = prefersReducedMotion();
  const [level, setLevel] = useState(reduced ? FLOW_STEPS : -1);
  const [cycle, setCycle] = useState(0);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const running = !reduced && !paused && !hidden;

  useEffect(() => {
    if (!running) return;
    const delay = level === -1 ? 60 : level === 0 ? (cycle === 0 ? INTRO_MS : RESET_MS) : FLOW_STEP_MS;
    const timer = window.setTimeout(() => {
      if (level >= FLOW_STEPS) {
        setLevel(0);
        setCycle((c) => c + 1);
      } else {
        setLevel(level + 1);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [level, cycle, running]);

  /** Step shown in the caption and indicator (1-based). */
  const activeStep = Math.min(Math.max(level, 1), FLOW_STEPS);
  return { level, activeStep, cycle, running, reduced };
}
