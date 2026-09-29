import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LabIndex from './lab/Index'
import Frame from './lab/Frame'
import type { Ctl } from './lab/ctl'
import BenchA from './experiments/001-bench/A-minimal'
import BenchB from './experiments/001-bench/B-paper'
import BenchC from './experiments/001-bench/C-glass'
import OneLine from './experiments/002-one-line'
import Terminal from './experiments/003-terminal'
import Chronicle from './experiments/004-chronicle'
import Desktop from './experiments/005-desktop'
import Spatial from './experiments/006-spatial'
import Brief from './experiments/007-brief'
import Baseline from './experiments/008-baseline'
import Workbench from './experiments/009-workbench'
import Home from './experiments/010-home'

const BENCH: { id: string; name: string; Comp: (p: Ctl) => React.ReactElement }[] = [
  { id: 'a', name: 'A · 极简黑白', Comp: BenchA },
  { id: 'b', name: 'B · 暖色纸张', Comp: BenchB },
  { id: 'c', name: 'C · 冷调玻璃', Comp: BenchC },
]

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LabIndex />} />

        {BENCH.map((v) => (
          <Route
            key={v.id}
            path={`/001/${v.id}`}
            element={
              <Frame
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
          element={<Frame no="002" title="One Line" render={(ctl) => <OneLine {...ctl} />} />}
        />

        <Route
          path="/003"
          element={<Frame no="003" title="Terminal" render={(ctl) => <Terminal {...ctl} />} />}
        />

        <Route
          path="/004"
          element={<Frame no="004" title="Chronicle" render={(ctl) => <Chronicle {...ctl} />} />}
        />

        <Route
          path="/005"
          element={<Frame no="005" title="Desktop" render={(ctl) => <Desktop {...ctl} />} />}
        />

        <Route
          path="/006"
          element={<Frame no="006" title="Spatial" render={(ctl) => <Spatial {...ctl} />} />}
        />

        <Route
          path="/007"
          element={<Frame no="007" title="The Brief" render={(ctl) => <Brief {...ctl} />} />}
        />

        <Route
          path="/008"
          element={<Frame no="008" title="Baseline" autoPlay={false} render={(ctl) => <Baseline {...ctl} />} />}
        />

        <Route
          path="/009"
          element={<Frame no="009" title="Workbench" autoPlay={false} render={(ctl) => <Workbench {...ctl} />} />}
        />

        <Route
          path="/010"
          element={<Frame no="010" title="Home" autoPlay={false} render={(ctl) => <Home {...ctl} />} />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
