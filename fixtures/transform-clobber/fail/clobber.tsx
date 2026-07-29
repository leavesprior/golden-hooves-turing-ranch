// MUST FAIL (exit 1). The original defect shape: one node owns both authorities.
export function Clobber() {
  return (
    <g className="map-compass" transform="translate(92, 5)">
      <text x="4" y="3">N</text>
    </g>
  )
}
