'use client'

import { localAvoidFor, localPlacesFor, type LocalPlaceKind } from '@/lib/localPlaces'
import { VolcanoStayShow } from '@/components/VolcanoStayShow'

const KIND_LABEL: Record<LocalPlaceKind, string> = { food: 'Eat', show: 'A show', explore: 'Walk & explore' }

function checkedLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`
}

/**
 * The guest layer beside the 1849 street: real places open today, each with
 * what stood there then. The 1849 face hides later buildings on purpose; this
 * panel is where a guest finds where to actually go.
 */
export function LocalTodayPanel({ townId, townName }: { townId: string; townName: string }) {
  const places = localPlacesFor(townId)
  if (places.length === 0) return null
  const avoid = localAvoidFor(townId)
  const oldest = places.map((p) => p.verifiedAt).sort()[0]
  return (
    <details className="west-face-paper mt-3" data-testid="local-today">
      <summary className="cursor-pointer font-serif text-sm text-[#f3ead8]">
        Go there today · {townName} <span className="text-xs text-[#b8a88a]">(checked {checkedLabel(oldest)})</span>
      </summary>
      {(['food', 'show', 'explore'] as const).map((kind) => {
        const group = places.filter((p) => p.kind === kind)
        if (group.length === 0) return null
        return (
          <div key={kind} className="mt-3">
            <p className="west-face-eyebrow">{KIND_LABEL[kind]}</p>
            <ul className="mt-1 space-y-2">
              {group.map((p) => (
                <li key={p.id} data-testid={`local-place-${p.id}`}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-serif text-sm text-[#f3ead8] underline decoration-dotted">
                    {p.name}
                  </a>
                  <p className="font-serif text-xs text-[#e8dcc4]">{p.address}{p.phone ? ` · ${p.phone}` : ''}</p>
                  <p className="font-serif text-xs text-[#e8dcc4]">{p.today}</p>
                  <p className="font-serif text-xs italic text-[#b8a88a]">Then: {p.then}</p>
                  {p.id === 'vol_cobblestone' && <VolcanoStayShow />}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {avoid.length > 0 && (
        <div className="mt-3">
          <p className="west-face-eyebrow">Save yourself the trip</p>
          <ul className="mt-1 space-y-1">
            {avoid.map((a) => (
              <li key={a.id} className="font-serif text-xs text-[#b8a88a]">{a.name}: {a.reason}</li>
            ))}
          </ul>
        </div>
      )}
    </details>
  )
}
