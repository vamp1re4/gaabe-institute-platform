import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type PublicBackendConfig = {
  firebase: FirebaseOptions;
  supabaseUrl: string;
  supabasePublishableKey: string;
};

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required to use the production backend.`);
  return value;
}

/**
 * Reads public browser configuration only. Secrets such as Firebase service
 * accounts, the Supabase service role, Resend and R2 keys must never appear
 * in VITE_ variables or in a browser bundle.
 */
export function publicBackendConfig(env: ImportMetaEnv): PublicBackendConfig {
  return {
    firebase: {
      apiKey: required(env.VITE_FIREBASE_API_KEY, 'VITE_FIREBASE_API_KEY'),
      authDomain: required(env.VITE_FIREBASE_AUTH_DOMAIN, 'VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: required(env.VITE_FIREBASE_PROJECT_ID, 'VITE_FIREBASE_PROJECT_ID'),
      appId: required(env.VITE_FIREBASE_APP_ID, 'VITE_FIREBASE_APP_ID'),
      messagingSenderId: required(env.VITE_FIREBASE_MESSAGING_SENDER_ID, 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
    },
    supabaseUrl: required(env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL'),
    supabasePublishableKey: required(env.VITE_SUPABASE_PUBLISHABLE_KEY, 'VITE_SUPABASE_PUBLISHABLE_KEY'),
  };
}

export function createProductionClients(config: PublicBackendConfig): { auth: Auth; supabase: SupabaseClient } {
  const app = getApps().length ? getApp() : initializeApp(config.firebase);
  const auth = getAuth(app);
  const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    accessToken: async () => (await auth.currentUser?.getIdToken(false)) ?? null,
  });
  return { auth, supabase };
}
