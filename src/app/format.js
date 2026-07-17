export function formatScore(value) {
  return Math.round(value).toLocaleString("en-US");
}

export function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

export function formatEra(value) {
  return {
    foraging_band: "Foraging band",
    early_agriculture: "Early agriculture",
    medieval_organization: "Civic organization",
    industrial_transition: "Industrial transition",
    modern_complex_society: "Modern society"
  }[value] ?? value;
}

export function formatEventType(value) {
  return value
    .replace(/^shock_/, "")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function seasonForTurn(turn) {
  return ["spring", "summer", "autumn", "winter"][(Math.max(1, turn) - 1) % 4];
}

export function winterForTurn(turn) {
  return Math.max(1, Math.ceil(turn / 4));
}
