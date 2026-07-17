import { Activity, CircleAlert, ShieldCheck } from "lucide-react";

import { formatEra, formatPercent, formatScore } from "../format.js";

export function MetricRail({ snapshot, result, decision, currentEvent }) {
  const score = snapshot.score;
  const metrics = [
    ["Continuity", score.continuity],
    ["Adaptation", score.adaptation],
    ["Robustness", score.robustness],
    ["Sustainability", score.sustainability],
    ["Safety", score.safety]
  ];
  const highestRisk = Object.entries(snapshot.risk)
    .sort((a, b) => b[1] - a[1])[0];
  const status = snapshot.outcome.status;

  return (
    <aside className="metric-rail" aria-label="Selected agent metrics">
      <div className="metric-rail__score">
        <span className="eyebrow">PUBLIC SCORE</span>
        <strong>{formatScore(score.total)}</strong>
        <small>weighted / 1,000</small>
      </div>

      <div className={`status-line status-line--${status}`}>
        {status === "active" ? <ShieldCheck size={16} /> : <CircleAlert size={16} />}
        <span>{status === "active" ? "Civilization continuous" : "Civilization collapsed"}</span>
      </div>

      <div className="metric-lines">
        {metrics.map(([label, value]) => (
          <div className="metric-line" key={label}>
            <div><span>{label}</span><strong>{formatPercent(value)}</strong></div>
            <div className="metric-line__track"><i style={{ width: `${Math.max(1, value * 100)}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="rail-fact">
        <span className="eyebrow">ERA REACHED</span>
        <strong>{formatEra(snapshot.civilization.era_label)}</strong>
        <small>{snapshot.outcome.survived_winters} winters recorded</small>
      </div>

      <div className="rail-fact rail-fact--risk">
        <span className="eyebrow">HIGHEST SYSTEM PRESSURE</span>
        <strong>{highestRisk[0].replaceAll("_", " ")}</strong>
        <small>{formatPercent(highestRisk[1])} observed pressure</small>
      </div>

      <div className="decision-note">
        <Activity size={15} />
        <div>
          <span className="eyebrow">AGENT POLICY</span>
          <p>{decision}</p>
        </div>
      </div>

      {currentEvent && (
        <div className="event-note">
          <span>WORLD EVENT</span>
          <p>{currentEvent.summary}</p>
        </div>
      )}

      <div className="rail-footer">
        <span>{result.completed_turns.toLocaleString()} season decisions</span>
        <span>{result.outcome.status === "active" ? "PASS" : "COLLAPSE"}</span>
      </div>
    </aside>
  );
}
