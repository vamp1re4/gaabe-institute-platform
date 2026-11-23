import { Link } from 'react-router-dom';
import { Notice } from '@gaabe/ui';
import { usePaymentNotification } from '../production-auth';

/** Stripe redirects here after Checkout; it is deliberately not an entitlement. */
export function PaymentReturn() {
  const notification = usePaymentNotification();
  return (
    <div className="container page" style={{ maxInlineSize: '44rem' }}>
      <section className="card stack" aria-labelledby="payment-verification-title">
        <h1 id="payment-verification-title">Verifying your test payment</h1>
        {notification ? (
          <Notice>Test subscription status updated: <strong>{notification.status}</strong>. Access remains governed by the server.</Notice>
        ) : (
          <Notice>Stripe has returned you to Gaabe Institute. Your learning access will remain unchanged until the signed Stripe webhook is recorded by our server.</Notice>
        )}
        <p className="muted">This is a test-mode checkout. No live payment has been processed.</p>
        <div className="row">
          <Link className="btn btn-gold" to="/dashboard">Go to dashboard</Link>
          <Link className="btn btn-ghost" to="/pricing">Back to pricing</Link>
        </div>
      </section>
    </div>
  );
}
