// MUST REPORT A BLIND SPOT (exit 2). A spread may hide a className; not knowable.
export function Spread(props: Record<string, unknown>) {
  return <g transform="translate(3, 3)" {...props}><text>x</text></g>
}
