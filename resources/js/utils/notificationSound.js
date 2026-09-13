// Short two-note chime synthesized with the Web Audio API — no audio file to
// ship or license. The AudioContext is created lazily on first play, not at
// module load, since some browsers block audio until the page has seen a
// user gesture; by the time a poll finds a new notification, the user has
// already been interacting with the app.
let ctx = null;

export function playNotificationSound() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    [[880, now], [1108.73, now + 0.1]].forEach(([freq, start]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch {
    // Web Audio unsupported/blocked — silently skip, the visual badge still works.
  }
}
