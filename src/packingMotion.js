import { smootherstep } from "./motion.js";
// Timings have separate, non-overlapping placement and lid-closing intervals.
export const packingDuration = 2.9;
export function packingFrame(time) {
  const arrive = smootherstep(time / 0.6),
    lower = smootherstep((time - 0.6) / 0.85),
    fold = smootherstep((time - 1.45) / 0.25),
    close = smootherstep((time - 1.75) / 0.75);
  return {
    arrive,
    lower,
    fold,
    close,
    lift: 3.4 * (1 - lower),
    hinge: -Math.PI * 0.88 * (1 - close),
    done: time >= packingDuration,
    stage:
      time < 0.6
        ? "Acercando tu caja…"
        : time < 1.45
          ? "Acomodando tu creación…"
          : time < 1.75
            ? "Plegando los bordes…"
            : time < 2.5
              ? "Cerrando con cuidado…"
              : "Todo listo para tu antojo.",
  };
}
export function fitPackage(category, size) {
  const minimum =
    category === "pizza"
      ? { w: 6.0, d: 6.0 }
      : category === "burger"
        ? { w: 4.6, d: 4.2 }
        : { w: 6.2, d: 3.2 };
  const h = Math.max(category === "pizza" ? 0.5 : 1.6, size.y + 0.65);
  return {
    w: Math.max(minimum.w, size.x + 1.2),
    d: Math.max(minimum.d, size.z + 1.2),
    bottom: h * (category === "pizza" ? 0.7 : 0.43),
    lid: h * (category === "pizza" ? 0.3 : 0.57),
  };
}
