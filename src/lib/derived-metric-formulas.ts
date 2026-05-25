import type { DerivedMetricFormulaId, Measurement } from './domain-model'

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
    compute: ({ measurements }) => {
      const values = numericValues(measurements).slice(0, 2)
      if (values.length < 2 || values[1] === 0) return null
      return values[0] / values[1]
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
