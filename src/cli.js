import { createBaselineAgents } from "./arena/baseline-agents.js";
import { ArenaRunner } from "./arena/arena-runner.js";

const turns = Number.parseInt(process.argv[2] ?? "48", 10);
const runner = new ArenaRunner({ turns, worldIdPrefix: "cli" });
const result = runner.runBaselines(createBaselineAgents());

console.log(JSON.stringify({
  ruleset: result.ruleset,
  turns: result.turns,
  agents: result.agent_results.map((entry) => ({
    agent_id: entry.agent_id,
    total: entry.final_score.total,
    era: entry.final_snapshot.civilization.era_label,
    sustainability: entry.final_score.sustainability
  }))
}, null, 2));

