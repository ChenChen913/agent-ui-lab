import { useEffect } from 'react'

/**
 * 演示节拍引擎
 * ─────────────────────────────────────────────────────────────
 * A2 到 A9 这八个产品态实验用的是同一套推进方式：
 *
 *   · scenario 是一串带时间戳的 Beat，按 t 的先后发生
 *   · 逐帧只往 ref 里写 CSS 变量和 DOM 样式，React 不参与每帧渲染
 *   · 只有离散的节拍到了（或者打字机吐出新字）才 commit 一次
 *   · 用户一插手就切到 live，剧本让位，不再自动推进
 *
 * 这段循环原本在每个实验里各写一遍，八个副本逐字节相同。
 * 抽到这里不影响任何一个实验的外观 —— 它是纯技术设施，不决定视觉语言。
 */

/** 剧本里的一拍。t 是从演示开始算的毫秒数 */
export interface Beat {
  t: number
}

/** 引擎的运行态。存在 ref 里，逐帧改它不触发渲染 */
export interface BeatRunner<D> {
  elapsed: number
  idx: number
  typing: { text: string; dur: number; t0: number } | null
  typedLen: number
  disc: D
  /** demo = 正在播剧本；live = 用户已经插手，剧本让位 */
  mode: 'demo' | 'live'
}

export function useBeatLoop<D, B extends Beat>(o: {
  playing: boolean
  speed: number
  runId: number
  /** 引擎自己用 useRef 维护的运行态 */
  S: { current: BeatRunner<D> }
  scenario: readonly B[]
  /** 处理一拍。返回 true 表示剧本到此为止 */
  applyBeat: (S: BeatRunner<D>, b: B) => boolean
  /** 推进打字机。不传表示这个实验不用打字（014 / 015） */
  typing?: (S: BeatRunner<D>) => boolean
  /** 把 ref 里的 disc 推给 React */
  commit: () => void
}) {
  const { playing, speed, runId, S, scenario, applyBeat, typing, commit } = o

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const st = S.current
      st.elapsed += (now - last) * speed
      last = now

      let dirty = false
      if (st.mode === 'demo') {
        while (st.idx < scenario.length && scenario[st.idx].t <= st.elapsed) {
          const stop = applyBeat(st, scenario[st.idx])
          st.idx++
          dirty = true
          if (stop) break
        }
        if (typing && typing(st)) dirty = true
      }
      if (dirty) commit()

      // 剧本跑完就该停 —— 否则会一直空转到用户离开页面为止。
      // live 模式下剧本不再推进，同样没必要让循环继续转。
      if (st.mode === 'demo' && (st.idx < scenario.length || st.typing)) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, runId, commit])
}

/**
 * 打字机的逐帧推进：需要逐字吐字的实验共用。
 * 返回 true 表示这一帧有东西变了，需要 commit。
 */
export function typingFrame<D extends { typed: string }>(st: BeatRunner<D>): boolean {
  if (!st.typing) return false
  const p = Math.min(1, (st.elapsed - st.typing.t0) / st.typing.dur)
  const n = Math.round(p * st.typing.text.length)
  let changed = false
  if (n !== st.typedLen) {
    st.typedLen = n
    st.disc.typed = st.typing.text.slice(0, n)
    changed = true
  }
  if (p >= 1) st.typing = null
  return changed
}
