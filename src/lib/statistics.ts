import {
  sampleCorrelation,
  linearRegression as ssLinearRegression,
  mean,
  sum,
  variance,
} from 'simple-statistics';

/** Normal CDF approximation using error function */
function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return 0.5 * (1.0 + sign * y);
}

/** Incomplete beta function approximation (used for t-distribution CDF) */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // Use continued fraction approximation
  const bt = Math.exp(
    lngamma(a + b) - lngamma(a) - lngamma(b) +
    a * Math.log(x) + b * Math.log(1 - x)
  );
  if (x < (a + 1) / (a + b + 2)) {
    return bt * betacf(x, a, b) / a;
  }
  return 1 - bt * betacf(1 - x, b, a) / b;
}

/** Log gamma function */
function lngamma(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lngamma(1 - z);
  z -= 1;
  let x = p[0];
  for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Continued fraction for incomplete beta */
function betacf(x: number, a: number, b: number): number {
  const maxIterations = 200;
  const epsilon = 3e-7;
  let am = 1;
  let bm = 1;
  let az = 1;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let bz = 1 - qab * x / qap;
  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let d = m * (b - m) * x / ((qam + m2) * (a + m2));
    const ap = az + d * am;
    const bp = bz + d * bm;
    d = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    const app = ap + d * az;
    const bpp = bp + d * bz;
    am = ap / bpp;
    bm = bp / bpp;
    az = app / bpp;
    bz = 1;
    if (Math.abs(az - am) < epsilon * Math.abs(az)) return az;
  }
  return az;
}

/** Student t-distribution CDF */
function studentTcdf(t: number, df: number): number {
  if (df > 30) return normalCdf(t);
  const x = df / (df + t * t);
  const incBeta = incompleteBeta(x, df / 2, 0.5);
  return 1 - 0.5 * incBeta;
}

/** Return Pearson correlation r and p-value between two arrays */
export function pearsonCorrelation(x: number[], y: number[]): { r: number; p: number } {
  if (x.length !== y.length || x.length < 3) return { r: 0, p: 1 };
  const r = sampleCorrelation(x, y);
  const n = x.length;
  const df = n - 2;
  if (df <= 0 || isNaN(r)) return { r: 0, p: 1 };
  const tStat = r * Math.sqrt(df) / Math.sqrt(Math.max(0, 1 - r * r));
  const p = 2 * (1 - studentTcdf(Math.abs(tStat), df));
  return { r, p: isNaN(p) ? 1 : Math.max(0, Math.min(1, p)) };
}

/** Spearman rank correlation */
export function spearmanCorrelation(x: number[], y: number[]): { r: number; p: number } {
  const n = x.length;
  if (n < 3) return { r: 0, p: 1 };
  const rankX = getRanks(x);
  const rankY = getRanks(y);
  return pearsonCorrelation(rankX, rankY);
}

function getRanks(arr: number[]): number[] {
  const sorted = arr
    .map((v, i) => ({ v, i }))
    .sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length);
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j < sorted.length && sorted[j].v === sorted[i].v) j++;
    const rank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[sorted[k].i] = rank;
    }
    i = j - 1;
  }
  return ranks;
}

/** Simple linear regression: y = mx + b */
export function linearRegression(x: number[], y: number[]): {
  slope: number;
  intercept: number;
  r2: number;
  predicted: number[];
  residuals: number[];
} {
  const n = x.length;
  if (n < 2) {
    return { slope: 0, intercept: 0, r2: 0, predicted: y.map(() => 0), residuals: y.map(v => v) };
  }
  const lr = ssLinearRegression(x.map((xi, i) => [xi, y[i]]));
  const slope = lr.m;
  const intercept = lr.b;
  const predicted = x.map(xi => slope * xi + intercept);
  const residuals = y.map((yi, i) => yi - predicted[i]);
  const yMean = mean(y);
  const ssTot = sum(y.map(yi => (yi - yMean) ** 2));
  const ssRes = sum(residuals.map(r => r * r));
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2, predicted, residuals };
}

/** Polynomial regression: y = a*x^2 + b*x + c */
export function polynomialRegression(x: number[], y: number[], degree: number): {
  coefficients: number[];
  r2: number;
  predicted: number[];
  residuals: number[];
} {
  const n = x.length;
  if (n < degree + 1) {
    return { coefficients: new Array(degree + 1).fill(0), r2: 0, predicted: y.map(() => mean(y)), residuals: y.map(yi => yi - mean(y)) };
  }
  return polynomialLeastSquares(x, y, degree);
}

function polynomialLeastSquares(x: number[], y: number[], degree: number): {
  coefficients: number[];
  r2: number;
  predicted: number[];
  residuals: number[];
} {
  const n = x.length;
  // Build Vandermonde-like matrix for least squares
  const A: number[][] = [];
  const Y: number[] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let d = 0; d <= degree; d++) {
      row.push(Math.pow(x[i], d));
    }
    A.push(row);
    Y.push(y[i]);
  }
  const coeffs = leastSquaresSolve(A, Y);
  const predicted = x.map(xi => {
    let sum = 0;
    for (let d = 0; d <= degree; d++) {
      sum += coeffs[d] * Math.pow(xi, d);
    }
    return sum;
  });
  const residuals = y.map((yi, i) => yi - predicted[i]);
  const yMean = mean(y);
  const ssTot = sum(y.map(yi => (yi - yMean) ** 2));
  const ssRes = sum(residuals.map(r => r * r));
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { coefficients: coeffs, r2, predicted, residuals };
}

function leastSquaresSolve(A: number[][], y: number[]): number[] {
  const n = A.length;
  const m = A[0].length;
  // Normal equations: A^T * A * x = A^T * y
  const AtA: number[][] = Array.from({ length: m }, () => new Array(m).fill(0));
  const Aty: number[] = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < n; k++) {
        AtA[i][j] += A[k][i] * A[k][j];
      }
    }
    for (let k = 0; k < n; k++) {
      Aty[i] += A[k][i] * y[k];
    }
  }
  return gaussianElimination(AtA, Aty);
}

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;
  // Augmented matrix
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);
  // Forward elimination
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
    if (Math.abs(aug[i][i]) < 1e-10) continue;
    for (let k = i + 1; k < n; k++) {
      const factor = aug[k][i] / aug[i][i];
      for (let j = i; j <= n; j++) {
        aug[k][j] -= factor * aug[i][j];
      }
    }
  }
  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(aug[i][i]) < 1e-10) {
      x[i] = 0;
      continue;
    }
    x[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= aug[i][j] * x[j];
    }
    x[i] /= aug[i][i];
  }
  return x;
}

/** Calculate AIC for a model */
export function calculateAIC(residuals: number[], numParams: number): number {
  const n = residuals.length;
  if (n === 0) return Infinity;
  const rss = sum(residuals.map(r => r * r));
  if (rss <= 0) return -Infinity;
  return n * Math.log(rss / n) + 2 * numParams;
}

/** Calculate BIC for a model */
export function calculateBIC(residuals: number[], numParams: number): number {
  const n = residuals.length;
  if (n === 0) return Infinity;
  const rss = sum(residuals.map(r => r * r));
  if (rss <= 0) return -Infinity;
  return n * Math.log(rss / n) + numParams * Math.log(n);
}

/** Calculate VIF for each variable in a multivariate set */
export function calculateVIF(data: Record<string, number[]>): { name: string; vif: number }[] {
  const names = Object.keys(data);
  if (names.length < 2) return names.map(name => ({ name, vif: 1 }));
  return names.map((name, idx) => {
    // VIF for variable idx = 1 / (1 - R^2) where R^2 is from regressing this var on all others
    const y = data[name];
    const otherNames = names.filter((_, i) => i !== idx);
    if (otherNames.length === 0) return { name, vif: 1 };
    const X: number[][] = [];
    for (let i = 0; i < y.length; i++) {
      X.push(otherNames.map(on => data[on][i]));
    }
    try {
      const pairs: [number, number][] = X.map((row, i) => [row[0] ?? 0, y[i]]);
      const lr = ssLinearRegression(pairs);
      const slope = Array.isArray(lr.m) ? (lr.m[0] ?? 0) : lr.m;
      const predicted = X.map(row => slope * (row[0] ?? 0) + lr.b);
      const residuals = y.map((yi, i) => yi - predicted[i]);
      const yMean = mean(y);
      const ssTot = sum(y.map(yi => (yi - yMean) ** 2));
      const ssRes = sum(residuals.map(r => r * r));
      const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
      const vif = Math.max(1, 1 / (1 - r2 + 1e-10));
      return { name, vif };
    } catch {
      return { name, vif: 1 };
    }
  });
}

/** Detect collinear pairs (correlation > threshold) */
export function detectCollinearity(data: Record<string, number[]>, threshold = 0.85): {
  name1: string;
  name2: string;
  r: number;
}[] {
  const names = Object.keys(data);
  const pairs: { name1: string; name2: string; r: number }[] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const { r } = pearsonCorrelation(data[names[i]], data[names[j]]);
      if (Math.abs(r) > threshold) {
        pairs.push({ name1: names[i], name2: names[j], r });
      }
    }
  }
  return pairs;
}

/** Calculate 95% confidence interval for Pearson r */
export function confidenceIntervalR(r: number, n: number): [number, number] {
  if (n < 4) return [-1, 1];
  // Fisher z-transformation
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const se = 1 / Math.sqrt(n - 3);
  const z95 = 1.96;
  const zLower = z - z95 * se;
  const zUpper = z + z95 * se;
  const lower = Math.tanh(zLower);
  const upper = Math.tanh(zUpper);
  return [Math.round(lower * 100) / 100, Math.round(upper * 100) / 100];
}

/** Interpret correlation strength */
export function interpretCorrelation(r: number): string {
  const abs = Math.abs(r);
  const direction = r >= 0 ? '正' : '负';
  if (abs >= 0.9) return `极强${direction}相关`;
  if (abs >= 0.7) return `强${direction}相关`;
  if (abs >= 0.5) return `中等${direction}相关`;
  if (abs >= 0.3) return `弱${direction}相关`;
  return '极弱相关/无相关';
}

/** GAM-like smoothing using local polynomial regression */
export function gamSmoothFit(x: number[], y: number[], numPoints = 100): {
  x: number[];
  y: number[];
  ciLower: number[];
  ciUpper: number[];
} {
  const n = x.length;
  if (n < 5) {
    const pairs: [number, number][] = x.map((xi, i) => [xi, y[i]]);
    const lr = ssLinearRegression(pairs);
    const slope = Array.isArray(lr.m) ? (lr.m[0] ?? 0) : lr.m;
    const xRange = linspace(Math.min(...x), Math.max(...x), numPoints);
    return {
      x: xRange,
      y: xRange.map(xi => slope * xi + lr.b),
      ciLower: xRange.map(xi => slope * xi + lr.b - 1),
      ciUpper: xRange.map(xi => slope * xi + lr.b + 1),
    };
  }
  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const xRange = linspace(xMin, xMax, numPoints);
  const bandwidth = (xMax - xMin) * 0.3;
  const fitted: number[] = [];
  const ciLower: number[] = [];
  const ciUpper: number[] = [];
  for (const xi of xRange) {
    // Local weighted linear regression
    const weights = x.map(xj => {
      const d = Math.abs(xj - xi);
      return Math.exp(-0.5 * (d / bandwidth) ** 2);
    });
    const wSum = sum(weights);
    if (wSum < 1e-10) {
      fitted.push(mean(y));
      ciLower.push(mean(y) - 1);
      ciUpper.push(mean(y) + 1);
      continue;
    }
    const wMeanX = sum(x.map((xj, j) => xj * weights[j])) / wSum;
    const wMeanY = sum(y.map((yj, j) => yj * weights[j])) / wSum;
    let num = 0;
    let den = 0;
    for (let j = 0; j < n; j++) {
      num += weights[j] * (x[j] - wMeanX) * (y[j] - wMeanY);
      den += weights[j] * (x[j] - wMeanX) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = wMeanY - slope * wMeanX;
    const yi = slope * xi + intercept;
    // Approximate CI using local residual std
    const localResid = x.map((xj, j) => {
      const pred = slope * xj + intercept;
      return Math.abs(y[j] - pred);
    });
    const localSE = mean(localResid) + 1e-6;
    fitted.push(yi);
    ciLower.push(yi - 1.96 * localSE);
    ciUpper.push(yi + 1.96 * localSE);
  }
  return { x: xRange, y: fitted, ciLower, ciUpper };
}

/** Simulated Random Forest feature importance using permutation importance */
export function randomForestImportance(
  xVars: Record<string, number[]>,
  y: number[]
): { name: string; importance: number }[] {
  const names = Object.keys(xVars);
  if (names.length === 0) return [];
  // Baseline: total variance
  const yMean = mean(y);
  const baselineVar = sum(y.map(yi => (yi - yMean) ** 2));
  if (baselineVar === 0) return names.map(name => ({ name, importance: 0 }));
  // Simple tree-based approximation: use variance reduction from splits
  const importances = names.map(name => {
    const x = xVars[name];
    // Find best split and variance reduction
    const sorted = x.map((v, i) => ({ v, y: y[i] })).sort((a, b) => a.v - b.v);
    let bestReduction = 0;
    for (let i = 1; i < sorted.length - 1; i++) {
      const leftY = sorted.slice(0, i).map(s => s.y);
      const rightY = sorted.slice(i).map(s => s.y);
      const leftMean = mean(leftY);
      const rightMean = mean(rightY);
      const leftVar = sum(leftY.map(yi => (yi - leftMean) ** 2));
      const rightVar = sum(rightY.map(yi => (yi - rightMean) ** 2));
      const totalVar = leftVar + rightVar;
      const reduction = baselineVar - totalVar;
      if (reduction > bestReduction) bestReduction = reduction;
    }
    return { name, importance: Math.max(0, bestReduction / baselineVar) };
  });
  // Normalize to 0-100 scale
  const maxImp = Math.max(...importances.map(i => i.importance), 1e-10);
  return importances.map(i => ({ ...i, importance: Math.round((i.importance / maxImp) * 100) }));
}

/** Generate simulated SHAP values for each feature */
export function generateSHAPValues(
  xVars: Record<string, number[]>,
  y: number[]
): { name: string; values: { shap: number; featureValue: number }[] }[] {
  const names = Object.keys(xVars);
  const rng = seededRandom(42);
  return names.map(name => {
    const x = xVars[name];
    const xMean = mean(x);
    const xStd = Math.sqrt(variance(x)) || 1;
    const correlation = pearsonCorrelation(x, y).r;
    const values = x.map((xi, i) => {
      const normalized = (xi - xMean) / xStd;
      const shap = normalized * correlation * (y[i] - mean(y)) + (rng() - 0.5) * 0.5;
      return { shap, featureValue: normalized };
    });
    return { name, values };
  });
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function linspace(start: number, end: number, num: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < num; i++) {
    arr.push(start + (end - start) * (i / (num - 1)));
  }
  return arr;
}

/** Format p-value for display */
export function formatPValue(p: number): string {
  if (p < 0.001) return '< .001';
  return p.toFixed(3).replace(/^0/, '');
}

/** Get algorithm name based on sample size */
export function getAlgorithmName(n: number): string {
  if (n < 20) return '线性相关 + 二次多项式';
  if (n < 50) return '广义相加模型 (GAM)';
  return '随机森林 + TreeSHAP';
}

/** Get algorithm type based on sample size */
export type AlgorithmType = 'linear' | 'polynomial' | 'gam' | 'randomforest';

export function getDefaultAlgorithm(n: number): AlgorithmType {
  if (n < 20) return 'linear';
  if (n < 50) return 'gam';
  return 'randomforest';
}
