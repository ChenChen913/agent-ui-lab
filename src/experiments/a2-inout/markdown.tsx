import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

/** Agent 回复里的 Markdown。react-markdown + GFM（表格、脚注、任务列表都支持） */
export default function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          hr: () => <hr />,
          table: ({ children }) => <div className="md-tw"><table>{children}</table></div>,
          code: ({ className, children }) => {
            const isBlock = /language-/.test(className ?? '')
            if (!isBlock) return <code className="md-ic">{children}</code>
            return <CodeBlock lang={(className ?? '').replace('language-', '')} code={String(children).replace(/\n$/, '')} />
          },
          sup: ({ children }) => <sup>{children}</sup>,
          section: ({ children, ...props }: any) =>
            props['data-footnotes'] !== undefined
              ? <section className="md-fn">{children}</section>
              : <section>{children}</section>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="md-code">
      <div className="md-code-h">
        <span>{lang || 'text'}</span>
        <button
          onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1400) }}
        >
          {copied ? <Check size={12} strokeWidth={2.6} /> : <Copy size={12} strokeWidth={2} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}
