import { useEffect, useRef, useState } from 'react'
import '@fontsource-variable/source-serif-4'
import { DOC_TITLE, TOTAL, type Clause, type ClauseState } from './scenario'
import { useBrief } from './useBrief'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 007 · The Brief —— 「委托书」
 *
 * 核心观点：界面的主角是这份委托，不是聊天记录。
 * 对话只是把委托谈清楚的过程；谈成之后它被条款吸收掉，消失。
 *
 * 所以这个界面里没有一条「消息」：
 *   你的回答会改写条款正文，Agent 的问题挂在条款底下，
 *   进度是条款被逐条划掉，失败是「有一条承诺没兑现」。
 */

const STAGE: Record<string, string> = {
  idle: '', drafting: '拟稿中', negotiating: '需要你确认',
  ready: '条款已明确', working: '兑现中', done: '已完成',
}

const MARK: Record<ClauseState, string> = {
  draft: '○', asking: '!', working: '●', done: '', unmet: '✗', error: '×',
}
const STATUS: Record<ClauseState, string> = {
  draft: '待办', asking: '需要你', working: '正在做', done: '已兑现', unmet: '未兑现', error: '已中断',
}

export default function Brief({ playing, speed, runId }: Ctl) {
  const [draft, setDraft] = useState('')
  const [ask, setAsk] = useState('')
  const [localRun, setLocalRun] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLDivElement>(null)

  const { state, api } = useBrief({ playing, speed, runId: runId + localRun, askOverride: ask })

  useEffect(() => {
    const el = docRef.current
    if (el && state.stamped) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [state.stamped])

  const live = draft || state.typed
  const done = state.clauses.filter((c) => c.state === 'done').length
  const total = state.clauses.length
  const asking = state.clauses.find((c) => c.state === 'asking')
  const unmet = state.clauses.filter((c) => c.state === 'unmet')

  const hint =
    asking ? '↳ 正在回答「' + asking.title + '」'
    : state.stage === 'ready' ? '所有条款都清楚了，确认之后我才开工'
    : state.stage === 'working' ? '正在逐条兑现'
    : unmet.length ? '有 ' + unmet.length + ' 条没有兑现'
    : state.stage === 'done' ? '这份委托已完成'
    : ''

  const submit = () => {
    const t = draft.trim()
    if (!t) return
    if (asking) { api.answer(asking.id, t); setDraft(''); return }
    setDraft('')
    setAsk(t)
    setLocalRun((n) => n + 1)
  }

  return (
    <div className="bp" data-stage={state.stage}>
      <div className="bp-doc" ref={docRef}>
        <header className="bp-head">
          <span>委托 · {DOC_TITLE}</span>
          <span className="bp-head-r">
            {state.stage ? <b>{STAGE[state.stage]}</b> : null}
            {total ? <em>{done} / {total}</em> : null}
          </span>
        </header>

        <div className="bp-clauses">
          {state.clauses.map((c) => (
            <ClauseRow key={c.id} c={c} api={api} />
          ))}

          {state.stamped && (
            <div className="bp-stamp">
              已兑现
              <em>{new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</em>
            </div>
          )}
        </div>
      </div>

      <footer className="bp-foot">
        <div className="bp-hint">{hint}</div>
        <div className="bp-bar">
          <button
            className="bp-ghost"
            onClick={() => {
              const t = draft.trim()
              if (t) { api.addClause(t); setDraft('') } else inputRef.current?.focus()
            }}
          >
            ＋ 加一条
          </button>

          <div className="bp-field" data-empty={live ? '0' : '1'} onClick={() => inputRef.current?.focus()}>
            <span className="bp-field-text">{live || (asking ? '回答这一条…' : '说点什么…')}</span>
            <i className="bp-caret" />
          </div>

          {state.stage === 'ready' && (
            <button className="bp-go" onClick={api.start}>确认并开始</button>
          )}
          {state.stage === 'working' && (
            <button className="bp-ghost" onClick={api.interrupt}>打断</button>
          )}
        </div>

        <input
          ref={inputRef}
          className="bp-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); submit() }
            if (e.key === 'Escape') api.interrupt()
          }}
          spellCheck={false}
          aria-label="补充委托内容"
        />
      </footer>
    </div>
  )
}

function ClauseRow({ c, api }: { c: Clause; api: any }) {
  const hasSteps = !!c.steps && c.steps.length > 0
  const open = !!c.question || (hasSteps && !!c.open)

  return (
    <section className="bp-clause" data-state={c.state}>
      <span className="bp-no">{c.no}</span>
      <div className="bp-body">
        <div className="bp-title">{c.title}</div>
        <p className="bp-text">{c.text}</p>

        <div
          className={'bp-meta' + (hasSteps ? ' is-toggle' : '')}
          onClick={hasSteps ? () => api.toggleOpen(c.id) : undefined}
        >
          <i className="bp-rule" />
          <span className="bp-mark">
            {c.state === 'done' ? (
              <svg className="bp-check" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M2.5 7.6 L5.6 10.6 L11.5 3.4" />
              </svg>
            ) : MARK[c.state]}
          </span>
          <span className="bp-status">{STATUS[c.state]}</span>
          {c.note && <span className="bp-note">{c.note}</span>}
          {c.state === 'unmet' && (
            <button className="bp-again" onClick={(e) => { e.stopPropagation(); api.rerun(c.id) }}>
              只重跑这条
            </button>
          )}
        </div>

        <div className="bp-block" data-open={c.question ? '1' : '0'}>
          <div className="bp-block-in">
            <p className="bp-q">{c.question}</p>
            <div className="bp-opts">
              {(c.options ?? []).map((o) => (
                <button key={o} onClick={() => api.answer(c.id, o)}>{o}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="bp-block" data-open={open && hasSteps ? '1' : '0'}>
          <div className="bp-block-in">
            <ul className="bp-steps">
              {(c.steps ?? []).map((s, i) => (
                <li key={i} data-s={s.state}>
                  <span className="bp-step-mark">{s.state === 'done' ? '✓' : s.state === 'working' ? '●' : '○'}</span>
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
