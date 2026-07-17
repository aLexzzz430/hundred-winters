# Agent Survival Benchmark

这是一个 agent 生存游戏 / 文明生存评测基准的设计项目。

当前入口文档：

- [Natural Civilization Survival Benchmark Spec](docs/specs/agent-survival-benchmark.md)

当前实现入口：

- `src/world/world-core.js`：权威世界状态、自然推导、event log、observation archive、public replay。
- `src/arena/baseline-agents.js`：六类 baseline agents。
- `src/arena/arena-runner.js`：批量运行 baseline 比赛。
- `src/api/server.js`：受限 HTTP API。
- `src/export/exporter.js`：match/events/observations/actions/scores/replay/audit 导出。
- `src/agents/codex-agent.js`：通过 `codex exec` 接入本机 Codex agent。

运行：

```bash
npm test
npm start -- 48
npm run simulate:codex -- --turns 1
```

核心方向：

- 评测基准优先，不是剧情游戏优先。
- 世界由 `WorldCore` 自然推导，不是固定 seed 地图生成器。
- agent 通过受限 HTTP/SDK 接入。
- 评分衡量长期生存、适应、因果理解、资源效率、复杂度增长、韧性、可持续和安全边界。
