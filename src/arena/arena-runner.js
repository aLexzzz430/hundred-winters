import { createDefaultWorldState, WorldCore } from "../world/world-core.js";

export class ArenaRunner {
  constructor({ turns = 100, worldIdPrefix = "match" } = {}) {
    this.turns = turns;
    this.worldIdPrefix = worldIdPrefix;
  }

  runBaselines(agents) {
    const agentResults = agents.map((agent) => this.runAgent(agent));
    return {
      ruleset: "natural-civ-survival-v1",
      turns: this.turns,
      agent_results: agentResults
    };
  }

  runAgent(agent) {
    const worldId = `${this.worldIdPrefix}-${agent.id}`;
    const core = new WorldCore(createDefaultWorldState({ worldId }));
    const scoreCurve = [];

    for (let index = 0; index < this.turns; index += 1) {
      const observation = core.observe(agent.id);
      const actionEnvelope = agent.decide(observation);
      const receipt = core.submitActions(actionEnvelope);
      if (!receipt.accepted) {
        throw new Error(`Baseline ${agent.id} produced invalid action: ${receipt.error.code}`);
      }
      scoreCurve.push(core.getScoreCurve().at(-1).score);
    }

    const finalSnapshot = core.getPublicSnapshot();
    return {
      agent_id: agent.id,
      final_score: finalSnapshot.score,
      final_snapshot: finalSnapshot,
      score_curve: scoreCurve,
      public_replay: core.createPublicReplay(),
      events: core.getEventLog().filter((event) => event.public)
    };
  }

  async runAgentAsync(agent) {
    const worldId = `${this.worldIdPrefix}-${agent.id}`;
    const core = new WorldCore(createDefaultWorldState({ worldId }));
    const scoreCurve = [];

    for (let index = 0; index < this.turns; index += 1) {
      const observation = core.observe(agent.id);
      const actionEnvelope = await agent.decide(observation);
      const receipt = core.submitActions(actionEnvelope);
      if (!receipt.accepted) {
        throw new Error(`Agent ${agent.id} produced invalid action: ${receipt.error.code}`);
      }
      scoreCurve.push(core.getScoreCurve().at(-1).score);
    }

    const finalSnapshot = core.getPublicSnapshot();
    return {
      agent_id: agent.id,
      final_score: finalSnapshot.score,
      final_snapshot: finalSnapshot,
      score_curve: scoreCurve,
      public_replay: core.createPublicReplay(),
      events: core.getEventLog().filter((event) => event.public)
    };
  }
}
