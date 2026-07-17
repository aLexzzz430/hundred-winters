import { createDefaultWorldState, RULESET, WorldCore } from "../world/world-core.js";

export class ArenaRunner {
  constructor({ turns = 400, worldIdPrefix = "match", profileId = "river_basin" } = {}) {
    this.turns = turns;
    this.worldIdPrefix = worldIdPrefix;
    this.profileId = profileId;
  }

  runBaselines(agents) {
    const agentResults = agents.map((agent) => this.runAgent(agent));
    return {
      ruleset: RULESET,
      turns: this.turns,
      target_winters: Math.floor(this.turns / 4),
      profile_id: this.profileId,
      agent_results: agentResults
    };
  }

  runAgent(agent) {
    const worldId = `${this.worldIdPrefix}-${agent.id}`;
    const core = new WorldCore(createDefaultWorldState({ worldId, profileId: this.profileId }));
    const scoreCurve = [];

    for (let index = 0; index < this.turns; index += 1) {
      const observation = core.observe(agent.id);
      const actionEnvelope = agent.decide(observation);
      const receipt = core.submitActions(actionEnvelope);
      if (!receipt.accepted) {
        if (receipt.error.code === "world_collapsed") break;
        throw new Error(`Baseline ${agent.id} produced invalid action: ${receipt.error.code}`);
      }
      scoreCurve.push(core.getScoreCurve().at(-1).score);
      if (core.getPublicSnapshot().outcome.status === "collapsed") break;
    }

    const finalSnapshot = core.getPublicSnapshot();
    return {
      agent_id: agent.id,
      final_score: finalSnapshot.score,
      final_snapshot: finalSnapshot,
      score_curve: scoreCurve,
      completed_turns: scoreCurve.length,
      survived_winters: finalSnapshot.outcome.survived_winters,
      outcome: finalSnapshot.outcome,
      public_replay: core.createPublicReplay(),
      events: core.getEventLog().filter((event) => event.public)
    };
  }

  async runAgentAsync(agent) {
    const worldId = `${this.worldIdPrefix}-${agent.id}`;
    const core = new WorldCore(createDefaultWorldState({ worldId, profileId: this.profileId }));
    const scoreCurve = [];

    for (let index = 0; index < this.turns; index += 1) {
      const observation = core.observe(agent.id);
      const actionEnvelope = await agent.decide(observation);
      const receipt = core.submitActions(actionEnvelope);
      if (!receipt.accepted) {
        if (receipt.error.code === "world_collapsed") break;
        throw new Error(`Agent ${agent.id} produced invalid action: ${receipt.error.code}`);
      }
      scoreCurve.push(core.getScoreCurve().at(-1).score);
      if (core.getPublicSnapshot().outcome.status === "collapsed") break;
    }

    const finalSnapshot = core.getPublicSnapshot();
    return {
      agent_id: agent.id,
      final_score: finalSnapshot.score,
      final_snapshot: finalSnapshot,
      score_curve: scoreCurve,
      completed_turns: scoreCurve.length,
      survived_winters: finalSnapshot.outcome.survived_winters,
      outcome: finalSnapshot.outcome,
      public_replay: core.createPublicReplay(),
      events: core.getEventLog().filter((event) => event.public)
    };
  }
}
