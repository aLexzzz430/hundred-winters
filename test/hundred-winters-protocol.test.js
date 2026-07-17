import assert from "node:assert/strict";
import test from "node:test";

import { createBaselineAgents } from "../src/arena/baseline-agents.js";
import { ArenaRunner } from "../src/arena/arena-runner.js";
import { createDefaultWorldState, WorldCore } from "../src/world/world-core.js";
import { getWorldProfile, WORLD_PROFILES } from "../src/world/world-profiles.js";

test("the public protocol exposes four profiles without leaking their shock schedules", () => {
  assert.deepEqual(
    WORLD_PROFILES.map((profile) => profile.id),
    ["river_basin", "dry_ridge", "storm_archipelago", "frost_steppe"]
  );

  for (const profile of WORLD_PROFILES) {
    assert.equal(Object.hasOwn(profile, "shocks"), false);
    assert.equal(Object.hasOwn(profile, "modifiers"), false);
    assert.ok(profile.signature.length >= 4);

    const core = new WorldCore(createDefaultWorldState({ worldId: `public-${profile.id}`, profileId: profile.id }));
    const publicJson = JSON.stringify({
      snapshot: core.getPublicSnapshot(),
      observation: core.observe("audit_agent"),
      replay: core.createPublicReplay()
    });
    assert.doesNotMatch(publicJson, /shock_schedule|future_event_pressure|judge_integrity_nonce|critical_streaks/);
  }
});

test("an unknown profile fails closed instead of silently changing the experiment", () => {
  assert.throws(() => getWorldProfile("unknown_world"), /Unknown world profile/);
});

test("agents in one profile encounter an identical public shock schedule", () => {
  const agents = createBaselineAgents().filter(({ id }) => [
    "conservative_survival_agent",
    "ecology_balancer_agent",
    "institution_first_agent"
  ].includes(id));
  const result = new ArenaRunner({
    turns: 400,
    worldIdPrefix: "shared-shock-check",
    profileId: "river_basin"
  }).runBaselines(agents);

  const schedules = result.agent_results.map(({ events }) => events
    .filter((event) => event.type.startsWith("shock_"))
    .map(({ turn, type, shock }) => ({ turn, type, shock }))
  );
  assert.equal(schedules[0].length, 7);
  assert.deepEqual(schedules[1], schedules[0]);
  assert.deepEqual(schedules[2], schedules[0]);
});

test("the full protocol represents 100 winters and produces auditable outcomes", () => {
  const civicMemory = createBaselineAgents().find(({ id }) => id === "institution_first_agent");
  const result = new ArenaRunner({
    turns: 400,
    worldIdPrefix: "century-check",
    profileId: "river_basin"
  }).runAgent(civicMemory);

  assert.equal(result.completed_turns, 400);
  assert.equal(result.survived_winters, 100);
  assert.equal(result.outcome.status, "active");
  assert.equal(result.score_curve.length, 400);
  assert.equal(result.public_replay.observations.length, 400);
  assert.equal(result.public_replay.observations[0].payload_hash.length, 64);
  assert.ok(result.final_score.total > 0);
});
