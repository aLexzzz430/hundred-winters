import assert from "node:assert/strict";
import test from "node:test";

import { CodexAgent, buildCodexPrompt, createCodexActionSchema } from "../src/agents/codex-agent.js";
import { ArenaRunner } from "../src/arena/arena-runner.js";
import { createDefaultWorldState, WorldCore } from "../src/world/world-core.js";

test("Codex prompt carries public observation and forbids hidden-state probing", () => {
  const core = new WorldCore(createDefaultWorldState({ worldId: "codex-prompt-world" }));
  const observation = core.observe("codex_agent");

  const prompt = buildCodexPrompt(observation);

  assert.match(prompt, /100 Winters/);
  assert.match(prompt, /Return one strict JSON object/);
  assert.match(prompt, /Do not request hidden state/);
  assert.match(prompt, /"turn": 0/);
  assert.match(prompt, /codex-prompt-world/);
});

test("Codex action schema constrains action types and forbids extra fields", () => {
  const schema = createCodexActionSchema();

  assert.equal(schema.additionalProperties, false);
  assert.ok(schema.properties.individual_actions.items.properties.type.enum.includes("forage"));
  assert.ok(schema.properties.risk_controls.items.properties.type.enum.includes("monitor_risks"));
  assert.equal(schema.properties.hidden_judge_override, undefined);
});

test("CodexAgent parses strict JSON output into a valid action envelope", async () => {
  const core = new WorldCore(createDefaultWorldState({ worldId: "codex-parse-world" }));
  const observation = core.observe("codex_agent");
  const calls = [];
  const agent = new CodexAgent({
    executor: async (request) => {
      calls.push(request);
      return JSON.stringify({
        strategy_summary: "secure food, water, memory, and early sanitation",
        individual_actions: [{ type: "forage", effort: 2 }, { type: "scout_water", effort: 1 }],
        community_actions: [{ type: "ration_food", effort: 2 }, { type: "improve_sanitation", effort: 1 }],
        civilization_actions: [{ type: "record_knowledge", effort: 1 }],
        risk_controls: [{ type: "monitor_risks", effort: 1 }],
        expected_outcomes: ["food and water stabilize without hidden-state access"]
      });
    }
  });

  const envelope = await agent.decide(observation);

  assert.equal(envelope.agent_id, "codex_agent");
  assert.equal(envelope.turn, 0);
  assert.equal(envelope.strategy_summary, "secure food, water, memory, and early sanitation");
  assert.equal(envelope.individual_actions.length, 2);
  assert.equal(core.submitActions(envelope).accepted, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].schema.additionalProperties, false);
  assert.match(calls[0].prompt, /Do not request hidden state/);
});

test("CodexAgent rejects non-JSON output instead of fabricating a fallback action", async () => {
  const core = new WorldCore(createDefaultWorldState({ worldId: "codex-invalid-world" }));
  const observation = core.observe("codex_agent");
  const agent = new CodexAgent({
    executor: async () => "I would probably forage and scout."
  });

  await assert.rejects(
    () => agent.decide(observation),
    /Codex output was not strict JSON/
  );
});

test("ArenaRunner can run an asynchronous Codex-style agent", async () => {
  const agent = new CodexAgent({
    executor: async () => JSON.stringify({
      strategy_summary: "conservative primitive survival",
      individual_actions: [{ type: "forage", effort: 2 }, { type: "scout_water", effort: 1 }],
      community_actions: [{ type: "ration_food", effort: 2 }],
      civilization_actions: [{ type: "record_knowledge", effort: 1 }],
      risk_controls: [{ type: "monitor_risks", effort: 1 }],
      expected_outcomes: []
    })
  });
  const runner = new ArenaRunner({ turns: 3, worldIdPrefix: "codex-async" });

  const result = await runner.runAgentAsync(agent);

  assert.equal(result.agent_id, "codex_agent");
  assert.equal(result.score_curve.length, 3);
  assert.ok(result.public_replay.frames.length > 0);
});
