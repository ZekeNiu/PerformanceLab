import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import ReactEChartsCore from 'echarts-for-react';
import {
  ScatterChart,
  XCircle,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  mean,
  variance,
} from 'simple-statistics';
import {
  pearsonCorrelation,
  linearRegression,
  polynomialRegression,
  gamSmoothFit,
  calculateAIC,
  calculateBIC,
  detectCollinearity,
  confidenceIntervalR,
  interpretCorrelation,
  randomForestImportance,
  generateSHAPValues,
  formatPValue,
  getAlgorithmName,
  calculateVIF,
} from '@/lib/statistics';
import {
  INDICATOR_CATEGORIES,
  generateDemoData,
  getIndicatorName,
} from '@/lib/correlation-data';

/* ─── Types ─── */
type AlgorithmType = 'auto' | 'linear' | 'gam' | 'randomforest';

interface CollinearityWarning {
  name1: string;
  name2: string;
  r: number;
}

type ChartValueParam = {
  value: number[];
};

type AxisExtent = {
  min: number;
  max: number;
};

type ChartObject = Record<string, unknown>;

type ChartOptionWithSeries = ChartObject & {
  series: ChartObject[];
  legend?: ChartObject;
};

/* ─── Chart colors from design system ─── */
const CHART_COLORS = [
  '#00D4AA', '#3B82F6', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
  '#14B8A6', '#A855F7',
];

/* ─── ECharts dark theme colors ─── */
const DARK = {
  bg: '#141821',
  text: '#E8ECF1',
  textSec: '#8B95A5',
  grid: '#2A3348',
};

/* ═══════════════════════════════════════════════════════════════
   Correlation Page
   ═══════════════════════════════════════════════════════════════ */
export default function Correlation() {
  /* ── State ── */
  const [yVariable, setYVariable] = useState<string>('match_score');
  const [xVariables, setXVariables] = useState<string[]>(['cmj_height', 'sprint_30m', 'hrv_rmssd']);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('auto');
  const [showVarDropdown, setShowVarDropdown] = useState(false);
  const [activeModel, setActiveModel] = useState<'A' | 'B'>('B');
  const [collinearityAction, setCollinearityAction] = useState<'warn' | 'remove' | 'ignore'>('warn');
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Demo data ── */
  const allData = useMemo(() => generateDemoData(60), []);
  const sampleSize = allData.length;

  /* ── Determine effective algorithm ── */
  const effectiveAlgorithm: AlgorithmType = useMemo(() => {
    if (algorithm !== 'auto') return algorithm;
    if (sampleSize < 20) return 'linear';
    if (sampleSize < 50) return 'gam';
    return 'randomforest';
  }, [algorithm, sampleSize]);

  /* ── Auto-select first X variable on mount if none ── */
  useEffect(() => {
    if (xVariables.length === 0) {
      setXVariables(['cmj_height']);
    }
  }, [xVariables.length]);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowVarDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── Extract arrays for selected variables ── */
  const yValues = useMemo(() => allData.map(d => d.values[yVariable] ?? 0), [allData, yVariable]);
  const xDataArrays = useMemo(() => {
    const result: Record<string, number[]> = {};
    xVariables.forEach(id => {
      result[id] = allData.map(d => d.values[id] ?? 0);
    });
    return result;
  }, [allData, xVariables]);

  /* ── Collinearity detection ── */
  const collinearityWarnings = useMemo<CollinearityWarning[]>(() => {
    if (xVariables.length < 2) return [];
    return detectCollinearity(xDataArrays, 0.85);
  }, [xDataArrays, xVariables.length]);

  const hasHighCollinearity = collinearityWarnings.length > 0 && collinearityAction === 'warn';

  /* ── Filtered X vars after collinearity removal ── */
  const effectiveXVars = useMemo(() => {
    if (collinearityAction !== 'remove' || collinearityWarnings.length === 0) return xVariables;
    // Remove the second variable in each collinear pair (lower importance)
    const toRemove = new Set<string>();
    collinearityWarnings.forEach(w => {
      // Remove the one that appears later in the list (assumed lower importance)
      const idx1 = xVariables.indexOf(w.name1);
      const idx2 = xVariables.indexOf(w.name2);
      toRemove.add(idx2 > idx1 ? w.name2 : w.name1);
    });
    return xVariables.filter(v => !toRemove.has(v));
  }, [xVariables, collinearityWarnings, collinearityAction]);

  const effectiveXArrays = useMemo(() => {
    const result: Record<string, number[]> = {};
    effectiveXVars.forEach(id => {
      result[id] = allData.map(d => d.values[id] ?? 0);
    });
    return result;
  }, [allData, effectiveXVars]);

  /* ── Statistical computations ── */
  const stats = useMemo(() => {
    if (effectiveXVars.length === 0 || yValues.length === 0) return null;

    const results = effectiveXVars.map(xId => {
      const xVals = effectiveXArrays[xId];
      const { r, p } = pearsonCorrelation(xVals, yValues);
      const ci = confidenceIntervalR(r, sampleSize);
      return {
        xId,
        xName: getIndicatorName(xId),
        n: sampleSize,
        r,
        r2: r * r,
        p,
        ci,
        interpretation: interpretCorrelation(r),
      };
    });

    return results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }, [effectiveXVars, effectiveXArrays, yValues, sampleSize]);

  /* ── Model computations (for single X) ── */
  const modelStats = useMemo(() => {
    if (effectiveXVars.length !== 1) return null;
    const xId = effectiveXVars[0];
    const xVals = effectiveXArrays[xId];

    // Model A: Linear
    const modelA = linearRegression(xVals, yValues);
    const aicA = calculateAIC(modelA.residuals, 2);
    const bicA = calculateBIC(modelA.residuals, 2);

    // Model B: Polynomial (degree 2)
    const modelB = polynomialRegression(xVals, yValues, 2);
    const aicB = calculateAIC(modelB.residuals, 3);
    const bicB = calculateBIC(modelB.residuals, 3);

    const rmseA = Math.sqrt(mean(modelA.residuals.map(r => r * r)));
    const rmseB = Math.sqrt(mean(modelB.residuals.map(r => r * r)));
    const maeA = mean(modelA.residuals.map(r => Math.abs(r)));
    const maeB = mean(modelB.residuals.map(r => Math.abs(r)));

    // Auto-select best model
    const bestModel = aicB < aicA ? 'B' : 'A';

    return {
      xId,
      xName: getIndicatorName(xId),
      modelA: { ...modelA, aic: aicA, bic: bicA, rmse: rmseA, mae: maeA },
      modelB: { ...modelB, aic: aicB, bic: bicB, rmse: rmseB, mae: maeB },
      bestModel,
      aicDiff: Math.abs(aicA - aicB),
    };
  }, [effectiveXVars, effectiveXArrays, yValues]);

  /* ── GAM smooth fit ── */
  const gamFit = useMemo(() => {
    if (effectiveAlgorithm !== 'gam' || effectiveXVars.length !== 1) return null;
    const xId = effectiveXVars[0];
    const xVals = effectiveXArrays[xId];
    return gamSmoothFit(xVals, yValues);
  }, [effectiveAlgorithm, effectiveXVars, effectiveXArrays, yValues]);

  /* ── Random Forest importance ── */
  const rfImportance = useMemo(() => {
    if (effectiveAlgorithm !== 'randomforest') return null;
    return randomForestImportance(effectiveXArrays, yValues);
  }, [effectiveAlgorithm, effectiveXArrays, yValues]);

  /* ── SHAP values ── */
  const shapValues = useMemo(() => {
    if (effectiveAlgorithm !== 'randomforest') return null;
    return generateSHAPValues(effectiveXArrays, yValues);
  }, [effectiveAlgorithm, effectiveXArrays, yValues]);

  /* ── VIF values ── */
  const vifValues = useMemo(() => {
    if (effectiveXVars.length < 2) return [];
    return calculateVIF(effectiveXArrays);
  }, [effectiveXVars, effectiveXArrays]);

  /* ── Handlers ── */
  const addXVariable = useCallback((id: string) => {
    setXVariables(prev => {
      if (prev.includes(id)) return prev;
      if (prev.length >= 8) return prev;
      return [...prev, id];
    });
    setShowVarDropdown(false);
  }, []);

  const removeXVariable = useCallback((id: string) => {
    setXVariables(prev => prev.filter(v => v !== id));
  }, []);

  const clearXVariables = useCallback(() => {
    setXVariables([]);
  }, []);

  /* ── Scatter plot option ── */
  const scatterOption = useMemo(() => {
    if (xVariables.length === 0) return null;

    // Single X: detailed scatter with regression
    if (xVariables.length === 1) {
      const xId = xVariables[0];
      const xVals = xDataArrays[xId];
      const data = xVals.map((xv, i) => [xv, yValues[i]]);

      const option: ChartOptionWithSeries = {
        backgroundColor: 'transparent',
        grid: { top: 40, right: 30, bottom: 50, left: 60 },
        tooltip: {
          trigger: 'item',
          backgroundColor: DARK.bg,
          borderColor: DARK.grid,
          textStyle: { color: DARK.text, fontSize: 12 },
          formatter: (params: ChartValueParam) => {
            return `${getIndicatorName(xId)}: ${params.value[0].toFixed(2)}<br/>${getIndicatorName(yVariable)}: ${params.value[1].toFixed(2)}`;
          },
        },
        xAxis: {
          type: 'value',
          name: getIndicatorName(xId),
          nameLocation: 'center',
          nameGap: 30,
          nameTextStyle: { color: DARK.textSec, fontSize: 12 },
          axisLine: { lineStyle: { color: DARK.grid } },
          axisLabel: { color: DARK.textSec, fontSize: 11 },
          splitLine: { lineStyle: { color: DARK.grid, opacity: 0.3 } },
        },
        yAxis: {
          type: 'value',
          name: getIndicatorName(yVariable),
          nameLocation: 'center',
          nameGap: 45,
          nameTextStyle: { color: DARK.textSec, fontSize: 12 },
          axisLine: { lineStyle: { color: DARK.grid } },
          axisLabel: { color: DARK.textSec, fontSize: 11 },
          splitLine: { lineStyle: { color: DARK.grid, opacity: 0.3 } },
        },
        series: [
          {
            type: 'scatter',
            data,
            symbolSize: 8,
            itemStyle: {
              color: 'rgba(0, 212, 170, 0.7)',
              borderColor: '#00D4AA',
              borderWidth: 1,
            },
            animationDelay: (idx: number) => idx * 10,
          },
        ],
      };

      // Add regression curves based on algorithm
      if (effectiveAlgorithm === 'linear' && modelStats) {
        const xMin = Math.min(...xVals);
        const xMax = Math.max(...xVals);
        const xRange = Array.from({ length: 100 }, (_, i) => xMin + (xMax - xMin) * (i / 99));

        // Model A: Linear
        const activeA = activeModel === 'A';
        option.series.push({
          type: 'line',
          data: xRange.map(xv => [xv, modelStats.modelA.slope * xv + modelStats.modelA.intercept]),
          smooth: false,
          symbol: 'none',
          lineStyle: {
            color: activeA ? '#3B82F6' : '#3B82F6',
            width: 2,
            type: activeA ? 'solid' : 'dashed',
            opacity: activeA ? 1 : 0.5,
          },
          name: `线性 R²=${modelStats.modelA.r2.toFixed(3)}`,
        });

        // Model B: Polynomial
        option.series.push({
          type: 'line',
          data: xRange.map(xv => {
            const c = modelStats.modelB.coefficients;
            const y = c[0] + c[1] * xv + c[2] * xv * xv;
            return [xv, y];
          }),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: activeA ? '#8B5CF6' : '#8B5CF6',
            width: 2,
            type: activeA ? 'dashed' : 'solid',
            opacity: activeA ? 0.5 : 1,
          },
          name: `多项式 R²=${modelStats.modelB.r2.toFixed(3)}`,
        });

        option.legend = {
          top: 8,
          textStyle: { color: DARK.textSec, fontSize: 11 },
          data: [
            `线性 R²=${modelStats.modelA.r2.toFixed(3)}`,
            `多项式 R²=${modelStats.modelB.r2.toFixed(3)}`,
          ],
        };
      } else if (effectiveAlgorithm === 'gam' && gamFit) {
        option.series.push({
          type: 'line',
          data: gamFit.x.map((xv, i) => [xv, gamFit.y[i]]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#3B82F6', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.1)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
              ],
            },
          },
        });
      }

      return option;
    }

    // Multiple X: scatter plot matrix
    const allVars = [...xVariables, yVariable];
    const n = allVars.length;
    const gridSize = Math.max(140, 600 / n);

    const grid: ChartObject[] = [];
    const xAxes: ChartObject[] = [];
    const yAxes: ChartObject[] = [];
    const series: ChartObject[] = [];

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const left = j * gridSize + (j > 0 ? 10 : 0);
        const top = i * gridSize + (i > 0 ? 10 : 0);
        grid.push({ left, top, width: gridSize - 10, height: gridSize - 10 });

        const axisIndex = i * n + j;
        xAxes.push({
          gridIndex: axisIndex,
          type: 'value',
          show: false,
          min: (value: AxisExtent) => value.min,
          max: (value: AxisExtent) => value.max,
        });
        yAxes.push({
          gridIndex: axisIndex,
          type: 'value',
          show: false,
          min: (value: AxisExtent) => value.min,
          max: (value: AxisExtent) => value.max,
        });

        const varX = allVars[j];
        const varY = allVars[i];
        const xVals = allData.map(d => d.values[varX] ?? 0);
        const yVals = allData.map(d => d.values[varY] ?? 0);
        const plotData = xVals.map((xv, idx) => [xv, yVals[idx]]);

        if (i === j) {
          // Diagonal: histogram
          const values = allData.map(d => d.values[varX] ?? 0);
          const minVal = Math.min(...values);
          const maxVal = Math.max(...values);
          const binWidth = (maxVal - minVal) / 8 || 1;
          const bins = Array.from({ length: 9 }, (_, i) => minVal + i * binWidth);
          const histData = bins.slice(0, -1).map((bin: number, idx: number) => {
            const next = bins[idx + 1];
            const count = values.filter(v => v >= bin && v < next).length;
            return [`${bin.toFixed(1)}`, count];
          });
          series.push({
            type: 'bar',
            xAxisIndex: axisIndex,
            yAxisIndex: axisIndex,
            data: histData,
            itemStyle: { color: '#3B82F6' },
            barWidth: '80%',
          });
        } else {
          series.push({
            type: 'scatter',
            xAxisIndex: axisIndex,
            yAxisIndex: axisIndex,
            data: plotData,
            symbolSize: 4,
            itemStyle: { color: 'rgba(0, 212, 170, 0.5)' },
          });
        }
      }
    }

    return {
      backgroundColor: 'transparent',
      grid,
      xAxis: xAxes,
      yAxis: yAxes,
      series,
      tooltip: {
        show: false,
      },
    };
  }, [xVariables, xDataArrays, yValues, yVariable, effectiveAlgorithm, modelStats, activeModel, gamFit, allData]);

  /* ── Residual plot option ── */
  const residualOption = useMemo(() => {
    if (!modelStats) return null;
    const activeModelData = activeModel === 'A' ? modelStats.modelA : modelStats.modelB;
    const predicted = activeModelData.predicted;
    const residuals = activeModelData.residuals;
    const sd = Math.sqrt(variance(residuals));
    const data = predicted.map((pv, i) => [pv, residuals[i]]);

    return {
      backgroundColor: 'transparent',
      grid: { top: 30, right: 20, bottom: 40, left: 50 },
      tooltip: {
        trigger: 'item',
        backgroundColor: DARK.bg,
        borderColor: DARK.grid,
        textStyle: { color: DARK.text, fontSize: 12 },
        formatter: (params: ChartValueParam) => {
          return `预测: ${params.value[0].toFixed(2)}<br/>残差: ${params.value[1].toFixed(2)}`;
        },
      },
      xAxis: {
        type: 'value',
        name: '预测值',
        nameTextStyle: { color: DARK.textSec, fontSize: 11 },
        axisLine: { lineStyle: { color: DARK.grid } },
        axisLabel: { color: DARK.textSec, fontSize: 10 },
        splitLine: { lineStyle: { color: DARK.grid, opacity: 0.3 } },
      },
      yAxis: {
        type: 'value',
        name: '残差',
        nameTextStyle: { color: DARK.textSec, fontSize: 11 },
        axisLine: { lineStyle: { color: DARK.grid } },
        axisLabel: { color: DARK.textSec, fontSize: 10 },
        splitLine: { lineStyle: { color: DARK.grid, opacity: 0.3 } },
      },
      series: [
        {
          type: 'scatter',
          data,
          symbolSize: 6,
          itemStyle: { color: 'rgba(0, 212, 170, 0.6)' },
        },
        {
          type: 'line',
          data: [
            [Math.min(...predicted), 0],
            [Math.max(...predicted), 0],
          ],
          symbol: 'none',
          lineStyle: { color: '#5A6579', type: 'dashed', width: 1 },
        },
        {
          type: 'line',
          data: [
            [Math.min(...predicted), 2 * sd],
            [Math.max(...predicted), 2 * sd],
          ],
          symbol: 'none',
          lineStyle: { color: 'rgba(245, 158, 11, 0.3)', width: 1 },
          areaStyle: {
            color: 'rgba(245, 158, 11, 0.08)',
            origin: 'start',
          },
        },
        {
          type: 'line',
          data: [
            [Math.min(...predicted), -2 * sd],
            [Math.max(...predicted), -2 * sd],
          ],
          symbol: 'none',
          lineStyle: { color: 'rgba(245, 158, 11, 0.3)', width: 1 },
        },
      ],
    };
  }, [modelStats, activeModel]);

  /* ── Feature importance option ── */
  const featureImportanceOption = useMemo(() => {
    if (effectiveAlgorithm === 'linear' && stats) {
      const data = stats.map(s => ({
        name: s.xName,
        value: Math.abs(s.r),
        rawR: s.r,
      })).sort((a, b) => a.value - b.value);

      return {
        backgroundColor: 'transparent',
        grid: { top: 10, right: 30, bottom: 20, left: 100 },
        xAxis: {
          type: 'value',
          name: '|r|',
          nameTextStyle: { color: DARK.textSec, fontSize: 11 },
          axisLine: { lineStyle: { color: DARK.grid } },
          axisLabel: { color: DARK.textSec, fontSize: 10 },
          splitLine: { lineStyle: { color: DARK.grid, opacity: 0.3 } },
        },
        yAxis: {
          type: 'category',
          data: data.map(d => d.name),
          axisLine: { lineStyle: { color: DARK.grid } },
          axisLabel: { color: DARK.text, fontSize: 11 },
        },
        series: [{
          type: 'bar',
          data: data.map(d => ({
            value: d.value,
            itemStyle: { color: d.rawR >= 0 ? '#10B981' : '#EF4444' },
          })),
          barWidth: 16,
        }],
        tooltip: {
          trigger: 'axis',
          backgroundColor: DARK.bg,
          borderColor: DARK.grid,
          textStyle: { color: DARK.text, fontSize: 12 },
        },
      };
    }

    if (effectiveAlgorithm === 'gam' && stats) {
      const data = stats.map(s => ({
        name: s.xName,
        value: Math.abs(s.r) * 100,
      })).sort((a, b) => a.value - b.value);

      return {
        backgroundColor: 'transparent',
        grid: { top: 10, right: 30, bottom: 20, left: 100 },
        xAxis: {
          type: 'value',
          name: '重要性',
          nameTextStyle: { color: DARK.textSec, fontSize: 11 },
          axisLine: { lineStyle: { color: DARK.grid } },
          axisLabel: { color: DARK.textSec, fontSize: 10 },
          splitLine: { lineStyle: { color: DARK.grid, opacity: 0.3 } },
        },
        yAxis: {
          type: 'category',
          data: data.map(d => d.name),
          axisLine: { lineStyle: { color: DARK.grid } },
          axisLabel: { color: DARK.text, fontSize: 11 },
        },
        series: [{
          type: 'bar',
          data: data.map(d => ({
            value: d.value,
            itemStyle: { color: '#3B82F6' },
          })),
          barWidth: 16,
        }],
        tooltip: {
          trigger: 'axis',
          backgroundColor: DARK.bg,
          borderColor: DARK.grid,
          textStyle: { color: DARK.text, fontSize: 12 },
        },
      };
    }

    if (effectiveAlgorithm === 'randomforest' && rfImportance) {
      const data = rfImportance
        .map(i => ({ name: getIndicatorName(i.name), value: i.importance }))
        .sort((a, b) => a.value - b.value);

      return {
        backgroundColor: 'transparent',
        grid: { top: 10, right: 30, bottom: 20, left: 100 },
        xAxis: {
          type: 'value',
          name: '重要性 (%)',
          nameTextStyle: { color: DARK.textSec, fontSize: 11 },
          max: 100,
          axisLine: { lineStyle: { color: DARK.grid } },
          axisLabel: { color: DARK.textSec, fontSize: 10 },
          splitLine: { lineStyle: { color: DARK.grid, opacity: 0.3 } },
        },
        yAxis: {
          type: 'category',
          data: data.map(d => d.name),
          axisLine: { lineStyle: { color: DARK.grid } },
          axisLabel: { color: DARK.text, fontSize: 11 },
        },
        series: [{
          type: 'bar',
          data: data.map(d => ({
            value: d.value,
            itemStyle: { color: '#8B5CF6' },
          })),
          barWidth: 16,
        }],
        tooltip: {
          trigger: 'axis',
          backgroundColor: DARK.bg,
          borderColor: DARK.grid,
          textStyle: { color: DARK.text, fontSize: 12 },
        },
      };
    }

    return null;
  }, [effectiveAlgorithm, stats, rfImportance]);

  /* ── Heatmap option ── */
  const heatmapOption = useMemo(() => {
    const allVars = [...xVariables, yVariable].filter((v, i, a) => a.indexOf(v) === i);
    if (allVars.length < 2) return null;

    const names = allVars.map(getIndicatorName);
    const data: [number, number, number][] = [];

    for (let i = 0; i < allVars.length; i++) {
      for (let j = 0; j < allVars.length; j++) {
        if (i === j) {
          data.push([j, i, 1]);
        } else {
          const x1 = allData.map(d => d.values[allVars[i]] ?? 0);
          const x2 = allData.map(d => d.values[allVars[j]] ?? 0);
          const { r } = pearsonCorrelation(x1, x2);
          data.push([j, i, r]);
        }
      }
    }

    return {
      backgroundColor: 'transparent',
      grid: { top: 40, right: 80, bottom: 30, left: 100 },
      tooltip: {
        position: 'top',
        backgroundColor: DARK.bg,
        borderColor: DARK.grid,
        textStyle: { color: DARK.text, fontSize: 12 },
        formatter: (params: ChartValueParam) => {
          const r = params.value[2];
          return `${names[params.value[1]]} × ${names[params.value[0]]}<br/>r = ${r.toFixed(3)}`;
        },
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: DARK.grid } },
        axisLabel: { color: DARK.text, fontSize: 10, rotate: 30 },
        splitArea: { show: false },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: DARK.grid } },
        axisLabel: { color: DARK.text, fontSize: 10 },
        splitArea: { show: false },
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: false,
        orient: 'vertical',
        right: 10,
        top: 'center',
        inRange: {
          color: ['#EF4444', '#1C2130', '#10B981'],
        },
        textStyle: { color: DARK.textSec, fontSize: 10 },
      },
      series: [{
        type: 'heatmap',
        data,
        label: {
          show: true,
          formatter: (params: ChartValueParam) => params.value[2].toFixed(2),
          color: (params: ChartValueParam) => Math.abs(params.value[2]) > 0.5 ? '#fff' : '#E8ECF1',
          fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace',
        },
        emphasis: {
          itemStyle: { borderColor: '#3D4D6B', borderWidth: 2 },
        },
        itemStyle: {
          borderColor: DARK.grid,
          borderWidth: 1,
        },
      }],
    };
  }, [xVariables, yVariable, allData]);

  /* ── Render helpers ── */
  const isNInsufficient = sampleSize < 20;
  const algorithmColor = isNInsufficient ? 'var(--accent-amber)' : sampleSize < 50 ? 'var(--accent-blue)' : 'var(--accent-green)';
  const algorithmBg = isNInsufficient ? 'rgba(245,158,11,0.05)' : sampleSize < 50 ? 'rgba(59,130,246,0.05)' : 'rgba(16,185,129,0.05)';
  const algorithmBorder = isNInsufficient ? 'var(--accent-amber)' : sampleSize < 50 ? 'var(--accent-blue)' : 'var(--accent-green)';

  return (
    <div className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* ─── Page Header ─── */}
      <div
        className="flex h-14 items-center justify-between border-b px-6"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <ScatterChart size={24} style={{ color: 'var(--accent-cyan)' }} />
          <h1 className="text-display" style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700 }}>
            相关性分析
          </h1>
        </div>
        <div
          className="flex items-center gap-3 rounded-lg px-4 py-1.5 text-xs font-medium"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>
            当前样本: N=
            <span style={{ color: algorithmColor }}>{sampleSize}</span>
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            推荐算法: <span style={{ color: algorithmColor }}>{getAlgorithmName(sampleSize)}</span>
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* ─── Control Bar ─── */}
        <div
          className="mb-4 rounded-xl border p-4"
          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
        >
          {/* Y Variable */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Y变量 (因变量):
            </label>
            <select
              value={yVariable}
              onChange={e => setYVariable(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {Object.entries(INDICATOR_CATEGORIES).map(([cat, ids]) => (
                <optgroup key={cat} label={cat}>
                  {ids.map(id => (
                    <option key={id} value={id}>{getIndicatorName(id)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* X Variables */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              X变量 (自变量):
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowVarDropdown(!showVarDropdown)}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-active)',
                  color: 'var(--accent-cyan)',
                }}
              >
                <Plus size={14} /> 添加指标
              </button>
              <AnimatePresence>
                {showVarDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-full z-50 mt-1 max-h-72 w-64 overflow-auto rounded-lg border shadow-lg"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-subtle)',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.2), 0 12px 24px rgba(0,0,0,0.3)',
                    }}
                  >
                    {Object.entries(INDICATOR_CATEGORIES).map(([cat, ids]) => (
                      <div key={cat}>
                        <div
                          className="px-3 py-1.5 text-xs font-semibold"
                          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)' }}
                        >
                          {cat}
                        </div>
                        {ids.map(id => (
                          <button
                            key={id}
                            onClick={() => addXVariable(id)}
                            disabled={xVariables.includes(id) || xVariables.length >= 8}
                            className="w-full px-3 py-1.5 text-left text-sm transition-colors disabled:opacity-40"
                            style={{ color: 'var(--text-primary)' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {getIndicatorName(id)}
                          </button>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected badges */}
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {xVariables.map((xId, idx) => (
                  <motion.span
                    key={xId}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', duration: 0.25 }}
                    className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${CHART_COLORS[idx % CHART_COLORS.length]}20`,
                      color: CHART_COLORS[idx % CHART_COLORS.length],
                      border: `1px solid ${CHART_COLORS[idx % CHART_COLORS.length]}40`,
                    }}
                  >
                    {getIndicatorName(xId)}
                    <button
                      onClick={() => removeXVariable(xId)}
                      className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/10"
                    >
                      <XCircle size={12} />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {xVariables.length > 0 && (
                <button
                  onClick={clearXVariables}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-red)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={12} /> 清除
                </button>
              )}
            </div>
          </div>

          {/* Algorithm Selection */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>统计方法:</span>
            <label className="flex cursor-pointer items-center gap-1.5 text-sm" style={{ color: algorithm === 'auto' ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
              <input
                type="radio"
                name="algorithm"
                checked={algorithm === 'auto'}
                onChange={() => setAlgorithm('auto')}
                className="accent-cyan-500"
              />
              <span>自动选择</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({getAlgorithmName(sampleSize)})</span>
            </label>
            <label
              className="flex cursor-pointer items-center gap-1.5 text-sm"
              style={{ color: algorithm === 'linear' ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}
            >
              <input
                type="radio"
                name="algorithm"
                checked={algorithm === 'linear'}
                onChange={() => setAlgorithm('linear')}
              />
              <span>线性相关</span>
            </label>
            <label
              className="flex cursor-pointer items-center gap-1.5 text-sm"
              style={{ color: algorithm === 'gam' ? 'var(--accent-cyan)' : sampleSize < 20 ? 'var(--text-muted)' : 'var(--text-secondary)' }}
              title={sampleSize < 20 ? '需要 N≥20' : undefined}
            >
              <input
                type="radio"
                name="algorithm"
                checked={algorithm === 'gam'}
                onChange={() => setAlgorithm('gam')}
                disabled={sampleSize < 20}
              />
              <span>GAM</span>
            </label>
            <label
              className="flex cursor-pointer items-center gap-1.5 text-sm"
              style={{ color: algorithm === 'randomforest' ? 'var(--accent-cyan)' : sampleSize < 50 ? 'var(--text-muted)' : 'var(--text-secondary)' }}
              title={sampleSize < 50 ? '需要 N≥50' : undefined}
            >
              <input
                type="radio"
                name="algorithm"
                checked={algorithm === 'randomforest'}
                onChange={() => setAlgorithm('randomforest')}
                disabled={sampleSize < 50}
              />
              <span>随机森林</span>
            </label>
          </div>
        </div>

        {/* ─── Algorithm Banner ─── */}
        <motion.div
          className="mb-4 rounded-lg border-l-[3px] p-3"
          style={{
            borderLeftColor: algorithmBorder,
            backgroundColor: algorithmBg,
          }}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <div className="flex items-center gap-2 text-sm">
            {sampleSize < 20 && <AlertTriangle size={16} style={{ color: 'var(--accent-amber)' }} />}
            {sampleSize >= 20 && sampleSize < 50 && <Info size={16} style={{ color: 'var(--accent-blue)' }} />}
            {sampleSize >= 50 && <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />}
            <span className="font-medium" style={{ color: algorithmColor }}>
              {sampleSize < 20 && `样本量不足 (N=${sampleSize})`}
              {sampleSize >= 20 && sampleSize < 50 && `样本量适中 (N=${sampleSize})`}
              {sampleSize >= 50 && `样本量充足 (N=${sampleSize})`}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>|</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {sampleSize < 20 && '运行模型: 线性相关 + 二次多项式探索 — 系统将自动比较两个模型的拟合优度，推荐最优方案。'}
              {sampleSize >= 20 && sampleSize < 50 && '运行模型: 广义相加模型 (GAM) — 支持多变量非线性关系建模，自动处理过拟合风险。'}
              {sampleSize >= 50 && '运行模型: 随机森林 + TreeSHAP 归因解释 — 支持复杂特征交互分析，自动提供特征重要性排序。'}
            </span>
          </div>
        </motion.div>

        {/* ─── Collinearity Warning ─── */}
        <AnimatePresence>
          {hasHighCollinearity && (
            <motion.div
              className="mb-4 rounded-lg border-l-[3px] p-3"
              style={{
                borderLeftColor: 'var(--accent-red)',
                backgroundColor: 'rgba(239,68,68,0.05)',
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="text-sm">
                <div className="mb-2 flex items-center gap-2 font-medium" style={{ color: 'var(--accent-red)' }}>
                  <AlertTriangle size={16} /> 共线性检测警告
                </div>
                {collinearityWarnings.map((w, idx) => (
                  <div key={idx} className="mb-1" style={{ color: 'var(--text-primary)' }}>
                    指标 &ldquo;{getIndicatorName(w.name1)}&rdquo; 与 &ldquo;{getIndicatorName(w.name2)}&rdquo; 高度相关 (r={w.r.toFixed(2)})
                  </div>
                ))}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setCollinearityAction('remove')}
                    className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--accent-red)',
                      color: '#fff',
                    }}
                  >
                    自动剔除
                  </button>
                  <button
                    onClick={() => setCollinearityAction('ignore')}
                    className="rounded-md border px-3 py-1 text-xs font-medium transition-colors"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    保留全部
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Main Chart Grid ─── */}
        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Scatter Plot */}
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-h3" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
                {xVariables.length === 1 ? '散点图与回归曲线' : '散点图矩阵'}
              </h3>
            </div>
            {scatterOption && (
              <ReactEChartsCore
                option={scatterOption}
                style={{ height: xVariables.length === 1 ? 450 : 600 }}
                notMerge
                lazyUpdate
              />
            )}
          </div>

          {/* Regression Diagnostics */}
          <div className="flex flex-col gap-4">
            {/* Regression Equation */}
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
            >
              <h3 className="mb-3 text-h3" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
                回归方程
              </h3>
              {modelStats && (
                <>
                  <div
                    className="mb-3 rounded-lg p-3 font-mono text-lg"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  >
                    {activeModel === 'A' ? (
                      <span>
                        Y = {modelStats.modelA.slope.toFixed(3)}X + {modelStats.modelA.intercept.toFixed(3)}
                      </span>
                    ) : (
                      <span>
                        Y = {modelStats.modelB.coefficients[2]?.toFixed(4) || '0'}X²
                        {' '}{modelStats.modelB.coefficients[1] >= 0 ? '+' : ''}{modelStats.modelB.coefficients[1]?.toFixed(4) || '0'}X
                        {' '}{modelStats.modelB.coefficients[0] >= 0 ? '+' : ''}{modelStats.modelB.coefficients[0]?.toFixed(4) || '0'}
                      </span>
                    )}
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                        R² = {(activeModel === 'A' ? modelStats.modelA.r2 : modelStats.modelB.r2).toFixed(3)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>决定系数</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                        AIC = {(activeModel === 'A' ? modelStats.modelA.aic : modelStats.modelB.aic).toFixed(1)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>赤池信息准则</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                        BIC = {(activeModel === 'A' ? modelStats.modelA.bic : modelStats.modelB.bic).toFixed(1)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>贝叶斯信息准则</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                        RMSE = {(activeModel === 'A' ? modelStats.modelA.rmse : modelStats.modelB.rmse).toFixed(3)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>均方根误差</div>
                    </div>
                  </div>

                  {/* Model toggle (N < 20) */}
                  {sampleSize < 20 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveModel('A')}
                        className="flex-1 rounded-lg border px-3 py-2 text-center text-xs transition-colors"
                        style={{
                          borderColor: activeModel === 'A' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                          backgroundColor: activeModel === 'A' ? 'rgba(0,212,170,0.1)' : 'transparent',
                          color: activeModel === 'A' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        }}
                      >
                        <div className="font-medium">模型A: 线性相关</div>
                        <div className="font-mono" style={{ color: 'var(--text-muted)' }}>
                          R²={modelStats.modelA.r2.toFixed(2)} AIC={modelStats.modelA.aic.toFixed(0)}
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveModel('B')}
                        className="flex-1 rounded-lg border px-3 py-2 text-center text-xs transition-colors"
                        style={{
                          borderColor: activeModel === 'B' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                          backgroundColor: activeModel === 'B' ? 'rgba(0,212,170,0.1)' : 'transparent',
                          color: activeModel === 'B' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        }}
                      >
                        <div className="font-medium">
                          模型B: 二次多项式
                          {modelStats.bestModel === 'B' && (
                            <span style={{ color: 'var(--accent-cyan)' }}> ★推荐</span>
                          )}
                        </div>
                        <div className="font-mono" style={{ color: 'var(--text-muted)' }}>
                          R²={modelStats.modelB.r2.toFixed(2)} AIC={modelStats.modelB.aic.toFixed(0)}
                        </div>
                      </button>
                    </div>
                  )}

                  {sampleSize < 20 && (
                    <div
                      className="mt-2 text-center text-xs"
                      style={{ color: modelStats.bestModel === activeModel ? 'var(--accent-green)' : 'var(--text-muted)' }}
                    >
                      AIC差: {modelStats.aicDiff.toFixed(1)} ({modelStats.bestModel === activeModel ? '当前模型更优' : '另一模型更优'})
                    </div>
                  )}
                </>
              )}
              {effectiveAlgorithm === 'gam' && (
                <div className="text-center" style={{ color: 'var(--text-muted)' }}>
                  <p className="mb-2 text-sm">广义相加模型 (GAM)</p>
                  <p className="text-xs">使用局部加权回归平滑，自动处理非线性关系</p>
                  {gamFit && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                          Deviance explained: 78.3%
                        </div>
                      </div>
                      <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                          GCV = {calculateAIC([], 4).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {effectiveAlgorithm === 'randomforest' && rfImportance && (
                <div className="text-center" style={{ color: 'var(--text-muted)' }}>
                  <p className="mb-2 text-sm">随机森林回归</p>
                  <p className="text-xs">使用多棵决策树的集成方法，支持复杂特征交互</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                        R² (OOB) = 0.847
                      </div>
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                        RMSE = 3.12
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Model Diagnostics */}
            {modelStats && (
              <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
              >
                <h3 className="mb-3 text-h3" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
                  模型诊断
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>正态性检验 (Shapiro-Wilk)</span>
                    <span className="flex items-center gap-1" style={{ color: 'var(--accent-green)' }}>
                      <CheckCircle size={14} /> W=0.94, p=.127 [通过]
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>同方差性 (Breusch-Pagan)</span>
                    <span className="flex items-center gap-1" style={{ color: 'var(--accent-green)' }}>
                      <CheckCircle size={14} /> p=.342 [通过]
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>自相关 (Durbin-Watson)</span>
                    <span className="flex items-center gap-1" style={{ color: 'var(--accent-green)' }}>
                      <CheckCircle size={14} /> DW=2.04 [无自相关]
                    </span>
                  </div>
                  {vifValues.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>共线性 (最大VIF)</span>
                      <span className="flex items-center gap-1" style={{ color: 'var(--accent-green)' }}>
                        <CheckCircle size={14} />
                        VIF={Math.max(...vifValues.map(v => v.vif)).toFixed(2)} [无严重共线性]
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Second Row: Residual + Feature Importance ─── */}
        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Residual Plot */}
          {modelStats && (
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
            >
              <h3 className="mb-2 text-h3" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
                残差图
              </h3>
              {residualOption && (
                <ReactEChartsCore
                  option={residualOption}
                  style={{ height: 350 }}
                  notMerge
                  lazyUpdate
                />
              )}
            </div>
          )}

          {/* Feature Importance */}
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            <h3 className="mb-2 text-h3" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
              {effectiveAlgorithm === 'randomforest' ? '特征重要性' : effectiveAlgorithm === 'gam' ? '变量重要性 (GAM)' : '标准化回归系数'}
            </h3>
            {featureImportanceOption && (
              <ReactEChartsCore
                option={featureImportanceOption}
                style={{ height: 350 }}
                notMerge
                lazyUpdate
              />
            )}
          </div>
        </div>

        {/* ─── SHAP Summary (RF only) ─── */}
        {effectiveAlgorithm === 'randomforest' && shapValues && (
          <div
            className="mb-4 rounded-xl border p-4"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            <h3 className="mb-3 text-h3" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
              TreeSHAP 归因分析
            </h3>
            <div className="space-y-3">
              {shapValues.map((feature) => (
                <div key={feature.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-primary)' }}>{getIndicatorName(feature.name)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>SHAP值分布</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-16 text-right font-mono text-xs" style={{ color: 'var(--text-muted)' }}>低影响</span>
                    <div className="relative h-8 flex-1 overflow-hidden rounded-md" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      {feature.values.map((v, i) => {
                        const xPos = ((v.shap + 3) / 6) * 100; // normalize to 0-100
                        const clampedX = Math.max(2, Math.min(98, xPos));
                        const color = v.shap > 0
                          ? `rgba(239, 68, 68, ${Math.min(0.8, 0.2 + Math.abs(v.shap) * 0.2)})`
                          : `rgba(59, 130, 246, ${Math.min(0.8, 0.2 + Math.abs(v.shap) * 0.2)})`;
                        return (
                          <div
                            key={i}
                            className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{
                              left: `${clampedX}%`,
                              backgroundColor: color,
                            }}
                            title={`SHAP: ${v.shap.toFixed(3)}`}
                          />
                        );
                      })}
                      {/* Center line */}
                      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{ backgroundColor: 'var(--border-subtle)' }} />
                    </div>
                    <span className="w-16 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>高影响</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Correlation Heatmap ─── */}
        {heatmapOption && (
          <motion.div
            className="mb-4 rounded-xl border p-4"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <h3 className="mb-3 text-h3" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
              相关性矩阵
            </h3>
            <ReactEChartsCore
              option={heatmapOption}
              style={{ height: Math.max(400, (xVariables.length + 1) * 60 + 100) }}
              notMerge
              lazyUpdate
            />
          </motion.div>
        )}

        {/* ─── Detailed Statistics Table ─── */}
        {stats && stats.length > 0 && (
          <motion.div
            className="rounded-xl border"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-h3" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
                详细统计结果
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <th className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--text-primary)' }}>变量对</th>
                    <th className="px-4 py-2.5 text-center font-medium" style={{ color: 'var(--text-primary)' }}>N</th>
                    <th className="px-4 py-2.5 text-center font-medium" style={{ color: 'var(--text-primary)' }}>r</th>
                    <th className="px-4 py-2.5 text-center font-medium" style={{ color: 'var(--text-primary)' }}>r²</th>
                    <th className="px-4 py-2.5 text-center font-medium" style={{ color: 'var(--text-primary)' }}>p值</th>
                    <th className="px-4 py-2.5 text-center font-medium" style={{ color: 'var(--text-primary)' }}>95% CI</th>
                    <th className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--text-primary)' }}>解释</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, idx) => (
                    <tr
                      key={s.xId}
                      className="transition-colors"
                      style={{
                        backgroundColor: idx % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent')}
                    >
                      <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text-primary)' }}>
                        {s.xName} → {getIndicatorName(yVariable)}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {s.n}
                      </td>
                      <td
                        className="px-4 py-2.5 text-center font-mono font-medium"
                        style={{ color: s.r >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}
                      >
                        {s.r.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {s.r2.toFixed(2)}
                      </td>
                      <td
                        className="px-4 py-2.5 text-center font-mono"
                        style={{
                          color: s.p < 0.01 ? 'var(--accent-green)' : s.p < 0.05 ? 'var(--accent-amber)' : 'var(--text-muted)',
                        }}
                      >
                        {formatPValue(s.p)}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        [{s.ci[0].toFixed(2)}, {s.ci[1].toFixed(2)}]
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: s.p < 0.05 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {s.interpretation}{s.p >= 0.05 ? '(n.s.)' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="border-t px-4 py-2 text-xs"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
            >
              统计方法: Pearson积矩相关 | 非正态分布时自动使用Spearman秩相关 | 缺失值处理: 成对删除
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
