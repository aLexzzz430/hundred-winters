const PROFILES = {
  river_basin: {
    id: "river_basin",
    name: "River Basin",
    descriptor: "Fertile, connected, deceptively fragile",
    signature: ["temperate", "seasonal river", "alluvial soil", "wood + stone"],
    modifiers: {},
    shocks: [
      shock(27, "cold_snap", 0.62, "An early freeze tests the first winter stores."),
      shock(71, "epidemic", 0.58, "A waterborne fever moves through the basin."),
      shock(126, "flood", 0.72, "The river crosses its old banks and reaches the granaries."),
      shock(183, "drought", 0.66, "Three weak snowmelt seasons tighten the watershed."),
      shock(247, "wildfire", 0.54, "A dry lightning front burns the western buffer."),
      shock(318, "knowledge_loss", 0.48, "A civic archive is lost during a transfer of power."),
      shock(379, "epidemic", 0.74, "A late epidemic tests institutional memory.")
    ]
  },
  dry_ridge: {
    id: "dry_ridge",
    name: "Dry Ridge",
    descriptor: "Mineral rich, water poor, politically sharp",
    signature: ["arid", "deep aquifer", "alkaline soil", "ore + stone"],
    modifiers: {
      "planet.climate_stability": -0.16,
      "planet.seasonal_stress": 0.20,
      "ecology.water_security": -0.20,
      "ecology.soil_fertility": -0.12,
      "ecology.resource_abundance": 0.08,
      "civilization.food_security": -0.08
    },
    shocks: [
      shock(19, "drought", 0.74, "The shallow wells stop recovering overnight."),
      shock(63, "mineral_discovery", 0.52, "A workable copper seam is mapped below the ridge."),
      shock(112, "epidemic", 0.44, "Crowded cisterns spread a respiratory fever."),
      shock(176, "drought", 0.86, "The deep aquifer falls below the oldest pump marks."),
      shock(229, "trade_collapse", 0.61, "A neighboring water compact closes its route."),
      shock(304, "wildfire", 0.42, "Dry scrub fire reaches the outer workshops."),
      shock(368, "drought", 0.91, "A century drought arrives before the final winter.")
    ]
  },
  storm_archipelago: {
    id: "storm_archipelago",
    name: "Storm Archipelago",
    descriptor: "Abundant water, broken logistics, violent seasons",
    signature: ["maritime", "cyclonic", "volcanic soil", "timber + fish"],
    modifiers: {
      "planet.climate_stability": -0.20,
      "planet.seasonal_stress": 0.24,
      "planet.water_cycle": 0.18,
      "planet.geological_activity": 0.22,
      "ecology.water_security": 0.20,
      "ecology.soil_fertility": 0.08,
      "settlement.infrastructure": -0.02
    },
    shocks: [
      shock(31, "flood", 0.68, "A king tide cuts the footpath between settlements."),
      shock(84, "cold_snap", 0.49, "Salt spray freezes across the winter fleet."),
      shock(137, "wildfire", 0.38, "An island fire removes a critical timber reserve."),
      shock(196, "flood", 0.88, "A cyclone lands at the height of the grain transfer."),
      shock(254, "trade_collapse", 0.70, "Three ports fail in the same storm season."),
      shock(327, "mineral_discovery", 0.43, "A volcanic shelf exposes dense workable glass."),
      shock(387, "flood", 0.92, "The final cyclone tests every redundant route.")
    ]
  },
  frost_steppe: {
    id: "frost_steppe",
    name: "Frost Steppe",
    descriptor: "Low density, high continuity pressure",
    signature: ["subarctic", "permafrost", "short summer", "herd + peat"],
    modifiers: {
      "planet.climate_stability": -0.08,
      "planet.seasonal_stress": 0.36,
      "ecology.regeneration_rate": -0.10,
      "ecology.soil_fertility": -0.10,
      "settlement.population": -18,
      "civilization.food_security": -0.05,
      "settlement.continuity_buffer": 0.04
    },
    shocks: [
      shock(15, "cold_snap", 0.72, "The first winter begins six weeks early."),
      shock(58, "epidemic", 0.42, "A lung illness spreads through the winter shelters."),
      shock(121, "cold_snap", 0.82, "A white season erases the southern grazing route."),
      shock(188, "knowledge_loss", 0.51, "A generation of route memory disappears in one storm."),
      shock(243, "mineral_discovery", 0.39, "Iron-rich stone appears beneath retreating ice."),
      shock(309, "cold_snap", 0.91, "The longest freeze in the archive locks the river."),
      shock(382, "trade_collapse", 0.57, "The last external caravan turns back.")
    ]
  }
};

export const WORLD_PROFILES = Object.freeze(Object.values(PROFILES).map(publicProfile));

export function getWorldProfile(profileId = "river_basin") {
  const profile = PROFILES[profileId];
  if (!profile) {
    throw new Error(`Unknown world profile: ${profileId}`);
  }
  return structuredClone(profile);
}

export function applyProfileModifiers(state, profile) {
  for (const [path, delta] of Object.entries(profile.modifiers)) {
    const parts = path.split(".");
    const field = parts.pop();
    let target = state;
    for (const part of parts) target = target[part];
    target[field] = typeof target[field] === "number"
      ? Math.max(0, Math.min(field === "population" ? Number.POSITIVE_INFINITY : 1, target[field] + delta))
      : target[field];
  }
  return state;
}

function shock(turn, type, severity, summary) {
  return { turn, type, severity, summary };
}

function publicProfile(profile) {
  return {
    id: profile.id,
    name: profile.name,
    descriptor: profile.descriptor,
    signature: [...profile.signature]
  };
}
