import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import DashboardCard from './DashboardCard'
import { radarData, periodicCategories, ratingColors } from './data'

/* ─── Radar Chart ─── */
function RadarChart() {
  const option = useMemo(() => {
    return {
      radar: {
        indicator: radarData.map((d) => ({
          name: d.category,
          max: 100,
          nameStyle: {
            color: '#E8ECF1',
            fontSize: 13,
            fontWeight: 600,
          },
        })),
        shape: 'polygon' as const,
        splitNumber: 5,
        axisNameGap: 12,
        splitLine: {
          lineStyle: {
            color: 'rgba(42,51,72,0.6)',
            width: 1,
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(20,24,33,0.5)', 'rgba(20,24,33,0.3)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(42,51,72,0.8)',
          },
        },
      },
      series: [
        {
          name: '综合能力',
          type: 'radar',
          data: [
            {
              value: radarData.map((d) => d.score),
              name: '当前得分',
              symbol: 'circle',
              symbolSize: 8,
              lineStyle: {
                color: '#00D4AA',
                width: 2,
              },
              itemStyle: {
                color: '#00D4AA',
                borderColor: '#fff',
                borderWidth: 2,
              },
              areaStyle: {
                color: 'rgba(0,212,170,0.2)',
              },
              label: {
                show: true,
                formatter: (p: { value: number }) => p.value.toString(),
                color: '#E8ECF1',
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
                distance: 8,
              },
            },
          ],
          animationDuration: 800,
          animationEasing: 'cubicOut' as const,
          animationDelay: (idx: number) => idx * 100,
        },
      ],
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: '#1C2130',
        borderColor: '#2A3348',
        textStyle: { color: '#E8ECF1', fontSize: 12 },
        formatter: (params: { name: string; value: number[]; seriesName: string }) => {
          let html = `<div style="font-weight:600;margin-bottom:6px">${params.seriesName}</div>`
          radarData.forEach((d, i) => {
            html += `<div style="display:flex;justify-content:space-between;gap:16px">
              <span>${d.category}</span>
              <span style="font-family:JetBrains Mono;font-weight:500;color:#00D4AA">${params.value[i]}分</span>
            </div>`
          })
          return html
        },
      },
    }
  }, [])

  return (
    <DashboardCard
      title="综合能力评估"
      configOptions={[
        { label: '全部类别', value: 'all' },
        { label: '力量+速度+耐力', value: 'strength-speed-endurance' },
        { label: '自定义...', value: 'custom' },
      ]}
      currentConfig="all"
    >
      <ReactECharts option={option} style={{ height: 380 }} />
    </DashboardCard>
  )
}

/* ─── Category Detail Card ─── */
function CategoryCard({ category }: { category: (typeof periodicCategories)[0] }) {
  const avgScore = Math.round(
    category.indicators.reduce((s, ind) => s + ind.score, 0) / category.indicators.length,
  )

  const option = useMemo(() => {
    return {
      grid: { top: 8, right: 80, bottom: 16, left: 140 },
      xAxis: {
        type: 'value' as const,
        max: 100,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(42,51,72,0.3)' } },
        axisLabel: { color: '#5A6579', fontSize: 10 },
      },
      yAxis: {
        type: 'category' as const,
        data: category.indicators.map((ind) => ind.name).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#8B95A5',
          fontSize: 11,
          width: 130,
          overflow: 'truncate' as const,
        },
      },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#1C2130',
        borderColor: '#2A3348',
        textStyle: { color: '#E8ECF1', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: category.indicators.map((ind) => ({
            value: ind.score,
            itemStyle: {
              color:
                ind.score >= 80
                  ? '#10B981'
                  : ind.score >= 60
                    ? '#00D4AA'
                    : ind.score >= 40
                      ? '#F59E0B'
                      : '#EF4444',
              borderRadius: [0, 4, 4, 0],
            },
          })).reverse(),
          barWidth: 16,
          label: {
            show: true,
            position: 'right' as const,
            formatter: (p: { value: number }) => `${p.value}`,
            color: '#E8ECF1',
            fontSize: 12,
            fontFamily: 'JetBrains Mono',
            fontWeight: 500,
          },
        },
      ],
      animationDuration: 800,
      animationEasing: 'cubicOut' as const,
    }
  }, [category])

  return (
    <DashboardCard
      title={`${category.name}测试`}
      footer={
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          基于 {category.indicators.length} 项指标
        </span>
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: 'rgba(0,212,170,0.15)',
            color: '#00D4AA',
          }}
        >
          均值: {avgScore}/100
        </span>
      </div>
      <ReactECharts option={option} style={{ height: category.indicators.length * 40 + 40 }} />

      {/* Statistics Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th className="py-1.5 pr-2 text-left font-medium">指标名称</th>
              <th className="py-1.5 pr-2 text-left font-medium">单位</th>
              <th className="py-1.5 pr-2 text-right font-medium">均值</th>
              <th className="py-1.5 pr-2 text-right font-medium">最佳值</th>
              <th className="py-1.5 pr-2 text-right font-medium">标准差</th>
              <th className="py-1.5 pr-2 text-right font-medium">CV%</th>
              <th className="py-1.5 pr-2 text-right font-medium">置信区间</th>
              <th className="py-1.5 text-center font-medium">评级</th>
            </tr>
          </thead>
          <tbody>
            {category.indicators.map((ind) => (
              <tr
                key={ind.name}
                className="transition-colors"
                style={{ borderBottom: '1px solid rgba(42,51,72,0.3)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td className="py-1.5 pr-2" style={{ color: 'var(--text-primary)' }}>{ind.name}</td>
                <td className="py-1.5 pr-2 font-mono" style={{ color: 'var(--text-secondary)' }}>{ind.unit}</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                  {typeof ind.mean === 'number' && ind.mean % 1 !== 0 ? ind.mean.toFixed(1) : ind.mean}
                </td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                  {typeof ind.best === 'number' && ind.best % 1 !== 0 ? ind.best.toFixed(1) : ind.best}
                </td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{ind.sd.toFixed(1)}</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{ind.cv}%</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                  [{ind.ci[0]}, {ind.ci[1]}]
                </td>
                <td className="py-1.5 text-center">
                  <span
                    className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${ratingColors[ind.rating]}20`,
                      color: ratingColors[ind.rating],
                    }}
                  >
                    {ind.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  )
}

/* ─── Main Periodic Testing Component ─── */
export default function PeriodicTesting() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      {/* Radar chart - full width */}
      <div className="col-span-1 xl:col-span-4">
        <RadarChart />
      </div>

      {/* Category detail cards */}
      {periodicCategories.map((cat) => (
        <div key={cat.name} className="col-span-1 xl:col-span-2">
          <CategoryCard category={cat} />
        </div>
      ))}
    </div>
  )
}
