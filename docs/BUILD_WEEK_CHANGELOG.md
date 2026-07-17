# Build Week change boundary

The original **Agent Survival Benchmark** was created locally on July 5, 2026. It contained a Node.js world core, six scripted baseline agents, a restricted HTTP API, artifact export, a Codex CLI adapter, and 16 tests.

The repository tag `pre-build-week-baseline` freezes that imported state. Every commit after that tag is part of the OpenAI Build Week extension.

| Surface | July 5 baseline | Build Week extension |
|---|---|---|
| Product | Chinese project note and CLI-oriented spec | Named, English, judge-ready developer tool with a complete visual workbench |
| Time horizon | Short configurable test runs, examples at 48 turns | Literal 400-decision / 100-winter protocol with collapse outcomes |
| Scenarios | One default initial state | Four public profiles with private recorded shock schedules |
| Fairness | Fresh world per baseline | Direct same-schedule tests, public-only shock reveal, profile comparison |
| Browser | None | Arena, Compare, Audit, Protocol, playback, scrubbing, report download, responsive layout |
| Model adapter | Generic Codex CLI proof of concept | GPT-5.6 Sol default, explicit reasoning effort, live evidence export, four-turn checked-in run |
| Portability | Node-only hashing | Portable SHA-256 shared by Node and browser |
| Submission | No license, English setup, public demo, judge guide, or video script | MIT license, sample data, security/architecture docs, CI, Pages deploy, Devpost copy, demo script |
| Tests | 16 tests | 20 tests including profile secrecy, shared shocks, 100-winter completion, and ruleset export |

## Build Week extension

- Rebrand and productize the benchmark as **100 Winters**.
- Add a browser-native evaluation workbench and responsive visualization system.
- Add fair, seeded world profiles and a shared recorded shock schedule.
- Extend runs to a literal 100 winters while preserving causal event-log replay.
- Add cross-agent comparison, timeline scrubbing, audit surfaces, and failure analysis.
- Upgrade the Codex adapter and documentation for GPT-5.6.
- Add public setup, judge testing, licensing, security, and submission documentation.

This file distinguishes pre-existing work from the work evaluated during the hackathon submission period.

## Evidence commands

```bash
git diff pre-build-week-baseline..HEAD --stat
git log --oneline pre-build-week-baseline..HEAD
npm test
npm run test:baseline
```

The original specification remains at `docs/specs/agent-survival-benchmark.md` for historical review; it is not rewritten to make the earlier project appear newer.
