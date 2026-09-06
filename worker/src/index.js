import { catalogRecord, SubmissionError, validateAndNormalizeMap } from "./validation.js"
import { publishPullRequest } from "./github.js"

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
})

export async function handleRequest(request, env) {
  const url = new URL(request.url)
  if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, service: "dghud-map-submissions" })
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
      makeRecord: (slug, formattedRaw, repository) => catalogRecord(normalized.map, normalized.publisher, slug, formattedRaw, repository)
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
