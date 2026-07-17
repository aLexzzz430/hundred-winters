import assert from "node:assert/strict";
import test from "node:test";

import { createApiServer } from "../src/api/server.js";

test("HTTP API registers an agent, returns observation, accepts an action, and returns result", async () => {
  const server = createApiServer();
  await server.start(0);
  try {
    const baseUrl = `http://127.0.0.1:${server.port}`;

    const registerResponse = await fetch(`${baseUrl}/agents/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agent_name: "api-agent",
        agent_version: "0.1.0",
        capabilities: { max_context_tokens: 32000, supports_tools: true }
      })
    });
    assert.equal(registerResponse.status, 200);
    const registration = await registerResponse.json();
    assert.ok(registration.agent_id);
    assert.equal(registration.ruleset, "hundred-winters-v1");

    const observationResponse = await fetch(`${baseUrl}/matches/default/observation?agent_id=${registration.agent_id}`);
    assert.equal(observationResponse.status, 200);
    const observation = await observationResponse.json();
    assert.equal(observation.agent_id, registration.agent_id);
    assert.equal("hidden_state" in observation, false);

    const actionResponse = await fetch(`${baseUrl}/matches/default/action`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agent_id: registration.agent_id,
        turn: observation.turn,
        strategy_summary: "stabilize early survival",
        individual_actions: [{ type: "forage", effort: 2 }],
        community_actions: [{ type: "ration_food", effort: 1 }],
        civilization_actions: [{ type: "record_knowledge", effort: 1 }],
        risk_controls: [],
        expected_outcomes: []
      })
    });
    assert.equal(actionResponse.status, 200);
    const receipt = await actionResponse.json();
    assert.equal(receipt.accepted, true);

    const resultResponse = await fetch(`${baseUrl}/matches/default/result?agent_id=${registration.agent_id}`);
    assert.equal(resultResponse.status, 200);
    const result = await resultResponse.json();
    assert.equal(result.match_id, "default");
    assert.ok(Number.isFinite(result.public_score.total));
  } finally {
    await server.stop();
  }
});
