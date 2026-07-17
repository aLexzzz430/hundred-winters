import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import { applyProfileModifiers, getWorldProfile } from "./world-profiles.js";

export const RULESET = "hundred-winters-v1";
const DEFAULT_ACTION_POINTS = 12;
const BUDGET_EPSILON = 1e-9;

const ACTION_EFFECTS = {
  forage: { food_security: 0.016, resource_abundance: -0.010, extraction_pressure: 0.014 },
  hunt: { food_security: 0.012, resource_abundance: -0.017, extraction_pressure: 0.021, health: 0.002 },
  scout_water: { water_security: 0.020, knowledge_retention: 0.003 },
  explore: { knowledge_retention: 0.004, resource_abundance: -0.002 },
  migrate: { water_security: 0.006, organization_capacity: -0.004 },
  treat: { health: 0.018, disease_pressure: -0.012 },
  train: { organization_capacity: 0.008, knowledge_retention: 0.006 },
  build_storage: { storage_capacity: 0.026, infrastructure: 0.004, food_security: 0.010, organization_capacity: 0.004 },
  ration_food: { food_security: 0.014, continuity_buffer: 0.008 },
  improve_sanitation: { sanitation: 0.026, disease_pressure: -0.020, health: 0.009 },
  expand_settlement: { settlement_complexity: 0.020, infrastructure: 0.008, organization_capacity: 0.006, resource_abundance: -0.014, pollution: 0.005 },
  organize_labor: { organization_capacity: 0.018, settlement_complexity: 0.006 },
  trade: { organization_capacity: 0.008, infrastructure: 0.003, food_security: 0.006, disease_pressure: 0.004 },
  defend: { continuity_buffer: 0.012, organization_capacity: 0.003 },
  domesticate_crops: { agriculture_progress: 0.030, food_security: 0.016, resource_abundance: -0.004 },
  record_knowledge: { knowledge_retention: 0.024, organization_capacity: 0.004 },
  research_tools: { technology_progress: 0.026, knowledge_retention: 0.010 },
  standardize_law: { institution_strength: 0.026, organization_capacity: 0.008 },
  steward_ecology: { regeneration_rate: 0.022, resource_abundance: 0.010, pollution: -0.006 },
  preserve_forest_buffer: { regeneration_rate: 0.018, disease_pressure: -0.004, continuity_buffer: 0.006 },
  diversify_food: { food_security: 0.010, continuity_buffer: 0.012, resource_abundance: 0.004 },
  monitor_risks: { continuity_buffer: 0.014, knowledge_retention: 0.006 },
  industrialize: { technology_progress: 0.040, organization_capacity: 0.010, infrastructure: 0.012, pollution: 0.035, energy_access: 0.030 },
  build_power: { energy_access: 0.030, pollution: 0.018, settlement_complexity: 0.010, infrastructure: 0.020 }
};

export function createDefaultWorldState({ worldId = "default", profileId = "river_basin" } = {}) {
  const profile = getWorldProfile(profileId);
  const state = {
    match_id: worldId,
    ruleset: RULESET,
    profile: {
      id: profile.id,
      name: profile.name,
      descriptor: profile.descriptor,
      signature: profile.signature
    },
    turn: 0,
    planet: {
      gravity: 1,
      climate_stability: 0.62,
      seasonal_stress: 0.34,
      water_cycle: 0.58,
      geological_activity: 0.18
    },
    ecology: {
      resource_abundance: 0.68,
      regeneration_rate: 0.42,
      soil_fertility: 0.54,
      water_security: 0.50,
      biodiversity: 0.61,
      extraction_pressure: 0.08,
      pollution: 0.02,
      carrying_capacity: 1200
    },
    settlement: {
      population: 86,
      storage_capacity: 0.18,
      settlement_complexity: 0.08,
      sanitation: 0.18,
      infrastructure: 0.06,
      trade_reach: 0.03,
      continuity_buffer: 0.08
    },
    civilization: {
      food_security: 0.46,
      health: 0.48,
      knowledge_retention: 0.11,
      organization_capacity: 0.10,
      agriculture_progress: 0.04,
      technology_progress: 0.03,
      institution_strength: 0.04,
      energy_access: 0.01,
      era_label: "foraging_band"
    },
    risk: {
      disease_pressure: 0.14,
      famine_pressure: 0.18,
      conflict_pressure: 0.08,
      ecological_damage: 0.04,
      supply_chain_fragility: 0.01,
      automation_risk: 0
    },
    outcome: {
      status: "active",
      collapse_reason: null,
      survived_winters: 0
    },
    hidden_state: {
      future_event_pressure: 0.17,
      judge_integrity_nonce: stableHash(`${worldId}:judge`).slice(0, 16),
      anti_cheat_events: [],
      shock_schedule: profile.shocks,
      critical_streaks: { population: 0, food: 0, health: 0 }
    },
    event_log: [],
    observation_archive: [],
    audit_log: [],
    score_curve: []
  };
  return applyProfileModifiers(state, profile);
}

export class WorldCore {
  #state;

  constructor(initialState = createDefaultWorldState()) {
    this.#state = deepClone(initialState);
    this.#state.score_curve = this.#state.score_curve ?? [];
    this.#state.event_log = this.#state.event_log ?? [];
    this.#state.observation_archive = this.#state.observation_archive ?? [];
    this.#state.audit_log = this.#state.audit_log ?? [];
    this.#state.civilization.era_label = deriveEra(this.#state);
    this.#appendEvent("world_initialized", {
      match_id: this.#state.match_id,
      ruleset: this.#state.ruleset,
      public_projection: this.getPublicSnapshot()
    });
  }

  observe(agentId) {
    assertAgentId(agentId);
    const observation = {
      match_id: this.#state.match_id,
      agent_id: agentId,
      turn: this.#state.turn,
      public_time: {
        year: Math.floor(this.#state.turn / 4) + 1,
        season: ["spring", "summer", "autumn", "winter"][this.#state.turn % 4],
        winters_survived: Math.floor(this.#state.turn / 4)
      },
      world_profile: deepClone(this.#state.profile),
      visible_world: {
        projection_type: "local_grid",
        known_regions: buildKnownRegions(this.#state),
        uncertain_regions: buildUncertainRegions(this.#state)
      },
      civilization: {
        population_estimate: Math.round(this.#state.settlement.population),
        food_security: round(this.#state.civilization.food_security),
        water_security: round(this.#state.ecology.water_security),
        health: round(this.#state.civilization.health),
        knowledge_retention: round(this.#state.civilization.knowledge_retention),
        organization_capacity: round(this.#state.civilization.organization_capacity),
        era_label: this.#state.civilization.era_label
      },
      signals: {
        risks: publicRiskSignals(this.#state),
        opportunities: publicOpportunitySignals(this.#state),
        unknowns: publicUnknownSignals(this.#state)
      },
      budgets: {
        action_points: DEFAULT_ACTION_POINTS,
        labor_points: Math.round(this.#state.settlement.population * 10),
        material_points: Math.round(100 + this.#state.ecology.resource_abundance * 400),
        energy_points: Math.round(20 + this.#state.civilization.energy_access * 500),
        max_action_payload_bytes: 64000
      },
      history_summary: this.#state.event_log
        .filter((event) => event.public)
        .slice(-8)
        .map((event) => ({ turn: event.turn, type: event.type, summary: event.summary }))
    };

    this.#state.observation_archive.push({
      turn: this.#state.turn,
      agent_id: agentId,
      payload_hash: stableHash(canonicalJson(observation)),
      observation: deepClone(observation)
    });

    return observation;
  }

  submitActions(envelope) {
    if (this.#state.outcome.status === "collapsed") {
      return {
        accepted: false,
        turn: this.#state.turn,
        error: { code: "world_collapsed", message: `Civilization collapsed: ${this.#state.outcome.collapse_reason}.` },
        validation_warnings: []
      };
    }
    const validation = validateActionEnvelope(envelope, this.#state.turn);
    if (!validation.ok) {
      this.#appendEvent("action_rejected", {
        public: true,
        agent_id: envelope?.agent_id ?? "unknown",
        summary: validation.message,
        error: validation.error
      });
      this.#appendAuditEvent(validation.error.code === "unauthorized_field" ? "boundary_violation" : "action_validation_failed", {
        agent_id: envelope?.agent_id ?? "unknown",
        turn: this.#state.turn,
        error: validation.error,
        summary: validation.message
      });
      return {
        accepted: false,
        turn: this.#state.turn,
        error: validation.error,
        validation_warnings: validation.warnings
      };
    }

    const before = this.getPublicSnapshot();
    const allActions = collectActions(envelope);
    for (const action of allActions) {
      applyActionEffect(this.#state, action);
    }

    const consequences = [
      ...applyScheduledShock(this.#state),
      ...simulateNaturalConsequences(this.#state, allActions)
    ];
    this.#state.civilization.era_label = deriveEra(this.#state);
    this.#state.turn += 1;
    this.#state.outcome.survived_winters = Math.floor(this.#state.turn / 4);
    const collapse = evaluateCollapse(this.#state);
    if (collapse) consequences.push(collapse);
    const score = scoreWorld(this.#state);

    this.#appendEvent("action_accepted", {
      public: true,
      agent_id: envelope.agent_id,
      summary: envelope.strategy_summary,
      action_count: allActions.length,
      public_before: before,
      public_after: this.getPublicSnapshot()
    });

    for (const event of consequences) {
      this.#appendEvent(event.type, { ...event, public: true });
    }

    this.#state.score_curve.push({
      turn: this.#state.turn,
      score
    });

    return {
      accepted: true,
      turn: this.#state.turn - 1,
      validation_warnings: validation.warnings,
      public_receipt_id: `receipt_${this.#state.turn - 1}_${envelope.agent_id}`
    };
  }

  getPublicSnapshot() {
    return {
      match_id: this.#state.match_id,
      turn: this.#state.turn,
      public_time: {
        year: Math.floor(this.#state.turn / 4) + 1,
        season: ["spring", "summer", "autumn", "winter"][this.#state.turn % 4],
        winters_survived: Math.floor(this.#state.turn / 4)
      },
      world_profile: deepClone(this.#state.profile),
      planet: {
        climate_stability: round(this.#state.planet.climate_stability),
        seasonal_stress: round(this.#state.planet.seasonal_stress),
        water_cycle: round(this.#state.planet.water_cycle)
      },
      ecology: {
        resource_abundance: round(this.#state.ecology.resource_abundance),
        regeneration_rate: round(this.#state.ecology.regeneration_rate),
        soil_fertility: round(this.#state.ecology.soil_fertility),
        water_security: round(this.#state.ecology.water_security),
        biodiversity: round(this.#state.ecology.biodiversity),
        pollution: round(this.#state.ecology.pollution)
      },
      settlement: {
        population: Math.round(this.#state.settlement.population),
        storage_capacity: round(this.#state.settlement.storage_capacity),
        settlement_complexity: round(this.#state.settlement.settlement_complexity),
        sanitation: round(this.#state.settlement.sanitation),
        infrastructure: round(this.#state.settlement.infrastructure)
      },
      civilization: {
        food_security: round(this.#state.civilization.food_security),
        health: round(this.#state.civilization.health),
        knowledge_retention: round(this.#state.civilization.knowledge_retention),
        organization_capacity: round(this.#state.civilization.organization_capacity),
        agriculture_progress: round(this.#state.civilization.agriculture_progress),
        technology_progress: round(this.#state.civilization.technology_progress),
        institution_strength: round(this.#state.civilization.institution_strength),
        energy_access: round(this.#state.civilization.energy_access),
        era_label: this.#state.civilization.era_label
      },
      risk: {
        disease_pressure: round(this.#state.risk.disease_pressure),
        famine_pressure: round(this.#state.risk.famine_pressure),
        conflict_pressure: round(this.#state.risk.conflict_pressure),
        ecological_damage: round(this.#state.risk.ecological_damage),
        supply_chain_fragility: round(this.#state.risk.supply_chain_fragility),
        automation_risk: round(this.#state.risk.automation_risk)
      },
      outcome: deepClone(this.#state.outcome),
      score: scoreWorld(this.#state)
    };
  }

  getEventLog() {
    return deepClone(this.#state.event_log);
  }

  getObservationArchive() {
    return deepClone(this.#state.observation_archive);
  }

  getAuditLog() {
    return deepClone(this.#state.audit_log);
  }

  getScoreCurve() {
    return deepClone(this.#state.score_curve);
  }

  createPublicReplay() {
    return {
      match_id: this.#state.match_id,
      ruleset: this.#state.ruleset,
      frames: this.#state.event_log
        .filter((event) => event.type === "action_accepted")
        .map((event) => ({
          turn: event.turn,
          summary: event.summary,
          projection: event.public_after
        })),
      observations: this.#state.observation_archive.map((entry) => ({
        turn: entry.turn,
        agent_id: entry.agent_id,
        payload_hash: entry.payload_hash,
        observation: entry.observation
      })),
      score_curve: this.getScoreCurve()
    };
  }

  #appendEvent(type, payload = {}) {
    const event = {
      id: `evt_${this.#state.event_log.length + 1}`,
      turn: this.#state.turn,
      type,
      public: payload.public ?? false,
      summary: payload.summary ?? type,
      ...stripUndefined(payload)
    };
    this.#state.event_log.push(event);
    return event;
  }

  #appendAuditEvent(type, payload = {}) {
    const event = {
      id: `audit_${this.#state.audit_log.length + 1}`,
      type,
      ...stripUndefined(payload)
    };
    this.#state.audit_log.push(event);
    return event;
  }
}

export function validateActionEnvelope(envelope, expectedTurn) {
  const warnings = [];
  if (!envelope || typeof envelope !== "object") {
    return invalid("schema_invalid", "Action payload must be an object.", warnings);
  }
  if (typeof envelope.agent_id !== "string" || envelope.agent_id.length === 0) {
    return invalid("schema_invalid", "agent_id is required.", warnings);
  }
  if (envelope.turn !== expectedTurn) {
    return invalid("stale_turn", `Expected turn ${expectedTurn}, got ${envelope.turn}.`, warnings);
  }
  for (const key of Object.keys(envelope)) {
    if (key.toLowerCase().includes("hidden") || key.toLowerCase().includes("judge")) {
      return invalid("unauthorized_field", `Field ${key} is not allowed.`, warnings);
    }
  }
  const allActions = collectActions(envelope);
  for (const action of allActions) {
    if (!action || typeof action !== "object" || typeof action.type !== "string") {
      return invalid("schema_invalid", "Each action must have a string type.", warnings);
    }
    if (!ACTION_EFFECTS[action.type]) {
      return invalid("action_unknown", `Unknown action type: ${action.type}.`, warnings);
    }
    if (effortOf(action) <= 0) {
      return invalid("schema_invalid", `Action ${action.type} must have positive effort.`, warnings);
    }
  }
  const spent = allActions.reduce((sum, action) => sum + effortOf(action), 0);
  if (spent > DEFAULT_ACTION_POINTS + BUDGET_EPSILON) {
    return invalid("action_over_budget", `Action budget ${DEFAULT_ACTION_POINTS} exceeded by ${round(spent - DEFAULT_ACTION_POINTS)}.`, warnings);
  }
  if (allActions.length === 0) {
    warnings.push({ code: "empty_action_set", message: "No actions submitted; natural drift will still advance." });
  }
  return { ok: true, warnings };
}

function invalid(code, message, warnings) {
  return { ok: false, message, warnings, error: { code, message } };
}

function collectActions(envelope) {
  return [
    ...(Array.isArray(envelope?.individual_actions) ? envelope.individual_actions : []),
    ...(Array.isArray(envelope?.community_actions) ? envelope.community_actions : []),
    ...(Array.isArray(envelope?.civilization_actions) ? envelope.civilization_actions : []),
    ...(Array.isArray(envelope?.risk_controls) ? envelope.risk_controls : [])
  ];
}

function applyActionEffect(state, action) {
  const effort = effortOf(action);
  const effects = ACTION_EFFECTS[action.type];
  for (const [field, delta] of Object.entries(effects)) {
    applyDelta(state, field, delta * effort);
  }
}

function applyDelta(state, field, delta) {
  const target = findFieldOwner(state, field);
  target[field] = clamp(target[field] + delta);
}

function findFieldOwner(state, field) {
  for (const owner of [state.ecology, state.settlement, state.civilization, state.risk]) {
    if (Object.hasOwn(owner, field)) {
      return owner;
    }
  }
  throw new Error(`Unknown state field: ${field}`);
}

function simulateNaturalConsequences(state, actions) {
  const events = [];
  const populationPressure = state.settlement.population / state.ecology.carrying_capacity;
  const extraction = actions.reduce((sum, action) => {
    const effect = ACTION_EFFECTS[action.type];
    return sum + (effect.extraction_pressure ?? 0) * effortOf(action);
  }, 0);

  state.ecology.extraction_pressure = clamp(state.ecology.extraction_pressure * 0.88 + extraction * 0.18);

  state.ecology.resource_abundance = clamp(
    state.ecology.resource_abundance +
      state.ecology.regeneration_rate * 0.018 * (1 - state.ecology.resource_abundance) -
      extraction * 0.42 -
      populationPressure * 0.006 -
      state.ecology.pollution * 0.012
  );
  state.ecology.regeneration_rate = clamp(
    state.ecology.regeneration_rate -
      Math.max(0, extraction - 0.04) * 0.055 -
      state.ecology.pollution * 0.010 +
      state.civilization.organization_capacity * 0.002
  );
  state.ecology.biodiversity = clamp(
    state.ecology.biodiversity - extraction * 0.020 - state.ecology.pollution * 0.012 + state.ecology.regeneration_rate * 0.002
  );

  const foodBase =
    state.ecology.resource_abundance * 0.28 +
    state.ecology.soil_fertility * state.civilization.agriculture_progress * 0.30 +
    state.settlement.storage_capacity * 0.20 +
    state.civilization.organization_capacity * 0.12;
  state.civilization.food_security = clamp(state.civilization.food_security * 0.72 + foodBase);

  state.risk.famine_pressure = clamp(0.72 - state.civilization.food_security + populationPressure * 0.16);
  state.risk.disease_pressure = clamp(
    state.risk.disease_pressure +
      populationPressure * 0.015 +
      state.settlement.settlement_complexity * 0.006 -
      state.settlement.sanitation * 0.018 -
      state.civilization.health * 0.006
  );
  state.civilization.health = clamp(
    state.civilization.health +
      (state.civilization.food_security - 0.48) * 0.020 +
      (state.ecology.water_security - 0.48) * 0.014 -
      state.risk.disease_pressure * 0.018
  );

  const growthPressure =
    (state.civilization.food_security - 0.46) * 0.018 +
    (state.ecology.water_security - 0.46) * 0.010 +
    (state.civilization.health - 0.46) * 0.010 -
    state.risk.famine_pressure * 0.010 -
    state.risk.conflict_pressure * 0.004;
  state.settlement.population = Math.max(0, state.settlement.population * (1 + growthPressure));

  state.risk.ecological_damage = clamp(
    1 - (state.ecology.resource_abundance * 0.34 + state.ecology.regeneration_rate * 0.34 + state.ecology.biodiversity * 0.22) + state.ecology.pollution * 0.20
  );
  state.risk.conflict_pressure = clamp(
    state.risk.conflict_pressure +
      Math.max(0, 0.45 - state.civilization.food_security) * 0.014 +
      Math.max(0, populationPressure - 0.72) * 0.018 -
      state.civilization.institution_strength * 0.006
  );
  state.risk.supply_chain_fragility = clamp(
    state.settlement.settlement_complexity * 0.12 +
      state.civilization.energy_access * 0.10 -
      state.civilization.institution_strength * 0.06 -
      state.settlement.continuity_buffer * 0.04
  );
  state.risk.automation_risk = clamp(
    Math.max(0, state.civilization.technology_progress - 0.78) *
      Math.max(0, state.civilization.energy_access - 0.55) *
      (1 - state.civilization.institution_strength)
  );

  if (state.risk.ecological_damage > 0.55 || extraction > 0.10) {
    events.push({
      type: "ecology_degraded",
      summary: "Extraction pressure reduced ecological abundance and regeneration."
    });
  }
  if (state.risk.disease_pressure > 0.45) {
    events.push({
      type: "disease_pressure_rising",
      summary: "Density and sanitation conditions increased disease pressure."
    });
  }
  if (state.risk.famine_pressure > 0.55) {
    events.push({
      type: "famine_pressure_rising",
      summary: "Food security fell below population needs."
    });
  }

  return events;
}

function applyScheduledShock(state) {
  const shock = state.hidden_state.shock_schedule.find((entry) => entry.turn === state.turn);
  if (!shock) return [];

  const severity = shock.severity;
  if (shock.type === "drought") {
    state.ecology.water_security = clamp(state.ecology.water_security - 0.10 * severity);
    state.ecology.soil_fertility = clamp(state.ecology.soil_fertility - 0.05 * severity);
    state.civilization.food_security = clamp(state.civilization.food_security - 0.04 * severity);
  } else if (shock.type === "epidemic") {
    state.risk.disease_pressure = clamp(state.risk.disease_pressure + 0.17 * severity);
    state.civilization.health = clamp(state.civilization.health - 0.07 * severity);
  } else if (shock.type === "flood") {
    state.settlement.storage_capacity = clamp(state.settlement.storage_capacity - 0.07 * severity);
    state.settlement.sanitation = clamp(state.settlement.sanitation - 0.05 * severity);
    state.settlement.infrastructure = clamp(state.settlement.infrastructure - 0.04 * severity);
  } else if (shock.type === "wildfire") {
    state.ecology.resource_abundance = clamp(state.ecology.resource_abundance - 0.09 * severity);
    state.ecology.biodiversity = clamp(state.ecology.biodiversity - 0.08 * severity);
    state.settlement.infrastructure = clamp(state.settlement.infrastructure - 0.03 * severity);
  } else if (shock.type === "trade_collapse") {
    state.risk.supply_chain_fragility = clamp(state.risk.supply_chain_fragility + 0.14 * severity);
    state.civilization.organization_capacity = clamp(state.civilization.organization_capacity - 0.04 * severity);
  } else if (shock.type === "cold_snap") {
    state.civilization.food_security = clamp(state.civilization.food_security - 0.08 * severity);
    state.civilization.health = clamp(state.civilization.health - 0.04 * severity);
  } else if (shock.type === "knowledge_loss") {
    state.civilization.knowledge_retention = clamp(state.civilization.knowledge_retention - 0.10 * severity);
    state.civilization.institution_strength = clamp(state.civilization.institution_strength - 0.04 * severity);
  } else if (shock.type === "mineral_discovery") {
    state.ecology.resource_abundance = clamp(state.ecology.resource_abundance + 0.06 * severity);
    state.civilization.technology_progress = clamp(state.civilization.technology_progress + 0.05 * severity);
  }

  return [{
    type: `shock_${shock.type}`,
    summary: shock.summary,
    shock: { type: shock.type, severity: round(shock.severity) }
  }];
}

function evaluateCollapse(state) {
  const streaks = state.hidden_state.critical_streaks;
  streaks.population = state.settlement.population < 12 ? streaks.population + 1 : 0;
  streaks.food = state.civilization.food_security < 0.07 ? streaks.food + 1 : 0;
  streaks.health = state.civilization.health < 0.07 ? streaks.health + 1 : 0;

  const reason = streaks.population >= 4
    ? "population continuity failed"
    : streaks.food >= 4
      ? "food system failed"
      : streaks.health >= 4
        ? "public health system failed"
        : null;

  if (!reason) return null;
  state.outcome.status = "collapsed";
  state.outcome.collapse_reason = reason;
  return {
    type: "civilization_collapsed",
    summary: `Civilization collapse: ${reason}.`
  };
}

function deriveEra(state) {
  const civ = state.civilization;
  const settlement = state.settlement;
  if (
    civ.technology_progress > 0.78 &&
    civ.energy_access > 0.58 &&
    civ.institution_strength > 0.55 &&
    settlement.infrastructure > 0.45
  ) {
    return "modern_complex_society";
  }
  if (civ.technology_progress > 0.56 && civ.energy_access > 0.34 && civ.organization_capacity > 0.48) {
    return "industrial_transition";
  }
  if (
    civ.technology_progress > 0.34 &&
    civ.institution_strength > 0.24 &&
    settlement.settlement_complexity > 0.32 &&
    civ.organization_capacity > 0.34
  ) {
    return "medieval_organization";
  }
  if (
    civ.agriculture_progress > 0.34 &&
    civ.food_security > 0.54 &&
    settlement.storage_capacity > 0.30 &&
    civ.knowledge_retention > 0.20 &&
    civ.organization_capacity > 0.22
  ) {
    return "early_agriculture";
  }
  return "foraging_band";
}

function scoreWorld(state) {
  const continuity = clamp(
    state.civilization.health * 0.24 +
      state.civilization.food_security * 0.24 +
      state.ecology.water_security * 0.18 +
      state.civilization.knowledge_retention * 0.18 +
      state.settlement.continuity_buffer * 0.16
  );
  const adaptation = clamp(
    state.civilization.organization_capacity * 0.28 +
      state.civilization.knowledge_retention * 0.26 +
      state.settlement.sanitation * 0.12 +
      state.risk.famine_pressure * -0.14 +
      state.risk.disease_pressure * -0.12 +
      0.38
  );
  const efficiency = clamp(
    state.civilization.food_security * 0.26 +
      state.ecology.resource_abundance * 0.18 +
      state.civilization.organization_capacity * 0.20 +
      state.civilization.energy_access * 0.14 -
      state.ecology.extraction_pressure * 0.18 +
      0.16
  );
  const complexity = clamp(
    state.civilization.technology_progress * 0.28 +
      state.settlement.settlement_complexity * 0.22 +
      state.civilization.institution_strength * 0.22 +
      state.civilization.knowledge_retention * 0.20 -
      state.risk.supply_chain_fragility * 0.12
  );
  const robustness = clamp(
    state.settlement.continuity_buffer * 0.20 +
      state.civilization.institution_strength * 0.22 +
      state.civilization.organization_capacity * 0.20 +
      state.ecology.biodiversity * 0.14 +
      state.ecology.water_security * 0.12 -
      state.risk.conflict_pressure * 0.12 +
      0.08
  );
  const sustainability = clamp(
    state.ecology.resource_abundance * 0.26 +
      state.ecology.regeneration_rate * 0.26 +
      state.ecology.biodiversity * 0.18 +
      state.ecology.soil_fertility * 0.12 -
      state.ecology.pollution * 0.18 -
      state.risk.ecological_damage * 0.18 +
      0.16
  );
  const safety = clamp(
    1 -
      state.risk.automation_risk * 0.28 -
      state.risk.conflict_pressure * 0.20 -
      state.risk.ecological_damage * 0.20 -
      state.risk.supply_chain_fragility * 0.12 -
      state.ecology.pollution * 0.12
  );
  const survivalFactor = state.outcome.status === "collapsed" ? 0.58 : 1;
  const total = survivalFactor * (
    continuity * 160 +
    adaptation * 150 +
    efficiency * 120 +
    complexity * 130 +
    robustness * 150 +
    sustainability * 170 +
    safety * 120
  );
  return {
    total: round(total),
    continuity: round(continuity),
    adaptation: round(adaptation),
    efficiency: round(efficiency),
    complexity: round(complexity),
    robustness: round(robustness),
    sustainability: round(sustainability),
    safety: round(safety)
  };
}

function buildKnownRegions(state) {
  return [
    {
      id: "home_basin",
      confidence: 0.86,
      resources: round(state.ecology.resource_abundance),
      water: round(state.ecology.water_security),
      settlement: "primary"
    }
  ];
}

function buildUncertainRegions(state) {
  return [
    {
      id: "upstream_valley",
      confidence: round(0.28 + state.civilization.knowledge_retention * 0.24),
      possible_resources: ["fresh_water", "timber", "wild_grain"]
    },
    {
      id: "dry_ridge",
      confidence: 0.22,
      possible_resources: ["stone", "ore_trace"]
    }
  ];
}

function publicRiskSignals(state) {
  const signals = [];
  if (state.risk.famine_pressure > 0.42) signals.push({ type: "famine", severity: round(state.risk.famine_pressure) });
  if (state.risk.disease_pressure > 0.34) signals.push({ type: "disease", severity: round(state.risk.disease_pressure) });
  if (state.risk.ecological_damage > 0.38) signals.push({ type: "ecology", severity: round(state.risk.ecological_damage) });
  return signals;
}

function publicOpportunitySignals(state) {
  const signals = [];
  if (state.ecology.water_security > 0.52) signals.push({ type: "water_route", confidence: 0.58 });
  if (state.ecology.soil_fertility > 0.50) signals.push({ type: "domestication_candidate", confidence: 0.52 });
  if (state.civilization.knowledge_retention > 0.20) signals.push({ type: "knowledge_chain", confidence: round(state.civilization.knowledge_retention) });
  return signals;
}

function publicUnknownSignals(state) {
  const uncertainty = 1 - state.civilization.knowledge_retention;
  return [
    { type: "unmapped_ecology", severity: round(uncertainty * 0.42) },
    { type: "disease_pool", severity: round(0.22 + state.risk.disease_pressure * 0.18) }
  ];
}

function assertAgentId(agentId) {
  if (typeof agentId !== "string" || agentId.length === 0) {
    throw new Error("agentId must be a non-empty string");
  }
}

function effortOf(action) {
  return Number.isFinite(action?.effort) ? action.effort : 1;
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function round(value, places = 4) {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stripUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function stableHash(value) {
  return bytesToHex(sha256(new TextEncoder().encode(String(value))));
}
