import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createBaselineAgents, getBaselineMetadata } from "../src/arena/baseline-agents.js";
import { ArenaRunner } from "../src/arena/arena-runner.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "demo");
const profileId = process.argv[2] ?? "river_basin";
const result = new ArenaRunner({
  turns: 400,
  worldIdPrefix: `sample-${profileId}`,
  profileId
}).runBaselines(createBaselineAgents());
const metadata = new Map(getBaselineMetadata().map((entry) => [entry.id, entry]));
const ranked = result.agent_results
  .map((entry) => ({ ...entry, ...metadata.get(entry.agent_id) }))
  .sort((a, b) => b.final_score.total - a.final_score.total);
const winner = ranked[0];

const report = {
  benchmark: "100 Winters",
  ruleset: result.ruleset,
  profile_id: result.profile_id,
  protocol: { turns: result.turns, target_winters: result.target_winters, policies: ranked.length },
  agents: ranked.map((entry, index) => ({
    rank: index + 1,
    agent_id: entry.agent_id,
    label: entry.label,
    philosophy: entry.philosophy,
    completed_turns: entry.completed_turns,
    survived_winters: entry.survived_winters,
    outcome: entry.outcome,
    era: entry.final_snapshot.civilization.era_label,
    final_score: entry.final_score
  }))
};

const replay = {
  benchmark: "100 Winters",
  ruleset: result.ruleset,
  profile_id: result.profile_id,
  agent: {
    agent_id: winner.agent_id,
    label: winner.label,
    philosophy: winner.philosophy
  },
  final_snapshot: winner.final_snapshot,
  winter_frames: winner.public_replay.frames
    .filter((_, index) => index % 4 === 3)
    .map(({ turn, summary, projection }) => ({ turn, winter: Math.floor(turn / 4), summary, projection })),
  observation_hashes: winner.public_replay.observations.map(({ turn, payload_hash }) => ({ turn, payload_hash })),
  public_shocks: winner.events
    .filter((event) => event.type.startsWith("shock_"))
    .map(({ turn, type, summary, shock }) => ({ turn, type, summary, shock }))
};

await mkdir(outputDir, { recursive: true });
await Promise.all([
  writeJson(path.join(outputDir, `${profileId}-report.json`), report),
  writeJson(path.join(outputDir, `${profileId}-winner-replay.json`), replay)
]);

console.log(`Generated ${path.relative(root, outputDir)} for ${profileId}.`);

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
