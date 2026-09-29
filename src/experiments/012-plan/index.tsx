import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, FileText, Plus, Square, X } from 'lucide-react'
import { ripple, type Step } from './scenario'
import { usePlan } from './usePlan'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 012 · The Plan —— 计划本身就是界面
 *
 * 核心不是「展示计划」，是「计划可以被你当场改」。
 * 改任何一步，Agent 沿着依赖关系算出哪些步骤作废。
 *
 * 最要紧的一点：**在你还只是打字的时候，涟漪就已经显示出来了。**
 * 你还没按回车，下面哪些步骤会重做已经标好了。
 */
export default function Plan({ playing, speed, runId }: Ctl) {
  const { state, api } = usePlan({ playing, speed, runId })
  const [edit, setEdit] = useState<{ id: string; text: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [newStep, setNewStep] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const idle = state.steps.length === 0
  const done = state.steps.filter((s) => s.state === 'done').length
  const running = state.steps.some((s) => s.state === 'running' || s.state === 'asking')

  // 正在编辑的那一步，实时算涟漪 —— 还没提交就已经看得见
  const preview = useMemo(() => {
    if (!edit) return new Set<string>()
    const cur = state.steps.find((s) => s.id === edit.id)
    if (!cur || edit.text.trim() === cur.title) return new Set<string>()
    return new Set(ripple(state.steps, edit.id))
  }, [edit, state.steps])

  useEffect(() => {
    const el = taRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 100) + 'px' }
  }, [draft])

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.steps, state.result])

  const submit = () => { if (draft.trim()) { api.send(draft); setDraft('') } }
  const commitEdit = () => {
    if (edit) api.editStep(edit.id, edit.text.trim() || '（空）')
    setEdit(null)
  }

  return (
    <div className="pl" data-idle={idle ? '1' : '0'}>
      <header className="pl-top">
        <div className="pl-top-t">{idle ? '新计划' : '研究 · 国内 AI Agent 开发平台'}</div>
        {!idle && <div className="pl-top-c"><b>{done}</b> / {state.steps.length}</div>}
      </header>

      <div className="pl-body" ref={bodyRef}>
        <div className="pl-col">
          {idle ? (
            <div className="pl-empty">
              <div className="pl-empty-m">◇</div>
              <h1>交给它一件事</h1>
              <p>它会先拆成几步给你看。任何一步你都可以当场改，改完它立刻重排。</p>
            </div>
          ) : (
            <>
              {state.intro && <p className="pl-intro">{state.intro}</p>}

              <div className="pl-steps">
                {state.steps.map((s, i) => (
                  <StepRow
                    key={s.id} s={s} last={i === state.steps.length - 1}
                    willRedo={preview.has(s.id)}
                    editing={edit?.id === s.id ? edit.text : null}
                    onEditStart={() => setEdit({ id: s.id, text: s.title })}
                    onEditChange={(t) => setEdit((e) => (e ? { ...e, text: t } : e))}
                    onEditCommit={commitEdit}
                    onEditCancel={() => setEdit(null)}
                    onRemove={() => api.removeStep(s.id)}
                    onAnswer={(t) => api.answer(s.id, t)}
                  />
                ))}
              </div>

              {adding && (
                <div className="pl-add">
                  <Plus size={14} strokeWidth={2} />
                  <input
                    autoFocus value={newStep} placeholder="加一步，回车确认"
                    onChange={(e) => setNewStep(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newStep.trim()) { api.addStep(newStep.trim()); setNewStep(''); setAdding(false) }
                      if (e.key === 'Escape') { setAdding(false); setNewStep('') }
                    }}
                  />
                </div>
              )}

              {state.result && (
                <div className="pl-result">
                  <span className="pl-result-ic"><FileText size={20} strokeWidth={1.7} /></span>
                  <span className="pl-result-mid">
                    <span className="pl-result-t">{state.result.title}</span>
                    <span className="pl-result-d">{state.result.desc}</span>
                  </span>
                  <span className="pl-result-m">{state.result.meta}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <footer className="pl-foot">
        <div className="pl-col">
          {state.summary && (
            <div className="pl-summary" data-kind={state.summary.indexOf('不受影响') > -1 ? 'ripple' : 'plain'}>
              {state.summary}
            </div>
          )}
          {preview.size > 0 && !state.summary && (
            <div className="pl-summary" data-kind="ripple">
              还没应用：这一步改了，{' '}
              {state.steps.filter((s) => preview.has(s.id)).map((s) => s.no).join('、')} 会重做 ·{' '}
              {state.steps.filter((s) => !preview.has(s.id) && s.id !== edit?.id).map((s) => s.no).join('、')} 不受影响
            </div>
          )}

          {idle ? (
            <div className="pl-composer">
              <textarea
                ref={taRef} className="pl-ta" rows={1} value={draft}
                placeholder="比如：帮我研究国内 AI Agent 开发平台，比较 20 个项目，给我一份报告"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              />
              <button className="pl-go" data-on={draft.trim() ? '1' : '0'} onClick={submit}>开始</button>
            </div>
          ) : (
            <div className="pl-bar">
              <button className="pl-ghost" onClick={() => setAdding(true)}><Plus size={14} strokeWidth={2} />加一步</button>
              <span className="pl-hint">点任何一步的标题就能改它</span>
              <div className="pl-sp" />
              {running && <button className="pl-stop" onClick={api.interrupt}><Square size={10} fill="currentColor" strokeWidth={0} />打断</button>}
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}

const BADGE: Record<string, string> = {
  pending: '待办', running: '进行中', done: '已完成', asking: '需要你', stale: '将重做',
}

function StepRow({ s, last, willRedo, editing, onEditStart, onEditChange, onEditCommit, onEditCancel, onRemove, onAnswer }: {
  s: Step; last: boolean; willRedo: boolean; editing: string | null
  onEditStart: () => void; onEditChange: (t: string) => void; onEditCommit: () => void
  onEditCancel: () => void; onRemove: () => void; onAnswer: (t: string) => void
}) {
  const st = willRedo ? 'stale' : s.state
  return (
    <div className="pl-step" data-s={st}>
      <div className="pl-rail">
        <span className="pl-node">
          {s.state === 'done' && !willRedo ? <Check size={13} strokeWidth={2.6} /> : s.no}
        </span>
        {!last && <span className="pl-conn" />}
      </div>

      <div className="pl-main">
        <div className="pl-head">
          {editing !== null ? (
            <input
              className="pl-input" autoFocus value={editing}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEditCommit()
                if (e.key === 'Escape') onEditCancel()
              }}
              onBlur={onEditCommit}
            />
          ) : (
            <button className="pl-title" onClick={onEditStart} title="点一下改这一步">{s.title}</button>
          )}
          <span className="pl-badge">{willRedo ? '将重做' : BADGE[s.state]}</span>
          {!editing && s.state !== 'running' && s.state !== 'asking' && (
            <button className="pl-del" onClick={onRemove} title="删掉这一步"><X size={12} strokeWidth={2.2} /></button>
          )}
        </div>

        <div className="pl-detail">{s.detail}{s.deps.length ? ' · 依赖 ' + s.deps.map((d) => d.replace('s', '')).join('、') : ''}</div>

        {s.items && (
          <div className="pl-items">
            {s.items.map((it, i) => (
              <span key={i} className="pl-item" data-s={it.state}>{it.label}</span>
            ))}
          </div>
        )}
        {s.note && <div className="pl-note">{s.note}</div>}
        {s.answer && <div className="pl-answer">你选的：{s.answer}</div>}
        {s.output && <div className="pl-out">{s.output}</div>}

        {s.question && (
          <div className="pl-q">
            <p>{s.question}</p>
            <div className="pl-opts">
              {(s.options ?? []).map((o) => <button key={o} onClick={() => onAnswer(o)}>{o}</button>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
