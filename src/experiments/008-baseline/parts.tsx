import { useState } from 'react'
import {
  BarChart3, Brain, Check, ChevronRight, Download, ExternalLink, FileText,
  Globe, Terminal as TermIcon,
} from 'lucide-react'
import type { Part } from './scenario'

/** 过程类 Part 的一行外壳：图标 + 一句话 + 可展开的细节 */
export function Proc({ icon, label, note, state, open, onToggle, children }: {
  icon: React.ReactNode; label: string; note?: string; state: string
  open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="pc" data-s={state} data-open={open ? '1' : '0'}>
      <button className="pc-h" onClick={onToggle}>
        <span className="pc-ic">{state === 'running' ? <span className="pc-ring" /> : icon}</span>
        <span className="pc-l">{label}</span>
        {note && <span className="pc-n">{note}</span>}
        <ChevronRight size={13} strokeWidth={2.2} className="pc-chev" />
      </button>
      <div className="pc-b"><div className="pc-bi">{children}</div></div>
    </div>
  )
}

export function ThinkingBody({ p }: { p: Extract<Part, { kind: 'thinking' }> }) {
  return <div className="pc-think">{p.text.split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
}

export function SearchBody({ p }: { p: Extract<Part, { kind: 'search' }> }) {
  return (
    <div className="pc-hits">
      {p.hits.map((h, i) => (
        <a key={i} className="hit" href={'https://' + h.url} target="_blank" rel="noreferrer">
          <span className="hit-top">
            <span className="hit-fav">{h.site.slice(0, 1)}</span>
            <span className="hit-site">{h.site}</span>
            <span className="hit-url">{h.url}</span>
            <ExternalLink size={11} strokeWidth={2} className="hit-ext" />
          </span>
          <span className="hit-t">{h.title}</span>
          <span className="hit-s">{h.snippet}</span>
        </a>
      ))}
    </div>
  )
}

export function ReadBody({ p }: { p: Extract<Part, { kind: 'read' }> }) {
  return (
    <div className="pc-file">
      <div className="pf-h"><FileText size={14} strokeWidth={1.8} /><span>{p.file}</span><em>{p.pages} 页</em></div>
      <div className="pf-b">{p.preview.map((l, i) => <p key={i}>{l}</p>)}</div>
    </div>
  )
}

export function RunBody({ p }: { p: Extract<Part, { kind: 'run' }> }) {
  return (
    <div className="pc-run">
      <div className="pr-code">
        <div className="pr-bar"><span>{p.lang}</span></div>
        <pre><code>{p.code}</code></pre>
      </div>
      <div className="pr-out">
        <div className="pr-bar">
          <span>stdout</span>
          <em data-ok={p.exit === 0 ? '1' : '0'}>exit {p.exit} · {(p.ms / 1000).toFixed(1)}s</em>
        </div>
        <pre><code>{p.out}</code></pre>
      </div>
    </div>
  )
}

/** 真的画出来的柱状图 */
export function ChartBody({ p }: { p: Extract<Part, { kind: 'chart' }> }) {
  const W = 520, H = 168, pad = { l: 34, r: 14, t: 16, b: 30 }
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b
  const max = Math.max(...p.bars.map((b) => Math.abs(b.value)), 1)
  const zero = pad.t + ih * (max / (max * 2))
  const bw = iw / p.bars.length * 0.52
  return (
    <div className="pc-chart">
      <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" height={H}>
        <line x1={pad.l} y1={zero} x2={W - pad.r} y2={zero} stroke="#e3e7ea" strokeWidth="1" />
        {p.bars.map((b, i) => {
          const cx = pad.l + (iw / p.bars.length) * (i + 0.5)
          const h = Math.abs(b.value) / (max * 2) * ih
          const up = b.value >= 0
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={up ? zero - h : zero} width={bw} height={Math.max(h, 1.5)} rx="3"
                fill={up ? '#2f6bd8' : '#c2705f'} />
              <text x={cx} y={up ? zero - h - 6 : zero + h + 13} textAnchor="middle" fontSize="11.5"
                fill={up ? '#3a4149' : '#a1553f'} fontFamily="Geist Mono Variable, monospace">
                {b.value > 0 ? '+' : ''}{b.value}
              </text>
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="11.5" fill="#868e96">{b.label}</text>
            </g>
          )
        })}
        <text x={pad.l - 8} y={zero + 4} textAnchor="end" fontSize="10" fill="#a9b0b7" fontFamily="Geist Mono Variable, monospace">0</text>
      </svg>
      <div className="pc-chart-cap">{p.title} · 单位 {p.unit}</div>
    </div>
  )
}

export function ArtifactBody({ p }: { p: Extract<Part, { kind: 'artifact' }> }) {
  return (
    <div className="pc-art">
      <span className="pa-ic"><FileText size={18} strokeWidth={1.7} /></span>
      <span className="pa-mid"><span className="pa-t">{p.title}</span><span className="pa-d">{p.desc}</span></span>
      <span className="pa-m">{p.meta}</span>
      <span className="pa-act"><Download size={14} strokeWidth={1.8} /></span>
    </div>
  )
}

export const ICONS = {
  thinking: <Brain size={13} strokeWidth={1.9} />,
  search: <Globe size={13} strokeWidth={1.9} />,
  read: <FileText size={13} strokeWidth={1.9} />,
  run: <TermIcon size={13} strokeWidth={1.9} />,
  chart: <BarChart3 size={13} strokeWidth={1.9} />,
  done: <Check size={13} strokeWidth={2.6} />,
}
