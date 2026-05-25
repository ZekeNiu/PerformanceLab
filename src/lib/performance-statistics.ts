import { mean, sampleCorrelation, standardDeviation } from 'simple-statistics'
import {
  confidenceIntervalR,
  pearsonCorrelation,
  spearmanCorrelation,
} from './statistics'

export type DataQualityStatus = 'ok' | 'caution' | 'insufficient'

export interface DataQualityMetadata {
  status: DataQualityStatus
  flags: string[]
}

export interface SampleSizeMetadata {
  n: number
  groupA?: number
  groupB?: number
  paired?: number
  missing?: number
}

export interface StatisticMetadata {
  method: string
  assumptions: string[]
  sampleSize: SampleSizeMetadata
  missingDataPolicy: string
  dataQuality: DataQualityMetadata
}

export interface StatisticResult<T = number> {
  value: T
  metadata: StatisticMetadata
}

export interface SummaryGroupInput {
  mean: number
  sd: number
  n: number
}

export interface ComparisonStatisticsInput {
  baseline: SummaryGroupInput
  comparison: SummaryGroupInput
  confidenceLevel?: number
}

export interface ComparisonStatistics {
  change: StatisticResult<number>
  percentChange: StatisticResult<number>
  te: StatisticResult<number>
  mdc: StatisticResult<number>
  swc: StatisticResult<number>
  snr: StatisticResult<number>
  effectSize: StatisticResult<number>
  pValue: StatisticResult<number>
  metadata: StatisticMetadata
}

export type CorrelationMethod = 'pearson' | 'spearman'

export interface CorrelationStatistics {
  r: StatisticResult<number>
  p: StatisticResult<number>
  r2: StatisticResult<number>
  confidenceInterval: StatisticResult<[number, number]>
  metadata: StatisticMetadata
}

const DEFAULT_MISSING_DATA_POLICY = 'complete-case: exclude non-finite values and unmatched pairs'

function finiteNumber(value: number) {
  return Number.isFinite(value)
}

function qualityFromFlags(flags: string[]): DataQualityMetadata {
  if (flags.includes('insufficient-sample')) return { status: 'insufficient', flags }
  if (flags.length > 0) return { status: 'caution', flags }
  return { status: 'ok', flags }
}

function baseMetadata(
  method: string,
  sampleSize: SampleSizeMetadata,
  flags: string[],
  assumptions: string[],
): StatisticMetadata {
  return {
    method,
    assumptions,
    sampleSize,
    missingDataPolicy: DEFAULT_MISSING_DATA_POLICY,
    dataQuality: qualityFromFlags(flags),
  }
}

function withMetadata(value: number, metadata: StatisticMetadata): StatisticResult<number> {
  return { value: finiteNumber(value) ? value : 0, metadata }
}

export function pooledStandardDeviation(groupA: SummaryGroupInput, groupB: SummaryGroupInput): StatisticResult<number> {
  const flags: string[] = []
  if (groupA.n < 2 || groupB.n < 2) flags.push('insufficient-sample')
  if (groupA.sd < 0 || groupB.sd < 0) flags.push('invalid-standard-deviation')

  const denominator = groupA.n + groupB.n - 2
  const value = denominator > 0
    ? Math.sqrt((((groupA.n - 1) * groupA.sd ** 2) + ((groupB.n - 1) * groupB.sd ** 2)) / denominator)
    : 0

  return withMetadata(
    value,
    baseMetadata(
      'pooled standard deviation from two summary groups',
      { n: groupA.n + groupB.n, groupA: groupA.n, groupB: groupB.n },
      flags,
      ['independent summary groups', 'approximately continuous metric values'],
    ),
  )
}

export function technicalErrorFromSummaries(groupA: SummaryGroupInput, groupB: SummaryGroupInput): StatisticResult<number> {
  const pooled = pooledStandardDeviation(groupA, groupB)
  const flags = [...pooled.metadata.dataQuality.flags, 'summary-level-te-estimate']

  return withMetadata(
    pooled.value * 0.35,
    baseMetadata(
      'TE estimate = pooled SD x 0.35',
      pooled.metadata.sampleSize,
      flags,
      [
        'summary-level approximation until repeated-measure reliability data is available',
        'baseline and comparison summaries are on the same metric scale',
      ],
    ),
  )
}

export function mdcFromTechnicalError(te: number, confidenceLevel = 0.95): StatisticResult<number> {
  const z = confidenceLevel === 0.95 ? 1.96 : 1.96
  const flags = te > 0 ? [] : ['zero-or-missing-te']

  return withMetadata(
    te * z * Math.sqrt(2),
    baseMetadata(
      `MDC = TE x ${z} x sqrt(2)`,
      { n: 0 },
      flags,
      ['TE is estimated on the same metric scale', 'normal measurement error approximation'],
    ),
  )
}

export function swcFromSummaries(groupA: SummaryGroupInput, groupB: SummaryGroupInput): StatisticResult<number> {
  const pooled = pooledStandardDeviation(groupA, groupB)
  return withMetadata(
    pooled.value * 0.2,
    baseMetadata(
      'SWC = pooled SD x 0.2',
      pooled.metadata.sampleSize,
      pooled.metadata.dataQuality.flags,
      ['Cohen small-effect convention used as first-pass sports science threshold'],
    ),
  )
}

export function signalToNoiseRatio(meanA: number, meanB: number, te: number): StatisticResult<number> {
  const flags = te > 0 ? [] : ['zero-or-missing-te']
  return withMetadata(
    te > 0 ? Math.abs(meanB - meanA) / te : 0,
    baseMetadata(
      'signal-to-noise = absolute mean change / TE',
      { n: 0 },
      flags,
      ['larger values indicate change exceeds estimated measurement noise'],
    ),
  )
}

export function cohensDFromSummaries(groupA: SummaryGroupInput, groupB: SummaryGroupInput): StatisticResult<number> {
  const pooled = pooledStandardDeviation(groupA, groupB)
  const flags = [...pooled.metadata.dataQuality.flags]
  if (pooled.value === 0) flags.push('zero-pooled-sd')

  return withMetadata(
    pooled.value > 0 ? (groupB.mean - groupA.mean) / pooled.value : 0,
    baseMetadata(
      'Cohen d = mean difference / pooled SD',
      pooled.metadata.sampleSize,
      flags,
      ['independent summary groups', 'pooled variance is appropriate for the two groups'],
    ),
  )
}

export function approximateSummaryTTest(groupA: SummaryGroupInput, groupB: SummaryGroupInput): StatisticResult<number> {
  const pairedN = Math.min(groupA.n, groupB.n)
  const flags: string[] = ['summary-level-p-value-estimate']
  if (pairedN < 3) flags.push('insufficient-sample')

  const se = pairedN > 0 ? Math.sqrt((groupA.sd ** 2 + groupB.sd ** 2) / pairedN) : 0
  const t = se > 0 ? (groupB.mean - groupA.mean) / se : 0
  const df = Math.max(1, pairedN - 1)
  const p = 2 * (1 - studentTCdf(Math.abs(t), df))

  return withMetadata(
    Math.max(0.001, Math.min(1, p)),
    baseMetadata(
      'summary-level approximate paired t-test',
      { n: pairedN, groupA: groupA.n, groupB: groupB.n, paired: pairedN },
      flags,
      [
        'uses summary means and SDs, not raw paired differences',
        'replace with raw paired test when repeated athlete-level observations are available',
      ],
    ),
  )
}

export function compareSummaries(input: ComparisonStatisticsInput): ComparisonStatistics {
  const te = technicalErrorFromSummaries(input.baseline, input.comparison)
  const mdc = mdcFromTechnicalError(te.value, input.confidenceLevel)
  const swc = swcFromSummaries(input.baseline, input.comparison)
  const snr = signalToNoiseRatio(input.baseline.mean, input.comparison.mean, te.value)
  const effectSize = cohensDFromSummaries(input.baseline, input.comparison)
  const pValue = approximateSummaryTTest(input.baseline, input.comparison)
  const change = input.comparison.mean - input.baseline.mean
  const percentChange = input.baseline.mean !== 0 ? (change / input.baseline.mean) * 100 : 0
  const flags = Array.from(new Set([
    ...te.metadata.dataQuality.flags,
    ...mdc.metadata.dataQuality.flags,
    ...swc.metadata.dataQuality.flags,
    ...snr.metadata.dataQuality.flags,
    ...effectSize.metadata.dataQuality.flags,
    ...pValue.metadata.dataQuality.flags,
  ]))
  const metadata = baseMetadata(
    'summary comparison bundle: change, TE, MDC, SWC, SNR, Cohen d, approximate p-value',
    {
      n: input.baseline.n + input.comparison.n,
      groupA: input.baseline.n,
      groupB: input.comparison.n,
      paired: Math.min(input.baseline.n, input.comparison.n),
    },
    flags,
    ['summary statistics are derived from compatible metric and aggregation settings'],
  )

  return {
    change: withMetadata(change, metadata),
    percentChange: withMetadata(percentChange, metadata),
    te,
    mdc,
    swc,
    snr,
    effectSize,
    pValue,
    metadata,
  }
}

export function analyzeCorrelation(
  x: number[],
  y: number[],
  method: CorrelationMethod = 'pearson',
): CorrelationStatistics {
  const pairs = x
    .map((xValue, index) => ({ x: xValue, y: y[index] }))
    .filter((pair) => finiteNumber(pair.x) && finiteNumber(pair.y))
  const missing = Math.max(x.length, y.length) - pairs.length
  const flags: string[] = []
  if (pairs.length < 3) flags.push('insufficient-sample')
  if (missing > 0) flags.push('missing-or-non-finite-values-excluded')
  if (method === 'pearson' && pairs.length >= 3) {
    const xStd = standardDeviation(pairs.map((pair) => pair.x))
    const yStd = standardDeviation(pairs.map((pair) => pair.y))
    if (xStd === 0 || yStd === 0) flags.push('zero-variance-variable')
  }

  const cleanX = pairs.map((pair) => pair.x)
  const cleanY = pairs.map((pair) => pair.y)
  const result = method === 'spearman'
    ? spearmanCorrelation(cleanX, cleanY)
    : pearsonCorrelation(cleanX, cleanY)
  const r = finiteNumber(result.r) ? result.r : 0
  const p = finiteNumber(result.p) ? result.p : 1
  const ci = confidenceIntervalR(r, pairs.length)
  const metadata = baseMetadata(
    method === 'spearman'
      ? 'Spearman rank correlation with two-sided p-value'
      : 'Pearson product-moment correlation with two-sided p-value',
    { n: pairs.length, missing },
    flags,
    method === 'spearman'
      ? ['monotonic relationship', 'ranked values reduce sensitivity to non-normality']
      : ['linear relationship', 'approximately independent paired observations'],
  )

  return {
    r: { value: r, metadata },
    p: { value: p, metadata },
    r2: { value: method === 'pearson' ? r * r : sampleCorrelation(cleanX, cleanY) ** 2, metadata },
    confidenceInterval: { value: ci, metadata },
    metadata,
  }
}

export function meanAndSd(values: number[]): StatisticResult<SummaryGroupInput> {
  const cleanValues = values.filter(finiteNumber)
  const flags: string[] = []
  if (cleanValues.length < 2) flags.push('insufficient-sample')
  if (cleanValues.length !== values.length) flags.push('missing-or-non-finite-values-excluded')
  const summary = {
    mean: cleanValues.length ? mean(cleanValues) : 0,
    sd: cleanValues.length > 1 ? standardDeviation(cleanValues) : 0,
    n: cleanValues.length,
  }

  return {
    value: summary,
    metadata: baseMetadata(
      'mean and sample standard deviation',
      { n: cleanValues.length, missing: values.length - cleanValues.length },
      flags,
      ['finite numeric measurements only'],
    ),
  }
}

function studentTCdf(t: number, df: number): number {
  if (df > 30) return normalCdf(t)
  const x = df / (df + t * t)
  return 1 - 0.5 * incompleteBeta(x, df / 2, 0.5)
}

function normalCdf(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x)
  const t = 1.0 / (1.0 + p * absX)
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX))
  return 0.5 * (1.0 + sign * y)
}

function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) +
    a * Math.log(x) + b * Math.log(1 - x),
  )
  if (x < (a + 1) / (a + b + 2)) {
    return bt * betaContinuedFraction(x, a, b) / a
  }
  return 1 - bt * betaContinuedFraction(1 - x, b, a) / b
}

function betaContinuedFraction(x: number, a: number, b: number): number {
  const maxIterations = 200
  const epsilon = 3e-7
  let am = 1
  let bm = 1
  let az = 1
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let bz = 1 - qab * x / qap
  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m
    let d = m * (b - m) * x / ((qam + m2) * (a + m2))
    const ap = az + d * am
    const bp = bz + d * bm
    d = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
    const app = ap + d * az
    const bpp = bp + d * bz
    am = ap / bpp
    bm = bp / bpp
    az = app / bpp
    bz = 1
    if (Math.abs(az - am) < epsilon * Math.abs(az)) return az
  }
  return az
}

function logGamma(z: number): number {
  const g = 7
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z)
  z -= 1
  let x = p[0]
  for (let i = 1; i < g + 2; i++) x += p[i] / (z + i)
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}
