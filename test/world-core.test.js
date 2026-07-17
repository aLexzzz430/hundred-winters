import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultWorldState, WorldCore } from "../src/world/world-core.js";

test("WorldCore emits public observations without hidden judge state and archives what the agent saw", () => {
  const core = new WorldCore(createDefaultWorldState({ worldId: "obs-world" }));

  const observation = core.observe("agent_a");

  assert.equal(observation.match_id, "obs-world");
  assert.equal(observation.agent_id, "agent_a");
  assert.equal(observation.turn, 0);
  assert.ok(observation.visible_world);
  assert.ok(observation.civilization);
  assert.ok(observation.budgets.action_points > 0);
  assert.equal("hidden_state" in observation, false);
  assert.equal("hiddenJudge" in observation, false);

  const archive = core.getObservationArchive();
  assert.equal(archive.length, 1);
  assert.equal(archive[0].agent_id, "agent_a");
  assert.equal(archive[0].turn, 0);
  assert.equal(archive[0].payload_hash.length, 64);
});

test("WorldCore rejects over-budget actions fail-closed and preserves the world state", () => {
  const core = new WorldCore(createDefaultWorldState({ worldId: "budget-world" }));
  const before = core.getPublicSnapshot();

  const receipt = core.submitActions({
    agent_id: "agent_a",
    turn: 0,
    strategy_summary: "try to do everything at once",
    individual_actions: [{ type: "explore", effort: 1000 }],
    community_actions: [{ type: "build_storage", effort: 1000 }],
    civilization_actions: [{ type: "research_tools", effort: 1000 }],
    risk_controls: [],
    expected_outcomes: []
  });

  assert.equal(receipt.accepted, false);
  assert.equal(receipt.error.code, "action_over_budget");
  assert.deepEqual(core.getPublicSnapshot(), before);
  assert.equal(core.getEventLog().at(-1).type, "action_rejected");
});

test("WorldCore accepts action budgets that only exceed the limit by floating point noise", () => {
  const core = new WorldCore(createDefaultWorldState({ worldId: "float-budget-world" }));

  const receipt = core.submitActions({
    agent_id: "agent_a",
    turn: 0,
    strategy_summary: "spend exactly the available action budget",
    individual_actions: [{ type: "forage", effort: 0.1 }, { type: "scout_water", effort: 0.2 }],
    community_actions: [{ type: "build_storage", effort: 0.3 }],
    civilization_actions: [{ type: "record_knowledge", effort: 11.400000000000002 }],
    risk_controls: [],
    expected_outcomes: []
  });

  assert.equal(receipt.accepted, true);
});

test("natural causality punishes resource overharvest and rewards sustainable recovery", () => {
  const greedy = new WorldCore(createDefaultWorldState({ worldId: "greedy-world" }));
  const steady = new WorldCore(createDefaultWorldState({ worldId: "steady-world" }));

  for (let turn = 0; turn < 36; turn += 1) {
    greedy.submitActions({
      agent_id: "greedy",
      turn,
      strategy_summary: "maximize extraction",
      individual_actions: [{ type: "forage", effort: 4 }, { type: "hunt", effort: 3 }],
      community_actions: [{ type: "expand_settlement", effort: 3 }],
      civilization_actions: [],
      risk_controls: [],
      expected_outcomes: []
    });
    steady.submitActions({
      agent_id: "steady",
      turn,
      strategy_summary: "balance food, water, sanitation, and regrowth",
      individual_actions: [{ type: "forage", effort: 2 }, { type: "scout_water", effort: 1 }],
      community_actions: [{ type: "ration_food", effort: 2 }, { type: "improve_sanitation", effort: 2 }],
      civilization_actions: [{ type: "steward_ecology", effort: 2 }],
      risk_controls: [{ type: "preserve_forest_buffer", effort: 1 }],
      expected_outcomes: []
    });
  }

  const greedySnapshot = greedy.getPublicSnapshot();
  const steadySnapshot = steady.getPublicSnapshot();

  assert.ok(greedySnapshot.ecology.resource_abundance < steadySnapshot.ecology.resource_abundance);
  assert.ok(greedySnapshot.ecology.regeneration_rate < steadySnapshot.ecology.regeneration_rate);
  assert.ok(greedySnapshot.score.sustainability < steadySnapshot.score.sustainability);
  assert.ok(greedy.getEventLog().some((event) => event.type === "ecology_degraded"));
});

test("era labels emerge from conditions rather than fixed turn counts", () => {
  const stalled = new WorldCore(createDefaultWorldState({ worldId: "stalled-world" }));
  const developing = new WorldCore(createDefaultWorldState({ worldId: "developing-world" }));

  for (let turn = 0; turn < 30; turn += 1) {
    stalled.submitActions({
      agent_id: "stalled",
      turn,
      strategy_summary: "short-term survival only",
      individual_actions: [{ type: "forage", effort: 1 }],
      community_actions: [],
      civilization_actions: [],
      risk_controls: [],
      expected_outcomes: []
    });
    developing.submitActions({
      agent_id: "developing",
      turn,
      strategy_summary: "create food surplus and knowledge transmission",
      individual_actions: [{ type: "forage", effort: 2 }, { type: "scout_water", effort: 1 }],
      community_actions: [{ type: "build_storage", effort: 2 }, { type: "organize_labor", effort: 2 }],
      civilization_actions: [{ type: "domesticate_crops", effort: 2 }, { type: "record_knowledge", effort: 1 }],
      risk_controls: [{ type: "preserve_forest_buffer", effort: 1 }],
      expected_outcomes: []
    });
  }

  assert.equal(stalled.getPublicSnapshot().civilization.era_label, "foraging_band");
  assert.equal(developing.getPublicSnapshot().civilization.era_label, "early_agriculture");
});

test("public replay is reconstructed from archived events and never exposes hidden fields", () => {
  const core = new WorldCore(createDefaultWorldState({ worldId: "replay-world" }));
  core.observe("agent_a");
  core.submitActions({
    agent_id: "agent_a",
    turn: 0,
    strategy_summary: "stabilize food and water",
    individual_actions: [{ type: "forage", effort: 2 }, { type: "scout_water", effort: 1 }],
    community_actions: [{ type: "build_storage", effort: 2 }],
    civilization_actions: [{ type: "record_knowledge", effort: 1 }],
    risk_controls: [],
    expected_outcomes: []
  });

  const replay = core.createPublicReplay();

  assert.equal(replay.match_id, "replay-world");
  assert.equal(replay.frames.length, 1);
  assert.equal(replay.observations.length, 1);
  assert.equal(JSON.stringify(replay).includes("hidden"), false);
  assert.equal(JSON.stringify(replay).includes("future_event"), false);
});
