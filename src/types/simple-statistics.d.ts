declare module 'simple-statistics' {
  export function mean(x: number[]): number;
  export function sum(x: number[]): number;
  export function variance(x: number[]): number;
  export function standardDeviation(x: number[]): number;
  export function sampleCorrelation(x: number[], y: number[]): number;
  export function linearRegression(data: [number, number][]): { m: number; b: number };
  export function linearRegressionLine(mb: { m: number; b: number }): (x: number) => number;
  export function rSquared(x: number[], y: number[], fn: (x: number) => number): number;
  export function min(x: number[]): number;
  export function max(x: number[]): number;
  export function quantile(x: number[], p: number): number;
  export function shuffle<T>(x: T[]): T[];
  export function permutationTest(x: number[], y: number[], numSamples?: number): number;
}
