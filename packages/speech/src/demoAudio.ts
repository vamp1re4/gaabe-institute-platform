/**
 * Generates a short, quiet sine-tone WAV in memory. Used ONLY to exercise the audio player
 * (teacher-recording provider path) in the demo. It is NOT speech and NOT a recording of anyone.
 */
export function makeDemoToneUrl(durationMs = 1800, freq = 330): string {
  const sampleRate = 22050;
  const n = Math.floor((sampleRate * durationMs) / 1000);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  v.setUint32(4, 36 + n * 2, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, 'data');
  v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / 2000, (n - i) / 2000);
    v.setInt16(44 + i * 2, Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.12 * env * 32767, true);
  }
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
