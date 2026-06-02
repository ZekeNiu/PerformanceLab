import type {
  DerivedMetricDefinition,
  DerivedMetricFormulaId,
  DerivedMetricInputSpec,
  Measurement,
  MeasurementDimensions,
  MetricDefinition,
} from './domain-model'

export interface DerivedMetricFormulaInput {
  measurements: Measurement[]
  parameters?: Record<string, string | number | boolean>
}

export interface DerivedMetricFormula {
  id: DerivedMetricFormulaId
  name: string
  description: string
  minInputs: number
  compute: (input: DerivedMetricFormulaInput) => number | null
}

export interface DerivedMetricComputationReport {
  definitionId: string
  metricId: string
  formulaId: DerivedMetricFormulaId
  generatedCount: number
  skippedCount: number
  missingInputCount: number
  missingDataPolicy: NonNullable<DerivedMetricDefinition['missingDataPolicy']>
  dependencyMetricIds: string[]
}

export interface DerivedMetricComputationResult {
  measurements: Measurement[]
  reports: DerivedMetricComputationReport[]
}

interface MeasurementKeyParts {
  athleteId: string
  sessionId: string
  measuredAt: string
  trialIndex: string
}

const DEFAULT_MISSING_DATA_POLICY: NonNullable<DerivedMetricDefinition['missingDataPolicy']> = 'require_all_inputs'

export const DEFAULT_DERIVED_METRIC_DEFINITIONS: DerivedMetricDefinition[] = [
  {
    id: 'derived-squat-relative-strength',
    metricId: 'squat_relative_strength',
    formulaId: 'relative_to_bodyweight',
    inputMetricIds: ['squat_1rm', 'weight'],
    inputMetrics: [
      { metricId: 'squat_1rm', role: 'load', required: true },
      { metricId: 'weight', role: 'bodyweight', required: true },
    ],
    missingDataPolicy: 'require_all_inputs',
    description: 'Squat 1RM divided by bodyweight measured for the same athlete and test condition.',
  },
  {
    id: 'derived-bench-relative-strength',
    metricId: 'bench_relative_strength',
    formulaId: 'relative_to_bodyweight',
    inputMetricIds: ['bench_1rm', 'weight'],
    inputMetrics: [
      { metricId: 'bench_1rm', role: 'load', required: true },
      { metricId: 'weight', role: 'bodyweight', required: true },
    ],
    missingDataPolicy: 'require_all_inputs',
    description: 'Bench press 1RM divided by bodyweight measured for the same athlete and test condition.',
  },
  {
    id: 'derived-bmi',
    metricId: 'bmi',
    formulaId: 'ratio',
    inputMetricIds: ['weight', 'height'],
    inputMetrics: [
      { metricId: 'weight', role: 'bodyweight', required: true },
      { metricId: 'height', role: 'stature', required: true },
    ],
    parameters: { denominatorPower: 2, denominatorScale: 0.01 },
    missingDataPolicy: 'require_all_inputs',
    description: 'Body mass divided by height squared. Height is converted from centimeters to meters.',
  },
]

function numericValues(measurements: Measurement[]) {
  return measurements.map((measurement) => measurement.value).filter((value) => Number.isFinite(value))
}

export const DERIVED_METRIC_FORMULAS: Record<DerivedMetricFormulaId, DerivedMetricFormula> = {
  asymmetry: {
    id: 'asymmetry',
    name: 'Asymmetry',
    description: 'Computes side-to-side asymmetry as absolute difference divided by the larger value.',
    minInputs: 2,
    compute: ({ measurements }) => {
      const values = numericValues(measurements).slice(0, 2)
      if (values.length < 2) return null
      const denominator = Math.max(Math.abs(values[0]), Math.abs(values[1]))
      if (!denominator) return null
      return (Math.abs(values[0] - values[1]) / denominator) * 100
    },
  },
  ratio: {
    id: 'ratio',
    name: 'Ratio',
    description: 'Computes first input divided by second input.',
    minInputs: 2,
    compute: ({ measurements, parameters }) => {
      const values = numericValues(measurements).slice(0, 2)
      if (values.length < 2) return null
      const denominatorScale = typeof parameters?.denominatorScale === 'number' ? parameters.denominatorScale : 1
      const denominatorPower = typeof parameters?.denominatorPower === 'number' ? parameters.denominatorPower : 1
      const denominator = (values[1] * denominatorScale) ** denominatorPower
      if (!denominator) return null
      return values[0] / denominator
    },
  },
  relative_to_bodyweight: {
    id: 'relative_to_bodyweight',
    name: 'Relative to bodyweight',
    description: 'Computes first input divided by bodyweight input.',
    minInputs: 2,
    compute: ({ measurements }) => {
      const values = numericValues(measurements).slice(0, 2)
      if (values.length < 2 || values[1] === 0) return null
      return values[0] / values[1]
    },
  },
  difference: {
    id: 'difference',
    name: 'Difference',
    description: 'Computes first input minus second input.',
    minInputs: 2,
    compute: ({ measurements }) => {
      const values = numericValues(measurements).slice(0, 2)
      if (values.length < 2) return null
      return values[0] - values[1]
    },
  },
  mean: {
    id: 'mean',
    name: 'Mean',
    description: 'Computes the arithmetic mean of all available inputs.',
    minInputs: 1,
    compute: ({ measurements }) => {
      const values = numericValues(measurements)
      if (!values.length) return null
      return values.reduce((total, value) => total + value, 0) / values.length
    },
  },
}

export function getDerivedMetricFormula(id: DerivedMetricFormulaId): DerivedMetricFormula {
  return DERIVED_METRIC_FORMULAS[id]
}

function normalizeInputSpecs(definition: DerivedMetricDefinition): DerivedMetricInputSpec[] {
  if (definition.inputMetrics?.length) return definition.inputMetrics
  return definition.inputMetricIds.map((metricId) => ({ metricId, required: true }))
}

function dimensionMatches(measurement: Measurement, dimensions?: MeasurementDimensions): boolean {
  if (!dimensions) return true
  return Object.entries(dimensions).every(([key, value]) => measurement.dimensions?.[key] === value)
}

function keyFromMeasurement(measurement: Measurement): string {
  return [
    measurement.athleteId,
    measurement.sessionId ?? 'no-session',
    measurement.measuredAt,
    measurement.trialIndex == null ? 'no-trial' : String(measurement.trialIndex),
  ].join('|')
}

function parseMeasurementKey(key: string): MeasurementKeyParts {
  const [athleteId, sessionId, measuredAt, trialIndex] = key.split('|')
  return { athleteId, sessionId, measuredAt, trialIndex }
}

function measuredTargetKey(measurement: Measurement): string {
  return `${measurement.metricId}|${keyFromMeasurement(measurement)}`
}

function pickInputMeasurement(
  measurements: Measurement[],
  spec: DerivedMetricInputSpec,
  key: string,
): Measurement | undefined {
  return measurements
    .filter((measurement) => measurement.metricId === spec.metricId)
    .filter((measurement) => keyFromMeasurement(measurement) === key)
    .filter((measurement) => dimensionMatches(measurement, spec.dimensions))
    .sort((a, b) => (a.trialIndex ?? 0) - (b.trialIndex ?? 0) || a.id.localeCompare(b.id))[0]
}

function derivedMeasurementId(definition: DerivedMetricDefinition, key: string): string {
  return `derived-${definition.id}-${key.replace(/[^a-zA-Z0-9-]/g, '-')}`
}

function buildNotes(definition: DerivedMetricDefinition, formula: DerivedMetricFormula, inputMetricIds: string[]) {
  return [
    `Derived metric: ${formula.name}.`,
    `Dependencies: ${inputMetricIds.join(', ')}.`,
    `Missing data policy: ${definition.missingDataPolicy ?? DEFAULT_MISSING_DATA_POLICY}.`,
  ].join(' ')
}

export function computeDerivedMeasurements(options: {
  definitions: DerivedMetricDefinition[]
  measurements: Measurement[]
  metricDefinitions?: MetricDefinition[]
}): DerivedMetricComputationResult {
  const metricById = new Map(options.metricDefinitions?.map((metric) => [metric.id, metric]) ?? [])
  const existingTargetKeys = new Set(options.measurements.map(measuredTargetKey))
  const generated: Measurement[] = []
  const reports: DerivedMetricComputationReport[] = []

  options.definitions.forEach((definition) => {
    const formula = getDerivedMetricFormula(definition.formulaId)
    const inputSpecs = normalizeInputSpecs(definition)
    const dependencyMetricIds = Array.from(new Set(inputSpecs.map((input) => input.metricId)))
    const candidateKeys = new Set(
      options.measurements
        .filter((measurement) => dependencyMetricIds.includes(measurement.metricId))
        .map(keyFromMeasurement),
    )
    const missingDataPolicy = definition.missingDataPolicy ?? DEFAULT_MISSING_DATA_POLICY
    let generatedCount = 0
    let skippedCount = 0
    let missingInputCount = 0

    candidateKeys.forEach((key) => {
      const inputs = inputSpecs.map((spec) => pickInputMeasurement(options.measurements, spec, key))
      const missingRequiredInput = inputSpecs.some((spec, index) => spec.required !== false && !inputs[index])
      const availableInputs = inputs.filter((measurement): measurement is Measurement => Boolean(measurement))

      if (missingRequiredInput) missingInputCount += 1
      if (
        availableInputs.length < formula.minInputs ||
        (missingDataPolicy === 'require_all_inputs' && missingRequiredInput)
      ) {
        skippedCount += 1
        return
      }

      const keyParts = parseMeasurementKey(key)
      const targetKey = `${definition.metricId}|${key}`
      if (existingTargetKeys.has(targetKey)) {
        skippedCount += 1
        return
      }

      const value = formula.compute({ measurements: availableInputs, parameters: definition.parameters })
      if (value == null || !Number.isFinite(value)) {
        skippedCount += 1
        return
      }

      const qualityFlags = missingRequiredInput || availableInputs.length < inputSpecs.length ? ['partial' as const] : undefined
      const firstInput = availableInputs[0]

      generated.push({
        id: derivedMeasurementId(definition, key),
        athleteId: keyParts.athleteId,
        sessionId: keyParts.sessionId === 'no-session' ? undefined : keyParts.sessionId,
        testActionId: firstInput?.testActionId,
        batteryId: firstInput?.batteryId,
        metricId: definition.metricId,
        measuredAt: keyParts.measuredAt,
        value,
        unit: metricById.get(definition.metricId)?.unit,
        trialIndex: keyParts.trialIndex === 'no-trial' ? undefined : Number(keyParts.trialIndex),
        source: 'computed',
        dimensions: definition.outputDimensions,
        qualityFlags,
        notes: buildNotes(definition, formula, dependencyMetricIds),
      })
      generatedCount += 1
      existingTargetKeys.add(targetKey)
    })

    reports.push({
      definitionId: definition.id,
      metricId: definition.metricId,
      formulaId: definition.formulaId,
      generatedCount,
      skippedCount,
      missingInputCount,
      missingDataPolicy,
      dependencyMetricIds,
    })
  })

  return { measurements: generated, reports }
}
