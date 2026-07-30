// MUST FAIL (exit 1). The wagon shape: both authorities present, both dynamic.
export function DynamicClobber({ x, y, moving }: { x: number; y: number; moving: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`} className={moving ? 'map-wagon-bob' : undefined}>
      <circle r="1" />
    </g>
  )
}
