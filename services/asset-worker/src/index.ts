interface Env {
  ASSETS: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  ALLOWED_ORIGINS: string;
}

const MAX_BYTES = 25 * 1024 * 1024;
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff' };

function json(value: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(value), { status, headers: { ...JSON_HEADERS, ...headers } });
}

function cors(request: Request, env: Env) {
  const origin = request.headers.get('origin');
  if (!origin) return {};
  const allowed = env.ALLOWED_ORIGINS.split(',').map((value) => value.trim());
  return allowed.includes(origin) ? { 'access-control-allow-origin': origin, vary: 'origin' } : null;
}

function bearer(request: Request) {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') && value.length > 7 ? value : null;
}

function safeFilename(value: string | null) {
  if (!value || value.length > 255 || /[\\/\u0000-\u001f]/.test(value)) return null;
  return value;
}

async function supabase(env: Env, authorization: string, path: string, init: RequestInit = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization, ...(init.headers ?? {}) },
  });
}

async function canUpload(env: Env, authorization: string, organizationId: string) {
  const response = await supabase(env, authorization, `organization_members?organization_id=eq.${encodeURIComponent(organizationId)}&select=role`);
  if (!response.ok) return false;
  const rows = await response.json() as Array<{ role?: string }>;
  return rows.some((row) => row.role === 'owner' || row.role === 'admin' || row.role === 'teacher');
}

export default {
  async fetch(request, env): Promise<Response> {
    const requestCors = cors(request, env);
    if (requestCors === null) return json({ error: 'origin_not_allowed' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...requestCors, 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'authorization, content-type, x-filename, x-organization-id', 'access-control-max-age': '600' } });
    const authorization = bearer(request);
    if (!authorization) return json({ error: 'unauthorized' }, 401, requestCors);
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/v1/assets') {
      const organizationId = request.headers.get('x-organization-id');
      const filename = safeFilename(request.headers.get('x-filename'));
      const contentType = request.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream';
      const length = Number(request.headers.get('content-length') ?? 0);
      if (!organizationId || !filename || !request.body || !Number.isFinite(length) || length < 1 || length > MAX_BYTES) return json({ error: 'invalid_upload' }, 400, requestCors);
      if (!await canUpload(env, authorization, organizationId)) return json({ error: 'forbidden' }, 403, requestCors);
      const r2Key = `organizations/${organizationId}/assets/${crypto.randomUUID()}`;
      await env.ASSETS.put(r2Key, request.body, { httpMetadata: { contentType } });
      const profile = await supabase(env, authorization, 'profiles?select=firebase_uid');
      const profileRows = profile.ok ? await profile.json() as Array<{ firebase_uid: string }> : [];
      const ownerUid = profileRows[0]?.firebase_uid;
      if (!ownerUid) { await env.ASSETS.delete(r2Key); return json({ error: 'forbidden' }, 403, requestCors); }
      const stored = await supabase(env, authorization, 'assets', { method: 'POST', headers: { 'content-type': 'application/json', prefer: 'return=representation' }, body: JSON.stringify({ organization_id: organizationId, owner_uid: ownerUid, r2_key: r2Key, original_filename: filename, content_type: contentType, byte_size: length, visibility: 'private' }) });
      if (!stored.ok) { await env.ASSETS.delete(r2Key); return json({ error: 'metadata_failed' }, 502, requestCors); }
      const [asset] = await stored.json() as Array<{ id: string; original_filename: string; content_type: string; byte_size: number }>;
      return json({ asset }, 201, requestCors);
    }

    const match = /^\/v1\/assets\/([0-9a-f-]{36})$/.exec(url.pathname);
    if (request.method === 'GET' && match) {
      const assetResponse = await supabase(env, authorization, `assets?id=eq.${match[1]}&select=r2_key,original_filename,content_type`);
      if (!assetResponse.ok) return json({ error: 'asset_lookup_failed' }, 502, requestCors);
      const [asset] = await assetResponse.json() as Array<{ r2_key: string; original_filename: string; content_type: string }>;
      if (!asset) return json({ error: 'not_found' }, 404, requestCors);
      const object = await env.ASSETS.get(asset.r2_key);
      if (!object) return json({ error: 'not_found' }, 404, requestCors);
      return new Response(object.body, { headers: { ...requestCors, 'content-type': asset.content_type, 'content-disposition': `attachment; filename="${asset.original_filename.replaceAll('"', '')}"`, 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' } });
    }
    return json({ error: 'not_found' }, 404, requestCors);
  },
} satisfies ExportedHandler<Env>;
