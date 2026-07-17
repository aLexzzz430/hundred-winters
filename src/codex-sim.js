import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { CodexAgent } from "./agents/codex-agent.js";
import { ArenaRunner } from "./arena/arena-runner.js";
import { RULESET } from "./world/world-core.js";

const options = parseArgs(process.argv.slice(2));
const agent = new CodexAgent({
  model: options.model,
  reasoningEffort: options.reasoningEffort,
  timeoutMs: options.timeoutMs
});
const runner = new ArenaRunner({
  turns: options.turns,
  worldIdPrefix: "codex-live",
  profileId: options.profileId
});

const result = await runner.runAgentAsync(agent);

const evidence = {
  benchmark: "100 Winters",
  ruleset: RULESET,
  execution: "live Codex CLI",
  requested_model: options.model,
  reasoning_effort: options.reasoningEffort,
  world_profile: options.profileId,
  requested_turns: options.turns,
  completed_turns: result.completed_turns,
  generated_at: new Date().toISOString(),
  agent_id: result.agent_id,
  decisions: agent.decisions,
  observation_hashes: result.public_replay.observations.map(({ turn, payload_hash }) => ({ turn, payload_hash })),
  final_score: result.final_score,
  final_snapshot: result.final_snapshot,
  recent_events: result.events.slice(-8)
};

const rendered = `${JSON.stringify(evidence, null, 2)}\n`;
if (options.output) {
  const outputPath = path.resolve(options.output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, rendered, "utf8");
}
console.log(rendered.trimEnd());

function parseArgs(args) {
  const parsed = {
    turns: 1,
    model: "gpt-5.6-sol",
    reasoningEffort: "medium",
    timeoutMs: 120_000,
    profileId: "river_basin",
    output: null
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--turns") {
      parsed.turns = Number.parseInt(args[index + 1], 10);
      index += 1;
    } else if (arg === "--model") {
      parsed.model = args[index + 1];
      index += 1;
    } else if (arg === "--timeout-ms") {
      parsed.timeoutMs = Number.parseInt(args[index + 1], 10);
      index += 1;
    } else if (arg === "--reasoning-effort") {
      parsed.reasoningEffort = args[index + 1];
      index += 1;
    } else if (arg === "--profile") {
      parsed.profileId = args[index + 1];
      index += 1;
    } else if (arg === "--output") {
      parsed.output = args[index + 1];
      index += 1;
    }
  }
  if (!Number.isInteger(parsed.turns) || parsed.turns < 1) {
    throw new Error("--turns must be a positive integer");
  }
  return parsed;
}
