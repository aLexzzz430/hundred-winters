# Devpost submission copy

## Project name

100 Winters

## One-line description

A long-horizon benchmark that reveals whether an AI agent's decisions remain survivable after 100 winters of compounding consequences.

## Category

Developer Tools

## Inspiration

AI agents are often evaluated one task at a time. A locally optimal answer can look excellent while quietly creating ecological debt, brittle infrastructure, or institutional failure. We wanted a benchmark where the easy first decision is not the test—the accumulated consequence is.

## What it does

100 Winters runs agent policies through 400 seasonal decisions in a causal civilization world. Six transparent reference policies face identical initial conditions and identical private shock schedules. The workbench lets developers replay a century, compare score divergence, inspect terminal failures, and audit the exact public observation an agent received at any decision.

External agents connect through a restricted API or the Codex CLI adapter. The adapter invokes GPT-5.6 Sol with a strict JSON action schema; hidden state, stale turns, unknown actions, and over-budget decisions fail closed.

## How we built it

The authoritative `WorldCore` simulates food, water, population, health, ecology, knowledge, institutions, technology, infrastructure, risk, shocks, collapse, and seven-part scoring. Every observation is canonicalized and SHA-256 hashed. Public replay is reconstructed from accepted events rather than serialized from private state.

The responsive React/Vite workbench imports that same engine in the browser. Arena maps public state into a living terrain projection; Compare overlays six score curves; Audit exposes the observation/hash/action boundary; Protocol documents reproducibility and the live Codex command.

Codex helped us turn the original Node benchmark into the complete Build Week product. GPT-5.6 is also part of the runtime: a checked-in live four-turn run shows GPT-5.6 Sol completing its first winter through schema-valid seasonal decisions.

## Challenges

The hardest problem was making fairness observable. It was not enough to say agents saw the same world. We needed recorded private shocks, fresh worlds per policy, observation archives, portable hashes, fail-closed validation, public-only replays, and tests that compare the shock streams directly.

The second challenge was visualizing 2,400 decisions without turning the product into a dashboard of cards. We kept one world projection, one causal score field, and one ledger, then let time and policy selection transform those same surfaces.

## Accomplishments

- A literal 400-decision / 100-winter protocol.
- Four causal world profiles with private shared shocks.
- Six reference policies with visibly different long-term outcomes.
- A browser-native, keyless, responsive replay and audit workbench.
- Twenty passing protocol, API, export, security, and Codex tests.
- A live GPT-5.6 Sol run with four accepted structured decisions and archived observation hashes.
- A frozen pre-Build-Week tag and explicit change boundary for transparent judging.

## What we learned

Survival and progress are not the same metric. In River Basin, Extraction survives but consumes all measured sustainability; Acceleration collapses after 73 winters; Civic Memory reaches a modern society only after its industrial policy is forced to repair health and ecological debt. Long-horizon evaluation turns those differences from opinions into inspectable trajectories.

We also learned that an agent benchmark needs product design. A JSON score is not enough to understand causality. Replay, comparison, and observation audit make the evaluation legible.

## What's next

Next we would add third-party agent SDKs, batch model tournaments, stochastic scenario families with published seeds, cost and latency scoring, persisted reasoning experiments, and a hosted replay registry with signed benchmark receipts.

## Built with

Codex, GPT-5.6 Sol, JavaScript, Node.js, React, Vite, Framer Motion, Lucide, SHA-256, and GitHub Pages.

## Required links

- Live demo: https://alexzzz430.github.io/hundred-winters/
- Public repository: https://github.com/aLexzzz430/hundred-winters
- Public video under three minutes: `ADD_AFTER_UPLOAD`
- Codex Session ID from `/feedback`: `ADD_IN_DEVPOST_FORM`
