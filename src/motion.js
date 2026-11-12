// Exact damped-spring solution: the same trajectory at 30, 60 or 120 Hz.
export function spring(
  position,
  velocity,
  target,
  dt,
  stiffness = 170,
  damping = 21,
) {
  const offset = position - target,
    half = damping / 2,
    discriminant = half * half - stiffness;
  if (Math.abs(discriminant) < 1e-6) {
    const e = Math.exp(-half * dt),
      b = velocity + half * offset;
    return [target + e * (offset + b * dt), e * (velocity - half * b * dt)];
  }
  if (discriminant < 0) {
    const omega = Math.sqrt(-discriminant),
      angle = omega * dt,
      e = Math.exp(-half * dt),
      c = Math.cos(angle),
      s = Math.sin(angle);
    return [
      target + e * (offset * c + ((velocity + half * offset) / omega) * s),
      e * (velocity * c - ((half * velocity + stiffness * offset) / omega) * s),
    ];
  }
  const root = Math.sqrt(discriminant),
    r1 = -half + root,
    r2 = -half - root,
    a = (velocity - r2 * offset) / (r1 - r2),
    b = offset - a,
    e1 = Math.exp(r1 * dt),
    e2 = Math.exp(r2 * dt);
  return [target + a * e1 + b * e2, r1 * a * e1 + r2 * b * e2];
}
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const smootherstep = (t) => {
  t = clamp(t, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const randomSeed = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
