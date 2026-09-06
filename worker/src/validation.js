export const DIRECTIONS = new Set(["n", "ne", "e", "se", "s", "sw", "w", "nw", "up", "down", "in", "out"])

export class SubmissionError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = "SubmissionError"
    this.status = status
  }
}

export function cleanHandle(value) {
  const handle = String(value || "").trim().replace(/[^A-Za-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
  if (!handle || handle.length > 39) throw new SubmissionError("publisher must contain 1-39 letters, numbers, or hyphens")
  return handle
}

export function cleanSlug(value) {
  const slug = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(slug)) throw new SubmissionError("map slug is invalid")
  return slug
}

function safeText(value, label, max) {
  if (typeof value !== "string" || !value.trim()) throw new SubmissionError(`${label} is required`)
  const text = value.trim()
  if (text.length > max) throw new SubmissionError(`${label} is too long`)
  return text
}

export function validateAndNormalizeMap(input, requestId) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new SubmissionError("request body must be a JSON object")
  const map = structuredClone(input.map || input)
  if (map.format !== "DragonsGateHUD-map" || map.schema !== 1) throw new SubmissionError("unsupported map format")
  if (!map.provenance || typeof map.provenance !== "object") throw new SubmissionError("missing provenance")

  const publisher = cleanHandle(input.publisher || map.provenance.publisher)
  const slug = cleanSlug(input.slug || map.provenance.slug)
  map.title = safeText(map.title || slug, "title", 120)
  map.description = typeof map.description === "string" ? map.description.trim().slice(0, 1000) : ""
  map.version = String(map.version || "1.0.0").slice(0, 40)
  map.provenance.publisher = publisher
  map.provenance.slug = slug
  map.provenance.author = safeText(map.provenance.author, "author", 100)
  map.provenance.artifact_id = safeText(map.provenance.artifact_id, "artifact ID", 200)
  map.provenance.verified = false
  map.provenance.submission_id = requestId

  const selection = map.provenance.selection && typeof map.provenance.selection === "object" ? map.provenance.selection : {}
  const scope = map.provenance.scope || selection.scope || "all"
  if (!new Set(["all", "area", "subarea"]).has(scope)) throw new SubmissionError("map scope is invalid")
  map.provenance.scope = scope
  map.provenance.selection = { scope }
  for (const key of ["area", "partition", "area_name", "subarea_name"]) if (selection[key] != null) map.provenance.selection[key] = safeText(String(selection[key]), key.replace("_", " "), key.endsWith("name") ? 100 : 160)

  if (!Array.isArray(map.rooms) || map.rooms.length < 1 || map.rooms.length > 20000) throw new SubmissionError("invalid room collection")
  const ids = new Set()
  const coordinates = new Set()
  let edges = 0
  for (const [index, room] of map.rooms.entries()) {
    if (!room || typeof room !== "object") throw new SubmissionError(`room ${index + 1} is invalid`)
    if (!Number.isInteger(room.id) || room.id <= 0 || ids.has(room.id)) throw new SubmissionError(`room ${index + 1} has an invalid or duplicate ID`)
    ids.add(room.id)
    const coordinate = JSON.stringify([room.partition, room.x, room.y, room.z])
    if (coordinates.has(coordinate)) throw new SubmissionError(`room ${index + 1} duplicates a coordinate in its partition`)
    coordinates.add(coordinate)
  }
  for (const [index, room] of map.rooms.entries()) {
    const exits = room.exits ?? []
    const special = room.special_exits ?? []
    if (!Array.isArray(exits) || !Array.isArray(special)) throw new SubmissionError(`room ${index + 1} has invalid exits`)
    for (const edge of exits) {
      edges++
      if (!edge || !DIRECTIONS.has(edge.direction) || !ids.has(edge.to)) throw new SubmissionError(`room ${index + 1} has an invalid directional exit`)
    }
    for (const edge of special) {
      edges++
      if (!edge || !ids.has(edge.to) || typeof edge.command !== "string" || !edge.command.trim() || edge.command.length > 160) {
        throw new SubmissionError(`room ${index + 1} has an unsafe special exit`)
      }
    }
  }
  if (edges > 100000) throw new SubmissionError("map has too many exits")
  return { map, publisher, slug }
}

export async function catalogRecord(map, publisher, slug, raw, repository) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))
  const sha256 = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("")
  const record = {
    publisher,
    slug,
    name: map.title,
    author: map.provenance.author,
    description: map.description,
    version: map.version,
    areas: [...new Set(map.rooms.map(room => String(room.area ?? "unknown")))].sort(),
    room_count: map.rooms.length,
    bytes: new TextEncoder().encode(raw).length,
    download_url: `https://raw.githubusercontent.com/${repository}/main/maps/${publisher}/${slug}.json`,
    sha256
  }
  return record
}

export async function catalogRecordV2(map, publisher, slug, raw, repository) {
  const base = await catalogRecord(map, publisher, slug, raw, repository)
  const selection = map.provenance.selection || {}
  const record = {
    ...base,
    scope: map.provenance.scope === "area" ? "area" : map.provenance.scope === "subarea" ? "subarea" : "full_map",
    map_name: map.title,
    subareas: [...new Set(map.rooms.map(room => String(room.partition ?? "unknown")))].sort()
  }
  if (selection.area_name) record.area_name = selection.area_name
  if (selection.subarea_name) record.subarea_name = selection.subarea_name
  return record
}

export function validateDiagnostic(input, requestId) {
  if (!input || typeof input!=="object" || Array.isArray(input)) throw new SubmissionError("diagnostic body must be an object")
  const allowed=new Set(["component","edition","version","mudlet_version","message","details"])
  for (const key of Object.keys(input)) if (!allowed.has(key)) throw new SubmissionError(`diagnostic contains unsupported field ${key}`)
  const plain=(value,label,max) => { const text=String(value || "").trim(); if (!text || text.length>max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) throw new SubmissionError(`${label} is invalid`); return text }
  const component=plain(input.component,"component",40).toLowerCase()
  if (!/^[a-z0-9_-]+$/.test(component)) throw new SubmissionError("component is invalid")
  const report={request_id:requestId,component,edition:plain(input.edition,"edition",16),version:plain(input.version,"version",32),mudlet_version:plain(input.mudlet_version,"Mudlet version",40),message:plain(input.message,"message",500),details:plain(input.details,"details",12000)}
  const forbidden=/(password|username|account|authorization|bearer|token|api[_ -]?key|ip address|chat history|room prose)\s*[:=]/i
  if (forbidden.test(report.message) || forbidden.test(report.details)) throw new SubmissionError("diagnostic appears to contain sensitive fields")
  return report
}
