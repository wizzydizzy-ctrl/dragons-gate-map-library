import assert from "node:assert/strict"
import test from "node:test"
import { catalogRecord, validateAndNormalizeMap, validateDiagnostic } from "../src/validation.js"

const valid = () => ({
  publisher: "Map Maker",
  slug: "My Map",
  map: {
    format: "DragonsGateHUD-map", schema: 1, title: "Test", version: "1.0.0",
    provenance: { publisher: "old", slug: "old", author: "Dace", artifact_id: "local:1", verified: true },
    rooms: [
      { id: 1, partition: "a", area: 7, x: 0, y: 0, z: 0, exits: [{ direction: "e", to: 2 }], special_exits: [] },
      { id: 2, partition: "a", area: 7, x: 1, y: 0, z: 0, exits: [{ direction: "w", to: 1 }], special_exits: [] }
    ]
  }
})

test("normalizes publisher, slug, and unverified provenance", () => {
  const result = validateAndNormalizeMap(valid(), "ABC-123")
  assert.equal(result.publisher, "Map-Maker")
  assert.equal(result.slug, "my-map")
  assert.equal(result.map.provenance.verified, false)
  assert.equal(result.map.provenance.submission_id, "ABC-123")
})

test("rejects exits to unknown rooms", () => {
  const input = valid()
  input.map.rooms[0].exits[0].to = 999
  assert.throws(() => validateAndNormalizeMap(input, "id"), /invalid directional exit/)
})

test("rejects unsafe special exits", () => {
  const input = valid()
  input.map.rooms[0].special_exits = [{ to: 2, command: "" }]
  assert.throws(() => validateAndNormalizeMap(input, "id"), /unsafe special exit/)
})

test("builds a catalog record compatible with the Python validator", async () => {
  const result = validateAndNormalizeMap(valid(), "id")
  const raw = `${JSON.stringify(result.map, null, 2)}\n`
  const record = await catalogRecord(result.map, result.publisher, result.slug, raw, "owner/repo")
  assert.equal(record.room_count, 2)
  assert.equal(record.areas[0], "7")
  assert.match(record.sha256, /^[a-f0-9]{64}$/)
})

test("accepts only bounded sanitized anonymous diagnostics", () => {
  const report=validateDiagnostic({component:"map_import",edition:"player",version:"0.2.147",mudlet_version:"5.0.1",message:"room validation failed",details:"current_room=199\nlast_status=import"},"report-1")
  assert.equal(report.request_id,"report-1")
  assert.throws(()=>validateDiagnostic({...report,token:"secret"},"x"),/unsupported field/)
  assert.throws(()=>validateDiagnostic({component:"map",edition:"player",version:"1",mudlet_version:"5",message:"failed",details:"password=secret"},"x"),/sensitive/)
})
