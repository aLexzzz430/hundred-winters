import { createBaselineAgents, getBaselineMetadata } from "../arena/baseline-agents.js";
import { ArenaRunner } from "../arena/arena-runner.js";

export const PROTOCOL_TURNS = 400;
export const TARGET_WINTERS = 100;

const experimentCache = new Map();

export function runProtocol(profileId) {
  if (experimentCache.has(profileId)) return experimentCache.get(profileId);

  const startedAt = performance.now();
  const runner = new ArenaRunner({
    turns: PROTOCOL_TURNS,
    worldIdPrefix: `browser-${profileId}`,
    profileId
  });
  const raw = runner.runBaselines(createBaselineAgents());
  const metadata = new Map(getBaselineMetadata().map((agent) => [agent.id, agent]));
  const agentResults = raw.agent_results
    .map((result) => ({ ...result, ...metadata.get(result.agent_id) }))
    .sort((a, b) => b.final_score.total - a.final_score.total);

  const experiment = {
    ...raw,
    agent_results: agentResults,
    benchmark_runtime_ms: Math.round((performance.now() - startedAt) * 10) / 10,
    generated_at: new Date().toISOString()
  };
  experimentCache.set(profileId, experiment);
  return experiment;
}

export function getFrameAt(result, turn) {
  const frames = result.public_replay.frames;
  if (frames.length === 0) return result.final_snapshot;
  const index = Math.max(0, Math.min(frames.length - 1, turn - 1));
  return frames[index]?.projection ?? result.final_snapshot;
}

export function getObservationAt(result, turn) {
  const observations = result.public_replay.observations;
  if (observations.length === 0) return null;
  const index = Math.max(0, Math.min(observations.length - 1, turn - 1));
  return observations[index];
}

export function getVisibleEventsAt(result, turn, limit = 8) {
  return result.events
    .filter((event) => event.turn <= turn && event.type !== "action_accepted")
    .slice(-limit)
    .reverse();
}

export function getCurrentDecision(result, turn) {
  const frames = result.public_replay.frames;
  const index = Math.max(0, Math.min(frames.length - 1, turn - 1));
  return frames[index]?.summary ?? "No accepted decision at this point.";
}

export function downloadProtocolReport(experiment) {
  const report = {
    benchmark: "100 Winters",
    ruleset: experiment.ruleset,
    profile_id: experiment.profile_id,
    target_winters: experiment.target_winters,
    generated_at: experiment.generated_at,
    benchmark_runtime_ms: experiment.benchmark_runtime_ms,
    agents: experiment.agent_results.map((result, rank) => ({
      rank: rank + 1,
      agent_id: result.agent_id,
      label: result.label,
      final_score: result.final_score,
      survived_winters: result.survived_winters,
      outcome: result.outcome,
      era: result.final_snapshot.civilization.era_label,
      public_replay_hashes: result.public_replay.observations.map((entry) => entry.payload_hash)
    }))
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `100-winters-${experiment.profile_id}-report.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
