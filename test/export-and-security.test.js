import assert from "node:assert/strict";
import test from "node:test";

import { exportMatchArtifacts } from "../src/export/exporter.js";
import { createDefaultWorldState, WorldCore } from "../src/world/world-core.js";

test("hidden or judge action fields are rejected and recorded as boundary violations", () => {
  const core = new WorldCore(createDefaultWorldState({ worldId: "security-world" }));

  const receipt = core.submitActions({
    agent_id: "attacker",
    turn: 0,
    strategy_summary: "try to influence judge",
    hidden_judge_override: true,
    individual_actions: [{ type: "forage", effort: 1 }],
    community_actions: [],
    civilization_actions: [],
    risk_controls: [],
    expected_outcomes: []
  });

  assert.equal(receipt.accepted, false);
  assert.equal(receipt.error.code, "unauthorized_field");
  assert.equal(core.getPublicSnapshot().turn, 0);
  assert.equal(core.getAuditLog().at(-1).type, "boundary_violation");
  assert.equal(core.getAuditLog().at(-1).error.code, "unauthorized_field");
});

test("match artifact export contains required public and internal files with hidden fields stripped from public replay", () => {
  const core = new WorldCore(createDefaultWorldState({ worldId: "export-world" }));
  core.observe("agent_a");
  core.submitActions({
    agent_id: "agent_a",
    turn: 0,
    strategy_summary: "build durable food and knowledge base",
    individual_actions: [{ type: "forage", effort: 2 }, { type: "scout_water", effort: 1 }],
    community_actions: [{ type: "build_storage", effort: 2 }, { type: "improve_sanitation", effort: 1 }],
    civilization_actions: [{ type: "record_knowledge", effort: 1 }],
    risk_controls: [{ type: "monitor_risks", effort: 1 }],
    expected_outcomes: []
  });

  const artifacts = exportMatchArtifacts(core, { publicOnly: false });

  assert.deepEqual(Object.keys(artifacts).sort(), [
    "actions.jsonl",
    "audit.jsonl",
    "events.jsonl",
    "match.json",
    "observations.jsonl",
    "public_replay.json",
    "scores.csv"
  ]);
  assert.equal(JSON.parse(artifacts["match.json"]).match_id, "export-world");
  assert.match(artifacts["events.jsonl"], /action_accepted/);
  assert.match(artifacts["observations.jsonl"], /agent_a/);
  assert.match(artifacts["actions.jsonl"], /build durable food/);
  assert.match(artifacts["scores.csv"], /^turn,total,continuity,adaptation,efficiency,complexity,robustness,sustainability,safety/m);
  assert.equal(artifacts["public_replay.json"].includes("hidden"), false);
  assert.equal(artifacts["public_replay.json"].includes("judge"), false);
});
