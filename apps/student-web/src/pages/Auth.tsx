import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { T, useI18n } from '@gaabe/i18n';
import { Button, Notice } from '@gaabe/ui';
import { useDemoUser } from '../state';
import { productionAuthEnabled, registerProduction, signInProduction } from '../production-auth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthForm({ mode }: { mode: 'signin' | 'register' }) {
  const { t } = useI18n();
  const nav = useNavigate();
  const { signIn } = useDemoUser();
  const [errors, setErrors] = useState<{ email?: boolean; password?: boolean; name?: boolean }>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') ?? '').trim();
    const password = String(f.get('password') ?? '');
    const name = String(f.get('name') ?? '').trim();
    const next = {
      email: !EMAIL.test(email),
      password: password.length < 8,
      name: mode === 'register' && name.length < 2,
    };
    setErrors(next);
    if (next.email || next.password || next.name) return;
    try {
      if (productionAuthEnabled) {
        if (mode === 'register') await registerProduction(name, email, password);
        else await signInProduction(email, password);
      } else {
        // Demo deployments have no production identity provider configured.
        signIn(name || email.split('@')[0]!);
      }
      nav('/dashboard');
    } catch {
      setErrors({ email: true, password: true, name: mode === 'register' && name.length < 2 });
    }
  }

  return (
    <div className="container page" style={{ maxInlineSize: '32rem' }}>
      <form className="card stack" onSubmit={onSubmit} noValidate aria-labelledby="auth-h">
        <h1 id="auth-h" style={{ fontSize: '1.6rem' }}>
          <T k={mode === 'signin' ? 'auth.signIn.title' : 'auth.register.title'} />
        </h1>
        {!productionAuthEnabled && <Notice><T k="auth.demoNotice" /></Notice>}

        {mode === 'register' && (
          <div className="field">
            <label htmlFor="name"><T k="auth.name" /></label>
            <input id="name" name="name" type="text" autoComplete="name" aria-invalid={errors.name} aria-describedby={errors.name ? 'name-err' : undefined} />
            {errors.name && <span id="name-err" role="alert" style={{ color: 'var(--danger)' }}>≥ 2</span>}
          </div>
        )}
        <div className="field">
          <label htmlFor="email"><T k="auth.email" /></label>
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" aria-invalid={errors.email} aria-describedby={errors.email ? 'email-err' : undefined} />
          {errors.email && <span id="email-err" role="alert" style={{ color: 'var(--danger)' }}>name@example.com</span>}
        </div>
        <div className="field">
          <label htmlFor="password"><T k="auth.password" /></label>
          <input id="password" name="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} aria-invalid={errors.password} aria-describedby={errors.password ? 'pw-err' : undefined} />
          {errors.password && <span id="pw-err" role="alert" style={{ color: 'var(--danger)' }}>≥ 8</span>}
        </div>
        {mode === 'register' && (
          <label className="choice">
            <input type="checkbox" name="guardian" />
            <span><T k="auth.guardian" /></span>
          </label>
        )}
        <Button type="submit"><T k={mode === 'signin' ? 'nav.signIn' : 'nav.register'} /></Button>
        <p className="muted" style={{ margin: 0 }}>
          {mode === 'signin' ? (
            <Link to="/register">{t('nav.register')}</Link>
          ) : (
            <Link to="/sign-in">{t('nav.signIn')}</Link>
          )}
        </p>
      </form>
    </div>
  );
}

export const SignIn = () => <AuthForm mode="signin" />;
export const Register = () => <AuthForm mode="register" />;
