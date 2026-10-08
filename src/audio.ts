// Sonido chiptune generado en el momento con WebAudio: no hay archivos de
// audio, así que todo es original y la app pesa menos.

export type Sfx = 'pio' | 'nam' | 'jump' | 'catch' | 'coin' | 'error' | 'hit' | 'tap';
export type Track = 'home' | 'game';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let wanted: Track | null = null;
let playing: { track: Track; timer: number } | null = null;

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

/** Los navegadores solo dejan sonar después de un toque: se activa con el primero. */
export function initAudio(): void {
  const unlock = () => {
    const c = audio();
    void c?.resume();
    if (wanted && !playing) startTrack(wanted);
  };
  document.addEventListener('pointerdown', unlock, { once: false, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopTrack();
    else if (wanted) startTrack(wanted);
  });
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopTrack();
  else if (wanted) startTrack(wanted);
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
  const c = audio();
  if (!c || !master) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function noise(start: number, dur: number, vol: number): void {
  const c = audio();
  if (!c || !master) return;
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  const gain = c.createGain();
  src.buffer = buffer;
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  src.connect(gain).connect(master);
  src.start(start);
}

export function sfx(name: Sfx): void {
  const c = audio();
  if (!enabled || !c || c.state !== 'running') return;
  const t = c.currentTime;
  switch (name) {
    case 'pio':
      tone(1400, t, 0.07, 'square', 0.12, 1900);
      tone(1500, t + 0.1, 0.09, 'square', 0.12, 2100);
      break;
    case 'nam':
      tone(300, t, 0.08, 'square', 0.15, 200);
      tone(330, t + 0.14, 0.08, 'square', 0.15, 220);
      break;
    case 'jump':
      tone(320, t, 0.16, 'square', 0.1, 760);
      break;
    case 'catch':
      [660, 880, 1320].forEach((f, i) => tone(f, t + i * 0.05, 0.08, 'triangle', 0.2));
      break;
    case 'coin':
      tone(988, t, 0.08, 'square', 0.1);
      tone(1319, t + 0.08, 0.22, 'square', 0.1);
      break;
    case 'error':
      tone(220, t, 0.18, 'sawtooth', 0.08, 140);
      break;
    case 'hit':
      noise(t, 0.25, 0.25);
      tone(400, t, 0.3, 'square', 0.1, 80);
      break;
    case 'tap':
      tone(800, t, 0.03, 'square', 0.06);
      break;
  }
}

// ---------- música ----------

// Notas en semitonos desde La4 (0 = 440 Hz); null = silencio. Una nota por corchea.
type Bar = (number | null)[];
const SONGS: Record<Track, { bpm: number; lead: Bar; bass: Bar }> = {
  // Tranquila y alegre, para cuidar a Pío.
  home: {
    bpm: 96,
    lead: [3, null, 7, 10, 12, 10, 7, null, 5, null, 8, 12, 10, null, 8, 7, 3, null, 7, 10, 15, 14, 12, 10, 8, 7, 5, 3, 5, null, null, null],
    bass: [-21, null, -14, null, -21, null, -14, null, -16, null, -9, null, -16, null, -9, null, -21, null, -14, null, -21, null, -14, null, -16, null, -9, null, -14, null, -21, null],
  },
  // Más rápida, para los minijuegos.
  game: {
    bpm: 150,
    lead: [10, 12, 15, 12, 10, null, 7, null, 8, 10, 12, 10, 8, null, 5, null, 10, 12, 15, 17, 19, 17, 15, 12, 14, 12, 10, 7, 10, null, null, null],
    bass: [-14, -2, -14, -2, -14, -2, -14, -2, -16, -4, -16, -4, -16, -4, -16, -4, -14, -2, -14, -2, -11, 1, -11, 1, -9, 3, -9, 3, -14, -2, -14, -2],
  },
};

const freq = (semi: number) => 440 * 2 ** (semi / 12);

export function playMusic(track: Track): void {
  wanted = track;
  if (playing?.track === track) return;
  startTrack(track);
}

function startTrack(track: Track): void {
  stopTrack();
  const c = audio();
  if (!enabled || !c || c.state !== 'running' || document.hidden) return;
  const song = SONGS[track];
  const step = 60 / song.bpm / 2;
  let next = c.currentTime + 0.05;
  let i = 0;
  // Programa las notas un poco por adelantado para que no se corten.
  const schedule = () => {
    while (next < c.currentTime + 0.3) {
      const lead = song.lead[i % song.lead.length];
      const bass = song.bass[i % song.bass.length];
      if (lead !== null) tone(freq(lead), next, step * 0.9, 'square', 0.035);
      if (bass !== null) tone(freq(bass), next, step * 0.9, 'triangle', 0.08);
      next += step;
      i++;
    }
  };
  schedule();
  playing = { track, timer: window.setInterval(schedule, 100) };
}

function stopTrack(): void {
  if (playing) window.clearInterval(playing.timer);
  playing = null;
}

export function stopMusic(): void {
  wanted = null;
  stopTrack();
}
