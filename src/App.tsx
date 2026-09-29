import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LabIndex from './lab/Index'
import Frame from './lab/Frame'
import BenchA from './experiments/001-bench/A-minimal'
import BenchB from './experiments/001-bench/B-paper'
import BenchC from './experiments/001-bench/C-glass'
import type { BenchProps } from './experiments/001-bench/types'

const VARIANTS: { id: string; name: string; Comp: (p: BenchProps) => React.ReactElement }[] = [
  { id: 'a', name: 'A · 极简黑白', Comp: BenchA },
  { id: 'b', name: 'B · 暖色纸张', Comp: BenchB },
  { id: 'c', name: 'C · 冷调玻璃', Comp: BenchC },
]

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LabIndex />} />
        {VARIANTS.map((v) => (
          <Route
            key={v.id}
            path={`/001/${v.id}`}
            element={
              <Frame
                no="001"
                title="The Bench"
                variants={VARIANTS.map(({ id, name }) => ({ id, name }))}
                current={v.id}
                render={(ctl) => <v.Comp {...ctl} />}
              />
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
