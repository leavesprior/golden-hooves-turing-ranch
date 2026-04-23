'use client'

/**
 * CipherAltar — the Act 5 gate-opening puzzle.
 *
 * Renders a 2x2 draggable tray of the four Prologue keepsakes plus a central
 * void "altar heart". Dragging an artifact onto the heart snaps it to center
 * if dropped within ±12px and at a rotation that is a multiple of 90°.
 *
 * When all four artifacts are aligned AND the COMBINE button is pressed,
 * `onCipherSolved()` fires. The button stays dim until every artifact is on
 * the altar; misalignment on COMBINE gets a shake + elder-NPC hint line
 * rather than auto-advancing, so the player owns the "I did it" beat.
 *
 * The component is intentionally self-contained: it does not read the act5
 * Zustand store directly (the caller owns state transitions). This keeps the
 * mechanism reusable from the dev route and the eventual Phase 8 integration.
 *
 * Styling is inline + scoped <style> tag so it can drop into either the
 * pixel-aesthetic adventure UI or a dream-sequence full-bleed overlay later.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ArtifactId } from '@/lib/act5GateStore'

/**
 * Inline-fetches an SVG as text so we can render its DOM directly (needed to
 * toggle the invisible <g id="cipher-skeleton"> group via CSS). Falls back to
 * null until the fetch resolves; the parent renders a placeholder in that
 * window.
 */
function useInlineSvg(url: string): string | null {
  const [markup, setMarkup] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status}`))))
      .then((text) => {
        if (!cancelled) setMarkup(text)
      })
      .catch(() => {
        if (!cancelled) setMarkup(null)
      })
    return () => {
      cancelled = true
    }
  }, [url])
  return markup
}

interface CipherAltarProps {
  artifacts: ArtifactId[]
  onCipherSolved: () => void
}

interface Placement {
  id: ArtifactId
  /** Absolute position in altar-coord space (0,0 = altar heart). */
  x: number
  y: number
  rot: number
  /** True when |pos|<12 AND rot%90===0 after the last drop. */
  aligned: boolean
  /** True while the pointer is down on this artifact. */
  held: boolean
}

const ALTAR_SIZE = 520 // px — square canvas
const CENTER = ALTAR_SIZE / 2
const SNAP_RADIUS = 12
const TRAY_SLOT_RADIUS = 170 // distance from center to each tray slot (2x2 corners)

const ARTIFACT_META: Record<
  ArtifactId,
  { label: string; file: string; tray: { x: number; y: number } }
> = {
  norse_sunwheel: {
    label: 'Sunwheel Whalebone',
    file: '/assets/cipher/artifact_norse_sunwheel.svg',
    tray: { x: -TRAY_SLOT_RADIUS, y: -TRAY_SLOT_RADIUS },
  },
  miss_gorget: {
    label: 'Cahokia Shell Gorget',
    file: '/assets/cipher/artifact_miss_gorget.svg',
    tray: { x: TRAY_SLOT_RADIUS, y: -TRAY_SLOT_RADIUS },
  },
  chumash_stone: {
    label: 'Painted Island Stone',
    file: '/assets/cipher/artifact_chumash_stone.svg',
    tray: { x: -TRAY_SLOT_RADIUS, y: TRAY_SLOT_RADIUS },
  },
  inca_chakana: {
    label: 'Chakana Tile',
    file: '/assets/cipher/artifact_inca_chakana.svg',
    tray: { x: TRAY_SLOT_RADIUS, y: TRAY_SLOT_RADIUS },
  },
}

const ELDER_HINTS = [
  'Elder: "Four winds, one heart. Bring them closer."',
  'Elder: "The star-road falls through the center. Align the corners."',
  'Elder: "Turn each as the sun turns — by quarters, not by whim."',
  'Elder: "Not yet. The Council Fire burns square to the cardinal."',
]

function pickHint(seed: number): string {
  return ELDER_HINTS[seed % ELDER_HINTS.length]
}

interface ArtifactNodeProps {
  placement: Placement
  overlayReveal: boolean
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  onRotate: (delta: number) => void
}

function ArtifactNode({
  placement: p,
  overlayReveal,
  onPointerDown,
  onRotate,
}: ArtifactNodeProps) {
  const meta = ARTIFACT_META[p.id]
  const markup = useInlineSvg(meta.file)
  const style: React.CSSProperties = {
    transform: p.held
      ? `scale(0.6) translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`
      : `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`,
    opacity: p.held ? 0.25 : 1,
  }
  return (
    <div
      className={`cipher-altar-artifact placed${p.held ? ' held' : ''}${p.aligned ? ' aligned' : ''}${overlayReveal ? ' overlay' : ''}`}
      style={style}
      onPointerDown={onPointerDown}
      role="button"
      aria-label={`Drag ${meta.label}`}
      aria-pressed={p.aligned}
    >
      {markup ? (
        <div
          className="artifact-svg"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      ) : (
        <img src={meta.file} alt={meta.label} draggable={false} />
      )}
      <div className="rotctl" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onRotate(-90)}
          aria-label={`Rotate ${meta.label} left`}
        >
          ↺
        </button>
        <button
          type="button"
          onClick={() => onRotate(90)}
          aria-label={`Rotate ${meta.label} right`}
        >
          ↻
        </button>
      </div>
    </div>
  )
}

export default function CipherAltar({
  artifacts,
  onCipherSolved,
}: CipherAltarProps) {
  // Initial placements: each artifact starts in its tray slot, not on the altar.
  const [placements, setPlacements] = useState<Placement[]>(() =>
    artifacts.map((id) => ({
      id,
      x: ARTIFACT_META[id].tray.x,
      y: ARTIFACT_META[id].tray.y,
      rot: 0,
      aligned: false,
      held: false,
    })),
  )
  const [overlayReveal, setOverlayReveal] = useState(false)
  const [solved, setSolved] = useState(false)
  const [shakeSeed, setShakeSeed] = useState(0)
  const [hint, setHint] = useState<string | null>(null)
  const altarRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    id: ArtifactId
    offsetX: number
    offsetY: number
  } | null>(null)

  // Resync if the artifacts prop changes (e.g. late-collected during dev).
  useEffect(() => {
    setPlacements((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]))
      return artifacts.map(
        (id) =>
          byId.get(id) ?? {
            id,
            x: ARTIFACT_META[id].tray.x,
            y: ARTIFACT_META[id].tray.y,
            rot: 0,
            aligned: false,
            held: false,
          },
      )
    })
  }, [artifacts])

  const allOnAltar = useMemo(
    () => placements.length > 0 && placements.every((p) => p.aligned),
    [placements],
  )

  const pointerToAltarCoords = useCallback((clientX: number, clientY: number) => {
    const rect = altarRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    // Scale pointer into our fixed ALTAR_SIZE logical space.
    const scale = ALTAR_SIZE / rect.width
    const x = (clientX - rect.left) * scale - CENTER
    const y = (clientY - rect.top) * scale - CENTER
    return { x, y }
  }, [])

  const handlePointerDown = useCallback(
    (id: ArtifactId, e: React.PointerEvent<HTMLDivElement>) => {
      if (solved) return
      e.preventDefault()
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      const p = placements.find((pp) => pp.id === id)
      if (!p) return
      const pointer = pointerToAltarCoords(e.clientX, e.clientY)
      dragRef.current = {
        id,
        offsetX: pointer.x - p.x,
        offsetY: pointer.y - p.y,
      }
      setPlacements((prev) =>
        prev.map((pp) => (pp.id === id ? { ...pp, held: true } : pp)),
      )
    },
    [placements, pointerToAltarCoords, solved],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current || solved) return
      const { id, offsetX, offsetY } = dragRef.current
      const pointer = pointerToAltarCoords(e.clientX, e.clientY)
      const nx = pointer.x - offsetX
      const ny = pointer.y - offsetY
      setPlacements((prev) =>
        prev.map((pp) => (pp.id === id ? { ...pp, x: nx, y: ny } : pp)),
      )
    },
    [pointerToAltarCoords, solved],
  )

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current) return
    const { id } = dragRef.current
    dragRef.current = null
    setPlacements((prev) =>
      prev.map((pp) => {
        if (pp.id !== id) return pp
        const dist = Math.hypot(pp.x, pp.y)
        const rotMod = ((pp.rot % 360) + 360) % 360
        const rotAligned = rotMod % 90 === 0
        const aligned = dist < SNAP_RADIUS && rotAligned
        return {
          ...pp,
          held: false,
          // Snap to exact center on alignment for the reveal moment.
          x: aligned ? 0 : pp.x,
          y: aligned ? 0 : pp.y,
          aligned,
        }
      }),
    )
  }, [])

  const rotateArtifact = useCallback((id: ArtifactId, delta: number) => {
    setPlacements((prev) =>
      prev.map((pp) => {
        if (pp.id !== id) return pp
        const rot = pp.rot + delta
        // Snap-on-release will re-evaluate alignment; for now just update rot.
        return { ...pp, rot }
      }),
    )
  }, [])

  const onCombine = useCallback(() => {
    if (solved) return
    if (!allOnAltar) {
      setShakeSeed((s) => s + 1)
      setHint(pickHint(shakeSeed))
      return
    }
    setSolved(true)
    setOverlayReveal(true)
    setHint(null)
    // Fire 1.2s gold-bloom via CSS, then notify caller.
    window.setTimeout(() => {
      onCipherSolved()
    }, 1200)
  }, [allOnAltar, onCipherSolved, shakeSeed, solved])

  return (
    <div className="cipher-altar-root">
      <style>{`
        .cipher-altar-root {
          --altar-size: ${ALTAR_SIZE}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          user-select: none;
          font-family: "Press Start 2P", ui-monospace, monospace;
          color: #f3ecd8;
        }
        .cipher-altar-stage {
          position: relative;
          width: min(var(--altar-size), 92vw);
          aspect-ratio: 1 / 1;
          background: radial-gradient(circle at 50% 50%, #0a0812 0%, #000 75%);
          border: 2px solid #2a1f10;
          border-radius: 12px;
          overflow: hidden;
          touch-action: none;
        }
        .cipher-altar-heart {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 88px;
          height: 88px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, #111 0%, #000 70%);
          box-shadow:
            inset 0 0 24px #000,
            0 0 30px rgba(255, 200, 80, 0.08);
          transition: box-shadow 0.3s ease;
        }
        .cipher-altar-heart.primed {
          box-shadow:
            inset 0 0 24px #000,
            0 0 30px rgba(255, 200, 80, 0.35);
        }
        .cipher-altar-artifact {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 120px;
          height: 120px;
          margin: -60px 0 0 -60px;
          cursor: grab;
          transition:
            opacity 0.15s ease,
            transform 0.15s ease,
            filter 0.3s ease;
          will-change: transform, opacity;
        }
        .cipher-altar-artifact.held {
          cursor: grabbing;
          opacity: 0.25;
          transform: scale(0.6) translate(var(--tx), var(--ty)) rotate(var(--rot));
          z-index: 5;
        }
        .cipher-altar-artifact.placed {
          opacity: 1;
          transform: translate(var(--tx), var(--ty)) rotate(var(--rot));
        }
        .cipher-altar-artifact.aligned {
          filter: drop-shadow(0 0 8px rgba(255, 210, 120, 0.6));
        }
        .cipher-altar-artifact img,
        .cipher-altar-artifact .artifact-svg {
          width: 100%;
          height: 100%;
          pointer-events: none;
          display: block;
        }
        .cipher-altar-artifact .artifact-svg svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        /* Overlay mode: reveal the invisible cipher-skeleton in gold,
           dim every other layer inside the SVG to 0.15 opacity. */
        .cipher-altar-artifact.overlay .artifact-svg svg > *:not(#cipher-skeleton):not(defs) {
          opacity: 0.15;
          transition: opacity 0.4s ease;
        }
        .cipher-altar-artifact.overlay .artifact-svg svg #cipher-skeleton {
          opacity: 1 !important;
          stroke: #ffd76a !important;
          stroke-width: 1.5 !important;
          fill: none !important;
          filter: drop-shadow(0 0 6px rgba(255, 210, 120, 0.55));
          transition: opacity 0.4s ease;
        }
        .cipher-altar-artifact.overlay .artifact-svg svg #cipher-skeleton * {
          stroke: #ffd76a !important;
          stroke-width: 1.5 !important;
          fill: none !important;
        }
        .cipher-altar-artifact .rotctl {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .cipher-altar-artifact:hover .rotctl,
        .cipher-altar-artifact.aligned .rotctl {
          opacity: 0.9;
        }
        .cipher-altar-artifact .rotctl button {
          font: inherit;
          font-size: 10px;
          padding: 2px 6px;
          background: #1a1208;
          color: #f3ecd8;
          border: 1px solid #3a2e18;
          border-radius: 3px;
          cursor: pointer;
        }
        .cipher-altar-artifact .rotctl button:hover {
          background: #2a1f10;
        }
        .cipher-altar-shake {
          animation: altar-shake 0.45s ease-in-out;
        }
        @keyframes altar-shake {
          0%,100% { transform: translate(-50%,-50%) translateX(0); }
          15% { transform: translate(-50%,-50%) translateX(-6px); }
          30% { transform: translate(-50%,-50%) translateX(6px); }
          45% { transform: translate(-50%,-50%) translateX(-4px); }
          60% { transform: translate(-50%,-50%) translateX(4px); }
          75% { transform: translate(-50%,-50%) translateX(-2px); }
        }
        .cipher-altar-stage.solved {
          animation: altar-bloom 1.2s ease-out forwards;
        }
        @keyframes altar-bloom {
          0% {
            filter: hue-rotate(0deg) brightness(1);
            transform: scale(1);
          }
          50% {
            filter: hue-rotate(35deg) brightness(1.6) saturate(1.5);
            transform: scale(1.03);
            box-shadow: 0 0 80px rgba(255, 210, 120, 0.9);
          }
          100% {
            filter: hue-rotate(20deg) brightness(1.25) saturate(1.2);
            transform: scale(1.02);
            box-shadow: 0 0 60px rgba(255, 210, 120, 0.6);
          }
        }
        .cipher-altar-stage.solved .cipher-altar-artifact {
          opacity: 0.15;
        }
        .cipher-altar-combine {
          font: inherit;
          font-size: 12px;
          padding: 12px 20px;
          background: linear-gradient(180deg, #5a3a14 0%, #2a1a08 100%);
          color: #f3ecd8;
          border: 2px solid #7a5a2a;
          border-radius: 6px;
          cursor: pointer;
          letter-spacing: 0.08em;
          transition:
            opacity 0.2s ease,
            transform 0.1s ease,
            box-shadow 0.2s ease;
          opacity: 0.3;
          pointer-events: auto;
        }
        .cipher-altar-combine.primed {
          opacity: 1;
          box-shadow: 0 0 18px rgba(255, 210, 120, 0.5);
        }
        .cipher-altar-combine:hover.primed {
          transform: translateY(-1px);
        }
        .cipher-altar-combine[disabled] {
          cursor: not-allowed;
        }
        .cipher-altar-hint {
          min-height: 18px;
          font-size: 11px;
          color: #d4b97a;
          text-align: center;
          max-width: 480px;
          line-height: 1.5;
        }
        .cipher-altar-overlay-toggle {
          font: inherit;
          font-size: 10px;
          padding: 4px 10px;
          background: transparent;
          color: #d4b97a;
          border: 1px solid #3a2e18;
          border-radius: 3px;
          cursor: pointer;
        }
        .cipher-altar-overlay-toggle:hover { background: #2a1f10; }
      `}</style>

      <div
        className={`cipher-altar-stage${solved ? ' solved' : ''}`}
        ref={altarRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className={`cipher-altar-heart${allOnAltar ? ' primed' : ''}${shakeSeed ? ' cipher-altar-shake' : ''}`}
          key={`heart-${shakeSeed}`}
        />
        {placements.map((p) => (
          <ArtifactNode
            key={p.id}
            placement={p}
            overlayReveal={overlayReveal}
            onPointerDown={(e) => handlePointerDown(p.id, e)}
            onRotate={(delta) => rotateArtifact(p.id, delta)}
          />
        ))}
      </div>

      <div className="cipher-altar-hint" role="status" aria-live="polite">
        {solved
          ? 'The skeleton resolves — a causeway, a crosshair, a frozen hour at dawn.'
          : hint ?? ''}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="button"
          className={`cipher-altar-combine${allOnAltar && !solved ? ' primed' : ''}`}
          onClick={onCombine}
          disabled={solved}
          title={
            allOnAltar
              ? 'Combine the four artifacts'
              : 'Place all four artifacts at the altar heart'
          }
        >
          COMBINE
        </button>
        <button
          type="button"
          className="cipher-altar-overlay-toggle"
          onClick={() => setOverlayReveal((v) => !v)}
        >
          {overlayReveal ? 'Hide skeleton' : 'Show skeleton'}
        </button>
      </div>

    </div>
  )
}
