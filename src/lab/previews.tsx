import type { JSX } from 'react'

/**
 * 每个实验一张「示意图」—— 不是缩略图，是把它最核心的那个结构画出来。
 * 六张图必须一眼就能区分：一个列表 / 一条线 / 一个终端 / 一条时间轴 / 一个桌面 / 一片场。
 */

const W = 320
const H = 160

const Box = ({ bg, children, dark }: { bg: string; children: React.ReactNode; dark?: boolean }) => (
  <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width={W} height={H} fill={bg} />
    {children}
    {dark ? null : null}
  </svg>
)

function Bench() {
  return (
    <Box bg="#ffffff">
      <line x1="46" y1="18" x2="46" y2="142" stroke="#e8e8e8" />
      <rect x="62" y="24" width="132" height="8" fill="#0a0a0a" />
      <rect x="62" y="40" width="62" height="3" fill="#6e6e6e" />
      <rect x="62" y="58" width="188" height="4" fill="#0a0a0a" opacity="0.18" />
      <rect x="62" y="74" width="164" height="4" fill="#0a0a0a" opacity="0.18" />
      <rect x="62" y="90" width="196" height="4" fill="#0a0a0a" opacity="0.18" />
      <rect x="62" y="112" width="54" height="6" fill="#0a0a0a" opacity="0.9" />
      <rect x="62" y="136" width="150" height="1" fill="#e8e8e8" />
      <rect x="62" y="144" width="120" height="1" fill="#e8e8e8" />
      <rect x="232" y="136" width="26" height="6" fill="#d93a2b" />
      <rect x="268" y="136" width="1" height="1" fill="#ffffff" />
    </Box>
  )
}

function OneLine() {
  return (
    <Box bg="#ffffff">
      <rect x="292" y="0" width="28" height="160" fill="#0b0b0c" />
      <rect x="40" y="60" width="72" height="3" fill="#111111" opacity="0.8" />
      <rect x="40" y="79" width="252" height="1" fill="#111111" opacity="0.1" />
      <rect x="40" y="79" width="150" height="2" fill="#111111" />
      <circle cx="190" cy="80" r="3.5" fill="#111111" />
      <rect x="40" y="98" width="104" height="3" fill="#111111" opacity="0.3" />
      <rect x="40" y="124" width="96" height="16" rx="0" fill="none" />
      <rect x="40" y="124" width="96" height="1" fill="#111111" opacity="0.12" />
      <rect x="40" y="136" width="96" height="1" fill="#111111" opacity="0.12" />
      <rect x="40" y="60" width="0.5" height="4" fill="#ffffff" />
      <rect x="298" y="79" width="16" height="2" fill="#ededea" opacity="0.85" />
      <rect x="298" y="60" width="12" height="3" fill="#ededea" opacity="0.5" />
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
  const lanes: [number, number][] = [
    [22, 26],
    [52, 40],
    [96, 30],
    [130, 78],
    [212, 34],
    [250, 44],
  ]
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
      {[60, 120, 180, 240].map((x) => (
        <rect key={x} x={x} y="14" width="1" height="4" fill="#96a2ac" />
      ))}
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
    [160, 80, 7],
    [96, 42, 4.5],
    [228, 44, 4.5],
    [104, 122, 4.5],
    [52, 68, 3],
    [40, 116, 2.5],
    [148, 30, 2.5],
    [212, 116, 3],
    [268, 96, 2.5],
    [276, 30, 2],
    [176, 138, 2],
  ]
  const links: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [1, 4], [1, 6], [4, 5], [2, 9], [3, 7], [7, 8], [3, 10],
  ]
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
        <line
          key={i}
          x1={dots[a][0]} y1={dots[a][1]} x2={dots[b][0]} y2={dots[b][1]}
          stroke={i === 8 ? '#d8945a' : '#e6e4df'}
          strokeOpacity={i === 8 ? 0.85 : 0.22}
          strokeWidth="1"
          strokeDasharray={i === 8 ? '3 3' : undefined}
        />
      ))}
      {dots.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i === 0 ? '#f4f2ec' : '#8d939c'} />
      ))}
      <circle cx="268" cy="96" r="3" fill="#7fae86" />
    </Box>
  )
}

export const PREVIEWS: Record<string, () => JSX.Element> = {
  '001': Bench,
  '002': OneLine,
  '003': Terminal,
  '004': Chronicle,
  '005': Desktop,
  '006': Spatial,
}
