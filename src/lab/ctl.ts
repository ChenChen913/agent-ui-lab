/** 实验室外壳（Frame）传给每个实验的控制信号 —— 这是 lab 的契约，不属于任何实验 */
export interface Ctl {
  playing: boolean
  speed: number
  runId: number
}
