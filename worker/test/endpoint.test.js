import assert from "node:assert/strict"
import test from "node:test"
import { handleRequest } from "../src/index.js"

test("health endpoint is public", async () => {
  const response = await handleRequest(new Request("https://example.test/health"), {})
  assert.equal(response.status, 200)
  assert.equal((await response.json()).ok, true)
})

test("submission validates before requiring GitHub configuration", async () => {
  const response = await handleRequest(new Request("https://example.test/v1/maps", {
    method: "POST", headers: { "content-type": "application/json" }, body: "{}"
  }), {})
  assert.equal(response.status, 400)
  assert.match((await response.json()).error, /unsupported map format/)
})
