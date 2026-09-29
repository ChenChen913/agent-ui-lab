import { Suspense, lazy, type ComponentType } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Frame from './lab/Frame'
import type { Ctl } from './lab/ctl'

/**
 * 十五个实验各自单独打包，打开谁才下载谁。
 * 它们之间本来就互不 import，拆成独立 chunk 是最自然的结果。
 */
const LabIndex = lazy(() => import('./lab/Index'))
const BenchA = lazy(() => import('./experiments/001-bench/A-minimal'))
const BenchB = lazy(() => import('./experiments/001-bench/B-paper'))
const BenchC = lazy(() => import('./experiments/001-bench/C-glass'))
const OneLine = lazy(() => import('./experiments/002-one-line'))
const Terminal = lazy(() => import('./experiments/003-terminal'))
const Chronicle = lazy(() => import('./experiments/004-chronicle'))
const Desktop = lazy(() => import('./experiments/005-desktop'))
const Spatial = lazy(() => import('./experiments/006-spatial'))
const Brief = lazy(() => import('./experiments/007-brief'))
const Baseline = lazy(() => import('./experiments/008-baseline'))
const Workbench = lazy(() => import('./experiments/009-workbench'))
const Mission = lazy(() => import('./experiments/010-mission'))
const Bubble = lazy(() => import('./experiments/011-bubble'))
const Plan = lazy(() => import('./experiments/012-plan'))
const Weight = lazy(() => import('./experiments/013-weight'))
const Ledger = lazy(() => import('./experiments/014-ledger'))
const Return = lazy(() => import('./experiments/015-return'))

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
              path={`/001/${v.id}`}
              element={
                <Frame
                  key={'001-' + v.id}
                  no="001"
                  title="The Bench"
                  variants={BENCH.map(({ id, name }) => ({ id, name }))}
                  current={v.id}
                  render={(ctl) => <v.Comp {...ctl} />}
                />
              }
            />
          ))}

          <Route
            path="/002"
            element={<Frame key="002" no="002" title="One Line" render={(ctl) => <OneLine {...ctl} />} />}
          />

          <Route
            path="/003"
            element={<Frame key="003" no="003" title="Terminal" render={(ctl) => <Terminal {...ctl} />} />}
          />

          <Route
            path="/004"
            element={<Frame key="004" no="004" title="Chronicle" render={(ctl) => <Chronicle {...ctl} />} />}
          />

          <Route
            path="/005"
            element={<Frame key="005" no="005" title="Desktop" render={(ctl) => <Desktop {...ctl} />} />}
          />

          <Route
            path="/006"
            element={<Frame key="006" no="006" title="Spatial" render={(ctl) => <Spatial {...ctl} />} />}
          />

          <Route
            path="/007"
            element={<Frame key="007" no="007" title="The Brief" render={(ctl) => <Brief {...ctl} />} />}
          />

          <Route
            path="/008"
            element={<Frame key="008" no="008" title="In & Out" autoPlay={false} render={(ctl) => <Baseline {...ctl} />} />}
          />

          <Route
            path="/009"
            element={<Frame key="009" no="009" title="Workbench" autoPlay={false} render={(ctl) => <Workbench {...ctl} />} />}
          />

          <Route
            path="/010"
            element={<Frame key="010" no="010" title="Mission Control" autoPlay={false} render={(ctl) => <Mission {...ctl} />} />}
          />

          <Route
            path="/011"
            element={<Frame key="011" no="011" title="Bubble" autoPlay={false} render={(ctl) => <Bubble {...ctl} />} />}
          />

          <Route
            path="/012"
            element={<Frame key="012" no="012" title="The Plan" autoPlay={false} render={(ctl) => <Plan {...ctl} />} />}
          />

          <Route path="/013" element={<Frame key="013" no="013" title="Weight" autoPlay={false} render={(ctl) => <Weight {...ctl} />} />} />
          <Route path="/014" element={<Frame key="014" no="014" title="Ledger" autoPlay={false} render={(ctl) => <Ledger {...ctl} />} />} />
          <Route path="/015" element={<Frame key="015" no="015" title="Return" autoPlay={false} render={(ctl) => <Return {...ctl} />} />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
