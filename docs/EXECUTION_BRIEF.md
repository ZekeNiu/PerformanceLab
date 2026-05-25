# PerformanceLab Execution Brief

本文件不是普通总结，而是下一轮 Codex 对话的执行简报。新对话读完后，应能判断产品方向、当前架构问题、下一步优先级、每个待办是否完成，以及遇到新问题时应如何记录，避免每次都从头解释。

## 如何使用本文件

新对话开始后按这个顺序做：

1. 读取 `task_plan.md`、`findings.md`、`progress.md`、`docs/AI_CONTEXT.md`、`docs/ROADMAP.md`、`README.md` 和本文件。
2. 运行 `git status --short --branch`。
3. 如果用户没有指定更高优先级任务，优先执行本文档“执行路线图”中第一个状态不是 `Done` 的 `P0` 或 `P1` 任务。
4. 每次工作、改动、验证、错误、提交和推送都先写入 `progress.md`，确保它是唯一完整时间线日志。
5. 长期有效的发现可以从 `progress.md` 或代码审查中提炼到 `findings.md`，但不能替代 `progress.md` 的完整记录。
6. 每次完成一个 PL 编号待办，更新本文档“执行路线图”的状态、完成判据和“下一次默认任务”，并在 `progress.md` 记录具体工作。
7. 只有当新信息会改变下一次对话的执行方向、任务优先级、完成判据、默认下一步或关键产品/架构约束时，才更新本文档。
8. 如果本文档的默认下一步、PL 状态或关键产品/架构约束变化，同步更新 `docs/NEXT_CHAT_PROMPT.md` 的“当前重要状态”。
9. 如果新问题阻塞当前任务，先在 `progress.md` 记录阻塞原因和可选方案；只有它改变路线图或默认下一步时，才同步更新本文档。

文档职责边界：

- `progress.md`: 唯一完整工作日志，记录每轮实际发生的工作、验证、错误、提交和推送。
- `findings.md`: 长期有效发现的提炼版，不作为完整日志。
- `docs/EXECUTION_BRIEF.md`: 权威执行状态源，维护路线图、默认下一步、完成判据和关键约束，不记录普通过程日志。
- `docs/NEXT_CHAT_PROMPT.md`: 新对话启动入口；其中“当前重要状态”只是无法读取本地文件时的最小启动摘要。

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
- 第一阶段权威数据源应是用户可见的本地 `performancelab.workspace.json` 文件。File System Access API 可用于桌面 Chromium 浏览器的直接读写；清理浏览器缓存后权限可能丢失，但 JSON 文件不应丢失，用户重新选择同一文件即可恢复。
- IndexedDB/localStorage 不应作为核心数据的权威存储。它们只能用于主题、短期 UI 状态、最近文件提示等非核心信息；不支持 File System Access API 的浏览器必须走手动导入/导出 JSON 降级流程。
- 图表和卡片应由可序列化配置驱动，而不是在页面组件里写死指标和统计逻辑。
- 统计计算应集中管理，并明确方法、假设、样本量、缺失值处理和是否只是 demo 近似。
- 独立 `/comparison` 页面短期可保留，但不应继续扩展成第二套比较系统。长期应复用同一套指标展示面，或降级为“比较实验室/预设视图”。

## 当前代码事实

- `src/lib/domain-model.ts` 已有第一版 Team、Athlete、TestSession、TestBattery、MetricDefinition、Measurement、Benchmark、DisplayPreset、ImportBatch 类型。
- `src/lib/metric-registry.ts` 已有第一版 canonical metric registry。
- `src/lib/import-parser.ts` 已支持真实 CSV/XLSX 解析，并能解析 registry metric id。
- `src/components/data-entry/ValidationStagingArea.tsx` 已能做运动员、指标、重复次数、异常值的 staging validation。
- `src/components/dashboard/PeriodicTesting.tsx` 已迁移为 registry + measurement selector 驱动：数据展示、纵向比较、横向比较共用 registry 指标、`MetricSurfaceConfig` 和 measurement selector；当前已通过 `src/lib/workspace-measurement-store.ts` 从活动 workspace 派生读取数据。
- `src/pages/Comparison.tsx` 已收敛为 `/comparison` 路由壳，纵向/横向比较复用 `PeriodicTesting` 的 registry + `MetricSurfaceConfig` + measurement selector 展示面，不再维护第二套 demo indicators、layers、统计函数和图表配置。
- `src/pages/Correlation.tsx` 已从 metric registry 派生指标名称/类别，并已开始消费 `src/lib/performance-statistics.ts` 的相关性统计输出；数据仍来自 correlation demo generator。
- `src/lib/measurement-store.ts` 已建立第一版共享 mock `Measurement[]` store 和 selector。Data Entry 手动录入和 Excel 导入确认已能生成 `Measurement[]` 并在 PL-010 中写入本地 JSON workspace；Dashboard periodic testing 和 `/comparison` 已开始读取活动 workspace；Admin 定义库已开始写入 workspace 定义配置；其他 Dashboard 区块还没有迁移为 workspace/selector 消费者。
- `src/lib/workspace-file.ts`、`src/lib/workspace-store.tsx`、`src/lib/workspace-measurement-store.ts` 和 `src/components/WorkspaceFileBar.tsx` 已建立第一版本地 `performancelab.workspace.json` 文件层和到 measurement selector 的读取 adapter。它支持 File System Access API 的创建、打开、保存、另存为，以及不支持浏览器的 JSON 导入/导出降级；Settings 的外观偏好、人体图、显示阈值、通知规则、系统统计和导出入口已接入活动 workspace；Admin 定义库新增/编辑/删除指标已写入 `metricDefinitions`、`testActionCategories`、`testActions`，Data Entry 指标选择和导入解析会优先读取活动 workspace 定义。当前仍需补剩余核心页面读取路径和清缓存后重连恢复验证。
- `src/lib/domain-model.ts` 已扩展 `MetricDefinition`、`Measurement`、`TestAction`、`TestBattery`、`SessionBatteryAssignment`、`DerivedMetricDefinition` 等字段，为测试内容、批次、维度、质量标记和衍生指标做准备；`src/lib/derived-metric-formulas.ts` 已有公式 registry 雏形，但尚未接入 measurement query 和 UI。
- `src/lib/metric-surface-config.ts` 已建立第一版可序列化指标展示面配置模型，包含主数据组、最多 3 组额外对比数据组、时间/主体选择、聚合方式、横向参照群组和统计注释配置。
- `src/lib/performance-statistics.ts` 已建立第一版专业统计边界，集中 summary comparison、TE、MDC、SWC、SNR、Cohen's d、summary-level p-value、Pearson/Spearman correlation、CI、样本量、缺失值策略和数据质量 metadata。Dashboard periodic comparison 和 `/correlation` 的主统计表已开始消费该边界。

## 执行路线图

| ID | 优先级 | 状态 | 任务 | 完成判据 | 主要文件 |
| --- | --- | --- | --- | --- | --- |
| PL-001 | P0 | Done | 建立 mock measurement store 和 selector | 已新增统一 `Measurement[]` mock 数据；能按 metric、athlete、team、position、session/time range、source、aggregation 查询；本轮未改 UI。性别、年龄段、专项和复杂参照群组筛选尚未实现，应在 PL-002/PL-003 设计中处理 | `src/lib/measurement-store.ts` |
| PL-002 | P0 | Done | 定义指标展示面配置模型 | 已新增 `MetricSurfaceConfig`、`ComparisonDataGroupConfig`、`TimeSelection`、`SubjectSelector`、`ReferenceGroupSelector`、聚合方式和 `StatisticalAnnotationConfig`；`UpToThree` 与 `MAX_COMPARISON_DATA_GROUPS` 表达“最多 3 组额外对比数据”；`docs/METRIC_SURFACE_CONFIG.md` 记录产品边界。本轮未迁移 UI | `src/lib/metric-surface-config.ts`, `docs/METRIC_SURFACE_CONFIG.md` |
| PL-003 | P0 | Done | 迁移 Dashboard periodic testing 到 registry + measurement selector | `PeriodicTesting` 不再依赖本地 `DEMO_INDICATORS` 作为指标真相；display/longitudinal/cross-sectional 使用 registry 指标、`MetricSurfaceConfig`、`metric-surface-measurements` adapter 和 shared measurement selector；横向运动员对比不再用 `Math.random()` | `src/components/dashboard/PeriodicTesting.tsx`, `src/lib/metric-surface-measurements.ts` |
| PL-004 | P1 | Done | 收敛 `/comparison` 页面 | `src/pages/Comparison.tsx` 已替换为复用 `PeriodicTesting` 的路由壳；纵向/横向比较共用 Dashboard periodic testing 的 metric registry、metric surface config、measurement selector、统计和图表路径；不再维护第二套页面本地指标/统计/图表真相 | `src/pages/Comparison.tsx`, `src/components/dashboard/PeriodicTesting.tsx` |
| PL-005 | P1 | Done | 统一 Data Entry 指标来源 | `IndicatorSelector` 已从 registry-backed test battery config 派生，不再消费本地 `m-*` 指标；手动录入保存和 Excel 暂存确认都会生成 domain-model `Measurement[]`；持久化已在 PL-010 开始接入本地 JSON workspace | `src/components/data-entry/*`, `src/lib/data-entry-config.ts`, `src/lib/data-entry-measurements.ts`, `src/lib/metric-registry.ts` |
| PL-006 | P1 | Done | 统计模块专业化 | 已新增 `src/lib/performance-statistics.ts`，集中 summary comparison、TE、MDC、SWC、SNR、effect size、summary-level p-value 和 correlation 输出；结果包含 method、assumptions、sampleSize、missingDataPolicy、dataQuality。Dashboard periodic comparison 和 `/correlation` 主统计表已迁移到该边界；仍需后续用真实 paired/reliability 原始数据替换 summary-level 近似 | `src/lib/statistics.ts`, `src/lib/performance-statistics.ts`, `src/components/dashboard/PeriodicTesting.tsx`, `src/pages/Correlation.tsx` |
| PL-010 | P0 | Doing | 本地 JSON 工作区文件持久化 | 已建立 `performancelab.workspace.json` 文件层、全局工作区文件栏、创建/打开/保存/另存为/导入/导出入口；Data Entry 手动保存、Excel 导入确认、Settings 外观偏好/人体图/显示阈值/通知规则/系统统计/导出入口已写入或读取 workspace；Dashboard periodic testing 和 `/comparison` 已通过 workspace adapter 读取活动 JSON 中的测量数据；Admin 定义库新增/编辑/删除指标会写入 workspace 的 `metricDefinitions`、`testActionCategories`、`testActions`，Data Entry 指标选择和导入解析会优先消费这些 workspace 定义。完成前还需补其他核心页面读取路径，并验证清缓存后重新打开同一 JSON 能恢复核心数据 | `src/lib/workspace-file.ts`, `src/lib/workspace-store.tsx`, `src/lib/workspace-measurement-store.ts`, `src/lib/workspace-definition-config.ts`, `src/components/WorkspaceFileBar.tsx`, `src/components/dashboard/PeriodicTesting.tsx`, `src/pages/DataEntry.tsx`, `src/pages/Settings.tsx`, `src/pages/Admin.tsx` |
| PL-011 | P0 | Todo | 测试内容、测试批次与 availability matrix | 建立 `TestAction`、`TestBattery`、`SessionBatteryAssignment` 的真实使用路径；横向比较默认只比较共同可用指标，表格可展示全集并标记 missing/partial/incompatible；同一批次、同一备赛阶段、不同测试内容的边界规则写入 selector 和 UI | `src/lib/domain-model.ts`, `src/lib/workspace-file.ts`, measurement selector, Dashboard periodic testing |
| PL-012 | P0 | Todo | 衍生指标公式 registry | 公式 registry 能从 raw measurements 计算 derived metrics，首版覆盖不对称性、比值、相对体重、差值、均值；衍生指标有依赖指标、维度标签、质量标记和缺失数据处理说明；UI 不要求用户手写公式即可展示常见衍生指标 | `src/lib/derived-metric-formulas.ts`, `src/lib/domain-model.ts`, measurement store/query adapter |
| PL-013 | P1 | Todo | Dashboard 全局筛选和卡片切换实装 | 顶部日期、运动员、测试批次筛选实际驱动 measurement query；所有可切换卡片改为真实 metric/display config，不再只是菜单高亮；雷达图少于 3 个可用维度时自动降级为柱状图、折线图或表格 | `src/components/dashboard/*`, `src/lib/metric-surface-config.ts`, `src/lib/metric-surface-measurements.ts` |
| PL-014 | P1 | Todo | 日常监控 UI 重构 | 人体图隐藏绿色正常点；右侧改为损伤历史趋势图并按严重程度着色；人体图下方卡片重新组织为更专业、密度合理、与真实指标选择兼容的布局 | `src/components/dashboard/DailyMonitoring.tsx`, `src/components/dashboard/data.ts` |
| PL-015 | P1 | Todo | 定期测试 UI 与异常预警重构 | 定期测试改为更专业的左图右表结构；异常值标红并显示原因；纵向比较支持基准组 + 最多 3 个对比时间组；横向参考群体补全并避免均值/最佳值语义混乱 | `src/components/dashboard/PeriodicTesting.tsx`, `src/lib/performance-statistics.ts`, `src/lib/metric-surface-measurements.ts` |
| PL-016 | P1 | Todo | Admin 定义库与高级 Settings 持久化 | Admin 支持新增动作分类、测试动作和指标定义，并与 Data Entry 共享同一 workspace 配置源；Settings 后续如新增自定义通知分组、更多用户配置或显示预设，也应写入 JSON 文件而不是只存在浏览器状态或 alert | `src/pages/Admin.tsx`, `src/pages/Settings.tsx`, `src/lib/workspace-store.tsx` |
| PL-007 | P2 | Todo | 稳定 mock 数据 | Dashboard daily data 和 correlation demo 数据不再使用未 seeded 的 `Math.random()`，刷新后数据稳定；`PeriodicTesting` 横向运动员对比已在 PL-003 中改为 measurement selector 汇总，`/comparison` 已在 PL-004 中复用该路径 | `src/components/dashboard/data.ts`, `src/pages/Correlation.tsx` |
| PL-008 | P2 | Todo | 移动端比较视图 QA | 390px、768px、1440px 下 Dashboard 比较视图和 Comparison 页面无页面级横向溢出，关键文本不重叠 | Dashboard, Comparison, Playwright smoke |
| PL-009 | P2 | Todo | 路由级性能优化 | ECharts-heavy 页面按路由 lazy load；build 仍可通过；bundle 警告有明确处理或记录 | `src/App.tsx`, Vite build output |

如果用户没有指定任务，下一轮建议从第一个状态不是 `Done` 的 P0/P1 任务开始；当前默认继续 `PL-010`。本轮已完成本地 JSON workspace 的基础文件层、全局文件栏、Data Entry 写入、Settings 主要配置读写、Dashboard periodic testing/`/comparison` 对活动 workspace 测量数据的读取，以及 Admin 定义库到 Data Entry 定义消费路径，但还不能把 PL-010 判定为 `Done`，因为其他核心页面读取路径和清缓存后重连恢复验证仍未完成。

## 高优先级问题详情

### 指标定义仍分散

问题：

- `metric-registry.ts` 是 canonical registry。
- `dashboard/data.ts` 仍有 daily monitoring 及部分统计/helper mock 数据。
- Data Entry 已不再消费 `mockData.ts` 中的 `m-*` 指标；手动指标选择和导入解析会优先使用活动 workspace 定义。`mockData.ts` 中的旧结构仍保留给尚未迁移的 mock 页面上下文。

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
- `src/components/dashboard/PeriodicTesting.tsx` 横向运动员对比已不再使用 `Math.random()`；剩余随机性主要在 daily data 和 legacy analysis demo 数据中。
- `src/pages/Correlation.tsx` 仍是超大单文件，后续需要拆分，但拆分前先统一数据模型。
- Vite build 仍有 >500 kB chunk 警告，ECharts-heavy 页面后续应 route-level lazy import。
- Import History 在 Excel 导入确认时已生成 `ImportBatch` 并写入 workspace；历史列表 UI 仍主要显示当前页面会话的新导入，尚未完整读取 workspace 历史。
- `Measurement` 类型已经补充 test action/battery id、raw import batch id、operator、notes、quality flags、dimensions、device/equipment；后续重点是让写入路径和查询路径实际填充并消费这些字段。
- Admin 页维护的运动员/测试批次数据与 `mockData.ts`、domain model 尚未统一；定义库已开始写入 workspace，但还不是完整的测试电池/availability matrix 管理界面。

## 下一次默认任务

若用户没有指定其他任务，下一次应执行：

`PL-010`: 本地 JSON 工作区文件持久化。

开始前应先确认：

- 是否已有未提交改动。
- 是否存在近期文档更新改变了优先级。
- Dashboard 其他区块、Admin 运动员/测试批次、导入历史和 selector 哪些路径仍只读 mock/local state，而不是 workspace。
- File System Access API 的创建、打开、保存、另存为、导入/导出降级是否在当前浏览器可用；清缓存后重新打开同一 JSON 文件是否能恢复核心数据。
- PL-010 完成前不要把 IndexedDB/localStorage 作为核心数据权威源；localStorage 只能保留主题、UI 偏好或最近提示一类非核心状态。
- 如果发现 PL-010 范围继续扩大，应先把 Admin、Dashboard、Settings 的子问题拆给 PL-011/PL-013/PL-016，而不是在一个组件里硬接所有逻辑。

完成后必须：

- 更新本文档中 `PL-010` 状态。
- 更新 `progress.md` 记录具体改动和验证。
- 如果发现数据模型不足，先记录到 `progress.md`；若该发现长期有效，补充到 `findings.md`；只有当它改变路线图、完成判据或默认下一步时，才同步更新本文档。
- 如果改动代码，运行 `npm run build`。
