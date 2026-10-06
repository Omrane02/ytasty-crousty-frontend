let audioContext: AudioContext | null = null;

export function enableSound(): boolean {
  try {
    audioContext ??= new AudioContext();
    void audioContext.resume();
    return true;
  } catch {
    return false;
  }
}

// Double bip "ding-ding", généré par le navigateur (aucun fichier audio à ajouter).
export function playNewOrderSound(): void {
  if (audioContext === null) return;
  const ctx = audioContext;
  const start = ctx.currentTime;

  [880, 1175].forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = start + index * 0.18;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.18);
  });
}