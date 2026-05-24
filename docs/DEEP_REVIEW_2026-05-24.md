# PerformanceLab Deep Review - 2026-05-24

本文件用于下一轮 Codex 对话快速恢复上下文。结论基于 2026-05-24 对当前 React/Vite 前端代码的系统检查，重点覆盖代码架构、运动表现专业性、产品设计和用户工作流。

## 当前判断

PerformanceLab 的正确长期方向是“指标优先、展示面可配置、比较作为图表层”。也就是说，基础数据展示、纵向比较和横向比较不应长期作为互相割裂的页面和数据源，而应共享同一张卡片/同一张图的 metric config、measurement source 和 comparison layers。

推荐产品模型：

- 先选择指标：例如 CMJ 跳跃高度、30m 冲刺、HRV RMSSD。
- 再选择展示面：卡片、折线、柱图、雷达、表格。
- 再打开可选比较层：
  - 纵向层：同一运动员/队伍/指标的基准期 vs 对比期。
  - 横向层：同一指标/时间窗下的运动员、位置、分组或队伍对比。
  - 目标/阈值层：benchmark、SWC、MDC、目标区间。
- 相关性分析保留独立页面，但必须复用同一个 metric registry 和 measurement store。

## 本轮已修复

- `src/components/data-entry/ValidationStagingArea.tsx`
  - 问题：上传第二个文件时，组件内部 `items` 只在首次挂载初始化，新的 `parsedRows` 不会重新校验，用户可能看到旧文件的校验表。
  - 修复：抽出 `validateParsedRows`，并由 `ExcelImportTab` 为每次解析结果提供 parse-specific `key`，让校验区随新文件重新挂载并初始化。

- `src/components/data-entry/UploadZone.tsx`
  - 问题：下载模板的第二行示例运动员是 `李明`，但当前 mock athlete 表中不存在该运动员，模板本身会制造“未知姓名”错误。
  - 修复：改为已存在的 `李娜 / ATH-2024-002`。

- `src/lib/metric-registry.ts` 与 `src/lib/correlation-data.ts`
  - 问题：`body_fat_pct` 与 `body_fat` 表示同一体脂率指标；`body_fat` 又是 `body_fat_pct` 的别名，后定义项会覆盖别名索引，导致导入 `body_fat` 时解析到非 canonical 指标。
  - 修复：删除重复 `body_fat` 指标定义，保留 `body_fat` 作为 `body_fat_pct` 的别名；移除相关性 demo data 中未注册的 `body_fat` 值。

## 高优先级问题

### 1. 比较分析仍有两套实现

- 独立页面：`src/pages/Comparison.tsx`
- Dashboard 内比较层雏形：`src/components/dashboard/PeriodicTesting.tsx`
- 两者都维护各自的 demo indicators、layers、统计方法和图表配置。

风险：

- 同一指标在不同页面可能名字、单位、方向、目标值不一致。
- 后续接入真实数据时会出现双倍迁移工作。
- 用户心智会被“独立比较页”和“数据展示内比较模式”拆开。

建议：

- 把 `/comparison` 视为临时实验室或历史兼容入口，不继续在它上面扩功能。
- 新架构优先落在 Dashboard 的指标展示面：`MetricDisplaySurface + ComparisonLayerConfig`。
- 当 dashboard 比较层成熟后，`Comparison.tsx` 可以改为跳转/包装同一套组件，或重命名为“比较实验室”。

### 2. 指标定义仍分散

目前至少有三处指标体系：

- `src/lib/metric-registry.ts`: 新增的 canonical metric registry。
- `src/components/dashboard/data.ts`: Dashboard daily/periodic/comparison demo data。
- `src/data/mockData.ts`: Data Entry 的 action/category/metric mock tree，指标 id 是 `m-1` 这类局部 id。

风险：

- 手动录入选择的指标不是 registry metric id，无法自然落成 `Measurement.metricId`。
- Excel 导入可以解析出 registry metric id，但确认入库后仍只是前端 import history，不进入统一 measurement store。
- Dashboard 的卡片配置无法可靠知道“这个卡片可显示哪些兼容指标”。

建议：

- 下一步新增 `src/lib/mock-measurements.ts` 或 `src/lib/measurement-store.ts`，用 `Measurement[]` 表示当前 mock 数据。
- Dashboard、手动录入、Excel staging 都逐步转成读写 `Measurement.metricId`。
- `mockActionCategories` 改为从 registry + test action/battery config 派生，而不是维护独立指标 id。

### 3. 统计逻辑重复且专业解释不足

当前统计逻辑分布在：

- `src/components/dashboard/data.ts`
- `src/pages/Comparison.tsx`
- `src/lib/statistics.ts`

主要风险：

- TE/MDC/SWC、Cohen's d、t-test 等实现有重复版本。
- 部分统计是 demo 近似：例如 TE 固定乘以 `0.35`，paired t-test 没有真实配对差值 SD，VIF 当前只近似使用第一个其他变量。
- UI 中展示 p 值、显著性、TreeSHAP、随机森林等高级术语，但当前实现更接近演示，不应被用户误认为严谨分析结果。

建议：

- 建立 `src/lib/performance-statistics.ts`，统一导出 dashboard/comparison 需要的统计函数。
- 每个统计输出加 `method`, `assumptions`, `dataQuality` 字段。
- 在 UI 中区分“演示数据/近似统计”和“可用于报告的统计”。

### 4. 数据展示卡片还不是可配置 surface

现状：

- `DailyMonitoring.tsx` 固定展示 HRV、RHR、ACWR、load 等。
- `PeriodicTesting.tsx` 固定展示 periodic categories 和 demo comparison indicators。
- `DashboardCard` 只有很轻的 `configOptions`，没有真正的 metric/visualization/time range/subject config。

建议的数据结构：

```ts
interface MetricSurfaceConfig {
  id: string
  title: string
  metricId: string
  visualization: 'summary-card' | 'line' | 'bar' | 'radar' | 'table'
  subjectScope: 'athlete' | 'group' | 'team'
  timeRange: { mode: 'latest' | 'range' | 'session'; value?: string }
  aggregation: 'latest' | 'mean' | 'best' | 'min' | 'max'
  layers: ComparisonLayerConfig[]
}

interface ComparisonLayerConfig {
  id: string
  type: 'longitudinal' | 'cross-sectional' | 'benchmark'
  enabled: boolean
  label: string
  subjectSelector?: unknown
  timeRange?: unknown
  benchmarkId?: string
}
```

### 5. 路由和导航需要跟产品方向对齐

`src/App.tsx` 仍有 `/comparison` 独立路由，`Navbar.tsx` 仍把 Comparison 作为一等导航项。短期可保留，但长期不应和 Dashboard 内的比较层并行扩展。

建议：

- 第一阶段：保留 Comparison，但在文档中标记为 legacy/experimental。
- 第二阶段：导航主入口聚焦 Dashboard、Correlation、Data Entry、Admin、Settings。
- 第三阶段：Comparison 页面改用同一套 metric surface 组件，只预置“比较视图”。

## 中优先级问题

- `src/components/dashboard/data.ts` 使用 `Math.random()` 生成 daily data，页面刷新会改变 mock 数据，不利于回归测试和截图对比。建议改成 seeded random。
- `src/components/dashboard/PeriodicTesting.tsx` 添加横向比较运动员层时也使用 `Math.random()`，同一操作不可复现。建议用 athlete id + metric id 派生固定 mock 值。
- `src/pages/Comparison.tsx` 是超大单文件，混合数据、统计、图表和 UI，后续维护成本高。建议不在该文件继续堆功能。
- `src/pages/Correlation.tsx` 也是超大单文件。相关性探索本身可保留独立，但变量选择、模型摘要、图表、诊断面板应该拆分。
- Vite build 仍有 >500 kB bundle 警告。ECharts、xlsx、页面级大组件都应继续动态加载；下一步可 route-level lazy import。
- Data Entry 的手动保存目前只是 toast 和本地 state reset，没有进入统一 store，也没有保存草稿实体。
- Import History 是前端临时 state + mock history，不反映真实 staged/committed measurements。
- `Measurement` 类型缺少一些未来会需要的字段：test action/battery id、raw import batch id、operator、notes、quality flags、side/limb、device/equipment。
- `DisplayPreset` 目前只有 `metricIds` 和 `comparisonMode`，不足以表达卡片配置和多层比较。
- 导入模板包含 `测试批次`、`动作分类`，但 parser 当前只使用姓名、日期、测试动作、测试指标、单位、重复值。后续需要把测试批次映射到 `TestSession`。
- Admin 页维护的运动员/测试批次数据与 `mockData.ts`、domain model 未统一。
- 部分移动端布局仍需复查：Comparison 页面存在固定 `grid-cols-2`、宽表格和高密度控件；Dashboard 比较模式的控制栏也需要移动端 wrap/scroll 策略。

## 建议实施顺序

1. 新增 mock measurement store
   - 从现有 dashboard periodic demo 和 import parsed rows 生成统一 `Measurement[]`。
   - 提供 selector：按 metric、athlete、session、time range 聚合。

2. 新增 metric surface config
   - 先做一个 periodic metric card/table/chart 的配置对象。
   - 让同一张图支持 `layers: []`、纵向 layer、横向 layer。

3. 迁移 Dashboard periodic testing
   - 保留现有视觉外观。
   - 数据来源改成 registry + measurement selectors。
   - 让 `display/longitudinal/cross-sectional` 只是同一 surface 的 layer preset。

4. 收敛 Comparison 页面
   - 删除页面内 demo data 和重复统计函数。
   - 复用 Dashboard 的 surface 或成为预设视图。

5. 迁移 Data Entry
   - `IndicatorSelector` 从 registry/test battery config 派生。
   - 手动录入和 Excel 导入都输出 `Measurement[]`。
   - Import History 关联 `ImportBatch`。

6. 统计专业化
   - 把 TE/MDC/SWC/effect size/correlation 统一到一个统计模块。
   - 给每个输出补充假设、样本量、缺失值策略和解释文案。

7. 性能与 QA
   - route-level lazy imports。
   - seeded mock data。
   - 添加核心 smoke：dashboard periodic display + longitudinal + cross-sectional，data-entry upload，correlation render。

## 下一轮推荐任务

如果下一轮继续编码，建议选择以下之一：

- 任务 A：建立 `mock-measurement-store` 和 selector，不改 UI，只把 canonical 数据源铺好。
- 任务 B：把 `PeriodicTesting` 的 comparison indicators 从 `DEMO_INDICATORS` 迁移到 registry-derived config。
- 任务 C：修移动端比较视图布局，并用 Playwright 做 390px/768px/1440px 截图检查。
- 任务 D：拆出 `performance-statistics.ts`，先消除 dashboard 与 Comparison 的统计重复。

本轮已选择低风险 bug 修复，没有开始大规模架构迁移。
