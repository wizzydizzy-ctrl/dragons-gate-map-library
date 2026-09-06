import { catalogRecord, catalogRecordV2, SubmissionError, validateAndNormalizeMap, validateDiagnostic } from "./validation.js"
import { publishDiagnosticIssue, publishPullRequest } from "./github.js"

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
})
const hexDigest=async value => [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map(byte=>byte.toString(16).padStart(2,"0")).join("")
async function acceptDiagnostic(env,request,raw) {
  const store=env.DGHUD_DIAGNOSTIC_LIMITS; if(!store) throw new SubmissionError("diagnostic service is temporarily unavailable",503)
  const digest=await hexDigest(raw); const duplicate=await store.get(`report:${digest}`); if(duplicate) return {duplicate}
  const now=Math.floor(Date.now()/1000); const window=Math.floor(now/900); const day=Math.floor(now/86400); const source=await hexDigest(request.headers.get("CF-Connecting-IP") || "unknown")
  const clientKey=`client:${source}:${window}`; const dayKey=`global:${day}`; const client=Number(await store.get(clientKey)||0); const global=Number(await store.get(dayKey)||0)
  if(client>=3 || global>=200) throw new SubmissionError("diagnostic submission limit reached; please try again later",429)
  await Promise.all([store.put(clientKey,String(client+1),{expirationTtl:1800}),store.put(dayKey,String(global+1),{expirationTtl:172800})])
  return {digest}
}

export async function handleRequest(request, env) {
  const url = new URL(request.url)
  if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, service: "dghud-map-submissions" })
  if (request.method === "POST" && url.pathname === "/v1/diagnostics") {
    try { if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json")) throw new SubmissionError("content type must be application/json",415); const raw=await request.text(); if(new TextEncoder().encode(raw).length>32768) throw new SubmissionError("diagnostic exceeds 32 KB",413); const accepted=await acceptDiagnostic(env,request,raw); if(accepted.duplicate) return json({ok:true,report_id:accepted.duplicate,duplicate:true},202); const requestId=crypto.randomUUID(); const report=validateDiagnostic(JSON.parse(raw),requestId); const result=await publishDiagnosticIssue(env,report); await env.DGHUD_DIAGNOSTIC_LIMITS.put(`report:${accepted.digest}`,requestId,{expirationTtl:86400}); return json({ok:true,report_id:requestId,...result},202) }
    catch(error) { if(error instanceof SubmissionError) return json({error:error.message},error.status); if(error instanceof SyntaxError) return json({error:"invalid JSON"},400); console.error(error); return json({error:"internal error"},500) }
  }
  if (request.method !== "POST" || url.pathname !== "/v1/maps") return json({ error: "not found" }, 404)
  const declaredSize = Number(request.headers.get("content-length") || 0)
  if (declaredSize > 20_000_000) return json({ error: "map exceeds 20 MB" }, 413)
  try {
    const body = await request.json()
    const requestId = crypto.randomUUID()
    const normalized = validateAndNormalizeMap(body, requestId)
    const raw = JSON.stringify(normalized.map)
    if (new TextEncoder().encode(raw).length > 20_000_000) throw new SubmissionError("map exceeds 20 MB", 413)
    const result = await publishPullRequest(env, {
      ...normalized,
      requestId,
      makeRecord: (slug, formattedRaw, repository) => catalogRecord(normalized.map, normalized.publisher, slug, formattedRaw, repository),
      makeRecordV2: (slug, formattedRaw, repository) => catalogRecordV2(normalized.map, normalized.publisher, slug, formattedRaw, repository)
    })
    return json({ ok: true, submission_id: requestId, status: "pending_review", ...result }, 202)
  } catch (error) {
    if (error instanceof SubmissionError) return json({ error: error.message }, error.status)
    if (error instanceof SyntaxError) return json({ error: "invalid JSON" }, 400)
    console.error(error)
    return json({ error: "internal error" }, 500)
  }
}

export default { fetch: handleRequest }
