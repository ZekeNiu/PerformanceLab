import type { MetricDefinition, TestAction } from './domain-model'
import { resolveMetricDefinition } from './metric-registry'
import type { PerformanceLabWorkspace, TestActionCategory } from './workspace-file'

export interface WorkspaceDefinitionAction extends TestAction {
  categoryName: string
}

export interface WorkspaceDefinitionCategory extends TestActionCategory {
  actions: WorkspaceDefinitionAction[]
}

function normalizeLookupKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()锛堬級_-]/g, '')
}

function actionMatches(action: TestAction, actionName: string) {
  const actionKey = normalizeLookupKey(actionName)
  const nameKey = normalizeLookupKey(action.name)
  return Boolean(actionKey) && (nameKey.includes(actionKey) || actionKey.includes(nameKey))
}

function metricMatches(metric: MetricDefinition, indicator: string) {
  const indicatorKey = normalizeLookupKey(indicator)
  if (!indicatorKey) return false
  const keys = [
    metric.id,
    metric.name,
    metric.shortName ?? '',
    ...(metric.aliases ?? []),
  ].map(normalizeLookupKey)
  return keys.includes(indicatorKey)
}

export function buildWorkspaceDefinitionCategories(
  workspace: PerformanceLabWorkspace,
): WorkspaceDefinitionCategory[] {
  const actionsByCategoryId = new Map<string, TestAction[]>()
  workspace.testActions.forEach((action) => {
    const actions = actionsByCategoryId.get(action.categoryId) ?? []
    actions.push(action)
    actionsByCategoryId.set(action.categoryId, actions)
  })

  return workspace.testActionCategories.map((category) => ({
    ...category,
    actions: (actionsByCategoryId.get(category.id) ?? []).map((action) => ({
      ...action,
      categoryName: category.name,
    })),
  }))
}

export function getWorkspaceActionMetrics(
  action: TestAction,
  metricDefinitions: MetricDefinition[],
): MetricDefinition[] {
  const metricsById = new Map(metricDefinitions.map((metric) => [metric.id, metric]))
  return action.metricIds
    .map((metricId) => metricsById.get(metricId) ?? resolveMetricDefinition(metricId))
    .filter((metric): metric is MetricDefinition => Boolean(metric))
}

export function resolveWorkspaceMetric(
  workspace: PerformanceLabWorkspace,
  actionName: string,
  indicator: string,
): MetricDefinition | undefined {
  const matchedActions = workspace.testActions.filter((action) => actionMatches(action, actionName))

  for (const action of matchedActions) {
    const metric = getWorkspaceActionMetrics(action, workspace.metricDefinitions).find((candidate) =>
      metricMatches(candidate, indicator),
    )
    if (metric) return metric
  }

  return workspace.metricDefinitions.find((metric) => metricMatches(metric, indicator)) ?? resolveMetricDefinition(indicator)
}
