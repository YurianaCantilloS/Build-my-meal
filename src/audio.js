// All sound is synthesized locally, after an explicit user gesture. No external media.
let context,
  enabled = false;
export function setSound(value) {
  enabled = value;
  if (value) {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    context.resume().catch(() => {});
    playSound("click");
  }
}
export function playSound(type = "click") {
  if (!enabled || !context) return;
  if (context.state === "suspended") context.resume().catch(() => {});
  const now = context.currentTime;
  const notes =
    type === "success" ? [660, 880, 1320] : type === "drop" ? [160, 90] : [540];
  notes.forEach((frequency, i) => {
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = type === "drop" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now + i * 0.075);
    if (type === "drop")
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 0.55,
        now + i * 0.075 + 0.15,
      );
    gain.gain.setValueAtTime(0.0001, now + i * 0.075);
    gain.gain.exponentialRampToValueAtTime(
      type === "success" ? 0.035 : 0.022,
      now + i * 0.075 + 0.008,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + i * 0.075 + (type === "success" ? 0.5 : 0.13),
    );
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + i * 0.075);
    oscillator.stop(now + i * 0.075 + 0.55);
  });
}
