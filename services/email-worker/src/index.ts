export interface Env {
  RESEND_API_KEY: string;
  EMAIL_FROM?: string;
  EMAIL_JOB_TOKEN: string;
}
type EmailJob = { type: "welcome" | "class_reminder"; to: string; language: "en" | "dv"; studentName: string; classTitle?: string; classTime?: string };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
const isEmail = (value: unknown): value is string => typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
function render(job: EmailJob) {
  const name = escapeHtml(job.studentName);
  const title = escapeHtml(job.classTitle ?? "");
  const time = escapeHtml(job.classTime ?? "");
  const dv = job.language === "dv";
  const subject = job.type === "welcome" ? (dv ? "ގާބޭ އިންސްޓިޓިއުޓަށް މަރުޙަބާ" : "Welcome to Gaabe Institute") : (dv ? "ކްލާސް ހަނދާންކުރުން" : "Class reminder");
  const body = job.type === "welcome"
    ? (dv ? `މަރުޙަބާ، ${name}. ގާބޭ އިންސްޓިޓިއުޓަށް މަރުޙަބާ.` : `Welcome, ${name}. Thanks for joining Gaabe Institute.`)
    : (dv ? `${name}، ކްލާސް ހަނދާންކުރުން: ${title} — ${time}` : `Hi ${name}, reminder: ${title} — ${time}`);
  return { subject, html: `<!doctype html><html lang="${job.language}" dir="${dv ? "rtl" : "ltr"}"><head><meta charset="utf-8"></head><body><main><h1>${escapeHtml(subject)}</h1><p>${body}</p></main></body></html>`, text: job.type === "welcome" ? (dv ? `މަރުޙަބާ، ${job.studentName}` : `Welcome, ${job.studentName}`) : `${job.studentName}: ${job.classTitle} — ${job.classTime}` };
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname !== "/internal/email/send") return json({ error: "not_found" }, 404);
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    if (!env.EMAIL_JOB_TOKEN || !env.RESEND_API_KEY) return json({ error: "service_unconfigured" }, 503);
    const supplied = request.headers.get("authorization");
    if (!supplied || supplied !== `Bearer ${env.EMAIL_JOB_TOKEN}`) return json({ error: "unauthorized" }, 401);
    if ((Number(request.headers.get("content-length")) || 0) > 8192) return json({ error: "payload_too_large" }, 413);
    let job: EmailJob;
    try { job = await request.json() as EmailJob; } catch { return json({ error: "invalid_json" }, 400); }
    if (!job || !["welcome", "class_reminder"].includes(job.type) || !isEmail(job.to) || !["en", "dv"].includes(job.language) || typeof job.studentName !== "string" || job.studentName.length > 120 || (job.type === "class_reminder" && (typeof job.classTitle !== "string" || typeof job.classTime !== "string" || job.classTitle.length > 200 || job.classTime.length > 100))) return json({ error: "invalid_job" }, 400);
    const content = render(job);
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ from: env.EMAIL_FROM || "Gaabe Institute <noreply@mail.techtasks.store>", to: [job.to], ...content }) });
    if (!response.ok) return json({ error: "delivery_provider_error", status: response.status }, 502);
    const result = await response.json() as { id?: string };
    return json({ id: result.id ?? null, status: "accepted" }, 202);
  }
};
