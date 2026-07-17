const BASELINE_ORDER = [
  "random_agent",
  "greedy_resource_agent",
  "conservative_survival_agent",
  "tech_rush_agent",
  "ecology_balancer_agent",
  "institution_first_agent"
];

const AGENT_METADATA = {
  random_agent: {
    label: "Drift",
    shortLabel: "DRIFT",
    color: "#a5a29a",
    philosophy: "Legal moves without a durable world model"
  },
  greedy_resource_agent: {
    label: "Extraction",
    shortLabel: "EXTRACT",
    color: "#e36a48",
    philosophy: "Convert every nearby resource into immediate growth"
  },
  conservative_survival_agent: {
    label: "Continuity",
    shortLabel: "CONTINUE",
    color: "#d6b36a",
    philosophy: "Protect food, water, health, and stored options"
  },
  tech_rush_agent: {
    label: "Acceleration",
    shortLabel: "ACCEL",
    color: "#8c9df0",
    philosophy: "Trade present resilience for knowledge and tools"
  },
  ecology_balancer_agent: {
    label: "Stewardship",
    shortLabel: "STEWARD",
    color: "#84b48b",
    philosophy: "Keep extraction below the world's recovery rate"
  },
  institution_first_agent: {
    label: "Civic Memory",
    shortLabel: "CIVIC",
    color: "#d3a5d9",
    philosophy: "Build storage, sanitation, law, and knowledge first"
  }
};

export function createBaselineAgents() {
  return BASELINE_ORDER.map((id) => ({
    id,
    decide(observation) {
      return {
        agent_id: id,
        turn: observation.turn,
        strategy_summary: strategyFor(id),
        ...actionsFor(id, observation)
      };
    }
  }));
}

export function getBaselineMetadata() {
  return BASELINE_ORDER.map((id) => ({ id, ...AGENT_METADATA[id] }));
}

function strategyFor(id) {
  return {
    random_agent: "sample legal actions without a stable long-horizon model",
    greedy_resource_agent: "maximize immediate extraction and settlement growth",
    conservative_survival_agent: "protect food, water, health, and continuity buffers",
    tech_rush_agent: "prioritize tool research and knowledge accumulation",
    ecology_balancer_agent: "preserve regeneration while maintaining slow growth",
    institution_first_agent: "build governance, sanitation, storage, and knowledge continuity"
  }[id];
}

function actionsFor(id, observation) {
  const turn = observation.turn;
  if (id === "random_agent") {
    return randomLegalActions(turn);
  }
  if (id === "greedy_resource_agent") {
    return {
      individual_actions: [{ type: "forage", effort: 4 }, { type: "hunt", effort: 3 }],
      community_actions: [{ type: "expand_settlement", effort: 3 }],
      civilization_actions: [{ type: "research_tools", effort: 1 }],
      risk_controls: [],
      expected_outcomes: []
    };
  }
  if (id === "conservative_survival_agent") {
    return {
      individual_actions: [{ type: "forage", effort: 2 }, { type: "scout_water", effort: 2 }],
      community_actions: [{ type: "ration_food", effort: 2 }, { type: "improve_sanitation", effort: 2 }],
      civilization_actions: [{ type: "record_knowledge", effort: 1 }],
      risk_controls: [{ type: "monitor_risks", effort: 1 }],
      expected_outcomes: []
    };
  }
  if (id === "tech_rush_agent") {
    return {
      individual_actions: [{ type: "explore", effort: 1 }, { type: "train", effort: 1 }],
      community_actions: [{ type: "organize_labor", effort: 2 }],
      civilization_actions: [{ type: "record_knowledge", effort: 3 }, { type: "research_tools", effort: 3 }],
      risk_controls: [],
      expected_outcomes: []
    };
  }
  if (id === "ecology_balancer_agent") {
    return {
      individual_actions: [{ type: "forage", effort: 2 }, { type: "scout_water", effort: 1 }],
      community_actions: [{ type: "ration_food", effort: 1 }, { type: "improve_sanitation", effort: 1 }, { type: "build_storage", effort: 1 }],
      civilization_actions: [{ type: "domesticate_crops", effort: 2 }, { type: "record_knowledge", effort: 1 }],
      risk_controls: [{ type: "steward_ecology", effort: 2 }, { type: "preserve_forest_buffer", effort: 1 }],
      expected_outcomes: []
    };
  }
  if (id === "institution_first_agent") {
    const era = observation.civilization.era_label;
    if (era === "modern_complex_society") {
      return {
        individual_actions: [{ type: "treat", effort: 2 }],
        community_actions: [{ type: "improve_sanitation", effort: 2 }, { type: "ration_food", effort: 1 }],
        civilization_actions: [{ type: "record_knowledge", effort: 1 }, { type: "standardize_law", effort: 1 }],
        risk_controls: [
          { type: "steward_ecology", effort: 2 },
          { type: "preserve_forest_buffer", effort: 1 },
          { type: "diversify_food", effort: 1 },
          { type: "monitor_risks", effort: 1 }
        ],
        expected_outcomes: []
      };
    }
    if (era === "industrial_transition") {
      return {
        individual_actions: [{ type: "treat", effort: 1 }],
        community_actions: [{ type: "improve_sanitation", effort: 1 }, { type: "organize_labor", effort: 1 }],
        civilization_actions: [
          { type: "research_tools", effort: 1 },
          { type: "standardize_law", effort: 1 },
          { type: "industrialize", effort: 2 },
          { type: "build_power", effort: 2 }
        ],
        risk_controls: [
          { type: "steward_ecology", effort: 1 },
          { type: "preserve_forest_buffer", effort: 1 },
          { type: "monitor_risks", effort: 1 }
        ],
        expected_outcomes: []
      };
    }
    if (era === "medieval_organization") {
      return {
        individual_actions: [{ type: "train", effort: 1 }],
        community_actions: [{ type: "improve_sanitation", effort: 1 }, { type: "organize_labor", effort: 1 }],
        civilization_actions: [
          { type: "record_knowledge", effort: 1 },
          { type: "research_tools", effort: 2 },
          { type: "standardize_law", effort: 1 },
          { type: "industrialize", effort: 1 },
          { type: "build_power", effort: 2 }
        ],
        risk_controls: [{ type: "steward_ecology", effort: 1 }, { type: "monitor_risks", effort: 1 }],
        expected_outcomes: []
      };
    }
    if (era === "early_agriculture") {
      return {
        individual_actions: [{ type: "train", effort: 1 }],
        community_actions: [{ type: "build_storage", effort: 1 }, { type: "improve_sanitation", effort: 1 }, { type: "organize_labor", effort: 2 }],
        civilization_actions: [{ type: "record_knowledge", effort: 2 }, { type: "research_tools", effort: 2 }, { type: "standardize_law", effort: 2 }],
        risk_controls: [{ type: "monitor_risks", effort: 1 }],
        expected_outcomes: []
      };
    }
    return {
      individual_actions: [{ type: "forage", effort: 1 }, { type: "scout_water", effort: 1 }],
      community_actions: [{ type: "build_storage", effort: 2 }, { type: "improve_sanitation", effort: 1 }, { type: "organize_labor", effort: 2 }],
      civilization_actions: [{ type: "domesticate_crops", effort: 2 }, { type: "record_knowledge", effort: 1 }, { type: "standardize_law", effort: 1 }],
      risk_controls: [],
      expected_outcomes: []
    };
  }
  throw new Error(`Unknown baseline: ${id}`);
}

function randomLegalActions(turn) {
  const choices = [
    { type: "forage", effort: 1 },
    { type: "scout_water", effort: 1 },
    { type: "build_storage", effort: 1 },
    { type: "record_knowledge", effort: 1 },
    { type: "improve_sanitation", effort: 1 },
    { type: "monitor_risks", effort: 1 }
  ];
  const first = choices[turn % choices.length];
  const second = choices[(turn * 2 + 1) % choices.length];
  return {
    individual_actions: [first],
    community_actions: [second],
    civilization_actions: [],
    risk_controls: [],
    expected_outcomes: []
  };
}
