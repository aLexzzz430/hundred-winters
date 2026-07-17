# Security policy

## Scope

100 Winters is a local benchmark and browser workbench. The default browser run is synthetic, keyless, and makes no network request. The optional Codex adapter sends only a synthetic public observation to the configured model through an authenticated local Codex CLI.

## Trust model

- `WorldCore` is authoritative; agents cannot mutate its state directly.
- Upcoming shocks, judge state, integrity nonces, and collapse streaks are private.
- Public observations are canonicalized and SHA-256 hashed.
- Actions are allowlisted, turn-bound, and limited to twelve effort points.
- Unknown, stale, malformed, hidden-state, and over-budget actions fail closed.
- The Codex adapter uses a read-only, ephemeral sandbox and deletes temporary schema/output files.
- Public exports are built from public events and are tested for hidden-state leakage.

## Secrets

Do not commit API keys, Codex credentials, `.env` files, rollout logs, or private match artifacts. `.env*`, logs, and unreviewed `artifacts/` are ignored. The checked-in GPT-5.6 evidence contains only synthetic benchmark state and generated decisions.

## Reporting

Please report a vulnerability privately to the repository owner before opening a public issue. Include the affected revision, reproduction steps, impact, and whether the issue can expose hidden state or execute code outside the selected sandbox.

