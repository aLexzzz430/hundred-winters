import { CodexAgent } from "./agents/codex-agent.js";
import { ArenaRunner } from "./arena/arena-runner.js";

const options = parseArgs(process.argv.slice(2));
const agent = new CodexAgent({
  model: options.model,
  timeoutMs: options.timeoutMs
});
const runner = new ArenaRunner({
  turns: options.turns,
  worldIdPrefix: "codex-live"
});

const result = await runner.runAgentAsync(agent);

console.log(JSON.stringify({
  agent_id: result.agent_id,
  turns: options.turns,
  final_score: result.final_score,
  final_snapshot: result.final_snapshot,
  recent_events: result.events.slice(-8)
}, null, 2));

function parseArgs(args) {
  const parsed = {
    turns: 1,
    model: undefined,
    timeoutMs: 120_000
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
    }
  }
  if (!Number.isInteger(parsed.turns) || parsed.turns < 1) {
    throw new Error("--turns must be a positive integer");
  }
  return parsed;
}
