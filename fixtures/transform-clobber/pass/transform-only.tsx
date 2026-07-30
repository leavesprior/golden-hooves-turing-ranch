// MUST PASS (exit 0). A transform with no class cannot be clobbered.
export function TransformOnly() {
  return <g transform="translate(1, 1)"><text>x</text></g>
}
