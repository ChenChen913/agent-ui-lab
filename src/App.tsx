import { Suspense, lazy, type ComponentType } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Frame from './lab/Frame'
import type { Ctl } from './lab/ctl'

/**
 * 十五个实验各自单独打包，打开谁才下载谁。
 * 它们之间本来就互不 import，拆成独立 chunk 是最自然的结果。
 */
const LabIndex = lazy(() => import('./lab/Index'))
const BenchA = lazy(() => import('./experiments/b1-bench/A-minimal'))
const BenchB = lazy(() => import('./experiments/b1-bench/B-paper'))
const BenchC = lazy(() => import('./experiments/b1-bench/C-glass'))
const OneLine = lazy(() => import('./experiments/b2-one-line'))
const Terminal = lazy(() => import('./experiments/b3-terminal'))
const Chronicle = lazy(() => import('./experiments/b4-chronicle'))
const Desktop = lazy(() => import('./experiments/b5-desktop'))
const Spatial = lazy(() => import('./experiments/b6-spatial'))
const Brief = lazy(() => import('./experiments/a1-brief'))
const Baseline = lazy(() => import('./experiments/a2-inout'))
const Workbench = lazy(() => import('./experiments/a3-workbench'))
const Mission = lazy(() => import('./experiments/a4-mission'))
const Bubble = lazy(() => import('./experiments/a5-bubble'))
const Plan = lazy(() => import('./experiments/a6-plan'))
const Weight = lazy(() => import('./experiments/a7-weight'))
const Ledger = lazy(() => import('./experiments/a8-ledger'))
const Return = lazy(() => import('./experiments/a9-return'))

const BENCH: { id: string; name: string; Comp: ComponentType<Ctl> }[] = [
  { id: 'a', name: 'A · 极简黑白', Comp: BenchA },
  { id: 'b', name: 'B · 暖色纸张', Comp: BenchB },
  { id: 'c', name: 'C · 冷调玻璃', Comp: BenchC },
]

/** 拆包之后那一瞬间的空位。用外壳自己的配色，不额外装饰 */
function Boot() {
  return (
    <div className="flex h-full items-center justify-center lab-bg">
      <span className="font-mono text-[12px] lab-t3">载入中…</span>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Boot />}>
        <Routes>
          <Route path="/" element={<LabIndex />} />

          {BENCH.map((v) => (
            <Route
              key={v.id}
              path={`/b1/${v.id}`}
              element={
                <Frame
                  key={'b1-' + v.id}
                  no="B1"
                  title="The Bench"
                  variants={BENCH.map(({ id, name }) => ({ id, name }))}
                  current={v.id}
                  render={(ctl) => <v.Comp {...ctl} />}
                />
              }
            />
          ))}

          <Route
            path="/b2"
            element={<Frame key="B2" no="B2" title="One Line" render={(ctl) => <OneLine {...ctl} />} />}
          />

          <Route
            path="/b3"
            element={<Frame key="B3" no="B3" title="Terminal" render={(ctl) => <Terminal {...ctl} />} />}
          />

          <Route
            path="/b4"
            element={<Frame key="B4" no="B4" title="Chronicle" render={(ctl) => <Chronicle {...ctl} />} />}
          />

          <Route
            path="/b5"
            element={<Frame key="B5" no="B5" title="Desktop" render={(ctl) => <Desktop {...ctl} />} />}
          />

          <Route
            path="/b6"
            element={<Frame key="B6" no="B6" title="Spatial" render={(ctl) => <Spatial {...ctl} />} />}
          />

          <Route
            path="/a1"
            element={<Frame key="A1" no="A1" title="The Brief" render={(ctl) => <Brief {...ctl} />} />}
          />

          <Route
            path="/a2"
            element={<Frame key="A2" no="A2" title="In & Out" autoPlay={false} render={(ctl) => <Baseline {...ctl} />} />}
          />

          <Route
            path="/a3"
            element={<Frame key="A3" no="A3" title="Workbench" autoPlay={false} render={(ctl) => <Workbench {...ctl} />} />}
          />

          <Route
            path="/a4"
            element={<Frame key="A4" no="A4" title="Mission Control" autoPlay={false} render={(ctl) => <Mission {...ctl} />} />}
          />

          <Route
            path="/a5"
            element={<Frame key="A5" no="A5" title="Bubble" autoPlay={false} render={(ctl) => <Bubble {...ctl} />} />}
          />

          <Route
            path="/a6"
            element={<Frame key="A6" no="A6" title="The Plan" autoPlay={false} render={(ctl) => <Plan {...ctl} />} />}
          />

          <Route path="/a7" element={<Frame key="A7" no="A7" title="Weight" autoPlay={false} render={(ctl) => <Weight {...ctl} />} />} />
          <Route path="/a8" element={<Frame key="A8" no="A8" title="Ledger" autoPlay={false} render={(ctl) => <Ledger {...ctl} />} />} />
          <Route path="/a9" element={<Frame key="A9" no="A9" title="Return" autoPlay={false} render={(ctl) => <Return {...ctl} />} />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
