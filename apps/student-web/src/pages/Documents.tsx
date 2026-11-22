import { useEffect, useMemo, useState } from 'react';
import { T } from '@gaabe/i18n';
import { ReadAloudToolbar, toSegments, useReadingSegmentId } from '@gaabe/speech';
import { Lang, Notice } from '@gaabe/ui';
import { makeDemoPdfUrl, sampleDocument } from '@gaabe/demo-data';

export function DocumentsPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  useEffect(() => {
    const url = makeDemoPdfUrl();
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  const queueId = 'doc-sample';
  const reading = useReadingSegmentId(queueId);
  const segments = useMemo(
    () => sampleDocument.paragraphs.flatMap((p) => toSegments(p.id, p.text, p.lang)),
    [],
  );

  return (
    <div className="container page stack">
      <h1><T k="document.title" /></h1>

      <section className="stack" aria-labelledby="pdf-h">
        <h2 id="pdf-h">PDF</h2>
        <Notice>
          Generated sample PDF shown with the browser&apos;s built-in viewer. A full viewer (page thumbnails, text layer, access control) needs the server pipeline and is not built yet.
        </Notice>
        {pdfUrl && (
          <>
            <iframe title="Sample PDF" src={pdfUrl} style={{ inlineSize: '100%', blockSize: '32rem', border: '1px solid var(--border)', borderRadius: 12, background: '#fff' }} />
            <a className="btn btn-ghost" style={{ alignSelf: 'start' }} href={pdfUrl} target="_blank" rel="noreferrer">
              Open PDF in a new tab
            </a>
          </>
        )}
      </section>

      <section className="stack" aria-labelledby="doc-h">
        <h2 id="doc-h"><Lang>{sampleDocument.title}</Lang></h2>
        <Notice><T k="document.sampleNotice" /></Notice>
        <ReadAloudToolbar queueId={queueId} segments={segments} />
        <article className="card stack">
          {sampleDocument.paragraphs.map((p, n) => (
            <div key={p.id}>
              <span className="muted"><T k="document.paragraphN" vars={{ n: n + 1 }} /></span>
              <p lang={p.lang} dir={p.lang === 'dv' ? 'rtl' : 'ltr'} className={reading?.startsWith(`${p.id}-`) ? 'reading-now' : undefined}>
                {p.text}
              </p>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}
