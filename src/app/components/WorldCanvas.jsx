import { motion } from "framer-motion";

import { formatEra, seasonForTurn, winterForTurn } from "../format.js";

const FOREST_POINTS = [
  [78, 126], [116, 160], [154, 112], [205, 182], [246, 124], [286, 208], [332, 146], [381, 92],
  [420, 177], [468, 117], [520, 194], [565, 142], [610, 96], [650, 184], [704, 132], [754, 205],
  [98, 292], [145, 248], [193, 316], [240, 266], [287, 342], [338, 284], [390, 350], [438, 272],
  [493, 326], [542, 258], [598, 336], [642, 280], [692, 348], [742, 288], [805, 332], [844, 244],
  [74, 436], [132, 382], [180, 464], [232, 404], [286, 486], [348, 422], [406, 490], [468, 408],
  [524, 472], [582, 414], [636, 486], [696, 420], [754, 472], [812, 408]
];

const CONTOURS = [
  "M-40 512 C92 390 176 488 292 372 S514 232 636 338 S824 442 958 286",
  "M-62 456 C82 334 194 432 304 320 S504 198 634 286 S822 388 962 232",
  "M-50 394 C76 292 188 362 298 270 S500 156 624 238 S800 324 948 184",
  "M-28 330 C94 240 182 302 290 220 S476 112 610 190 S806 272 934 134",
  "M32 576 C184 482 306 548 430 448 S678 348 900 458"
];

export function WorldCanvas({ snapshot, turn, selectedAgent }) {
  const season = seasonForTurn(turn);
  const winter = winterForTurn(turn);
  const ecology = snapshot.ecology;
  const settlement = snapshot.settlement;
  const civilization = snapshot.civilization;
  const risk = snapshot.risk;
  const forestCount = Math.max(4, Math.round(FOREST_POINTS.length * ecology.biodiversity));
  const villageCount = Math.max(3, Math.min(15, Math.round(3 + settlement.settlement_complexity * 12)));
  const riverWidth = 10 + ecology.water_security * 26;
  const vitality = Math.max(0.1, ecology.resource_abundance);
  const winterOpacity = season === "winter" ? 0.7 : season === "autumn" ? 0.18 : 0;
  const settlementRadius = Math.min(88, 34 + Math.log10(Math.max(10, settlement.population)) * 22);

  return (
    <section className="world-stage" aria-label={`World state at winter ${winter}`}>
      <div className="world-stage__header">
        <div>
          <span className="eyebrow">LIVE PUBLIC PROJECTION</span>
          <h1>{snapshot.world_profile.name}</h1>
        </div>
        <div className="world-time" aria-live="polite">
          <span>WINTER</span>
          <strong>{String(winter).padStart(3, "0")}</strong>
          <small>{season.toUpperCase()} · YEAR {Math.ceil(turn / 4)}</small>
        </div>
      </div>

      <div className="world-stage__canvas">
        <svg viewBox="0 0 900 590" role="img" aria-labelledby="world-title world-desc">
          <title id="world-title">100 Winters civilization projection</title>
          <desc id="world-desc">
            A generated terrain projection showing water, ecological abundance, settlement complexity, and seasonal pressure.
          </desc>
          <defs>
            <radialGradient id="settlementGlow">
              <stop offset="0" stopColor="#f0b55c" stopOpacity={0.52 + civilization.energy_access * 0.3} />
              <stop offset="0.42" stopColor="#c7733f" stopOpacity="0.16" />
              <stop offset="1" stopColor="#171713" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="riverGradient" x1="0" x2="1">
              <stop stopColor="#78949b" stopOpacity="0.25" />
              <stop offset="0.5" stopColor="#a8c1c4" stopOpacity={0.42 + ecology.water_security * 0.3} />
              <stop offset="1" stopColor="#607c84" stopOpacity="0.18" />
            </linearGradient>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <pattern id="grain" width="130" height="130" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="16" r="0.7" fill="#fff" opacity="0.07" />
              <circle cx="72" cy="34" r="0.5" fill="#fff" opacity="0.05" />
              <circle cx="102" cy="92" r="0.8" fill="#fff" opacity="0.04" />
              <circle cx="35" cy="111" r="0.5" fill="#fff" opacity="0.06" />
            </pattern>
          </defs>

          <rect width="900" height="590" fill="#171713" />
          <rect width="900" height="590" fill={`rgba(104, 119, 82, ${0.035 + vitality * 0.08})`} />
          <rect width="900" height="590" fill="url(#grain)" />

          <g className="contours" opacity={0.14 + ecology.soil_fertility * 0.18}>
            {CONTOURS.map((path, index) => <path key={path} d={path} style={{ transform: `translateY(${index * 2}px)` }} />)}
          </g>

          <motion.path
            d="M-30 88 C118 122 96 244 236 258 C382 274 346 164 492 188 C650 214 602 378 930 438"
            fill="none"
            stroke="url(#riverGradient)"
            strokeWidth={riverWidth}
            strokeLinecap="round"
            animate={{ pathLength: [0.96, 1], opacity: [0.72, 1, 0.72] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <path
            d="M-30 88 C118 122 96 244 236 258 C382 274 346 164 492 188 C650 214 602 378 930 438"
            fill="none"
            stroke="#d4e2df"
            strokeWidth="1"
            strokeOpacity="0.18"
          />

          <g className="forest" opacity={0.28 + vitality * 0.62}>
            {FOREST_POINTS.slice(0, forestCount).map(([x, y], index) => (
              <motion.g
                key={`${x}-${y}`}
                initial={false}
                animate={{ opacity: ecology.biodiversity < 0.25 ? 0.2 : 1, scale: 0.82 + ecology.regeneration_rate * 0.28 }}
                transition={{ duration: 0.5, delay: (index % 8) * 0.02 }}
                transform={`translate(${x} ${y})`}
              >
                <path d="M0 -9 L7 5 L3 5 L8 12 L-8 12 L-3 5 L-7 5 Z" />
                <path d="M0 10 V17" className="tree-trunk" />
              </motion.g>
            ))}
          </g>

          <circle cx="455" cy="302" r={settlementRadius * 2.1} fill="url(#settlementGlow)" filter="url(#softGlow)" />
          <motion.g
            className="settlement"
            initial={false}
            animate={{ scale: 0.92 + settlement.settlement_complexity * 0.16 }}
            transition={{ type: "spring", stiffness: 130, damping: 22 }}
            transform="translate(455 302)"
          >
            <circle r={settlementRadius} className="settlement-boundary" />
            <circle r={Math.max(18, settlementRadius * 0.56)} className="settlement-core" />
            {Array.from({ length: villageCount }, (_, index) => {
              const angle = (index / villageCount) * Math.PI * 2;
              const radius = 24 + (index % 3) * 13;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const size = 5 + (index % 4);
              return <rect key={index} x={x - size / 2} y={y - size / 2} width={size} height={size} rx="1" />;
            })}
            <path d="M-72 28 C-34 18 18 20 76 -14" className="settlement-route" />
            <path d="M-42 -58 C-18 -22 6 24 30 72" className="settlement-route" />
          </motion.g>

          <g className="pressure-ring" opacity={Math.max(risk.famine_pressure, risk.disease_pressure, risk.ecological_damage)}>
            <circle cx="455" cy="302" r={settlementRadius + 24} />
            <circle cx="455" cy="302" r={settlementRadius + 42} />
          </g>

          <g className="snow" opacity={winterOpacity} aria-hidden="true">
            {Array.from({ length: 38 }, (_, index) => (
              <circle
                key={index}
                cx={(index * 83 + 41) % 900}
                cy={(index * 137 + 19) % 590}
                r={index % 4 === 0 ? 2.2 : 1.2}
                style={{ animationDelay: `${-(index % 9) * 0.4}s` }}
              />
            ))}
          </g>

          <g className="map-labels">
            <text x="476" y="388">PRIMARY SETTLEMENT</text>
            <text x="98" y="73">UPSTREAM VALLEY · UNCERTAIN</text>
            <text x="686" y="500">DRY RIDGE · UNMAPPED</text>
          </g>
        </svg>

        <div className="world-stage__caption">
          <span className="agent-signal" style={{ "--agent-color": selectedAgent.color }} />
          <div>
            <strong>{selectedAgent.label}</strong>
            <span>{formatEra(civilization.era_label)} · {Math.round(settlement.population).toLocaleString()} people</span>
          </div>
        </div>
      </div>
    </section>
  );
}
