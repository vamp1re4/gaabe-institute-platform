const functions = require('firebase-functions/v1');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

/**
 * Firebase issues no Postgres role by default. Supabase's official Firebase
 * integration requires role=authenticated before it will expose RLS-protected
 * rows. This trigger grants only that generic transport role; application
 * authority continues to come from Supabase RLS and server-side administration.
 */
exports.assignSupabaseAuthenticatedRole = functions.auth.user().onCreate(async (user) => {
  const record = await getAuth().getUser(user.uid);
  await getAuth().setCustomUserClaims(user.uid, {
    ...(record.customClaims ?? {}),
    role: 'authenticated',
  });
});
