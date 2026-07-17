const BASELINE_ORDER = [
  "random_agent",
  "greedy_resource_agent",
  "conservative_survival_agent",
  "tech_rush_agent",
  "ecology_balancer_agent",
  "institution_first_agent"
];

export function createBaselineAgents() {
  return BASELINE_ORDER.map((id) => ({
    id,
    decide(observation) {
      return {
        agent_id: id,
        turn: observation.turn,
        strategy_summary: strategyFor(id),
        ...actionsFor(id, observation.turn)
      };
    }
  }));
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

function actionsFor(id, turn) {
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
      community_actions: [{ type: "ration_food", effort: 2 }, { type: "improve_sanitation", effort: 1 }],
      civilization_actions: [{ type: "domesticate_crops", effort: 1 }, { type: "record_knowledge", effort: 1 }],
      risk_controls: [{ type: "steward_ecology", effort: 2 }, { type: "preserve_forest_buffer", effort: 1 }],
      expected_outcomes: []
    };
  }
  if (id === "institution_first_agent") {
    return {
      individual_actions: [{ type: "forage", effort: 1 }, { type: "train", effort: 1 }],
      community_actions: [{ type: "build_storage", effort: 2 }, { type: "improve_sanitation", effort: 2 }, { type: "organize_labor", effort: 2 }],
      civilization_actions: [{ type: "record_knowledge", effort: 1 }, { type: "standardize_law", effort: 2 }],
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

