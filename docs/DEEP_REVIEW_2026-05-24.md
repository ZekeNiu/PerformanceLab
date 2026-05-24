# PerformanceLab Deep Review And Execution Brief - 2026-05-24

本文件不是普通总结，而是下一轮 Codex 对话的执行简报。新对话读完后，应能判断产品方向、当前架构问题、下一步优先级、每个待办是否完成，以及遇到新问题时应如何记录，避免每次都从头解释。

## 如何使用本文件

新对话开始后按这个顺序做：

1. 读取 `task_plan.md`、`findings.md`、`progress.md`、`docs/AI_CONTEXT.md`、`docs/ROADMAP.md`、`README.md` 和本文件。
2. 运行 `git status --short --branch`。
3. 如果用户没有指定更高优先级任务，优先执行本文档“执行路线图”中第一个状态不是 `Done` 的 `P0` 或 `P1` 任务。
4. 每次完成一个待办，更新本文档中的状态、完成日期、完成判据，并同步更新 `progress.md`。
5. 每次发现新的架构风险、产品约束、统计假设或 bug，必须写入本文档的“新增发现与决策记录”，并把简短版本写入 `findings.md`。
6. 如果新问题阻塞当前任务，先记录阻塞原因和可选方案，再决定是否调整优先级；不要只在聊天中说明。

状态定义：

- `Todo`: 未开始。
- `Doing`: 当前正在推进。
- `Done`: 已完成，并通过对应完成判据。
- `Blocked`: 被技术、产品定义或数据条件阻塞。
- `Deferred`: 暂缓，原因必须写清楚。

## 当前产品判断

PerformanceLab 的长期方向应是：强调指标展示和统计学深度，展示面可高度自由配置。

基础数据展示、纵向比较和横向比较不应长期作为互相割裂的页面、组件和数据源。它们应共享同一套指标定义、同一套测量数据、同一套图表/卡片配置。用户的主要心智模型应是：

1. 选择指标：例如 CMJ 跳跃高度、30m 冲刺、HRV RMSSD。
2. 选择展示面：卡片、折线图、柱状图、雷达图、表格等。
3. 选择主体和时间条件：运动员、队伍、分组、单个日期、日期范围或不限日期。
4. 在同一张图/同一卡片上按需添加对比数据组。
5. 查看统计解释：变化幅度、均值/最佳值、离散程度、TE、MDC、SWC、效应量、置信区间等。

“对比数据组”是给用户看的产品概念。代码里以后可以叫 `ComparisonLayerConfig`，但文档和 UI 文案应尽量避免让非工程用户理解“图层”这个抽象。

相关性分析建议保留独立页面，因为变量选择、模型诊断、共线性、残差图、相关矩阵和解释模型是探索式统计工作流，不适合强行塞进日常指标卡片。但相关性分析必须复用同一个 metric registry 和 measurement store。

## 对比数据组边界

每个指标展示面默认有 1 组主数据。用户最多额外添加 3 组对比数据，因此同屏最多显示 4 组数据。

目标、阈值、benchmark、SWC、MDC、置信区间、正常范围不算对比数据组。它们是指标展示面的统计注释或参考线，应跟随指标自动出现或由图表设置开关控制。它们不应占用“最多 3 组对比数据”的名额。

### 纵向对比

纵向对比用于回答：同一个主体在不同时间条件下是否变化。

基础条件：

- 同一运动员、队伍或分组。
- 同一指标。
- 基准时间条件：单个日期、日期范围或不限日期。
- 对比时间条件：单个日期、日期范围或不限日期。
- 聚合方式：均值或最佳值。后续可扩展为最新值、最大值、最小值、中位数。

可添加的额外对比数据组：

- 同一主体的另一个时间条件。
- 同一指标下另一个已命名训练阶段或测试批次。
- 同一主体的历史最佳或长期平均。此类可作为数据组，也可作为参考线，具体取决于视觉设计。

### 横向对比

横向对比用于回答：同一个指标和时间条件下，当前主体相对其他运动员或参照群体处于什么位置。

基础条件：

- 同一指标。
- 同一时间条件：单个日期、日期范围或不限日期。
- 聚合方式：均值或最佳值。
- 可额外添加最多 3 组对比数据。

可选对比对象：

- 真实运动员：指定单一运动员姓名或运动员 ID。
- 全局数据库参照群组：同性别均值/最佳值。
- 全局数据库参照群组：同性别 + 同专项均值/最佳值。
- 全局数据库参照群组：同性别 + 同位置均值/最佳值。
- 全局数据库参照群组：同性别 + 同年龄段均值/最佳值。
- 指定队伍参照群组：同性别均值/最佳值。
- 指定队伍参照群组：同性别 + 同位置均值/最佳值。
- 指定队伍参照群组：同性别 + 同年龄段均值/最佳值。
- 指定队伍参照群组：同性别 + 同年龄段 + 同位置均值/最佳值。

后续可扩展但先不作为首版硬需求：

- 自定义筛选群组：由用户自由组合性别、专项、位置、年龄段、队伍、赛季、状态。
- 百分位参照：P25、P50、P75、P90。
- 队内排名或全局排名。
- 伤病/可训练状态过滤。

## 架构原则

- `MetricDefinition` 是指标名称、单位、方向、类别、别名、适用上下文的唯一来源。
- `Measurement[]` 应成为展示、比较、导入和相关性分析共享的数据源。
- 图表和卡片应由可序列化配置驱动，而不是在页面组件里写死指标和统计逻辑。
- 统计计算应集中管理，并明确方法、假设、样本量、缺失值处理和是否只是 demo 近似。
- 独立 `/comparison` 页面短期可保留，但不应继续扩展成第二套比较系统。长期应复用同一套指标展示面，或降级为“比较实验室/预设视图”。

## 当前代码事实

- `src/lib/domain-model.ts` 已有第一版 Team、Athlete、TestSession、TestBattery、MetricDefinition、Measurement、Benchmark、DisplayPreset、ImportBatch 类型。
- `src/lib/metric-registry.ts` 已有第一版 canonical metric registry。
- `src/lib/import-parser.ts` 已支持真实 CSV/XLSX 解析，并能解析 registry metric id。
- `src/components/data-entry/ValidationStagingArea.tsx` 已能做运动员、指标、重复次数、异常值的 staging validation。
- `src/components/dashboard/PeriodicTesting.tsx` 已有“数据展示/纵向比较/横向比较”三种模式雏形，但仍使用本地 demo indicators。
- `src/pages/Comparison.tsx` 仍是独立比较页面，内部有另一套 demo indicators、layers、统计函数和图表配置。
- `src/pages/Correlation.tsx` 已从 metric registry 派生指标名称/类别，但数据仍来自 correlation demo generator。
- Data Entry 手动录入、Excel 导入确认、Admin 页、Dashboard 还没有统一到 `Measurement[]` store。

## 执行路线图

| ID | 优先级 | 状态 | 任务 | 完成判据 | 主要文件 |
| --- | --- | --- | --- | --- | --- |
| PL-001 | P0 | Done | 建立 mock measurement store 和 selector | 已新增统一 `Measurement[]` mock 数据；能按 metric、athlete、team/group、session/time range、aggregation 查询；本轮未改 UI | `src/lib/measurement-store.ts` |
| PL-002 | P0 | Todo | 定义指标展示面配置模型 | 有 `MetricSurfaceConfig`、`ComparisonDataGroupConfig`、时间选择、主体选择、聚合方式、统计注释开关；文档和类型能表达“最多 3 组额外对比数据” | `src/lib/domain-model.ts` 或新配置文件 |
| PL-003 | P0 | Todo | 迁移 Dashboard periodic testing 到 registry + measurement selector | `PeriodicTesting` 不再依赖本地 `DEMO_INDICATORS` 作为指标真相；display/longitudinal/cross-sectional 使用同一指标配置和数据 selector | `src/components/dashboard/PeriodicTesting.tsx`, `src/components/dashboard/data.ts` |
| PL-004 | P1 | Todo | 收敛 `/comparison` 页面 | 不再维护第二套指标/统计/图表真相；复用展示面组件或明确降级为 legacy/experimental | `src/pages/Comparison.tsx`, `src/App.tsx`, `src/components/Navbar.tsx` |
| PL-005 | P1 | Todo | 统一 Data Entry 指标来源 | `IndicatorSelector` 从 registry/test battery config 派生；手动录入和 Excel 确认输出 `Measurement[]` | `src/components/data-entry/*`, `src/data/mockData.ts` |
| PL-006 | P1 | Todo | 统计模块专业化 | TE/MDC/SWC/effect size/correlation 等集中在一个模块；输出包含 method、assumptions、sampleSize、missingDataPolicy、dataQuality | `src/lib/statistics.ts`, `src/lib/performance-statistics.ts` |
| PL-007 | P2 | Todo | 稳定 mock 数据 | Dashboard 和比较模式不再使用未 seeded 的 `Math.random()`，刷新后数据稳定 | `src/components/dashboard/data.ts`, `src/components/dashboard/PeriodicTesting.tsx` |
| PL-008 | P2 | Todo | 移动端比较视图 QA | 390px、768px、1440px 下 Dashboard 比较视图和 Comparison 页面无页面级横向溢出，关键文本不重叠 | Dashboard, Comparison, Playwright smoke |
| PL-009 | P2 | Todo | 路由级性能优化 | ECharts-heavy 页面按路由 lazy load；build 仍可通过；bundle 警告有明确处理或记录 | `src/App.tsx`, Vite build output |

如果用户没有指定任务，下一轮建议从第一个状态不是 `Done` 的 P0/P1 任务开始。当前默认下一步是 `PL-002`，因为 `PL-001` 已建立 measurement store，后续需要先定义可序列化的指标展示面配置模型，再迁移 Dashboard periodic testing。

## 已完成修复记录

| 日期 | 状态 | 内容 | 验证 |
| --- | --- | --- | --- |
| 2026-05-24 | Done | 上传第二个文件时，`ValidationStagingArea` 通过 parse-specific `key` 重新挂载，避免沿用旧校验状态 | `npm run lint`, `npm run build` |
| 2026-05-24 | Done | CSV 模板示例运动员从不存在的 `李明` 改为 `李娜 / ATH-2024-002` | `npm run lint`, `npm run build` |
| 2026-05-24 | Done | 删除重复 `body_fat` metric definition，保留其作为 `body_fat_pct` alias | `npm run lint`, `npm run build` |
| 2026-05-24 | Done | 完成 `PL-001`：新增 mock measurement store、领域 athlete/session/team 映射、稳定 mock `Measurement[]` 和 selector/summary/series 查询 API | `npm run build`, `npm run lint` |

## 高优先级问题详情

### 比较分析仍有两套实现

问题：

- `src/pages/Comparison.tsx` 和 `src/components/dashboard/PeriodicTesting.tsx` 都有自己的 demo indicators、layers、统计函数和图表配置。
- 这会造成同一指标在不同页面的名称、单位、方向、目标值和统计解释不一致。

处理原则：

- 不继续在 `Comparison.tsx` 上扩展新能力。
- 新能力优先落在 Dashboard 的指标展示面。
- 当展示面成熟后，Comparison 页面复用同一套组件。

### 指标定义仍分散

问题：

- `metric-registry.ts` 是 canonical registry。
- `dashboard/data.ts` 仍有独立 periodic/comparison 指标。
- `mockData.ts` 的 Data Entry 指标使用 `m-1` 这类局部 id。

处理原则：

- 所有进入系统的数据都应能映射到 `MetricDefinition.id`。
- test action/test battery 可以有自己的结构，但其 metrics 必须引用 registry id。

### 统计输出需要更严谨

问题：

- 当前部分统计是 demo 近似，却在 UI 中展示为专业统计结果。
- TE、MDC、SWC、Cohen's d、t-test、VIF、TreeSHAP 等不应分散实现。

处理原则：

- 先统一函数，再提高严谨性。
- 每个统计输出必须能解释“用的什么方法、适用条件是什么、样本量是多少、是否可靠”。

## 中优先级问题

- `src/components/dashboard/data.ts` 使用未 seeded 的 `Math.random()`，刷新会改变 daily data。
- `src/components/dashboard/PeriodicTesting.tsx` 添加横向运动员对比时使用 `Math.random()`，同一操作不可复现。
- `src/pages/Comparison.tsx` 和 `src/pages/Correlation.tsx` 都是超大单文件，后续需要拆分，但拆分前先统一数据模型。
- Vite build 仍有 >500 kB chunk 警告，ECharts-heavy 页面后续应 route-level lazy import。
- Import History 仍是临时前端 state + mock history，不反映真实 `ImportBatch` 和 committed measurements。
- `Measurement` 类型后续可能需要补充 test action/battery id、raw import batch id、operator、notes、quality flags、side/limb、device/equipment。
- Admin 页维护的运动员/测试批次数据与 `mockData.ts`、domain model 尚未统一。

## 新增发现与决策记录

新对话如果发现新的问题，请按这个格式追加：

```md
### YYYY-MM-DD - 简短标题

- 类型：Bug / Product Decision / Architecture / Statistics / UX / Data Model
- 发现：
- 影响：
- 决策：
- 后续任务：
- 同步到：task_plan.md / findings.md / progress.md / docs/ROADMAP.md
```

### 2026-05-24 - 目标/阈值不应算作对比数据组

- 类型：Product Decision
- 发现：上一版把 benchmark、SWC、MDC、目标区间写成“目标/阈值层”，容易让人误解它会占用用户最多 3 个对比数据组的名额。
- 影响：会混淆对比数据组和统计参考线，影响配置模型设计。
- 决策：目标、阈值、benchmark、SWC、MDC、置信区间、正常范围属于统计注释或参考线，不算对比数据组。
- 后续任务：PL-002 中用配置字段明确区分 `comparisonDataGroups` 和 `statisticalAnnotations`。
- 同步到：本文档。

### 2026-05-24 - 文档需要驱动下一步执行

- 类型：Architecture
- 发现：上一版 deep review 描述了问题，但缺少状态、完成判据和默认下一步，新对话仍需要用户指定任务。
- 影响：无法保证连续多轮对话形成闭环。
- 决策：本文档改为 execution brief，加入状态表、完成判据、默认任务选择规则和新增发现记录格式。
- 后续任务：每次完成 PL 编号任务都必须更新本文档状态。
- 同步到：本文档、`progress.md`。

## 下一次默认任务

若用户没有指定其他任务，下一次应执行：

`PL-002`: 定义指标展示面配置模型。

开始前应先确认：

- 是否已有未提交改动。
- 是否存在近期文档更新改变了优先级。
- `PL-001` 的 selector API 是否足够支撑 `MetricSurfaceConfig`、`ComparisonDataGroupConfig` 和统计注释配置。

完成后必须：

- 更新本文档中 `PL-002` 状态。
- 更新 `progress.md` 记录具体改动和验证。
- 如果发现数据模型不足，追加到“新增发现与决策记录”，并同步 `findings.md`。
- 如果改动代码，运行 `npm run build`。
