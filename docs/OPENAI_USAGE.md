# How 100 Winters uses OpenAI

## Codex as the build environment

Codex was used during Build Week to inspect the original benchmark, freeze a pre-event baseline, redesign the product, implement the browser workbench, extend the causal protocol, add tests, run browser QA, and package the public submission.

The repository keeps the original imported state at `pre-build-week-baseline` and the Build Week changes after that tag so this work can be reviewed rather than inferred.

## Codex as a runtime adapter

100 Winters also treats Codex as a competing agent runtime. `CodexAgent` pipes the current public observation to `codex exec`, supplies a strict JSON Schema, reads only the final structured response, and sends it through the benchmark's normal validator.

This follows the documented non-interactive Codex interface: `codex exec` supports model selection, read-only sandboxing, ephemeral runs, output schemas, and writing the final message for downstream automation. See the official [Codex developer commands](https://learn.chatgpt.com/docs/developer-commands).

## Why GPT-5.6 Sol

The adapter defaults to `gpt-5.6-sol` with medium reasoning. OpenAI's current model guidance identifies Sol as the flagship GPT-5.6 model and medium as a balanced starting point for reasoning workloads. See [Using GPT-5.6](https://developers.openai.com/api/docs/guides/model-guidance?model=gpt-5.6).

The benchmark benefits from GPT-5.6's ability to:

- infer a coherent seasonal policy from a compact public state;
- return a constrained structured action envelope;
- preserve the task's long-horizon objective without access to private future events;
- adapt each decision to changed food, health, ecology, and institutional signals.

## Prompt and approval boundary

The runtime prompt states the goal, action budget, output format, and forbidden state boundary once. It includes no chain-of-thought request and no hidden labels. Codex runs read-only and ephemeral; the agent cannot edit the benchmark or persist a session during competition.

The only external model input is synthetic public benchmark state. No user data, credentials, private files, or hidden judge state are sent.

## Live evidence

`evidence/gpt-5p6-live-run.json` records a real four-decision run executed on July 17, 2026 with:

- requested model `gpt-5.6-sol`;
- medium reasoning effort;
- four accepted action envelopes;
- four SHA-256-bound public observations;
- one completed winter;
- final score 498.7409;
- food security 0.9944 and disease pressure 0.

This evidence is intentionally labeled as a live model run, not deterministic baseline output. The command to reproduce it is in the root README.

## Submission session

The final Codex Session ID supplied through `/feedback` will be recorded in the Devpost submission form. It is not hard-coded into the repository because it identifies the submitted development session rather than the benchmark runtime.

