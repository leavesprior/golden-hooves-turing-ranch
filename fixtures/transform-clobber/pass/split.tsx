// MUST PASS (exit 0). The remedy: position outside, motion inside.
export function Split({ x, y, moving }: { x: number; y: number; moving: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className={moving ? 'map-wagon-bob' : undefined}>
        <circle r="1" />
      </g>
    </g>
  )
}
