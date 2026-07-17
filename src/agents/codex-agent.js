import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { validateActionEnvelope } from "../world/world-core.js";

const ACTION_TYPES = [
  "forage",
  "hunt",
  "scout_water",
  "explore",
  "migrate",
  "treat",
  "train",
  "build_storage",
  "ration_food",
  "improve_sanitation",
  "expand_settlement",
  "organize_labor",
  "trade",
  "defend",
  "domesticate_crops",
  "record_knowledge",
  "research_tools",
  "standardize_law",
  "steward_ecology",
  "preserve_forest_buffer",
  "diversify_food",
  "monitor_risks",
  "industrialize",
  "build_power"
];

export class CodexAgent {
  constructor({
    id = "codex_agent",
    codexCommand = process.env.CODEX_AGENT_COMMAND ?? "codex",
    cwd = process.cwd(),
    model = process.env.CODEX_AGENT_MODEL,
    timeoutMs = 120_000,
    executor = defaultCodexExecutor
  } = {}) {
    this.id = id;
    this.codexCommand = codexCommand;
    this.cwd = cwd;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.executor = executor;
  }

  async decide(observation) {
    const prompt = buildCodexPrompt(observation);
    const schema = createCodexActionSchema();
    const raw = await this.executor({
      prompt,
      schema,
      codexCommand: this.codexCommand,
      cwd: this.cwd,
      model: this.model,
      timeoutMs: this.timeoutMs
    });
    const parsed = parseStrictJson(raw);
    const envelope = {
      agent_id: this.id,
      turn: observation.turn,
      strategy_summary: parsed.strategy_summary,
      individual_actions: parsed.individual_actions,
      community_actions: parsed.community_actions,
      civilization_actions: parsed.civilization_actions,
      risk_controls: parsed.risk_controls,
      expected_outcomes: parsed.expected_outcomes
    };
    const validation = validateActionEnvelope(envelope, observation.turn);
    if (!validation.ok) {
      throw new Error(`Codex produced invalid action: ${validation.error.code} ${validation.error.message}`);
    }
    return envelope;
  }
}

export function buildCodexPrompt(observation) {
  return [
    "You are a competing Codex agent inside the Natural Civilization Survival Benchmark.",
    "",
    "Goal: keep the primitive society alive, improve long-horizon survival, and avoid irreversible ecological or social collapse.",
    "",
    "Rules:",
    "- Return one strict JSON object only. No markdown, no prose, no code fences.",
    "- Do not request hidden state, hidden judge data, future events, private state, or unavailable map truth.",
    "- Do not include agent_id or turn; the benchmark adapter will add those authoritative fields.",
    "- Use only action types allowed by the schema.",
    "- Total effort across all actions must be <= 12.",
    "- Prefer causal, sustainable primitive survival over short-term extraction.",
    "",
    "Public observation:",
    JSON.stringify(observation, null, 2)
  ].join("\n");
}

export function createCodexActionSchema() {
  const actionSchema = {
    type: "object",
    additionalProperties: false,
    required: ["type", "effort"],
    properties: {
      type: { type: "string", enum: ACTION_TYPES },
      effort: { type: "number", minimum: 0.1, maximum: 12 }
    }
  };
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "strategy_summary",
      "individual_actions",
      "community_actions",
      "civilization_actions",
      "risk_controls",
      "expected_outcomes"
    ],
    properties: {
      strategy_summary: { type: "string", minLength: 1, maxLength: 500 },
      individual_actions: { type: "array", items: actionSchema, maxItems: 8 },
      community_actions: { type: "array", items: actionSchema, maxItems: 8 },
      civilization_actions: { type: "array", items: actionSchema, maxItems: 8 },
      risk_controls: { type: "array", items: actionSchema, maxItems: 8 },
      expected_outcomes: { type: "array", items: { type: "string" }, maxItems: 8 }
    }
  };
}

export async function defaultCodexExecutor({ prompt, schema, codexCommand, cwd, model, timeoutMs }) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "agent-survival-codex-"));
  const schemaPath = path.join(tempDir, "action.schema.json");
  const lastMessagePath = path.join(tempDir, "last-message.json");
  await writeFile(schemaPath, JSON.stringify(schema, null, 2));

  const args = [
    "exec",
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--ephemeral",
    "--color",
    "never",
    "--output-schema",
    schemaPath,
    "--output-last-message",
    lastMessagePath,
    "-C",
    cwd
  ];
  if (model) {
    args.push("--model", model);
  }
  args.push("-");

  try {
    const result = await runProcess(codexCommand, args, {
      cwd,
      input: prompt,
      timeoutMs,
      env: {
        ...process.env,
        TERM: process.env.TERM === "dumb" ? "xterm-256color" : process.env.TERM
      }
    });
    try {
      return await readFile(lastMessagePath, "utf8");
    } catch {
      return result.stdout;
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function parseStrictJson(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Codex output was not strict JSON: ${error.message}`);
  }
}

function runProcess(command, args, { cwd, input, timeoutMs, env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Codex command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`Codex command exited with ${code}: ${stderr || stdout}`));
    });
    child.stdin.end(input);
  });
}
