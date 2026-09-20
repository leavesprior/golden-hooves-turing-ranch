'use client'

import { roomCellColor } from '@/lib/roomBitPalette'

/**
 * A 40×22 authored room, painted in the walk's 32-bit palette.
 *
 * The glyph grid is still the element's text, one real newline per row: the
 * overlay tests read those rows, the browser tools read them off the page, and
 * a copy of the room still copies as 22 lines rather than one run-on line
 * (the same trap the ascii2 viewport documents). What changed is the paint —
 * each cell carries its colour as a background and the letter itself is
 * transparent, so the reading survives while the room stops being a DOS screen.
 *
 * Cell size follows the frame: the grid is sized off the container so it fills
 * the picture instead of sitting in the corner as a postage stamp.
 */
export function BitRoom({ testid, rows, label }: {
  testid: string
  rows: string[]
  label: string
}) {
  const cols = rows[0]?.length ?? 0
  // A monospace cell is ~0.6em wide. Width-fit and height-fit, whichever is
  // smaller, so the whole grid is on screen at any shape of frame.
  const byWidth = cols ? 100 / (cols * 0.6) : 4
  const byHeight = rows.length ? 100 / rows.length : 4
  return (
    <div className="absolute inset-0 bg-[#0e0c0a]" style={{ containerType: 'size' }}>
      <pre
        data-testid={testid}
        data-cols={cols}
        data-rows={rows.length}
        role="img"
        aria-label={label}
        className="absolute inset-0 m-0 overflow-hidden font-mono"
        style={{
          display: 'grid',
          placeContent: 'center',
          fontSize: `min(${byWidth.toFixed(3)}cqw, ${byHeight.toFixed(3)}cqh)`,
          lineHeight: 1,
        }}
      >
        {/*
          One grid item holds the whole frame, and rows are separated by a real
          newline inside it. Letting each row be its own grid item blockifies it,
          and then the browser counts a line break per block ON TOP of the
          newline: the 22-row room read as 43 lines. (Caught by the browser
          check; the ascii2 viewport documents the same trap for copy/paste.)
        */}
        <span style={{ lineHeight: 'inherit' }}>
          {rows.map((row, y) => (
            <span key={y} style={{ lineHeight: 'inherit' }}>
              {[...row].map((glyph, x) => (
                <span
                  key={x}
                  style={{
                    backgroundColor: roomCellColor(glyph, x, y) ?? 'transparent',
                    color: 'transparent',
                    lineHeight: 'inherit',
                  }}
                >
                  {glyph}
                </span>
              ))}
              {y < rows.length - 1 ? '\n' : ''}
            </span>
          ))}
        </span>
      </pre>
    </div>
  )
}
