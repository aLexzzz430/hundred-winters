import { RULESET } from "../world/world-core.js";

export function exportMatchArtifacts(core, { publicOnly = false } = {}) {
  const snapshot = core.getPublicSnapshot();
  const publicReplay = core.createPublicReplay();
  const events = core.getEventLog();
  const observations = core.getObservationArchive();
  const audit = publicOnly ? [] : core.getAuditLog();
  const scoreCurve = core.getScoreCurve();

  return {
    "match.json": prettyJson({
      match_id: snapshot.match_id,
      ruleset: RULESET,
      turn: snapshot.turn,
      era_reached: snapshot.civilization.era_label,
      final_score: snapshot.score,
      public_only: publicOnly
    }),
    "events.jsonl": toJsonl(publicOnly ? events.filter((event) => event.public) : events),
    "observations.jsonl": toJsonl(
      observations.map((entry) => ({
        turn: entry.turn,
        agent_id: entry.agent_id,
        payload_hash: entry.payload_hash,
        observation: entry.observation
      }))
    ),
    "actions.jsonl": toJsonl(
      events
        .filter((event) => event.type === "action_accepted" || event.type === "action_rejected")
        .map((event) => ({
          turn: event.turn,
          agent_id: event.agent_id,
          type: event.type,
          summary: event.summary,
          error: event.error
        }))
    ),
    "scores.csv": scoresToCsv(scoreCurve),
    "public_replay.json": prettyJson(publicReplay),
    "audit.jsonl": toJsonl(audit)
  };
}

function scoresToCsv(scoreCurve) {
  const header = "turn,total,continuity,adaptation,efficiency,complexity,robustness,sustainability,safety";
  const rows = scoreCurve.map((entry) => [
    entry.turn,
    entry.score.total,
    entry.score.continuity,
    entry.score.adaptation,
    entry.score.efficiency,
    entry.score.complexity,
    entry.score.robustness,
    entry.score.sustainability,
    entry.score.safety
  ].join(","));
  return [header, ...rows].join("\n");
}

function toJsonl(entries) {
  return entries.map((entry) => JSON.stringify(entry)).join("\n");
}

function prettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
