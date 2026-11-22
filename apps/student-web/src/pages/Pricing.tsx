import { useState } from 'react';
import { formatMVR, T, useI18n, type MessageKey } from '@gaabe/i18n';
import { Badge, Button, Lang, Notice } from '@gaabe/ui';
import { plans } from '@gaabe/demo-data';
import { useSubscription } from '../state';

const PERIOD: Record<'month' | 'term' | 'year', MessageKey> = {
  month: 'pricing.perMonth',
  term: 'pricing.perTerm',
  year: 'pricing.perYear',
};

export function Pricing() {
  const { locale } = useI18n();
  const { planId, activate, reset } = useSubscription();
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = plans.find((p) => p.id === selected);

  return (
    <div className="container page stack">
      <div>
        <h1><T k="pricing.title" /></h1>
        <p className="muted"><T k="pricing.subtitle" /></p>
      </div>
      <Notice><T k="common.demoNotice" /></Notice>

      <div className="grid">
        {plans.map((p) => (
          <section key={p.id} className="card stack" aria-labelledby={`plan-${p.id}`} style={p.highlight ? { borderColor: 'var(--accent)', borderWidth: 2 } : undefined}>
            <div className="row row-between">
              <h2 id={`plan-${p.id}`} style={{ margin: 0 }}><Lang>{p.name}</Lang></h2>
              {planId === p.id && <Badge tone="gold"><T k="pricing.active" /></Badge>}
            </div>
            <p className="stat" style={{ margin: 0 }}>
              {p.priceMVR === 0 ? <T k="common.free" /> : formatMVR(locale, p.priceMVR)}
            </p>
            {p.priceMVR > 0 && <p className="muted" style={{ margin: 0 }}><T k={PERIOD[p.period]} /></p>}
            <ul style={{ paddingInlineStart: 18, margin: 0 }}>
              {p.features.map((f) => <li key={f}><Lang>{f}</Lang></li>)}
            </ul>
            {p.priceMVR > 0 && (
              <Button variant={p.highlight ? 'gold' : 'primary'} onClick={() => setSelected(p.id)} aria-pressed={selected === p.id}>
                <T k="pricing.choose" />
              </Button>
            )}
          </section>
        ))}
      </div>

      {chosen && (
        <section className="card stack" aria-labelledby="checkout" role="region">
          <h2 id="checkout"><T k="pricing.checkoutTitle" /></h2>
          <Notice tone="error"><T k="pricing.checkoutBody" /></Notice>
          <p><strong><Lang>{chosen.name}</Lang></strong> — {formatMVR(locale, chosen.priceMVR)} <T k={PERIOD[chosen.period]} /></p>
          <div className="row">
            <Button onClick={() => { activate(chosen.id); setSelected(null); }}><T k="pricing.confirm" /></Button>
            <Button variant="ghost" onClick={() => setSelected(null)}><T k="common.cancel" /></Button>
          </div>
        </section>
      )}

      {planId && planId !== 'free' && (
        <Button variant="ghost" style={{ alignSelf: 'start' }} onClick={reset}><T k="pricing.reset" /></Button>
      )}
    </div>
  );
}
