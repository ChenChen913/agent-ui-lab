import type { JSX } from 'react'

/**
 * 每个实验一张「示意图」：不是缩略图，是把它最核心的结构画出来。
 * 六张图必须一眼就能区分：一个列表 / 一条线 / 一个终端 / 一条时间轴 / 一个桌面 / 一片场。
 *
 * 带变体的实验（现在只有 001）会把配色传进来，所以卡片里切换变体时预览会跟着换色。
 */

const W = 320
const H = 160

export interface PreviewProps {
  bg?: string
  fg?: string
  accent?: string
  bg2?: string
}

const Box = ({ bg, children }: { bg: string; children: React.ReactNode }) => (
  <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width={W} height={H} fill={bg} />
    {children}
  </svg>
)

function Bench({ bg = '#ffffff', fg = '#0a0a0a', accent = '#d93a2b' }: PreviewProps) {
  return (
    <Box bg={bg}>
      <line x1="46" y1="18" x2="46" y2="142" stroke={fg} strokeOpacity="0.14" />
      <rect x="62" y="24" width="132" height="8" fill={fg} />
      <rect x="62" y="40" width="62" height="3" fill={fg} opacity="0.5" />
      <rect x="62" y="58" width="188" height="4" fill={fg} opacity="0.2" />
      <rect x="62" y="74" width="164" height="4" fill={fg} opacity="0.2" />
      <rect x="62" y="90" width="196" height="4" fill={fg} opacity="0.2" />
      <rect x="62" y="112" width="54" height="6" fill={fg} opacity="0.9" />
      <rect x="62" y="136" width="150" height="1" fill={fg} opacity="0.14" />
      <rect x="62" y="144" width="120" height="1" fill={fg} opacity="0.14" />
      <rect x="232" y="136" width="26" height="6" fill={accent} />
    </Box>
  )
}

function OneLine({ bg = '#ffffff', fg = '#111111', bg2 }: PreviewProps) {
  return (
    <Box bg={bg}>
      {bg2 ? <rect x="292" y="0" width="28" height="160" fill={bg2} /> : null}
      <rect x="40" y="60" width="72" height="3" fill={fg} opacity="0.8" />
      <rect x="40" y="79" width="252" height="1" fill={fg} opacity="0.12" />
      <rect x="40" y="79" width="150" height="2" fill={fg} />
      <circle cx="190" cy="80" r="3.5" fill={fg} />
      <rect x="40" y="98" width="104" height="3" fill={fg} opacity="0.3" />
      <rect x="40" y="124" width="96" height="1" fill={fg} opacity="0.12" />
      <rect x="40" y="136" width="96" height="1" fill={fg} opacity="0.12" />
      <rect x="298" y="79" width="16" height="2" fill={bg2 ? '#ededea' : fg} opacity="0.85" />
      <rect x="298" y="60" width="12" height="3" fill={bg2 ? '#ededea' : fg} opacity="0.5" />
    </Box>
  )
}

function Terminal() {
  return (
    <Box bg="#07080a">
      <rect x="24" y="14" width="272" height="132" rx="7" fill="#0e1012" stroke="#22272a" />
      <rect x="24.5" y="14.5" width="271" height="17" rx="7" fill="#14171a" />
      <rect x="24.5" y="28" width="271" height="3" fill="#14171a" />
      <rect x="36" y="21" width="42" height="3" fill="#d6a45f" opacity="0.9" />
      <rect x="150" y="21" width="34" height="3" fill="#6b7073" />
      <rect x="36" y="44" width="86" height="3" fill="#e7e4dc" />
      <rect x="36" y="57" width="54" height="3" fill="#d6a45f" />
      <rect x="36" y="70" width="120" height="3" fill="#8fae72" />
      <rect x="36" y="83" width="96" height="3" fill="#cf7368" />
      <rect x="36" y="100" width="148" height="1" fill="#6b7073" opacity="0.4" />
      <rect x="36" y="100" width="96" height="1" fill="#d6a45f" />
      <rect x="36" y="113" width="70" height="3" fill="#7f9fc4" />
      <rect x="24.5" y="128" width="271" height="18" fill="#14171a" />
      <rect x="24.5" y="128" width="271" height="1" fill="#22272a" />
      <rect x="36" y="134" width="44" height="3" fill="#e7e4dc" />
      <rect x="96" y="134" width="72" height="2" fill="#d6a45f" opacity="0.8" />
      <rect x="176" y="134" width="24" height="3" fill="#6b7073" />
    </Box>
  )
}

function Chronicle() {
  const lanes: [number, number][] = [[22, 26], [52, 40], [96, 30], [130, 78], [212, 34], [250, 44]]
  return (
    <Box bg="#eef1f3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="0" y={24 + i * 22} width={W} height="1" fill="#dfe5e9" />
      ))}
      {lanes.map(([x, wd], i) => (
        <rect key={i} x={x} y={22 + i * 22} width={wd} height="9" rx="1" fill={i === 3 ? '#8fa6b8' : '#16232e'} />
      ))}
      <rect x="163" y="16" width="1" height="132" fill="#c4472c" />
      <path d="M160 12 L166 12 L163 18 Z" fill="#c4472c" />
      {[60, 120, 180, 240].map((x) => <rect key={x} x={x} y="14" width="1" height="4" fill="#96a2ac" />)}
      <rect x="0" y="148" width={W} height="12" fill="#e7ebee" />
      <rect x="22" y="152" width="60" height="3" fill="#16232e" opacity="0.55" />
    </Box>
  )
}

function Desktop() {
  return (
    <Box bg="#a7b3c0">
      <rect x="0" y="0" width={W} height="60" fill="#3f8fa8" opacity="0.16" />
      <rect x="22" y="26" width="118" height="66" rx="7" fill="#fcfcfb" stroke="#e5e5e3" />
      <rect x="22.5" y="26.5" width="117" height="15" rx="7" fill="#f2f2f0" />
      <rect x="22.5" y="38" width="117" height="3" fill="#f2f2f0" />
      <rect x="30" y="31" width="42" height="4" fill="#1b2027" opacity="0.75" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="30" y={50 + i * 11} width="34" height="3" fill="#626b76" opacity="0.7" />
          <rect x="104" y={50 + i * 11} width="28" height="3" fill="#1b2027" opacity="0.5" />
        </g>
      ))}
      <rect x="156" y="52" width="104" height="58" rx="7" fill="#fcfcfb" stroke="#e5e5e3" />
      <rect x="156.5" y="52.5" width="103" height="15" rx="7" fill="#f2f2f0" />
      <rect x="156.5" y="64" width="103" height="3" fill="#f2f2f0" />
      <rect x="164" y="57" width="34" height="4" fill="#1b2027" opacity="0.75" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="164" y={74 + i * 11} width="4" height="4" fill={i === 2 ? '#c4811f' : '#4f8a63'} />
          <rect x="174" y={75 + i * 11} width="52" height="3" fill="#626b76" opacity="0.7" />
        </g>
      ))}
      <rect x="112" y="116" width="94" height="26" rx="9" fill="#fcfcfb" opacity="0.9" stroke="#e5e5e3" />
      <rect x="122" y="123" width="12" height="12" rx="4" fill="#f2f2f0" stroke="#e5e5e3" />
      <rect x="140" y="123" width="12" height="12" rx="4" fill="#f2f2f0" stroke="#e5e5e3" />
      <rect x="158" y="123" width="12" height="12" rx="4" fill="#f2f2f0" stroke="#4f8a63" />
      <rect x="262" y="110" width="30" height="30" rx="11" fill="#fcfcfb" stroke="#3f8fa8" />
      <circle cx="277" cy="125" r="2.6" fill="#3f8fa8" />
      <circle cx="270" cy="120" r="1.8" fill="#3f8fa8" />
      <circle cx="284" cy="130" r="1.8" fill="#3f8fa8" />
    </Box>
  )
}

function Spatial() {
  const dots: [number, number, number][] = [
    [160, 80, 7], [96, 42, 4.5], [228, 44, 4.5], [104, 122, 4.5], [52, 68, 3], [40, 116, 2.5],
    [148, 30, 2.5], [212, 116, 3], [268, 96, 2.5], [276, 30, 2], [176, 138, 2],
  ]
  const links: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 6], [4, 5], [2, 9], [3, 7], [7, 8], [3, 10]]
  return (
    <Box bg="#08090c">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={'v' + i} x={i * 52 + 8} y="0" width="1" height={H} fill="#ffffff" opacity="0.035" />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <rect key={'h' + i} x="0" y={i * 48 + 8} width={W} height="1" fill="#ffffff" opacity="0.035" />
      ))}
      <circle cx="160" cy="80" r="46" fill="none" stroke="#ffffff" strokeOpacity="0.06" />
      {links.map(([a, b], i) => (
        <line key={i} x1={dots[a][0]} y1={dots[a][1]} x2={dots[b][0]} y2={dots[b][1]}
          stroke={i === 8 ? '#d8945a' : '#e6e4df'} strokeOpacity={i === 8 ? 0.85 : 0.24}
          strokeWidth="1" strokeDasharray={i === 8 ? '3 3' : undefined} />
      ))}
      {dots.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i === 0 ? '#f4f2ec' : '#8d939c'} />
      ))}
      <circle cx="268" cy="96" r="3" fill="#7fae86" />
    </Box>
  )
}

/** 008 · 通用聊天式：侧栏 + 无气泡对话 + 悬浮输入框 */
function BaselinePv() {
  return (
    <Box bg="#fbfbfc">
      <rect x="0" y="0" width="62" height={H} fill="#f3f4f6" />
      <rect x="0" y="0" width="1" height={H} fill="#e9ebef" />
      <rect x="10" y="12" width="15" height="15" rx="4.5" fill="#15181d" />
      <rect x="30" y="17" width="22" height="4" rx="2" fill="#5a626e" />
      <rect x="10" y="36" width="42" height="15" rx="4.5" fill="#ffffff" stroke="#e5e7eb" />
      <rect x="16" y="41" width="26" height="4" rx="2" fill="#8b929e" />
      {[58, 88, 118].map((y) => <rect key={y} x="10" y={y} width="18" height="3" rx="1.5" fill="#b9bec7" />)}
      {[70, 82, 94, 124, 136].map((y) => <rect key={y} x="10" y={y} width="38" height="4" rx="2" fill="#c8ccd3" />)}
      <rect x="150" y="30" width="118" height="17" rx="8" fill="#f0f1f4" />
      <rect x="176" y="36" width="80" height="4" rx="2" fill="#8b929e" />
      <rect x="80" y="60" width="16" height="16" rx="5" fill="#15181d" />
      <rect x="104" y="62" width="150" height="4" rx="2" fill="#5a626e" />
      <rect x="104" y="72" width="120" height="4" rx="2" fill="#c8ccd3" />
      <rect x="104" y="88" width="88" height="14" rx="7" fill="#f7f8fa" stroke="#eef0f3" />
      <rect x="112" y="93" width="5" height="5" rx="2.5" fill="#2f6bd8" />
      <rect x="121" y="94" width="62" height="3" rx="1.5" fill="#aab0b9" />
      <rect x="80" y="120" width="228" height="30" rx="10" fill="#ffffff" stroke="#e5e7eb" />
      <rect x="92" y="130" width="70" height="4" rx="2" fill="#c8ccd3" />
      <rect x="92" y="139" width="12" height="3" rx="1.5" fill="#d5d9e0" />
      <rect x="110" y="139" width="12" height="3" rx="1.5" fill="#d5d9e0" />
      <circle cx="292" cy="135" r="8" fill="#15181d" />
      <rect x="289.5" y="132" width="5" height="6" rx="1" fill="#ffffff" />
    </Box>
  )
}

/** 009 · 工作台：左边对话，右边产物 */
function WorkbenchPv() {
  return (
    <Box bg="#f6f6f4">
      <rect x="0" y="0" width="52" height={H} fill="#f6f6f4" />
      <rect x="52" y="0" width="1" height={H} fill="#e6e5e1" />
      <rect x="10" y="11" width="16" height="16" rx="5" fill="#2e6b52" />
      <rect x="30" y="14" width="14" height="4" rx="2" fill="#5c5f5a" />
      <circle cx="32" cy="23" r="2" fill="#3f9c6b" />
      <rect x="36" y="21.5" width="12" height="3" rx="1.5" fill="#a9aca6" />
      <rect x="10" y="34" width="32" height="14" rx="5" fill="#191a18" />
      <rect x="10" y="56" width="14" height="3" rx="1.5" fill="#b9bcb6" />
      <rect x="10" y="68" width="34" height="6" rx="3" fill="#ffffff" stroke="#e6e5e1" />
      <rect x="10" y="80" width="34" height="5" rx="2.5" fill="#c5c8c2" />
      <rect x="80" y="26" width="120" height="16" rx="8" fill="#f0efec" />
      <rect x="106" y="32" width="76" height="4" rx="2" fill="#8b8e88" />
      <rect x="80" y="52" width="18" height="18" rx="6" fill="#2e6b52" />
      <rect x="80" y="80" width="200" height="26" rx="9" fill="#fcfcfb" stroke="#e6e5e1" />
      <circle cx="96" cy="93" r="5.5" fill="none" stroke="#2e6b52" strokeWidth="1.6" strokeDasharray="10 6" />
      <rect x="110" y="91" width="120" height="4" rx="2" fill="#8b8e88" />
      <rect x="106" y="120" width="140" height="4" rx="2" fill="#5c5f5a" />
      <rect x="106" y="131" width="100" height="4" rx="2" fill="#b9bcb6" />
      <rect x="238" y="0" width="1" height={H} fill="#e6e5e1" />
      <rect x="239" y="0" width="81" height={H} fill="#ffffff" />
      <rect x="250" y="14" width="40" height="4" rx="2" fill="#5c5f5a" />
      <rect x="250" y="34" width="30" height="5" rx="2.5" fill="#191a18" />
      <rect x="250" y="48" width="58" height="3" rx="1.5" fill="#b9bcb6" />
      <rect x="250" y="55" width="52" height="3" rx="1.5" fill="#b9bcb6" />
      <rect x="250" y="62" width="56" height="3" rx="1.5" fill="#b9bcb6" />
      <rect x="250" y="69" width="34" height="3" rx="1.5" fill="#b9bcb6" />
      <rect x="250" y="84" width="58" height="26" rx="4" fill="#f8f8f6" stroke="#efeeea" />
      <rect x="250" y="120" width="24" height="5" rx="2.5" fill="#191a18" />
      <rect x="250" y="132" width="58" height="3" rx="1.5" fill="#b9bcb6" />
      <rect x="250" y="139" width="44" height="3" rx="1.5" fill="#b9bcb6" />
    </Box>
  )
}

/** 010 · 首页：悬在正中的输入框 */
function HomePv() {
  return (
    <Box bg="#f8f7f5">
      <rect x="20" y="16" width="20" height="20" rx="6.5" fill="#17171a" />
      <rect x="128" y="34" width="64" height="11" rx="5.5" fill="#17171a" />
      <rect x="112" y="54" width="96" height="4" rx="2" fill="#b6b5b1" />
      {[0, 1, 2].map((i) => <rect key={i} x={44 + i * 80} y="72" width="70" height="20" rx="7" fill="none" stroke="#e8e7e3" />)}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={54 + i * 80} y="78" width="34" height="3.5" rx="1.75" fill="#5f6066" />
          <rect x={54 + i * 80} y="85" width="24" height="2.5" rx="1.25" fill="#b6b5b1" />
        </g>
      ))}
      <rect x="40" y="104" width="240" height="42" rx="13" fill="#ffffff" stroke="#e8e7e3" />
      <rect x="56" y="116" width="76" height="4" rx="2" fill="#c9c8c4" />
      <circle cx="60" cy="134" r="4.5" fill="none" stroke="#a9a8a4" strokeWidth="1.4" />
      <rect x="70" y="132" width="24" height="3" rx="1.5" fill="#b6b5b1" />
      <rect x="102" y="132" width="20" height="3" rx="1.5" fill="#b6b5b1" />
      <circle cx="256" cy="133" r="9" fill="#17171a" />
      <rect x="253" y="129.5" width="6" height="7" rx="1" fill="#ffffff" />
    </Box>
  )
}

/** 007 · 委托书：左边距竖线 + 条款 + 印章 */
function Brief() {
  return (
    <Box bg="#131211">
      <rect x="44" y="22" width="1" height="126" fill="#3a3632" />
      <rect x="22" y="16" width="52" height="3" rx="1.5" fill="#6d665e" />
      <rect x="252" y="16" width="46" height="3" rx="1.5" fill="#6d665e" />
      <rect x="22" y="34" width="9" height="4" rx="2" fill="#8c857b" />
      <rect x="58" y="32" width="24" height="2.5" rx="1.25" fill="#6d665e" />
      <rect x="58" y="42" width="78" height="6" rx="3" fill="#ece7dd" />
      <rect x="58" y="60" width="216" height="1" fill="#3a3632" />
      <path d="M268 57 l3 3 l6 -7" stroke="#7fa07a" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="284" y="55" width="14" height="3" rx="1.5" fill="#6d665e" />
      <rect x="22" y="68" width="9" height="4" rx="2" fill="#8c857b" />
      <rect x="58" y="66" width="24" height="2.5" rx="1.25" fill="#6d665e" />
      <rect x="58" y="76" width="64" height="6" rx="3" fill="#ece7dd" />
      <rect x="58" y="94" width="216" height="1" fill="#3a3632" />
      <path d="M268 91 l3 3 l6 -7" stroke="#7fa07a" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="284" y="89" width="14" height="3" rx="1.5" fill="#6d665e" />
      <rect x="22" y="102" width="9" height="4" rx="2" fill="#c8623f" />
      <rect x="58" y="100" width="24" height="2.5" rx="1.25" fill="#6d665e" />
      <rect x="58" y="110" width="58" height="6" rx="3" fill="#c8623f" />
      <rect x="58" y="128" width="216" height="1" fill="#5c3a2c" />
      <path d="M268 125 l4 4 l4 -4 M272 129 l0 -4" stroke="#c8623f" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="284" y="123" width="14" height="3" rx="1.5" fill="#c8623f" />
      <rect x="236" y="136" width="34" height="16" rx="1.5" fill="none" stroke="#c8623f" strokeWidth="1.4" />
    </Box>
  )
}

/** 011 · 会话：窄的绿色气泡 + 宽的白色内容面板 */
function BubblePv() {
  return (
    <Box bg="#ffffff">
      <rect x="0" y="0" width={W} height="24" fill="#ffffff" />
      <rect x="0" y="24" width={W} height="1" fill="#ededed" />
      <rect x="16" y="7" width="11" height="11" rx="3.5" fill="#0e8a5f" />
      <rect x="33" y="11" width="40" height="4" rx="2" fill="#3a3f3d" />
      <rect x="79" y="12" width="18" height="3" rx="1.5" fill="#b4b8b6" />
      <rect x="196" y="38" width="14" height="3" rx="1.5" fill="#b4b8b6" />
      <rect x="170" y="47" width="78" height="22" rx="7" fill="#0e8a5f" />
      <rect x="182" y="55" width="54" height="4" rx="2" fill="#ffffff" opacity="0.92" />
      <circle cx="264" cy="58" r="11" fill="#e9ebee" />
      <circle cx="264" cy="55" r="3.6" fill="#a2a7b0" />
      <path d="M257.5 64.5 a6.6 6.6 0 0 1 13 0 z" fill="#a2a7b0" />
      <rect x="16" y="86" width="11" height="11" rx="3.5" fill="#0e8a5f" />
      <rect x="33" y="90" width="38" height="3" rx="1.5" fill="#b4b8b6" />
      <rect x="33" y="99" width="243" height="50" rx="8" fill="#ffffff" stroke="#ededed" />
      <rect x="47" y="110" width="196" height="4" rx="2" fill="#4a504e" />
      <rect x="47" y="122" width="212" height="20" rx="6" fill="#f5f7f6" />
      <circle cx="59" cy="132" r="3.4" fill="#0e8a5f" />
      <rect x="68" y="130" width="88" height="3.5" rx="1.75" fill="#7d8380" />
      <rect x="214" y="130" width="26" height="3.5" rx="1.75" fill="#a9aeac" />
      <rect x="16" y="152" width="260" height="1" fill="none" />
      <rect x="16" y="146" width="260" height="14" rx="5" fill="#ffffff" stroke="#c9d3ce" />
      <rect x="26" y="151" width="112" height="4" rx="2" fill="#c4c9c7" />
      <rect x="258" y="148" width="14" height="11" rx="4" fill="#0e8a5f" />
      <path d="M265 153.5 l0 4 M263 155.5 l2 -2 l2 2" stroke="#ffffff" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  )
}

/** 012 · 计划：一条竖向轨道，改一步下游亮成琥珀 */
function PlanPv() {
  return (
    <Box bg="#f7f8f9">
      <rect x="0" y="0" width={W} height="26" fill="#f7f8f9" />
      <rect x="0" y="26" width={W} height="1" fill="#e3e6ea" />
      <rect x="18" y="11" width="86" height="4" rx="2" fill="#4a5058" />
      <rect x="280" y="11" width="22" height="4" rx="2" fill="#aeb4ba" />
      <rect x="18" y="38" width="168" height="4" rx="2" fill="#868e96" />
      <rect x="43" y="56" width="1.5" height="96" fill="#e3e6ea" />
      <circle cx="44" cy="66" r="9" fill="#2f7d5c" />
      <path d="M40 66 l3 3 l5 -5.5" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="64" y="58" width="72" height="5" rx="2.5" fill="#8b9299" />
      <rect x="64" y="70" width="118" height="3.5" rx="1.75" fill="#c2c8ce" />
      <rect x="64" y="80" width="96" height="11" rx="4" fill="#f2f8f5" stroke="#dcebe3" />
      <rect x="71" y="84" width="82" height="3.5" rx="1.75" fill="#7aa892" />
      <circle cx="44" cy="106" r="9" fill="#ffffff" stroke="#b8791a" strokeWidth="1.6" />
      <rect x="40.5" y="104" width="7" height="4" rx="1" fill="#b8791a" />
      <rect x="64" y="98" width="88" height="5" rx="2.5" fill="#b8791a" />
      <rect x="64" y="110" width="140" height="3.5" rx="1.75" fill="#c2c8ce" />
      <rect x="64" y="121" width="186" height="30" rx="7" fill="#fdf8ee" stroke="#f0e2c6" />
      <rect x="74" y="129" width="150" height="3.5" rx="1.75" fill="#c9ab6d" />
      <rect x="74" y="138" width="40" height="9" rx="3.5" fill="#ffffff" stroke="#e3d4b4" />
      <rect x="119" y="138" width="34" height="9" rx="3.5" fill="#ffffff" stroke="#e3d4b4" />
      <circle cx="44" cy="140" r="9" fill="#ffffff" stroke="#e3e6ea" strokeWidth="1.6" />
      <rect x="41" y="138.5" width="6" height="3.5" rx="1" fill="#c2c8ce" />
      <rect x="0" y="152" width={W} height="1" fill="#e3e6ea" />
      <rect x="18" y="156" width="46" height="12" rx="4" fill="none" stroke="#e3e6ea" />
      <rect x="260" y="157" width="42" height="10" rx="4" fill="none" stroke="#e3e6ea" />
    </Box>
  )
}

/** 013 · 分量：做完的缩成一行，正在跑的大任务接管 */
function WeightPv() {
  return (
    <Box bg="#fafaf9">
      <rect x="18" y="16" width="120" height="5" rx="2.5" fill="#3d3b37" />
      <rect x="18" y="30" width="180" height="4" rx="2" fill="#a5a19a" />
      <rect x="18" y="44" width="52" height="13" rx="6" fill="none" stroke="#e6e4e0" />
      <circle cx="30" cy="50.5" r="3" fill="#6f8f7c" />
      <rect x="37" y="49" width="24" height="3" rx="1.5" fill="#a5a19a" />
      <rect x="18" y="68" width="94" height="5" rx="2.5" fill="#3d3b37" />
      <rect x="18" y="82" width="150" height="4" rx="2" fill="#a5a19a" />
      <rect x="18" y="96" width="284" height="48" rx="11" fill="#ffffff" stroke="#e6e4e0" />
      <rect x="32" y="108" width="130" height="5" rx="2.5" fill="#1c1c1a" />
      <circle cx="39" cy="126" r="5" fill="#e3ede7" />
      <rect x="50" y="124" width="76" height="4" rx="2" fill="#55524d" />
      <circle cx="39" cy="137" r="5" fill="#1c1c1a" />
      <rect x="50" y="135" width="58" height="4" rx="2" fill="#1c1c1a" />
      <rect x="18" y="152" width="284" height="1" fill="#e6e4e0" />
    </Box>
  )
}

/** 014 · 沉淀：左页边是做过的事，右边是文档本身 */
function SettlePv() {
  return (
    <Box bg="#f2f1ee">
      <rect x="26" y="14" width="86" height="16" rx="5" fill="#fffefc" />
      <circle cx="36" cy="22" r="3" fill="#6f8f7c" />
      <rect x="43" y="20.5" width="26" height="3" rx="1.5" fill="#7c7770" />
      <rect x="26" y="34" width="86" height="16" rx="5" fill="#fffefc" />
      <circle cx="36" cy="42" r="3" fill="#1f5f8b" />
      <rect x="43" y="40.5" width="30" height="3" rx="1.5" fill="#1b1a18" />
      <rect x="26" y="54" width="86" height="14" rx="5" fill="none" />
      <circle cx="36" cy="61" r="3" fill="#c9c5bd" />
      <rect x="43" y="59.5" width="22" height="3" rx="1.5" fill="#b0aca5" />
      <rect x="132" y="18" width="1" height="126" fill="#e5e2dc" />
      <rect x="126" y="34" width="14" height="1" fill="#1f5f8b" />
      <rect x="148" y="26" width="62" height="6" rx="3" fill="#1b1a18" />
      <rect x="148" y="42" width="150" height="4" rx="2" fill="#5c5850" />
      <rect x="148" y="52" width="138" height="4" rx="2" fill="#5c5850" />
      <rect x="148" y="62" width="104" height="4" rx="2" fill="#5c5850" />
      <rect x="126" y="84" width="14" height="1" fill="#e5e2dc" />
      <rect x="148" y="76" width="78" height="6" rx="3" fill="#1b1a18" />
      <rect x="148" y="92" width="154" height="28" rx="7" fill="#f4f7f9" />
      <rect x="156" y="99" width="134" height="4" rx="2" fill="#5c7484" />
      <rect x="156" y="109" width="104" height="4" rx="2" fill="#5c7484" />
      <rect x="148" y="130" width="154" height="14" rx="4" fill="#ffffff" stroke="#e5e2dc" />
      <rect x="0" y="152" width={W} height="1" fill="#e5e2dc" />
      <rect x="18" y="157" width="120" height="3" rx="1.5" fill="#b0aca5" />
    </Box>
  )
}

/** 015 · 回来：简报 + 一条有时间长度的带 */
function ReturnPv() {
  return (
    <Box bg="#f4f6f8">
      <rect x="0" y="0" width={W} height="22" fill="#f4f6f8" />
      <rect x="0" y="22" width={W} height="1" fill="#e2e6ea" />
      <rect x="18" y="9" width="76" height="4" rx="2" fill="#14171b" />
      <rect x="248" y="9" width="54" height="4" rx="2" fill="#b6bdc5" />
      <circle cx="23" cy="38" r="3" fill="#b8811c" />
      <rect x="32" y="36" width="52" height="4" rx="2" fill="#737b85" />
      <rect x="18" y="48" width="284" height="34" rx="9" fill="#fffdf7" stroke="#f0e3c4" />
      <rect x="30" y="58" width="150" height="4" rx="2" fill="#5c5a52" />
      <rect x="30" y="68" width="52" height="10" rx="4" fill="#ffffff" stroke="#e8d9b4" />
      <rect x="88" y="68" width="52" height="10" rx="4" fill="#ffffff" stroke="#e8d9b4" />
      <circle cx="23" cy="96" r="3" fill="#2b6ca8" />
      <rect x="32" y="94" width="76" height="4" rx="2" fill="#737b85" />
      <rect x="18" y="106" width="284" height="42" rx="9" fill="#ffffff" stroke="#e2e6ea" />
      <rect x="32" y="115" width="26" height="3" rx="1.5" fill="#9aa3ac" />
      <rect x="66" y="115" width="120" height="3.5" rx="1.75" fill="#3a4149" />
      <rect x="262" y="115" width="26" height="3.5" rx="1.75" fill="#2b6ca8" />
      <rect x="18" y="126" width="284" height="1" fill="#edf0f3" />
      <rect x="32" y="134" width="26" height="3" rx="1.5" fill="#9aa3ac" />
      <rect x="66" y="134" width="142" height="3.5" rx="1.75" fill="#3a4149" />
      <rect x="0" y="160" width={W} height="0" fill="none" />
      <rect x="18" y="156" width="284" height="2" rx="1" fill="#e2e6ea" />
      <circle cx="70" cy="157" r="4" fill="#2b6ca8" />
      <circle cx="150" cy="157" r="4" fill="#2b6ca8" />
      <circle cx="212" cy="157" r="4" fill="#b8811c" />
    </Box>
  )
}

export const PREVIEWS: Record<string, (p: PreviewProps) => JSX.Element> = {
  '001': Bench,
  '002': OneLine,
  '003': Terminal,
  '004': Chronicle,
  '005': Desktop,
  '006': Spatial,
  '007': Brief,
  '008': BaselinePv,
  '009': WorkbenchPv,
  '010': HomePv,
  '011': BubblePv,
  '012': PlanPv,
  '013': WeightPv,
  '014': SettlePv,
  '015': ReturnPv,
}
