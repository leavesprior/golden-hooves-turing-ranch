// MUST PASS (exit 0). Documented, deliberate exception via the escape hatch.
export function Allowed() {
  return (
    <g
      className="decorative-only"
      transform="translate(2, 2)"
      data-allow-transform-class="decorative-only sets fill, never transform"
    >
      <text>x</text>
    </g>
  )
}
