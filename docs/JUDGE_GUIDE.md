# Judge guide

[Watch the 2:07 public demo](https://youtu.be/fRhGPnRTAtc) or follow the local verification path below.

## Fast path: under five minutes

1. Run `npm install && npm run dev` and open `http://localhost:5173`.
2. In **Arena**, click **Replay 100 winters**. Watch the map and metrics change while the score cursor advances.
3. Select **Acceleration** in the ledger and scrub to winter 73 to inspect its collapse.
4. Open **Compare** to see the same-world policy divergence and terminal failure count.
5. Open **Audit** to inspect the exact public observation, 64-character SHA-256, visible event stream, and hidden-state boundary.
6. Open **Protocol 1.0** for the score composition and live GPT-5.6 command.

No key or network request is required for this path.

## Verify the benchmark

```bash
npm test
npm run test:baseline
npm run generate:demo
npm run build
```

Expected local verification:

- 20 tests pass;
- six agents complete or collapse deterministically;
- Civic Memory leads River Basin with 769.65 and reaches a modern complex society;
- Acceleration collapses after 73 winters;
- the production bundle builds successfully.

Generated sample artifacts are in `public/demo/`.

## Verify the OpenAI integration

This requires an installed and authenticated Codex CLI:

```bash
npm run simulate:codex -- \
  --turns 1 \
  --model gpt-5.6-sol \
  --reasoning-effort medium
```

The command should return one accepted model decision and a final public snapshot. For an already completed four-turn run, inspect `evidence/gpt-5p6-live-run.json`.

## Claims and evidence

| Claim | Direct evidence |
|---|---|
| Same hidden shocks for agents in a profile | `test/hundred-winters-protocol.test.js` |
| Hidden state is absent from public replay | `test/export-and-security.test.js` and Audit view |
| 100 winters means 400 decisions | full-protocol test and baseline CLI |
| Browser uses the real core | `src/app/experiment.js` imports `ArenaRunner` |
| GPT-5.6 actions are schema constrained | `src/agents/codex-agent.js` and live evidence JSON |
| Build Week work is distinguishable | `pre-build-week-baseline` tag and `docs/BUILD_WEEK_CHANGELOG.md` |

## Known boundary

The simulation is designed to evaluate long-horizon policy behavior. It is not a prediction model for real civilizations. Compare agents only within the same versioned ruleset and profile.
