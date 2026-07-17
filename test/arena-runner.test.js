import assert from "node:assert/strict";
import test from "node:test";

import { createBaselineAgents } from "../src/arena/baseline-agents.js";
import { ArenaRunner } from "../src/arena/arena-runner.js";

test("ArenaRunner runs the required baseline agents and exports comparable score curves", () => {
  const baselines = createBaselineAgents();
  const runner = new ArenaRunner({ turns: 24, worldIdPrefix: "baseline-check" });

  const result = runner.runBaselines(baselines);

  assert.deepEqual(
    result.agent_results.map((entry) => entry.agent_id).sort(),
    [
      "conservative_survival_agent",
      "ecology_balancer_agent",
      "greedy_resource_agent",
      "institution_first_agent",
      "random_agent",
      "tech_rush_agent"
    ]
  );
  assert.equal(result.agent_results.length, 6);
  for (const agentResult of result.agent_results) {
    assert.equal(agentResult.score_curve.length, 24);
    assert.ok(Number.isFinite(agentResult.final_score.total));
    assert.ok(agentResult.public_replay.frames.length > 0);
  }
});

test("greedy baseline loses long-run sustainability against ecology baseline", () => {
  const baselines = createBaselineAgents();
  const runner = new ArenaRunner({ turns: 48, worldIdPrefix: "sustainability-check" });

  const result = runner.runBaselines(baselines);
  const greedy = result.agent_results.find((entry) => entry.agent_id === "greedy_resource_agent");
  const ecology = result.agent_results.find((entry) => entry.agent_id === "ecology_balancer_agent");

  assert.ok(greedy.final_score.sustainability < ecology.final_score.sustainability);
  assert.ok(greedy.final_snapshot.ecology.resource_abundance < ecology.final_snapshot.ecology.resource_abundance);
});
