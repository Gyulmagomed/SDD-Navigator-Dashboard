import { useEffect, useState } from "react";

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

const roundToDecimals = (input: number, decimals: number): number =>
  decimals === 0
    ? Math.round(input)
    : Math.round(input * 10 ** decimals) / 10 ** decimals;

export function useAnimatedNumber(
  target: number,
  options: { durationMs?: number; decimals?: number; enabled?: boolean } = {},
): number {
  const durationMs = options.durationMs ?? 800;
  const decimals = options.decimals ?? 0;
  const enabled = options.enabled ?? true;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let startTime: number | null = null;
    let frameId = 0;
    const from = 0;

    const step = (now: number): void => {
      if (startTime === null) {
        startTime = now;
      }

      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(t);
      const next = from + (target - from) * eased;
      const rounded = roundToDecimals(next, decimals);

      setValue(rounded);

      if (t < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs, decimals, enabled]);

  if (!enabled) {
    return roundToDecimals(target, decimals);
  }

  return value;
}
