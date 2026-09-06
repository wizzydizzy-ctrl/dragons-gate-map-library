import { SubmissionError } from "./validation.js"

export function githubClient(env) {
  const repository = `${env.GITHUB_OWNER}/${env.GITHUB_REPO}`
  const base = `https://api.github.com/repos/${repository}`
  async function call(path, options = {}) {
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "dghud-map-submissions",
        "X-GitHub-Api-Version": "2022-11-28",
        ...options.headers
      }
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new SubmissionError(`GitHub request failed (${response.status}): ${body.message || "unknown error"}`, 502)
    return body
  }
  return { call, repository }
}

export async function publishPullRequest(env, submission) {
  if (!env.GITHUB_TOKEN) throw new SubmissionError("submission service is not configured", 503)
  const client = githubClient(env)
  const baseBranch = env.GITHUB_BASE_BRANCH || "main"
  const ref = await client.call(`/git/ref/heads/${encodeURIComponent(baseBranch)}`)
  const commit = await client.call(`/git/commits/${ref.object.sha}`)
  const catalogFile = await client.call(`/contents/catalog.json?ref=${encodeURIComponent(baseBranch)}`)
  const catalog = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(catalogFile.content.replace(/\n/g, "")), c => c.charCodeAt(0))))

  const existing = catalog.maps.find(item => item.publisher === submission.publisher && item.slug === submission.slug)
  const finalSlug = existing ? `${submission.slug}-${submission.requestId.slice(0, 8).toLowerCase()}` : submission.slug
  submission.map.provenance.slug = finalSlug
  const mapRaw = `${JSON.stringify(submission.map, null, 2)}\n`
  const record = await submission.makeRecord(finalSlug, mapRaw, client.repository)
  catalog.maps.push(record)
  catalog.maps.sort((a, b) => `${a.publisher}/${a.slug}`.localeCompare(`${b.publisher}/${b.slug}`))
  const catalogRaw = `${JSON.stringify(catalog, null, 2)}\n`

  const [mapBlob, catalogBlob] = await Promise.all([
    client.call("/git/blobs", { method: "POST", body: JSON.stringify({ content: mapRaw, encoding: "utf-8" }) }),
    client.call("/git/blobs", { method: "POST", body: JSON.stringify({ content: catalogRaw, encoding: "utf-8" }) })
  ])
  const tree = await client.call("/git/trees", { method: "POST", body: JSON.stringify({
    base_tree: commit.tree.sha,
    tree: [
      { path: `maps/${submission.publisher}/${finalSlug}.json`, mode: "100644", type: "blob", sha: mapBlob.sha },
      { path: "catalog.json", mode: "100644", type: "blob", sha: catalogBlob.sha }
    ]
  }) })
  const newCommit = await client.call("/git/commits", { method: "POST", body: JSON.stringify({
    message: `Submit map: ${submission.publisher}/${finalSlug}`,
    tree: tree.sha,
    parents: [ref.object.sha]
  }) })
  const branch = `submissions/${submission.requestId.toLowerCase()}`
  await client.call("/git/refs", { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommit.sha }) })
  const pr = await client.call("/pulls", { method: "POST", body: JSON.stringify({
    title: `Map submission: ${submission.map.title}`,
    head: branch,
    base: baseBranch,
    body: `Automated DGHUD submission **${submission.requestId}** from **${submission.map.provenance.author}**.\n\nThe map is unverified and requires review before merging.`
  }) })
  return { pull_request_url: pr.html_url, number: pr.number, publisher: submission.publisher, slug: finalSlug }
}
