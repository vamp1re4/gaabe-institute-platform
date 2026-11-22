/**
 * Builds a tiny valid single-page PDF in memory (ASCII text only) so the PDF viewing path can be
 * exercised without shipping a binary asset. It is a generated sample, not course material.
 */
export function buildDemoPdf(lines: string[]): Uint8Array {
  const esc = (s: string) => s.replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7e]/g, '?');
  const text = ['BT', '/F1 18 Tf', '72 740 Td', '24 TL', ...lines.map((l) => `(${esc(l)}) Tj T*`), 'ET'].join('\n');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (out += `${String(o).padStart(10, '0')} 00000 n \n`));
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(out);
}

export function makeDemoPdfUrl(): string {
  const bytes = buildDemoPdf([
    'Gaabe Institute - DEMO PDF',
    'This generated sample is not course material.',
    'It only proves that PDF viewing works in the browser.',
  ]);
  const copy = new Uint8Array(bytes);
  return URL.createObjectURL(new Blob([copy], { type: 'application/pdf' }));
}
