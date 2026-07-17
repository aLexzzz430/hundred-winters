import { formatEra, formatScore } from "../format.js";

export function AgentLedger({ results, selectedId, onSelect }) {
  return (
    <section className="agent-ledger" aria-labelledby="agent-ledger-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SAME WORLD · SAME SHOCKS</span>
          <h2 id="agent-ledger-title">Agent ledger</h2>
        </div>
        <p>Ranked after the full protocol. Select a policy to inspect its public replay.</p>
      </div>

      <div className="agent-ledger__table" role="list">
        {results.map((result, index) => {
          const selected = result.agent_id === selectedId;
          return (
            <button
              type="button"
              className={`agent-row ${selected ? "is-selected" : ""}`}
              key={result.agent_id}
              onClick={() => onSelect(result.agent_id)}
              aria-pressed={selected}
              role="listitem"
              style={{ "--agent-color": result.color }}
            >
              <span className="agent-row__rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="agent-row__identity">
                <i />
                <span><strong>{result.label}</strong><small>{result.philosophy}</small></span>
              </span>
              <span className="agent-row__era">{formatEra(result.final_snapshot.civilization.era_label)}</span>
              <span className="agent-row__winter">
                <strong>{result.survived_winters}</strong><small>winters</small>
              </span>
              <span className="agent-row__score">{formatScore(result.final_score.total)}</span>
              <span className={`agent-row__status agent-row__status--${result.outcome.status}`}>
                {result.outcome.status === "active" ? "continuous" : `collapsed · ${result.outcome.collapse_reason}`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
