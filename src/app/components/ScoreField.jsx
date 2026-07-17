import { winterForTurn } from "../format.js";

const WIDTH = 1000;
const HEIGHT = 320;
const PLOT = { left: 42, right: 24, top: 30, bottom: 42 };
const MIN_SCORE = 220;
const MAX_SCORE = 860;

export function ScoreField({ results, selectedId, turn, onTurnChange, maxTurns }) {
  const selected = results.find((result) => result.agent_id === selectedId) ?? results[0];
  const shockEvents = selected.events.filter((event) => event.type.startsWith("shock_"));
  const cursorX = xForTurn(turn, maxTurns);

  function updateFromPointer(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const localX = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
    const normalized = (localX - PLOT.left) / (WIDTH - PLOT.left - PLOT.right);
    const next = Math.round(Math.max(0, Math.min(1, normalized)) * (maxTurns - 1)) + 1;
    onTurnChange(next);
  }

  return (
    <section className="score-field" aria-labelledby="score-field-title">
      <div className="section-heading section-heading--compact">
        <div>
          <span className="eyebrow">CAUSAL DIVERGENCE</span>
          <h2 id="score-field-title">Score across 100 winters</h2>
        </div>
        <p>World shocks are shared. Only policy decisions differ.</p>
      </div>

      <div className="score-field__plot">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Score comparison through winter ${winterForTurn(turn)}`}
          onPointerDown={updateFromPointer}
          onPointerMove={(event) => {
            if (event.buttons === 1) updateFromPointer(event);
          }}
        >
          <g className="chart-grid">
            {[300, 500, 700, 850].map((score) => {
              const y = yForScore(score);
              return (
                <g key={score}>
                  <line x1={PLOT.left} x2={WIDTH - PLOT.right} y1={y} y2={y} />
                  <text x="0" y={y + 4}>{score}</text>
                </g>
              );
            })}
            {[1, 25, 50, 75, 100].map((winter) => {
              const x = xForTurn(winter * 4, maxTurns);
              return <text key={winter} x={x} y={HEIGHT - 12} textAnchor={winter === 1 ? "start" : winter === 100 ? "end" : "middle"}>W{winter}</text>;
            })}
          </g>

          {shockEvents.map((event) => (
            <g className="chart-shock" key={event.id}>
              <line x1={xForTurn(event.turn, maxTurns)} x2={xForTurn(event.turn, maxTurns)} y1={PLOT.top} y2={HEIGHT - PLOT.bottom} />
              <circle cx={xForTurn(event.turn, maxTurns)} cy={PLOT.top + 5} r="3" />
            </g>
          ))}

          {results.map((result) => (
            <path
              key={result.agent_id}
              d={pathForCurve(result.score_curve, maxTurns)}
              fill="none"
              stroke={result.color}
              strokeWidth={result.agent_id === selectedId ? 4 : 1.6}
              strokeOpacity={result.agent_id === selectedId ? 1 : 0.34}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={result.agent_id === selectedId ? "selected-curve" : ""}
            />
          ))}

          <g className="chart-cursor">
            <line x1={cursorX} x2={cursorX} y1={PLOT.top} y2={HEIGHT - PLOT.bottom} />
            <circle
              cx={cursorX}
              cy={yForScore(selected.score_curve[Math.min(selected.score_curve.length - 1, turn - 1)]?.total ?? selected.final_score.total)}
              r="6"
              fill={selected.color}
            />
          </g>
          <rect x={PLOT.left} y={PLOT.top} width={WIDTH - PLOT.left - PLOT.right} height={HEIGHT - PLOT.top - PLOT.bottom} fill="transparent" />
        </svg>
      </div>

      <label className="timeline-control">
        <span>Winter {String(winterForTurn(turn)).padStart(3, "0")}</span>
        <input
          type="range"
          min="1"
          max={maxTurns}
          step="1"
          value={turn}
          onChange={(event) => onTurnChange(Number(event.target.value))}
          aria-label="Replay timeline"
        />
        <span>Winter 100</span>
      </label>
    </section>
  );
}

function pathForCurve(curve, maxTurns) {
  if (!curve.length) return "";
  const sampled = curve.filter((_, index) => index % 4 === 3 || index === curve.length - 1);
  return sampled
    .map((score, index) => {
      const sourceIndex = Math.min(curve.length - 1, index * 4 + 3);
      const x = xForTurn(sourceIndex + 1, maxTurns);
      const y = yForScore(score.total);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function xForTurn(turn, maxTurns) {
  return PLOT.left + ((Math.max(1, turn) - 1) / (maxTurns - 1)) * (WIDTH - PLOT.left - PLOT.right);
}

function yForScore(score) {
  const normalized = Math.max(0, Math.min(1, (score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)));
  return HEIGHT - PLOT.bottom - normalized * (HEIGHT - PLOT.top - PLOT.bottom);
}
