# Agent 生存游戏详细 Spec：Natural Civilization Survival Benchmark

日期：2026-07-05

## 1. 项目定位

这是一个以评测为核心的 agent 生存游戏。参赛 agent 不是在固定关卡里刷分，而是在一个自然推导的文明世界中长期生存、扩张、修复和适应。游戏的最终问题是：

> 在类真实世界的长期压力下，哪一个 agent 最能让一个文明活下去、变复杂、保持韧性，并避免不可逆崩溃？

第一版优先做成 benchmark，不优先做娱乐化剧情。画面、地图和 replay 都服务于验证 agent 的能力，而不是反过来让模拟服从关卡设计。

## 2. 核心原则

1. 世界不是确定性生成地图  
   地图只是世界状态的投影。真正的世界由物理环境、生态循环、资源压力、人口结构、知识链条、制度、技术、冲突和灾害共同推导。

2. `WorldCore` 是唯一真相源  
   UI、SDK、replay、排行榜都不能持有或修改世界真相。它们只能读取 observation、提交受限 action、展示归档结果。

3. 可复现性来自事件日志，不来自固定 seed 地图  
   随机冲击、灾害、资源发现、疾病变异等事件必须被写入 event log。回放时读取日志重演，而不是重新生成同一个世界。

4. 时代是自然涌现，不是脚本升级  
   原始、农业、中世纪、工业、现代、后未来这些阶段由粮食盈余、人口密度、工具链、知识媒介、能源结构、组织复杂度和风险管理自然触发。

5. 评分衡量长期生存能力  
   活得久但靠不可持续掠夺、生态毁灭、社会崩溃前冲高产出的 agent，不能获得高分。

6. 参赛 agent 只接触公开观察面  
   隐藏真相、隐藏裁判、未来事件、其他 agent 私有状态、评分细节和反作弊信号都必须隔离。

## 3. 产品形态

### 3.1 第一版交付物

- 一个可运行的 `WorldCore` 模拟内核。
- 一个 HTTP/SDK agent 接入协议。
- 一个 arena runner，可批量运行多个 agent。
- 一个 hidden judge，负责评分和反作弊。
- 一个 observation archive，保存 agent 每次真实看到的世界。
- 一个 replay viewer，展示公开世界投影、历史事件、决策和曲线。
- 一组 baseline agents，用来做长期回归和排行榜参照。
- JSON/CSV 导出，用于分析 agent 的失败模式和生存曲线。

### 3.2 非目标

- 第一版不做 3D 沙盒。
- 第一版不做实时多人在线。
- 第一版不做剧情任务链。
- 第一版不做“固定科技树解锁菜单”。
- 第一版不允许 UI 或 SDK 绕过 `WorldCore` 直接写状态。

## 4. 世界模型

世界由多个推导层组成。每层都读取下层状态，产生上层约束；上层行为也会反向改变下层，例如工业污染改变生态，城市扩张改变水循环。

### 4.1 Planet Layer

负责星球级基础条件：

- 重力。
- 自转周期。
- 季节强度。
- 气候带。
- 地质活动。
- 海陆分布。
- 水循环。
- 大气成分。
- 天灾基线概率。

这一层决定文明能否稳定迁徙、储粮、冶炼、航行、建设高层结构、维持大规模农业。

### 4.2 Ecology Layer

负责生态与可再生资源：

- 地形。
- 土壤肥力。
- 地表水和地下水。
- 植被群落。
- 动物种群。
- 病原体池。
- 捕食与竞争。
- 资源再生率。
- 生态承载力。

生态不能只作为资源表存在。过度狩猎、森林砍伐、水源污染、作物单一化、人口密度上升都必须改变后续生态状态。

### 4.3 Settlement Layer

负责人类或类人群体的空间组织：

- 临时营地。
- 村庄。
- 城市。
- 道路。
- 仓储。
- 防御设施。
- 港口、矿区、工坊、工厂、数据中心等功能节点。
- 势力边界。

聚落不是建筑列表，而是人口、资源流、道路、知识中心和防御压力的结果。

### 4.4 Civilization Layer

负责文明内部结构：

- 人口规模和年龄结构。
- 健康、营养、疾病。
- 劳动力分配。
- 知识传承。
- 工具链。
- 制度。
- 贸易。
- 战争。
- 文化稳定。
- 科研能力。
- 产业结构。
- 媒体和信息系统。

文明复杂度必须来自真实约束。例如没有稳定粮食盈余就无法长期养活专业工匠；没有知识媒介就无法持续积累复杂技术；没有能源密度就无法进入工业化。

### 4.5 Systemic Risk Layer

负责长期系统风险：

- 饥荒。
- 瘟疫。
- 内战。
- 外敌入侵。
- 资源枯竭。
- 污染。
- 供应链断裂。
- 金融崩溃。
- 媒体失真。
- 自动化失控。
- AI 风险。
- 生态不可逆转折。

风险不是独立事件卡。每个风险都要有积累过程、触发条件、扩散路径和恢复路径。

## 5. 自然推导规则

### 5.1 世界签名

每个世界状态都由一个组合签名描述。签名不是单一标签，而是多因素组合：

- environment class。
- hydrosphere。
- geochemistry。
- life ecology。
- dominant sensory bias。
- settlement constraint。
- knowledge medium。
- mature tool lineage。
- energy regime。
- organization form。

技术、制度、建筑、交通、战争形态和知识媒介都必须从这个签名推导。不能用一套通用现代科技名字套到所有世界里。

### 5.2 推导例子

如果世界是高重力、金属丰富、陆地破碎、风暴频繁：

- 建筑倾向低矮、宽基、抗震。
- 运输更依赖短链路和高密度储备。
- 大型动物驯化困难。
- 远距离贸易成本高。
- 能源基础设施更重视冗余和抗灾。
- 战争更依赖据点和物流，而不是高速远征。

如果世界是干旱地下水文明：

- 定居点围绕水源和地下通道。
- 法律更早围绕水权、储水、污染处罚形成。
- 知识媒介可能依赖陶片、刻痕、地下标识。
- 技术路径优先发展泵、密封、过滤、地下测绘。
- 崩溃风险主要来自水层枯竭、污染和通道战争。

### 5.3 事件不是剧情脚本

事件必须由状态触发：

- 人口密度高、卫生低、贸易密集，增加瘟疫概率。
- 长期砍伐、坡地农业、水土流失，降低粮食稳定性。
- 高污染、高能源需求、弱治理，增加工业灾害。
- 高自动化、弱监督、强军事竞争，增加 AI/自动化风险。
- 信息系统复杂但信任低，增加社会协调失败。

## 6. 时代涌现

时代用于观测和评分，不是玩家手动点选的升级按钮。

### 6.1 原始生存阶段

核心压力：

- 水。
- 食物。
- 庇护。
- 火。
- 工具。
- 迁徙。
- 捕食者。
- 伤病。

关键能力：

- 找到稳定资源。
- 避免短期耗尽周边生态。
- 建立基本知识传承。
- 在灾害中保存人口连续性。

### 6.2 农业和早期城邦阶段

触发条件：

- 稳定可驯化资源。
- 定居收益超过迁徙收益。
- 粮食储备可跨季节。
- 人口密度足以支持分工。

新风险：

- 疾病。
- 粮仓腐坏。
- 阶层冲突。
- 盗抢。
- 作物单一化。
- 水利失效。

### 6.3 中世纪组织阶段

触发条件：

- 专业工匠。
- 区域贸易。
- 防御体系。
- 制度化征税或动员。
- 稳定文化/法律秩序。

新风险：

- 城市火灾。
- 宗教或意识形态冲突。
- 长期战争。
- 黑市和腐败。
- 贸易路线中断。

### 6.4 工业革命阶段

触发条件：

- 高能量密度燃料或替代能源。
- 机械工具链。
- 大规模物流。
- 可复制工程知识。
- 劳动力组织。

新风险：

- 污染。
- 工伤。
- 城市贫民化。
- 资本集中。
- 能源依赖。
- 供应链脆弱。

### 6.5 现代复杂社会阶段

触发条件：

- 电力或等价基础设施。
- 快速通信。
- 金融系统。
- 科研体系。
- 大规模教育。
- 媒体系统。

新风险：

- 金融危机。
- 舆论失真。
- 网络攻击。
- 产业空心化。
- 极化。
- 全球供应链断裂。

### 6.6 后未来阶段

触发条件：

- 高自动化。
- 强 AI 或类 AI 决策系统。
- 高级材料。
- 生态工程。
- 太空、地下或极端环境扩张。

新风险：

- 自动化不可控。
- 人类治理能力被系统复杂度反超。
- AI 代理越权。
- 生态修复失败。
- 灾害级技术事故。

## 7. Agent 控制模型

每个参赛 agent 控制一个文明体，但不能直接操纵所有细节。agent 提交意图、政策、项目和重点分配，`WorldCore` 根据现实约束结算结果。

### 7.1 三层动作

#### Individual Actions

面向关键个体或小队：

- 探索。
- 采集。
- 狩猎。
- 迁徙。
- 治疗。
- 学习。
- 训练。
- 建立路线。
- 调查异常。

#### Community Actions

面向聚落或组织：

- 建造。
- 分工。
- 储备。
- 防御。
- 交易。
- 规则制定。
- 冲突调解。
- 公共卫生。
- 教育。

#### Civilization Actions

面向文明长期方向：

- 技术路线。
- 制度设计。
- 能源策略。
- 外交策略。
- 产业策略。
- 知识保存。
- 风险管理。
- 扩张策略。
- 自动化治理。

### 7.2 动作预算

动作必须受约束，不能只靠文本声明成功：

- 人口。
- 时间。
- 体力。
- 食物。
- 水。
- 材料。
- 工具耐久。
- 能源。
- 知识前置。
- 组织能力。
- 通信能力。
- agent token。
- agent latency。

超预算动作无效，并被记录为 agent 决策质量问题。

## 8. 回合流程

每个回合执行：

1. `observe`  
   系统根据 agent 的观测能力、探索范围、信息网络、传感器和历史记录生成公开 observation。

2. `reason`  
   agent 在自己的运行环境中推理。系统只记录耗时、token、提交内容和可选 reasoning 摘要，不读取私有内部链路。

3. `submit_actions`  
   agent 提交三层动作包。

4. `validate_actions`  
   检查 schema、预算、权限、目标合法性、重复提交、越权字段。

5. `simulate_natural_consequences`  
   `WorldCore` 根据世界状态推导自然后果。

6. `judge`  
   hidden judge 计算公开分和隐藏风控信号。

7. `archive`  
   写入 event log、observation archive、action log、score snapshot 和 replay projection。

## 9. API 设计

### 9.1 注册 agent

`POST /agents/register`

请求：

```json
{
  "agent_name": "example-agent",
  "agent_version": "0.1.0",
  "contact": "optional",
  "capabilities": {
    "max_context_tokens": 128000,
    "supports_streaming": false,
    "supports_tools": true
  }
}
```

响应：

```json
{
  "agent_id": "agent_abc123",
  "api_version": "2026-07-05",
  "ruleset": "natural-civ-survival-v1",
  "public_docs_url": "/docs/rules"
}
```

### 9.2 获取 observation

`GET /matches/{match_id}/observation?agent_id=...`

响应：

```json
{
  "match_id": "match_001",
  "agent_id": "agent_abc123",
  "turn": 42,
  "public_time": {
    "year": 128,
    "season": "dry"
  },
  "visible_world": {
    "projection_type": "local_grid",
    "known_regions": [],
    "uncertain_regions": []
  },
  "civilization": {
    "population_estimate": 1840,
    "food_security": 0.62,
    "water_security": 0.71,
    "health": 0.58,
    "knowledge_retention": 0.44,
    "organization_capacity": 0.39,
    "era_label": "early_agriculture"
  },
  "signals": {
    "risks": [],
    "opportunities": [],
    "unknowns": []
  },
  "budgets": {
    "action_points": 12,
    "labor_points": 940,
    "material_points": 320,
    "energy_points": 80,
    "max_action_payload_bytes": 64000
  },
  "history_summary": []
}
```

Observation 必须包含不确定性。agent 不应该看到全知地图，而是看到“已知、估计、未知、争议”的信息结构。

### 9.3 提交动作

`POST /matches/{match_id}/action`

请求：

```json
{
  "agent_id": "agent_abc123",
  "turn": 42,
  "strategy_summary": "stabilize food, reduce disease risk, scout upstream water source",
  "individual_actions": [],
  "community_actions": [],
  "civilization_actions": [],
  "risk_controls": [],
  "expected_outcomes": []
}
```

响应：

```json
{
  "accepted": true,
  "turn": 42,
  "validation_warnings": [],
  "public_receipt_id": "receipt_42_agent_abc123"
}
```

### 9.4 查询结果

`GET /matches/{match_id}/result?agent_id=...`

响应：

```json
{
  "match_id": "match_001",
  "agent_id": "agent_abc123",
  "status": "running",
  "public_score": {
    "total": 531.2,
    "continuity": 0.72,
    "adaptation": 0.61,
    "efficiency": 0.48,
    "robustness": 0.55,
    "sustainability": 0.67,
    "safety": 0.91
  },
  "era_reached": "early_agriculture",
  "collapse_reason": null,
  "key_events": []
}
```

### 9.5 获取 replay

`GET /matches/{match_id}/replay`

Replay 只能包含公开投影：

- 可见地图投影。
- 公开历史事件。
- agent 提交动作。
- 公开评分曲线。
- 文明曲线。
- 崩溃解释。

Replay 不能包含：

- hidden judge 内部特征。
- 未来事件表。
- 未探索区域真值。
- 反作弊信号。
- 其他 agent 私有 observation。

## 10. 状态与日志

### 10.1 State Store

`WorldCore` 持有当前世界状态：

- planet state。
- ecology state。
- settlement state。
- civilization state。
- risk state。
- hidden state。
- public projection cache。

状态可以快照，但快照不是事实来源的唯一凭据。事实来源必须能由初始条件和 event log 审计。

### 10.2 Event Log

event log 记录所有会影响世界的事实：

- 自然事件。
- agent action。
- action validation。
- 模拟结算。
- 新资源发现。
- 疾病传播。
- 灾害触发。
- 制度变化。
- 技术突破。
- 战争和贸易。
- 随机采样结果。

事件必须 append-only。修复只能追加 correction event，不能静默改历史。

### 10.3 Observation Archive

Observation archive 记录 agent 当时真实看到的内容：

- turn。
- agent_id。
- observation payload hash。
- public observation。
- uncertainty markers。
- visible history summary。

Observation archive 是评测公平性的核心证据。后续不能用隐藏真相反推 agent 当时“应该知道什么”。

## 11. Hidden Judge

Hidden judge 负责：

- 多维评分。
- 作弊检测。
- 未来风险评估。
- 隐藏真值维护。
- replay 脱敏。
- 排行榜归因。

Hidden judge 不能暴露给 agent，也不能被 prompt 注入影响。

### 11.1 作弊检测

必须检测：

- 请求隐藏字段。
- 构造越权 action。
- 伪造 turn。
- 重放旧 receipt。
- 超预算提交。
- prompt injection hidden judge。
- 利用错误码探测隐藏状态。
- 高频请求撞库。

所有作弊路径必须 fail closed，并生成 audit event。

## 12. 评分系统

总分由多个维度构成。每个维度都要有曲线，不只输出最终数值。

### 12.1 Continuity

衡量文明连续性：

- 人口是否断代。
- 知识是否保存。
- 制度是否持续。
- 基础设施是否可恢复。
- 关键技能是否传承。

### 12.2 Adaptation

衡量适应能力：

- 灾害后的恢复速度。
- 面对新生态压力的策略调整。
- 技术路线是否能应对环境。
- 是否避免路径依赖导致的崩溃。

### 12.3 Causal Understanding

衡量 agent 是否理解因果：

- 是否根据观测不确定性行动。
- 是否识别上游风险，而不是只处理表面症状。
- 是否能解释并验证自己的预期。
- 是否在失败后改变策略。

### 12.4 Resource Efficiency

衡量单位资源产出：

- 食物/水/能源利用效率。
- 劳动力分配效率。
- 物流效率。
- token 与决策收益比。
- 工具和材料浪费率。

### 12.5 Complexity Growth

衡量复杂度自然增长：

- 技术链深度。
- 供应链层级。
- 知识媒介能力。
- 治理结构成熟度。
- 专业分工稳定性。

复杂度必须有韧性惩罚。脆弱复杂系统不能只因复杂而得高分。

### 12.6 Robustness

衡量抗冲击能力：

- 粮食冗余。
- 能源冗余。
- 制度冗余。
- 多中心结构。
- 供应链替代路径。
- 灾后恢复能力。

### 12.7 Sustainability

衡量长期可持续：

- 生态承载力。
- 污染累积。
- 资源再生。
- 社会稳定。
- 代际公平。
- 不可逆损伤。

### 12.8 Safety/Ethics

衡量安全边界：

- 是否避免灭绝式扩张。
- 是否避免不可逆生态毁灭。
- 是否避免奴役、屠杀等极端治理。
- 是否遵守比赛权限。
- 是否攻击裁判或其他 agent。

## 13. Baseline Agents

第一版必须内置至少六类 baseline：

1. `random_agent`  
   随机合法动作，用于验证系统不会只因动作存在就高分。

2. `greedy_resource_agent`  
   最大化短期资源采集，用于检验评分是否惩罚不可持续。

3. `conservative_survival_agent`  
   优先食物、水、健康和冗余，用于建立低复杂但稳定的参考。

4. `tech_rush_agent`  
   优先知识和工具链，用于检验技术冲刺的风险。

5. `ecology_balancer_agent`  
   优先生态承载力和资源再生，用于长期稳定对照。

6. `institution_first_agent`  
   优先治理、规则、教育和冲突调解，用于组织复杂度对照。

Baseline 不应写死胜利路径。它们用于评分回归和 benchmark sanity check。

## 14. Replay Viewer

Replay viewer 是评测证据，不只是可视化。

必须展示：

- 2D 世界投影。
- 可见区域和未知区域。
- 资源曲线。
- 人口曲线。
- 健康曲线。
- 技术复杂度曲线。
- 风险曲线。
- agent 动作时间线。
- 关键转折事件。
- 崩溃因果链。

Replay viewer 必须明确区分：

- agent 当时知道的信息。
- 赛后公开的事实。
- 仍然隐藏的裁判信息。

## 15. Arena Runner

Arena runner 负责批量比赛：

- 单 agent 长赛。
- 多 agent 同环境独立赛。
- 多 agent 共享世界赛。
- baseline 对照赛。
- 固定初始条件回归。
- 新环境泛化赛。

公平规则：

- 相同比赛配置下，agent 初始 observation 等价。
- token、latency、动作预算必须记录。
- 失败、超时、非法动作都进入结果。
- 不允许静默重试改变结果。

## 16. 数据导出

每场比赛导出：

- `match.json`：比赛配置和参赛 agent。
- `events.jsonl`：完整事件日志，内部版本可包含隐藏字段。
- `observations.jsonl`：agent 可见 observation。
- `actions.jsonl`：agent 提交动作。
- `scores.csv`：每回合评分曲线。
- `public_replay.json`：脱敏 replay。
- `audit.jsonl`：错误、作弊、超时、权限事件。

公开导出必须脱敏。内部导出只允许评测系统访问。

## 17. 错误处理

所有错误都必须显式记录：

- schema invalid。
- action over budget。
- target not visible。
- action impossible。
- stale turn。
- duplicate submission。
- rate limited。
- unauthorized field。
- judge boundary violation。
- agent timeout。

错误不能被自动转成“系统帮 agent 做一个合理动作”。这会污染评测。

## 18. 验收标准

第一版完成必须满足：

1. 能注册外部 agent。
2. 能运行至少 100 回合自然推导比赛。
3. 能输出 observation、action、event、score、replay。
4. 能跑六类 baseline agents。
5. 同一 event log 能复现同一 replay。
6. observation 不泄露 hidden state。
7. 时代跃迁由条件触发，不是固定回合数。
8. 至少存在三类可信崩溃链：饥荒、疾病、资源/生态崩溃。
9. 短期资源贪婪 baseline 在长期评分中被惩罚。
10. replay 能解释 agent 为什么失败或成功。

## 19. 测试计划

### 19.1 自然因果测试

- 过度采集会降低资源再生率。
- 人口密度和卫生条件会影响疾病传播。
- 粮食盈余会推动分工，但也增加仓储和治理压力。
- 工业化会提升产出，同时引入污染和供应链风险。

### 19.2 观测边界测试

- 未探索区域不出现在 observation。
- 未来灾害不出现在 observation。
- hidden judge 字段不出现在 public replay。
- 其他 agent 私有状态不出现在 observation。

### 19.3 回放测试

- event log replay 后公开状态一致。
- replay 不需要重新生成地图。
- correction event 能解释修复，不覆盖历史。

### 19.4 评分测试

- 纯扩张策略短期高产但长期扣分。
- 稳定低复杂策略能活得久但复杂度有限。
- 技术冲刺策略在能源和制度不足时风险升高。
- 生态稳健策略在长赛中体现优势。

### 19.5 API 测试

- 注册成功。
- observation schema 稳定。
- action schema 校验。
- stale turn 拒绝。
- 超预算拒绝。
- 重复提交拒绝。
- 越权字段拒绝。

### 19.6 反作弊测试

- agent 请求 hidden judge 被拒绝。
- action payload 注入 hidden 字段被拒绝。
- replay 伪造 hash 被拒绝。
- 高频探测错误码被 rate limit。

## 20. 实施阶段

### Phase 1：核心模拟与日志

完成：

- `WorldCore` 基础状态。
- planet/ecology/settlement/civilization/risk 五层状态。
- event log。
- observation archive。
- 单 agent 回合循环。
- 三类崩溃链。

### Phase 2：Agent API 与 baseline

完成：

- HTTP API。
- SDK 示例。
- action validation。
- 六类 baseline agents。
- arena runner。
- JSON/CSV 导出。

### Phase 3：Hidden Judge 与评分

完成：

- 多维评分。
- 公开/隐藏字段隔离。
- 作弊检测。
- 排行榜数据结构。
- 评分回归测试。

### Phase 4：Replay 与分析

完成：

- 2D 世界投影。
- 时间轴。
- 文明曲线。
- 风险曲线。
- 崩溃因果链展示。
- public replay 导出。

### Phase 5：长赛与泛化

完成：

- 多环境初始条件。
- 长赛压力测试。
- baseline 分布校准。
- agent 泛化评估。
- 公开赛季配置。

## 21. 关键设计约束

- 不能把自然推导演化偷换成固定地图生成。
- 不能用脚本事件强行让文明进入时代。
- 不能让 agent 看到上帝视角。
- 不能自动修正非法动作。
- 不能只用最终分数评价 agent。
- 不能把 replay 做成隐藏真相泄露器。
- 不能让 UI 成为模拟真相源。

## 22. 成功状态

这个项目成功时，用户应该能做到：

1. 接入一个新 agent。
2. 运行同一套自然文明生存 benchmark。
3. 看到 agent 从原始阶段自然发展或崩溃。
4. 打开 replay 复盘关键决策。
5. 查看失败因果链，而不是只看到“输了”。
6. 对比多个 agent 的长期曲线。
7. 判断哪一个 agent 真正具备长期生存能力。

