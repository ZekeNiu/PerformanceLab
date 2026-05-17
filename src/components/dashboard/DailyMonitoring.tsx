import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import DashboardCard from './DashboardCard'
import { dailyData, bodyParts, calculateEMA } from './data'

/* ─── Injury Body Map ─── */
function InjuryBodyMap() {
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [view, setView] = useState<'front' | 'back'>('front')

  const getDotColor = (score: number) => {
    if (score === 0) return '#10B981'
    if (score <= 5) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Body map */}
      <div className="relative mx-auto flex flex-col items-center">
        <div className="mb-2 flex gap-2">
          <button
            onClick={() => setView('front')}
            className="rounded px-2 py-1 text-[11px]"
            style={{
              backgroundColor: view === 'front' ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
              color: view === 'front' ? '#0B0E14' : 'var(--text-secondary)',
            }}
          >
            前视
          </button>
          <button
            onClick={() => setView('back')}
            className="rounded px-2 py-1 text-[11px]"
            style={{
              backgroundColor: view === 'back' ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
              color: view === 'back' ? '#0B0E14' : 'var(--text-secondary)',
            }}
          >
            后视
          </button>
        </div>
        <div className="relative" style={{ width: 280, height: 420 }}>
          <img
            src={`${import.meta.env.BASE_URL}${view === 'front' ? 'body-map-front.png' : 'body-map-back.png'}`}
            alt="body map"
            className="h-full w-full object-contain"
            style={{ opacity: 0.7 }}
          />
          {bodyParts.map((part) => (
            <button
              key={part.name}
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-all duration-300"
              style={{
                left: `${part.x}%`,
                top: `${part.y}%`,
                backgroundColor: getDotColor(part.score),
                boxShadow: `0 0 8px ${getDotColor(part.score)}40`,
                transform: selectedPart === part.name ? 'translate(-50%, -50%) scale(1.5)' : 'translate(-50%, -50%) scale(1)',
              }}
              onClick={() => setSelectedPart(part.name === selectedPart ? null : part.name)}
              title={`${part.name}: ${part.score}/10`}
            />
          ))}
        </div>
      </div>

      {/* Injury details panel */}
      <div className="flex-1 space-y-2">
        <p className="mb-3 text-h3" style={{ color: 'var(--text-primary)' }}>
          2024-01-15 伤病详情
        </p>
        <div className="max-h-[320px] space-y-2 overflow-auto pr-2">
          {[...bodyParts]
            .sort((a, b) => b.score - a.score)
            .map((part) => (
              <div
                key={part.name}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
                style={{
                  backgroundColor: selectedPart === part.name ? 'var(--bg-hover)' : 'transparent',
                }}
              >
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: getDotColor(part.score) }}
                />
                <span className="w-20 text-[12px]" style={{ color: 'var(--text-primary)' }}>
                  {part.name}
                </span>
                <span className="text-data-md w-10 text-center text-[14px]">
                  {part.score}
                </span>
                <div className="flex flex-1 gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className="h-2 flex-1 rounded-sm"
                      style={{
                        backgroundColor:
                          i < part.score ? getDotColor(part.score) : 'var(--bg-hover)',
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
        <div className="mt-2 flex gap-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#10B981' }} />
            正常 (0)
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
            受限 (1-5)
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
            缺席 (6-10)
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Line chart card (HRV, RHR) ─── */
function LineCard({
  title,
  dataKey,
  color,
  unit,
}: {
  title: string
  dataKey: 'hrv' | 'rhr'
  color: string
  unit: string
}) {
  const option = useMemo(() => {
    const values = dailyData.map((d) => d[dataKey])
    const ema = calculateEMA(values, 7)
    const sd = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - values.reduce((a, b) => a + b, 0) / values.length, 2), 0) /
        values.length,
    )
    const emaMean = ema[ema.length - 1]

    return {
      grid: { top: 20, right: 16, bottom: 48, left: 48 },
      xAxis: {
        type: 'category' as const,
        data: dailyData.map((d) => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#2A3348' } },
        axisLabel: { color: '#5A6579', fontSize: 10, rotate: 45 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(42,51,72,0.5)' } },
        axisLabel: { color: '#5A6579', fontSize: 10, fontFamily: 'JetBrains Mono' },
      },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#1C2130',
        borderColor: '#2A3348',
        textStyle: { color: '#E8ECF1', fontSize: 11 },
        formatter: (params: Array<{ axisValue: string; value: number; seriesName: string; dataIndex: number }>) => {
          const val = params[0]
          const deviation = val.value - emaMean
          const isAlert = Math.abs(deviation) > sd
          return `<div style="font-weight:600;margin-bottom:4px">${val.axisValue}</div>
            <div>${val.seriesName}: <span style="font-family:JetBrains Mono;font-weight:500">${val.value} ${unit}</span></div>
            <div>EMA(7): <span style="font-family:JetBrains Mono">${Math.round(ema[val.dataIndex] * 10) / 10}</span></div>
            ${isAlert ? '<div style="color:#EF4444;margin-top:4px">超出 ±1σ 范围</div>' : ''}`
        },
      },
      series: [
        {
          name: title.split(' ')[0],
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: (val: number) => {
            return Math.abs(val - emaMean) > sd ? 8 : 4
          },
          itemStyle: {
            color: (p: { value: number }) =>
              Math.abs(p.value - emaMean) > sd ? '#EF4444' : color,
            shadowBlur: (p: { value: number }) =>
              Math.abs(p.value - emaMean) > sd ? 12 : 0,
            shadowColor: '#EF4444',
          },
          lineStyle: { color, width: 2 },
        },
        {
          name: 'EMA(7)',
          type: 'line',
          data: ema,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#F59E0B', width: 1.5, type: [4, 4] as [number, number] },
        },
      ],
      animationDuration: 800,
      animationEasing: 'cubicOut',
    }
  }, [dataKey, title, color, unit])

  return (
    <DashboardCard
      title={title}
      configOptions={[
        { label: 'HRV (心率变异性)', value: 'hrv' },
        { label: 'RHR (静息心率)', value: 'rhr' },
        { label: '准备状态', value: 'readiness' },
      ]}
      currentConfig={dataKey}
    >
      <ReactECharts option={option} style={{ height: 200 }} />
    </DashboardCard>
  )
}

/* ─── Readiness Card ─── */
function ReadinessCard() {
  const option = useMemo(() => {
    return {
      grid: { top: 20, right: 16, bottom: 56, left: 40 },
      xAxis: {
        type: 'category' as const,
        data: dailyData.map((d) => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#2A3348' } },
        axisLabel: { color: '#5A6579', fontSize: 10, rotate: 45 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        max: 10,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(42,51,72,0.5)' } },
        axisLabel: { color: '#5A6579', fontSize: 10 },
      },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#1C2130',
        borderColor: '#2A3348',
        textStyle: { color: '#E8ECF1', fontSize: 11 },
      },
      legend: {
        data: ['压力', '睡眠', '能量', '酸痛', '信心', '综合'],
        bottom: 0,
        textStyle: { color: '#5A6579', fontSize: 10 },
        itemWidth: 10,
        itemHeight: 6,
      },
      series: [
        { name: '压力', type: 'bar', stack: 'readiness', data: dailyData.map((d) => d.stress), itemStyle: { color: 'rgba(239,68,68,0.5)' } },
        { name: '睡眠', type: 'bar', stack: 'readiness', data: dailyData.map((d) => d.sleep), itemStyle: { color: 'rgba(59,130,246,0.5)' } },
        { name: '能量', type: 'bar', stack: 'readiness', data: dailyData.map((d) => d.energy), itemStyle: { color: 'rgba(16,185,129,0.5)' } },
        { name: '酸痛', type: 'bar', stack: 'readiness', data: dailyData.map((d) => d.soreness), itemStyle: { color: 'rgba(245,158,11,0.5)' } },
        { name: '信心', type: 'bar', stack: 'readiness', data: dailyData.map((d) => d.confidence), itemStyle: { color: 'rgba(139,92,246,0.5)' } },
        { name: '综合', type: 'line', data: dailyData.map((d) => d.readiness), smooth: true, lineStyle: { color: '#00D4AA', width: 2 }, itemStyle: { color: '#00D4AA' }, symbol: 'diamond', symbolSize: 5 },
      ],
      animationDuration: 800,
    }
  }, [])

  return (
    <DashboardCard
      title="准备状态"
      configOptions={[
        { label: '整体准备状态', value: 'readiness' },
        { label: 'HRV', value: 'hrv' },
        { label: 'RHR', value: 'rhr' },
      ]}
      currentConfig="readiness"
    >
      <ReactECharts option={option} style={{ height: 200 }} />
    </DashboardCard>
  )
}

/* ─── ACWR Card ─── */
function ACWRCard() {
  const hasEnoughData = dailyData.length >= 28

  const option = useMemo(() => {
    const dataPoints = dailyData.map((d) => d.acwr)

    return {
      grid: { top: 20, right: 16, bottom: 48, left: 44 },
      xAxis: {
        type: 'category' as const,
        data: dailyData.map((d) => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#2A3348' } },
        axisLabel: { color: '#5A6579', fontSize: 10, rotate: 45 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        min: 0,
        max: 2,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(42,51,72,0.5)' } },
        axisLabel: { color: '#5A6579', fontSize: 10, fontFamily: 'JetBrains Mono' },
      },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#1C2130',
        borderColor: '#2A3348',
        textStyle: { color: '#E8ECF1', fontSize: 11 },
        formatter: (params: Array<{ value: number }>) => {
          const val = params[0].value
          let zone = '最优区间'
          let zoneColor = '#10B981'
          if (val < 0.8 || val > 1.5) { zone = '高风险'; zoneColor = '#EF4444' }
          else if (val >= 1.3) { zone = '警戒区间'; zoneColor = '#F59E0B' }
          return `<div style="font-family:JetBrains Mono;font-weight:500">ACWR: ${val}</div>
            <div style="color:${zoneColor};margin-top:4px">${zone}</div>`
        },
      },
      series: [
        {
          name: 'ACWR',
          type: 'line',
          data: dataPoints,
          smooth: true,
          symbol: 'circle',
          symbolSize: (val: number) => (val < 0.8 || val > 1.3 ? 6 : 3),
          itemStyle: {
            color: '#00D4AA',
          },
          lineStyle: { color: '#00D4AA', width: 2 },
          markLine: {
            silent: true,
            lineStyle: { color: '#5A6579', type: [3, 3] as [number, number], width: 1 },
            data: [{ yAxis: 0.8 }, { yAxis: 1.0 }, { yAxis: 1.3 }, { yAxis: 1.5 }],
            label: { show: false },
          },
        },
      ],
      animationDuration: 800,
    }
  }, [])

  return (
    <DashboardCard
      title="ACWR 训练负荷比"
      configOptions={[
        { label: 'ACWR 训练负荷比', value: 'acwr' },
        { label: '训练负荷明细', value: 'load' },
        { label: '训练单调性', value: 'monotony' },
      ]}
      currentConfig="acwr"
    >
      <div style={{ position: 'relative' }}>
        {!hasEnoughData && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(11,14,20,0.7)' }}
          >
            <p className="text-h3" style={{ color: 'var(--text-secondary)' }}>
              基线数据积累中（目前 {dailyData.length}/28 天）
            </p>
            <div
              className="mt-3 h-2 w-48 overflow-hidden rounded-full"
              style={{ backgroundColor: 'var(--bg-hover)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(dailyData.length / 28) * 100}%`,
                  backgroundColor: 'var(--accent-cyan)',
                }}
              />
            </div>
          </div>
        )}
        {/* Zone backgrounds */}
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: 44, right: 16, top: 20, bottom: 48 }}>
            <div style={{ height: '40%', backgroundColor: 'rgba(245,158,11,0.08)' }} />
            <div style={{ height: '25%', backgroundColor: 'rgba(16,185,129,0.08)' }} />
            <div style={{ height: '10%', backgroundColor: 'rgba(245,158,11,0.08)' }} />
            <div style={{ height: '25%', backgroundColor: 'rgba(239,68,68,0.08)' }} />
          </div>
        </div>
        <ReactECharts option={option} style={{ height: 200, opacity: hasEnoughData ? 1 : 0.3 }} />
      </div>
    </DashboardCard>
  )
}

/* ─── Subjective Metric Card ─── */
function SubjectiveCard({
  title,
  dataKey,
}: {
  title: string
  dataKey: 'sleep' | 'stress' | 'energy' | 'soreness' | 'confidence'
}) {
  const option = useMemo(() => {
    const values = dailyData.map((d) => d[dataKey])
    const ema = calculateEMA(values, 7)
    const sd = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - values.reduce((a, b) => a + b, 0) / values.length, 2), 0) /
        values.length,
    )

    return {
      grid: { top: 12, right: 12, bottom: 24, left: 32 },
      xAxis: {
        type: 'category' as const,
        data: dailyData.map((d) => d.date.slice(5)),
        show: false,
      },
      yAxis: {
        type: 'value' as const,
        min: 0,
        max: 10,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(42,51,72,0.3)' } },
        axisLabel: { color: '#5A6579', fontSize: 9 },
      },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#1C2130',
        borderColor: '#2A3348',
        textStyle: { color: '#E8ECF1', fontSize: 11 },
      },
      series: [
        {
          name: title,
          type: 'bar',
          data: values.map((v) => ({
            value: v,
            itemStyle: {
              color: Math.abs(v - ema[ema.length - 1]) > sd ? '#EF4444' : 'rgba(0,212,170,0.4)',
            },
          })),
          barWidth: '60%',
        },
        {
          name: 'EMA(7)',
          type: 'line',
          data: ema,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#F59E0B', width: 1.5, type: [4, 4] as [number, number] },
        },
      ],
      animationDuration: 800,
    }
  }, [dataKey, title])

  return (
    <DashboardCard title={title}>
      <ReactECharts option={option} style={{ height: 160 }} />
    </DashboardCard>
  )
}

/* ─── Training Load Details Card ─── */
function TrainingLoadCard() {
  const option = useMemo(() => {
    return {
      grid: { top: 16, right: 16, bottom: 40, left: 40 },
      xAxis: {
        type: 'category' as const,
        data: dailyData.map((d) => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#2A3348' } },
        axisLabel: { color: '#5A6579', fontSize: 9, rotate: 45 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(42,51,72,0.5)' } },
        axisLabel: { color: '#5A6579', fontSize: 10, fontFamily: 'JetBrains Mono' },
      },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#1C2130',
        borderColor: '#2A3348',
        textStyle: { color: '#E8ECF1', fontSize: 11 },
      },
      legend: {
        data: ['低强度', '中强度', '高强度', 'sRPE'],
        bottom: 0,
        textStyle: { color: '#5A6579', fontSize: 9 },
        itemWidth: 8,
        itemHeight: 5,
      },
      series: [
        {
          name: '低强度',
          type: 'bar',
          stack: 'load',
          data: dailyData.map((d) => Math.round(d.load * 0.4)),
          itemStyle: { color: 'rgba(16,185,129,0.5)' },
        },
        {
          name: '中强度',
          type: 'bar',
          stack: 'load',
          data: dailyData.map((d) => Math.round(d.load * 0.35)),
          itemStyle: { color: 'rgba(245,158,11,0.5)' },
        },
        {
          name: '高强度',
          type: 'bar',
          stack: 'load',
          data: dailyData.map((d) => Math.round(d.load * 0.25)),
          itemStyle: { color: 'rgba(239,68,68,0.5)' },
        },
        {
          name: 'sRPE',
          type: 'line',
          data: dailyData.map((d) => d.sRPE),
          smooth: true,
          lineStyle: { color: '#8B5CF6', width: 2 },
          itemStyle: { color: '#8B5CF6' },
          symbol: 'circle',
          symbolSize: 3,
        },
      ],
      animationDuration: 800,
    }
  }, [])

  return (
    <DashboardCard title="训练负荷明细">
      <ReactECharts option={option} style={{ height: 180 }} />
      <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <MetricBlock label="训练单调性" value="1.42" alert />
        <MetricBlock label="训练应变" value="847" />
        <MetricBlock label="EWM(7)" value="65.3" />
      </div>
    </DashboardCard>
  )
}

function MetricBlock({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-data-md text-[16px]" style={{ color: alert ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
        {value}
        {alert && ' ⚠️'}
      </span>
    </div>
  )
}

/* ─── Training Monotony Card ─── */
function MonotonyCard() {
  const option = useMemo(() => {
    return {
      grid: { top: 12, right: 12, bottom: 24, left: 32 },
      xAxis: {
        type: 'category' as const,
        data: dailyData.map((d) => d.date.slice(5)),
        show: false,
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(42,51,72,0.3)' } },
        axisLabel: { color: '#5A6579', fontSize: 9 },
      },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#1C2130',
        borderColor: '#2A3348',
        textStyle: { color: '#E8ECF1', fontSize: 11 },
      },
      series: [
        {
          name: '训练单调性',
          type: 'line',
          data: dailyData.map((d) => d.monotony),
          smooth: true,
          symbol: 'circle',
          symbolSize: (val: number) => (val > 2 ? 6 : 3),
          itemStyle: {
            color: (p: { value: number }) => (p.value > 2 ? '#EF4444' : '#00D4AA'),
          },
          lineStyle: { color: '#00D4AA', width: 2 },
          markLine: {
            silent: true,
            data: [{ yAxis: 2.0 }],
            lineStyle: { color: '#EF4444', type: [4, 4] as [number, number], width: 1 },
            label: { show: false },
          },
        },
      ],
      animationDuration: 800,
    }
  }, [])

  return (
    <DashboardCard title="训练单调性">
      <ReactECharts option={option} style={{ height: 160 }} />
    </DashboardCard>
  )
}

/* ─── Main Daily Monitoring Component ─── */
export default function DailyMonitoring() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {/* Row 1: Primary metrics */}
      <LineCard title="HRV (心率变异性)" dataKey="hrv" color="#00D4AA" unit="ms" />
      <LineCard title="RHR (静息心率)" dataKey="rhr" color="#3B82F6" unit="bpm" />
      <ReadinessCard />
      <ACWRCard />

      {/* Row 2: Injury body map - full width */}
      <div className="col-span-1 sm:col-span-2 xl:col-span-4">
        <DashboardCard title="伤病状态分布" className="p-4">
          <InjuryBodyMap />
        </DashboardCard>
      </div>

      {/* Row 3: Subjective metrics */}
      <SubjectiveCard title="睡眠质量" dataKey="sleep" />
      <SubjectiveCard title="压力水平" dataKey="stress" />
      <SubjectiveCard title="能量水平" dataKey="energy" />
      <SubjectiveCard title="肌肉酸痛" dataKey="soreness" />

      {/* Row 4: More cards */}
      <SubjectiveCard title="信心指数" dataKey="confidence" />
      <div className="col-span-1 sm:col-span-2">
        <TrainingLoadCard />
      </div>
      <MonotonyCard />
    </div>
  )
}
