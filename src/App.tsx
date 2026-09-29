import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LabIndex from './lab/Index'
import Frame from './lab/Frame'
import type { Ctl } from './lab/ctl'
import BenchA from './experiments/001-bench/A-minimal'
import BenchB from './experiments/001-bench/B-paper'
import BenchC from './experiments/001-bench/C-glass'
import OneLine from './experiments/002-one-line'

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
