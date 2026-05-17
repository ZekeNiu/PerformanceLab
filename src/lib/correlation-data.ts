export interface Indicator {
  id: string;
  name: string;
  category: string;
}

export interface DataPoint {
  athlete: string;
  date: string;
  values: Record<string, number>;
}

export const INDICATOR_CATEGORIES: Record<string, string[]> = {
  '体能测试': ['cmj_height', 'cmj_power', 'squat_1rm', 'bench_1rm', 'sprint_30m', 'sprint_10m', 'beep_test', 'yoyo_test'],
  '生理监测': ['hrv_rmssd', 'hr_resting', 'spo2', 'sleep_score', 'rpe'],
  '身体成分': ['body_fat_pct', 'muscle_mass', 'weight', 'height', 'bmi'],
  '专项成绩': ['match_score', 'training_score', 'tactical_score', 'technical_score'],
};

export const INDICATORS: Indicator[] = [
  // 体能测试
  { id: 'cmj_height', name: 'CMJ跳跃高度', category: '体能测试' },
  { id: 'cmj_power', name: 'CMJ峰值功率', category: '体能测试' },
  { id: 'squat_1rm', name: '深蹲1RM', category: '体能测试' },
  { id: 'bench_1rm', name: '卧推1RM', category: '体能测试' },
  { id: 'sprint_30m', name: '30m冲刺', category: '体能测试' },
  { id: 'sprint_10m', name: '10m冲刺', category: '体能测试' },
  { id: 'beep_test', name: '渐进跑测试', category: '体能测试' },
  { id: 'yoyo_test', name: 'YoYo间歇测试', category: '体能测试' },
  // 生理监测
  { id: 'hrv_rmssd', name: 'HRV (RMSSD)', category: '生理监测' },
  { id: 'hr_resting', name: '静息心率', category: '生理监测' },
  { id: 'spo2', name: '血氧饱和度', category: '生理监测' },
  { id: 'sleep_score', name: '睡眠质量评分', category: '生理监测' },
  { id: 'rpe', name: 'RPE主观疲劳', category: '生理监测' },
  // 身体成分
  { id: 'body_fat_pct', name: '体脂率', category: '身体成分' },
  { id: 'muscle_mass', name: '肌肉量', category: '身体成分' },
  { id: 'weight', name: '体重', category: '身体成分' },
  { id: 'height', name: '身高', category: '身体成分' },
  { id: 'bmi', name: 'BMI', category: '身体成分' },
  // 专项成绩
  { id: 'match_score', name: '比赛得分', category: '专项成绩' },
  { id: 'training_score', name: '训练评分', category: '专项成绩' },
  { id: 'tactical_score', name: '战术评分', category: '专项成绩' },
  { id: 'technical_score', name: '技术评分', category: '专项成绩' },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Generate demo dataset with N athletes */
export function generateDemoData(n: number): DataPoint[] {
  const rng = seededRandom(12345);
  const athletes = [
    '张伟', '李明', '王强', '刘洋', '陈浩', '赵磊', '孙鹏', '周杰',
    '吴昊', '郑宇', '黄凯', '杨帆', '朱诚', '徐磊', '马超', '胡军',
    '林涛', '郭鑫', '何伟', '高峰', '梁波', '宋杰', '谢军', '韩冰',
    '唐勇', '曹阳', '许鹏', '邓超', '萧峰', '冯雷', '程坤', '蔡明',
    '彭亮', '潘军', '袁浩', '蒋波', '魏然', '傅鑫', '沈诚', '陆伟',
    '姚远', '卢刚', '钱坤', '董洋', '汪涛', '戴军', '崔鹏', '钟磊',
    '范冰', '金阳', '邹凯', '孔杰', '白军', '龙翔', '万波', '段明',
    '雷浩', '江涛', '顾鑫',
  ];

  const data: DataPoint[] = [];
  for (let i = 0; i < n; i++) {
    const athlete = athletes[i % athletes.length];
    // Generate correlated variables
    const baseFitness = rng() * 40 + 40; // 40-80
    const fatigue = rng() * 30 + 10; // 10-40

    const values: Record<string, number> = {
      // CMJ - correlated with base fitness
      cmj_height: Math.round((baseFitness * 0.6 + rng() * 15 + 20) * 10) / 10,
      cmj_power: Math.round((baseFitness * 8 + rng() * 200 + 1500) * 10) / 10,
      // Strength - correlated with base fitness
      squat_1rm: Math.round((baseFitness * 2.5 + rng() * 30 + 80) * 10) / 10,
      bench_1rm: Math.round((baseFitness * 1.5 + rng() * 20 + 50) * 10) / 10,
      // Sprint - negatively correlated with CMJ (speed vs power tradeoff)
      sprint_30m: Math.round((4.8 - baseFitness * 0.015 + rng() * 0.3) * 100) / 100,
      sprint_10m: Math.round((1.9 - baseFitness * 0.006 + rng() * 0.15) * 100) / 100,
      // Endurance - inversely related to fatigue
      beep_test: Math.round((18 - fatigue * 0.15 + rng() * 2) * 10) / 10,
      yoyo_test: Math.round((2000 - fatigue * 15 + rng() * 200) * 10) / 10,
      // HRV - inversely related to fatigue
      hrv_rmssd: Math.round((80 - fatigue * 0.8 + rng() * 15) * 10) / 10,
      hr_resting: Math.round((50 + fatigue * 0.4 + rng() * 5) * 10) / 10,
      spo2: Math.round((98 - rng() * 2) * 10) / 10,
      sleep_score: Math.round((85 - fatigue * 0.5 + rng() * 15) * 10) / 10,
      rpe: Math.round((fatigue * 0.6 + rng() * 2) * 10) / 10,
      // Body composition
      body_fat_pct: Math.round((8 + rng() * 12) * 10) / 10,
      muscle_mass: Math.round((65 + baseFitness * 0.3 + rng() * 5) * 10) / 10,
      weight: Math.round((75 + rng() * 20) * 10) / 10,
      height: Math.round((175 + rng() * 15) * 10) / 10,
      bmi: 0, // calculated later
      // Performance scores - function of multiple factors
      match_score: Math.round(
        (baseFitness * 0.5 + (100 - fatigue) * 0.3 + rng() * 10 + 10) * 10
      ) / 10,
      training_score: Math.round(
        (baseFitness * 0.6 + (100 - fatigue) * 0.2 + rng() * 8 + 15) * 10
      ) / 10,
      tactical_score: Math.round((70 + rng() * 25) * 10) / 10,
      technical_score: Math.round((baseFitness * 0.4 + rng() * 30 + 40) * 10) / 10,
    };

    // Calculate BMI
    values.bmi = Math.round((values.weight / ((values.height / 100) ** 2)) * 10) / 10;

    data.push({
      athlete,
      date: `2025-01-${String((i % 31) + 1).padStart(2, '0')}`,
      values,
    });
  }
  return data;
}

/** Get indicator name by ID */
export function getIndicatorName(id: string): string {
  const ind = INDICATORS.find(i => i.id === id);
  return ind?.name || id;
}

/** Get indicator category by ID */
export function getIndicatorCategory(id: string): string {
  const ind = INDICATORS.find(i => i.id === id);
  return ind?.category || '其他';
}
