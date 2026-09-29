import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Check, ChevronRight } from 'lucide-react'
import { type Task } from './scenario'
import { useWeight } from './useWeight'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 013 · Weight —— 过程占多大分量
 *
 * 底部那块过程区会**长大**：一行 → 一条带 → 接管大半个屏幕。
 * 决定它多大的不是 Agent 做了多少，而是用户有多需要知道。
 *
 * 最要紧的一拍：第三个任务开局只是一条带，
 * 跑到一半复杂度暴露出来，它**自己长大**了。
 */
export default function Weight({ playing, speed, runId }: Ctl) {
  const { state, api } = useWeight({ playing, speed, runId })
  const [draft, setDraft] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const big = [...state.tasks].reverse().find((t) => t.size === 'full' && (t.alert || t.steps.some((s) => s.state !== 'done')))
  const rest = state.tasks.filter((t) => t !== big)
  const grew = big?.grew

  useEffect(() => {
    const el = taRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 96) + 'px' }
  }, [draft, state.typed])
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight }, [state.tasks])
  useEffect(() => { const v = draft || state.typed; if (v && taRef.current) { taRef.current.value = v } }, [draft, state.typed])

  const submit = () => { const v = draft || state.typed; if (v.trim()) { api.send(v); setDraft('') } }

  return (
    <div className="wt" data-big={big ? '1' : '0'}>
      <div className="wt-thread" ref={bodyRef}>
        <div className="wt-col">
          {state.tasks.length === 0 && (
            <div className="wt-empty">
              <h1>连做三件事试试</h1>
              <p>一件一句话就能完事，一件中等，一件很复杂。<br />看它给出的过程**分量**有什么不同。</p>
            </div>
          )}

          {rest.map((t) => <Done key={t.id} t={t} onToggle={() => api.toggle(t.id)} />)}

          {big && <Big t={big} grew={!!grew} onAnswer={(o) => api.answerAlert(big.id, o)} />}
        </div>
      </div>

      <footer className="wt-dock">
        <div className="wt-col">
          <div className="wt-composer">
            <textarea
              ref={taRef} className="wt-ta" rows={1}
              placeholder="交给它一件事…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            />
            <button className="wt-go" data-on={(draft || state.typed).trim() ? '1' : '0'} onClick={submit}><ArrowUp size={16} strokeWidth={2.2} /></button>
          </div>
        </div>
      </footer>
    </div>
  )
}

/** 已经做完的：过程缩成一行 */
function Done({ t, onToggle }: { t: Task; onToggle: () => void }) {
  const n = t.steps.length
  return (
    <div className="wt-done">
      <div className="wt-ask">{t.ask}</div>
      <div className="wt-ans">{t.answer}</div>
      {t.size !== 'none' && n > 0 && (
        <div className="wt-fold" data-open={t.open ? '1' : '0'}>
          <button className="wt-fold-h" onClick={onToggle}>
            <Check size={12} strokeWidth={2.8} />
            {n} 步
            <ChevronRight size={12} strokeWidth={2.2} className="wt-chev" />
          </button>
          <div className="wt-fold-b"><div className="wt-fold-bi">
            {t.steps.map((s, i) => (
              <div key={i} className="wt-st" data-s={s.state}>
                <span className="wt-st-d" />{s.label}{s.note && <em>{s.note}</em>}
              </div>
            ))}
          </div></div>
        </div>
      )}
    </div>
  )
}

/** 正在跑的大任务：过程接管主界面 */
function Big({ t, grew, onAnswer }: { t: Task; grew: boolean; onAnswer: (o: string) => void }) {
  const done = t.steps.filter((s) => s.state === 'done').length
  return (
    <div className="wt-big" data-grew={grew ? '1' : '0'}>
      <div className="wt-big-h">
        <div className="wt-ask wt-ask-big">{t.ask}</div>
        {grew && <span className="wt-grew">任务比预想的复杂，过程已展开</span>}
      </div>

      <div className="wt-steps">
        {t.steps.map((s, i) => (
          <div key={i} className="wt-step" data-s={s.state}>
            <span className="wt-step-n">{s.state === 'done' ? <Check size={12} strokeWidth={2.8} /> : i + 1}</span>
            <span className="wt-step-l">{s.label}</span>
            {s.note && <em className="wt-step-note">{s.note}</em>}
          </div>
        ))}
      </div>

      {t.alert && (
        <div className="wt-alert">
          <p>{t.alert.text}</p>
          <div className="wt-opts">
            {t.alert.options.map((o) => <button key={o} onClick={() => onAnswer(o)}>{o}</button>)}
          </div>
        </div>
      )}

      <div className="wt-prog"><span style={{ width: (done / Math.max(1, t.steps.length)) * 100 + '%' }} /></div>
    </div>
  )
}
